import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: Date.now(),
    app: 'FabricAI Studio',
    version: '1.0.0',
  })
}
