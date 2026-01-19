import { NextRequest } from 'next/server'

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://api.ollama.com'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY

export async function POST(request: NextRequest) {
  try {
    const { model, messages } = await request.json()

    if (!model || !messages) {
      return new Response(JSON.stringify({ error: 'Missing model or messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OLLAMA_API_KEY && { Authorization: `Bearer ${OLLAMA_API_KEY}` }),
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Ollama API error:', errorText)
      return new Response(JSON.stringify({ error: 'Ollama API error' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Create a TransformStream to convert Ollama's format to SSE
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true })
        const lines = text.split('\n').filter((line) => line.trim())

        for (const line of lines) {
          try {
            const json = JSON.parse(line)
            if (json.message?.content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: json.message.content })}\n\n`)
              )
            }
            if (json.done) {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            }
          } catch {
            // Skip non-JSON lines
          }
        }
      },
    })

    const reader = response.body?.getReader()
    const stream = new ReadableStream({
      async start(controller) {
        if (!reader) {
          controller.close()
          return
        }

        const writer = transformStream.writable.getWriter()
        const transformReader = transformStream.readable.getReader()

        // Pipe transformed data to output
        const pumpOutput = async () => {
          while (true) {
            const { done, value } = await transformReader.read()
            if (done) break
            controller.enqueue(value)
          }
          controller.close()
        }

        // Pipe input to transform
        const pumpInput = async () => {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              await writer.close()
              break
            }
            await writer.write(value)
          }
        }

        pumpOutput()
        await pumpInput()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
