import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_DIR  = join(process.cwd(), '.next', 'analytics')
const DATA_FILE = join(DATA_DIR, 'custom_designs.json')

function readCustomDesigns(): any[] {
  if (!existsSync(DATA_FILE)) return []
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf8')) }
  catch { return [] }
}

function writeCustomDesigns(designs: any[]) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(DATA_FILE, JSON.stringify(designs, null, 2))
}

// GET — list all custom designs
export async function GET() {
  try {
    const designs = readCustomDesigns()
    return NextResponse.json({ ok: true, designs, count: designs.length })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// POST — add a new design
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json({ ok: false, error: 'Design name is required.' }, { status: 400 })
    }

    const designs = readCustomDesigns()

    // Parse peg_matrix from text if needed
    let peg_matrix = body.peg_matrix
    if (!Array.isArray(peg_matrix)) {
      const text: string = body.peg_matrix_text || ''
      peg_matrix = parsePegMatrix(text)
    }

    const design = {
      id:          body.id?.trim() || `C${Date.now()}`,
      name:        body.name.trim(),
      fabric_type: body.fabric_type?.trim() || 'Unknown',
      weave_type:  body.weave_type?.trim()  || 'Custom',
      shaft_count: Number(body.shaft_count) || 8,
      repeat_size: Number(body.repeat_size) || 8,
      description: body.description?.trim() || '',
      tags:        Array.isArray(body.tags) ? body.tags : (body.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
      applications: Array.isArray(body.applications) ? body.applications : (body.applications || '').split(',').map((t: string) => t.trim()).filter(Boolean),
      popularity:  Number(body.popularity) || 70,
      weight:      body.weight?.trim()     || 'Medium',
      direction:   body.direction?.trim()  || 'Z',
      peg_matrix,
      angle:       45,
      float_length: 'medium',
      threading:   'Straight',
      created_at:  new Date().toISOString(),
      source:      'admin',
    }

    // Prevent duplicate IDs
    if (designs.find((d: any) => d.id === design.id)) {
      design.id = `C${Date.now()}`
    }

    designs.unshift(design)
    writeCustomDesigns(designs)

    return NextResponse.json({ ok: true, design })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// DELETE — remove a design by id
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ ok: false, error: 'ID required' }, { status: 400 })
    const designs = readCustomDesigns()
    const filtered = designs.filter((d: any) => d.id !== id)
    writeCustomDesigns(filtered)
    return NextResponse.json({ ok: true, removed: designs.length - filtered.length })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePegMatrix(text: string): number[][] | null {
  if (!text?.trim()) return null
  try {
    const t = text.trim()
    if (t.startsWith('[[')) return JSON.parse(t)

    // Surat text format: "1-->1,2,3"
    const lines = t.split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) return null

    const allRaised = lines.flatMap(l => {
      const [, right] = l.split('-->')
      return right ? right.split(',').map(Number).filter(n => !isNaN(n)) : []
    })
    const maxShaft = allRaised.length ? Math.max(...allRaised) : 0
    if (!maxShaft) return null

    return lines.map(l => {
      const [, right] = l.split('-->')
      const raised = right ? right.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n)) : []
      return Array.from({ length: maxShaft }, (_, i) => raised.includes(i + 1) ? 1 : 0)
    })
  } catch {
    return null
  }
}
