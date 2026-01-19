export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

export interface Conversation {
  id: string
  title: string
  userId: string
  model: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface OllamaModel {
  id: string
  name: string
  description: string
}

export const OLLAMA_MODELS: OllamaModel[] = [
  { id: 'gpt-oss:20b', name: 'GPT-OSS 20B', description: 'Fast general purpose' },
  { id: 'gpt-oss:120b', name: 'GPT-OSS 120B', description: 'Powerful general purpose' },
  { id: 'ministral-3:3b', name: 'Ministral 3B', description: 'Lightweight & fast' },
  { id: 'ministral-3:8b', name: 'Ministral 8B', description: 'Balanced performance' },
  { id: 'gemma3:4b', name: 'Gemma 3 4B', description: 'Google compact model' },
  { id: 'gemma3:12b', name: 'Gemma 3 12B', description: 'Google medium model' },
  { id: 'deepseek-v3.2', name: 'DeepSeek V3.2', description: 'Advanced reasoning' },
  { id: 'qwen3-coder:480b', name: 'Qwen3 Coder', description: 'Code specialist' },
  { id: 'devstral-small-2:24b', name: 'Devstral Small', description: 'Dev focused' },
  { id: 'kimi-k2:1t', name: 'Kimi K2', description: 'Moonshot AI flagship' },
]

export interface User {
  id: string
  email: string
  createdAt: Date
}
