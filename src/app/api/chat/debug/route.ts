import { NextResponse } from 'next/server'

/** GET /api/chat/debug — confirms key is set (never shows the actual key) */
export async function GET() {
  const key = process.env.GROQ_API_KEY
  if (!key || key === 'PASTE_YOUR_KEY_HERE') {
    return NextResponse.json({ status: '❌ GROQ_API_KEY not set' }, { status: 500 })
  }
  return NextResponse.json({
    status: '✅ GROQ_API_KEY is set',
    prefix: key.slice(0, 8) + '...',   // shows first 8 chars only — safe to verify
  })
}
