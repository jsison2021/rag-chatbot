const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'https://api.ollama.com'
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onComplete: () => void
  onError: (error: Error) => void
}

export async function streamChat(
  model: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks
) {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(OLLAMA_API_KEY && { 'Authorization': `Bearer ${OLLAMA_API_KEY}` }),
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim())

      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          if (json.message?.content) {
            callbacks.onToken(json.message.content)
          }
          if (json.done) {
            callbacks.onComplete()
            return
          }
        } catch {
          // Skip non-JSON lines
        }
      }
    }

    callbacks.onComplete()
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error('Unknown error'))
  }
}

export async function chatCompletion(
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(OLLAMA_API_KEY && { 'Authorization': `Bearer ${OLLAMA_API_KEY}` }),
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status}`)
  }

  const data = await response.json()
  return data.message?.content || ''
}
