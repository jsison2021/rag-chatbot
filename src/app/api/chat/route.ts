import { NextRequest } from 'next/server'

// Edge runtime streams reliably on Netlify/Vercel and has no ~10s serverless timeout.
export const runtime = 'edge'
export const dynamic = 'force-dynamic'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://api.ollama.com'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { model, messages } = await request.json()

    if (!model || !messages) {
      return jsonError('Missing model or messages', 400)
    }

    if (!OLLAMA_API_KEY) {
      return jsonError('Server is missing OLLAMA_API_KEY. Set it in your hosting environment variables.', 500)
    }

    const upstream = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({ model, messages, stream: true }),
    })

    if (!upstream.ok || !upstream.body) {
      const errorText = await upstream.text().catch(() => '')
      console.error('Ollama API error:', upstream.status, errorText)
      return jsonError(`Ollama API error (${upstream.status})`, upstream.status || 502)
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    // Buffer across chunks: a single JSON object can be split across network chunks.
    let buffer = ''

    const transform = new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const json = JSON.parse(trimmed)
            if (json.message?.content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: json.message.content })}\n\n`)
              )
            }
            if (json.done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            }
          } catch {
            // Skip partial/non-JSON lines
          }
        }
      },
      flush(controller) {
        const trimmed = buffer.trim()
        if (trimmed) {
          try {
            const json = JSON.parse(trimmed)
            if (json.message?.content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: json.message.content })}\n\n`)
              )
            }
          } catch {
            // ignore trailing partial
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      },
    })

    return new Response(upstream.body.pipeThrough(transform), {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return jsonError('Internal server error', 500)
  }
}
