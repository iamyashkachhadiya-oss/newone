import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR  = join(process.cwd(), '.next', 'analytics')
const DATA_FILE = join(DATA_DIR, 'events.json')

function readEvents(): object[] {
  if (!existsSync(DATA_FILE)) return []
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf8')) }
  catch { return [] }
}

function writeEvents(events: object[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(events.slice(0, 10000)))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const events = readEvents()
    events.unshift({ ...body, server_ts: Date.now() })
    writeEvents(events)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

export async function GET() {
  try {
    const events = readEvents()
    // Aggregate stats
    const byType: Record<string, number> = {}
    const byPage: Record<string, number> = {}
    const sessions = new Set<string>()
    const users    = new Set<string>()
    const byDay:   Record<string, number> = {}
    const topLabels: Record<string, number> = {}

    for (const e of events as any[]) {
      byType[e.type] = (byType[e.type] || 0) + 1
      byPage[e.page] = (byPage[e.page] || 0) + 1
      if (e.sessionId) sessions.add(e.sessionId)
      if (e.userId)    users.add(e.userId)
      topLabels[e.label] = (topLabels[e.label] || 0) + 1
      if (e.ts) {
        const day = new Date(e.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
        byDay[day] = (byDay[day] || 0) + 1
      }
    }

    return NextResponse.json({
      total: events.length,
      sessions: sessions.size,
      users: users.size,
      byType,
      byPage,
      byDay,
      topLabels: Object.entries(topLabels)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([label, count]) => ({ label, count })),
      recent: (events as any[]).slice(0, 50),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to read analytics' }, { status: 500 })
  }
}
