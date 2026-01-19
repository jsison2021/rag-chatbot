import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// This endpoint can be called by a cron job to clean up old conversations
// Set up a cron job to call this endpoint every hour
export async function POST(request: Request) {
  try {
    // Verify the request is from an authorized source (optional - add your own auth)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // If CRON_SECRET is set, require it for cleanup requests
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Delete conversations older than 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // First, get the count of conversations to delete
    const { count: countBefore } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', twentyFourHoursAgo)

    // Delete old conversations (messages will cascade delete)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .lt('created_at', twentyFourHoursAgo)

    if (error) {
      console.error('Cleanup error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      deleted: countBefore || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Cleanup API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Cleanup endpoint is running. Send a POST request to trigger cleanup.',
  })
}
