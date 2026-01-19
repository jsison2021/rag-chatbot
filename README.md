# RAG Chat

A professional AI chatbot application with a modern UI similar to ChatGPT, Claude, and Gemini. Built with Next.js 14, Supabase for authentication and data storage, and Ollama Cloud for AI responses.

## Features

- Modern, responsive chat interface
- User authentication (sign up, sign in, sign out)
- Multiple AI model selection (Llama 3.2, Mistral, Mixtral, etc.)
- Conversation history with automatic 24-hour retention
- Real-time streaming responses
- Markdown support with syntax highlighting
- Mobile-friendly sidebar

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **AI Models**: Ollama Cloud API
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Ollama Cloud API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd rag-chatbot
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the schema from `supabase-schema.sql`
3. Copy your project URL and anon key from Settings > API

### 3. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OLLAMA_API_KEY=your-ollama-api-key
OLLAMA_BASE_URL=https://api.ollama.com
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── api/
│   │   ├── auth/callback/route.ts
│   │   ├── chat/route.ts
│   │   ├── cleanup/route.ts
│   │   └── conversations/route.ts
│   ├── chat/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageInput.tsx
│   │   ├── MessageList.tsx
│   │   ├── ModelSelector.tsx
│   │   └── Sidebar.tsx
│   └── ui/ (shadcn components)
├── context/
│   └── AuthContext.tsx
├── hooks/
├── lib/
│   ├── ollama.ts
│   ├── supabase.ts
│   ├── supabase-server.ts
│   ├── types.ts
│   └── utils.ts
└── middleware.ts
```

## Conversation Cleanup

Conversations are automatically deleted after 24 hours. You can trigger cleanup manually:

```bash
curl -X POST http://localhost:3000/api/cleanup
```

For production, set up a cron job (e.g., Vercel Cron, GitHub Actions) to call this endpoint hourly.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Set these in your hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OLLAMA_API_KEY`
- `OLLAMA_BASE_URL`
- `CRON_SECRET` (optional, for secure cleanup endpoint)

## License

MIT
