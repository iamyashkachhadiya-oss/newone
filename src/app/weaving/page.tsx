'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ─── Types ──────────────────────────────────────────────────────────────────

type LoomType = 'Dobby Loom' | 'Rapier Loom' | 'Water-Jet Loom' | 'Air-Jet Loom' | 'Jacquard Loom'
type DraftType = 'straight' | 'skip' | 'grouped' | 'custom'
type WeaveCategory = 'plain' | 'twill' | 'satin' | 'basket' | 'rib' | 'dobby'

interface Feeder {
  id: number
  yarnType: string
  color: string
  sequence: string
}

interface Config {
  shafts: number
  warpEnds: number
  loomType: LoomType
  feeders: number
  draftType: DraftType
  threadingMatrix: number[][]
  feederList: Feeder[]
}

interface WeavePattern {
  id: string
  name: string
  category: WeaveCategory
  shafts: number
  feeders: number
  colors: string[]
  matrix: number[][]
  description: string
}

// ─── Yarn DB (from Documents) ───────────────────────────────────────────────
const YARN_TYPES = [
  { id: 'polyester75d', label: 'Polyester 75D', tenacity: '35–45 cN/tex', loomCompat: ['Rapier Loom', 'Water-Jet Loom', 'Air-Jet Loom'], waterjet: true },
  { id: 'polyviscose8020', label: 'PV 80/20 Blend', tenacity: '16–20 cN/tex', loomCompat: ['Rapier Loom', 'Air-Jet Loom'], waterjet: false },
  { id: 'cotton40s', label: 'Cotton 40s Combed', tenacity: '15.5–25 cN/tex', loomCompat: ['Rapier Loom', 'Dobby Loom'], waterjet: false },
  { id: 'silk20d', label: 'Silk 20d', tenacity: '25–40 cN/tex', loomCompat: ['Rapier Loom', 'Jacquard Loom'], waterjet: false },
  { id: 'nylon', label: 'Nylon Filament', tenacity: '40–70 cN/tex', loomCompat: ['Rapier Loom', 'Water-Jet Loom', 'Air-Jet Loom'], waterjet: true },
  { id: 'viscose30s', label: 'Viscose 30s', tenacity: '12–18 cN/tex', loomCompat: ['Rapier Loom'], waterjet: false },
  { id: 'wool', label: 'Wool Nm 20/2', tenacity: '8–14 cN/tex', loomCompat: ['Rapier Loom', 'Dobby Loom'], waterjet: false },
]

const LOOM_TYPES: LoomType[] = ['Dobby Loom', 'Rapier Loom', 'Water-Jet Loom', 'Air-Jet Loom', 'Jacquard Loom']
const LOOM_MAX_FEEDERS: Record<LoomType, number> = {
  'Rapier Loom': 16, 'Water-Jet Loom': 4, 'Air-Jet Loom': 8,
  'Dobby Loom': 8, 'Jacquard Loom': 16,
}

const DEFAULT_COLORS = ['#E63946','#457B9D','#2A9D8F','#E9C46A','#F4A261','#8338EC','#06D6A0','#118AB2']

// ─── Pattern Generator ───────────────────────────────────────────────────────
function generateMatrix(type: WeaveCategory, size = 8): number[][] {
  const m: number[][] = []
  for (let r = 0; r < size; r++) {
    const row: number[] = []
    for (let c = 0; c < size; c++) {
      let v = 0
      switch (type) {
        case 'plain': v = (r + c) % 2 === 0 ? 1 : 0; break
        case 'twill': v = (r + c) % 4 < 2 ? 1 : 0; break
        case 'satin': v = (r * 3 + c) % 5 === 0 ? 1 : 0; break
        case 'basket': v = (Math.floor(r/2) + Math.floor(c/2)) % 2 === 0 ? 1 : 0; break
        case 'rib': v = Math.floor(c/2) % 2 === 0 ? 1 : 0; break
        case 'dobby': v = (r * 2 + c * 3) % 7 < 3 ? 1 : 0; break
      }
      row.push(v)
    }
    m.push(row)
  }
  return m
}

// ─── All Generated Patterns ──────────────────────────────────────────────────
const ALL_PATTERNS: WeavePattern[] = [
  { id: 'plain2', name: '2-Shaft Plain Weave', category: 'plain', shafts: 2, feeders: 1, colors: ['#E63946','#457B9D'], matrix: generateMatrix('plain', 8), description: 'Classic interlaced structure. Equal warp/weft exposure.' },
  { id: 'plain4', name: '4-Shaft Plain Weave', category: 'plain', shafts: 4, feeders: 4, colors: ['#E63946','#457B9D','#2A9D8F','#E9C46A'], matrix: generateMatrix('plain', 8), description: 'Multi-shaft plain weave for higher thread density.' },
  { id: 'basket2', name: '2-Shaft Basket Weave', category: 'plain', shafts: 2, feeders: 2, colors: ['#E63946','#457B9D'], matrix: generateMatrix('basket', 8), description: 'Double interlacing creates square texture.' },
  { id: 'rib2', name: '2-Shaft Rib Weave', category: 'plain', shafts: 2, feeders: 2, colors: ['#E63946','#2A9D8F'], matrix: generateMatrix('rib', 8), description: 'Warp-dominant horizontal ridged structure.' },
  { id: 'plain4b', name: '4-Shaft Plain Weave B', category: 'plain', shafts: 4, feeders: 8, colors: ['#E63946','#457B9D','#2A9D8F','#E9C46A'], matrix: generateMatrix('plain', 8), description: 'Extended feeder configuration for colour effects.' },
  { id: 'plain4c', name: '4-Shaft Plain Weave C', category: 'plain', shafts: 4, feeders: 3, colors: ['#E63946','#457B9D','#E9C46A'], matrix: generateMatrix('plain', 8), description: 'Three feeder plain weave for stripe effects.' },
  { id: 'twill4', name: '4-Shaft Twill 2/2', category: 'twill', shafts: 4, feeders: 2, colors: ['#8338EC','#06D6A0'], matrix: generateMatrix('twill', 8), description: 'Classic diagonal twill. Durable and flexible.' },
  { id: 'twill8', name: '8-Shaft Twill 3/1', category: 'twill', shafts: 8, feeders: 4, colors: ['#8338EC','#F4A261','#06D6A0','#118AB2'], matrix: generateMatrix('twill', 8), description: 'Warp-dominant twill for strength applications.' },
  { id: 'satin5', name: '5-Shaft Satin', category: 'satin', shafts: 5, feeders: 2, colors: ['#E9C46A','#1B1F3B'], matrix: generateMatrix('satin', 8), description: 'Long floats create smooth lustrous surface.' },
  { id: 'satin8', name: '8-Shaft Satin', category: 'satin', shafts: 8, feeders: 4, colors: ['#E9C46A','#E63946','#457B9D','#2A9D8F'], matrix: generateMatrix('satin', 8), description: 'High-shaft satin for premium fabric appearance.' },
  { id: 'dobby1', name: 'Dobby Diamond', category: 'dobby', shafts: 8, feeders: 3, colors: ['#F4A261','#118AB2','#E63946'], matrix: generateMatrix('dobby', 8), description: 'Dobby-controlled geometric diamond motif.' },
  { id: 'dobby2', name: 'Dobby Honeycomb', category: 'dobby', shafts: 16, feeders: 4, colors: ['#E9C46A','#2A9D8F','#8338EC','#E63946'], matrix: generateMatrix('dobby', 8), description: 'Honeycomb cell structure via dobby shedding.' },
]

// ─── Mini Canvas Preview ────────────────────────────────────────────────────
function PatternCanvas({ matrix, colors, warpColor, size = 72 }: {
  matrix: number[][]; colors: string[]; warpColor: string; size?: number
}) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rows = matrix.length
    const cols = matrix[0]?.length || 0
    if (!rows || !cols) return
    const cw = size / cols
    const ch = size / rows
    ctx.clearRect(0, 0, size, size)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = matrix[r][c] === 1 ? warpColor : (colors[r % colors.length] || '#ccc')
        ctx.fillRect(c * cw, r * ch, cw - 0.5, ch - 0.5)
      }
    }
  }, [matrix, colors, warpColor, size])

  return <canvas ref={ref} width={size} height={size} style={{ borderRadius: 6, display: 'block' }} />
}

// ─── Threading Grid ──────────────────────────────────────────────────────────
function ThreadingGrid({ matrix, shafts }: { matrix: number[][], shafts: number }) {
  const ends = matrix[0]?.length || 8
  const CELL = 22
  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'inline-grid', gridTemplateColumns: `repeat(${ends}, ${CELL}px)`, gap: 1, background: '#E8E8E8', border: '1px solid #E8E8E8', borderRadius: 6, overflow: 'hidden' }}>
        {matrix.slice(0, shafts).map((row, ri) =>
          row.map((cell, ci) => (
            <div key={`${ri}-${ci}`} style={{
              width: CELL, height: CELL,
              background: cell === 1 ? '#1B1F3B' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, color: cell === 1 ? '#fff' : '#ccc',
              cursor: 'pointer',
              transition: 'background 0.1s',
            }}>
              {ri === 0 && cell === 0 ? ci + 1 : ''}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─── Design Editor Grid ──────────────────────────────────────────────────────
function DesignEditorGrid({ matrix, onToggle, warpColor, feederColors }: {
  matrix: number[][]
  onToggle: (r: number, c: number) => void
  warpColor: string
  feederColors: string[]
}) {
  const rows = matrix.length
  const cols = matrix[0]?.length || 0
  const CELL = Math.max(10, Math.min(24, Math.floor(480 / Math.max(rows, cols))))

  return (
    <div style={{ overflowAuto: 'auto', display: 'inline-block' } as React.CSSProperties}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${CELL}px)`, gap: 1, background: '#eee', border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden', padding: 1 }}>
        {matrix.map((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              onClick={() => onToggle(ri, ci)}
              title={`Pick ${ri+1}, End ${ci+1}: ${cell ? 'Warp Up' : 'Weft Up'}`}
              style={{
                width: CELL, height: CELL,
                background: cell === 1 ? warpColor : (feederColors[ri % feederColors.length] || '#ddd'),
                cursor: 'pointer',
                transition: 'transform 0.05s',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — LOOM SETUP
// ═══════════════════════════════════════════════════════════════════════════════
function SetupScreen({ onGenerate }: { onGenerate: (cfg: Config) => void }) {
  const router = useRouter()
  const [shafts, setShafts] = useState(4)
  const [warpEnds, setWarpEnds] = useState(400)
  const [loomType, setLoomType] = useState<LoomType>('Dobby Loom')
  const [numFeeders, setNumFeeders] = useState(3)
  const [draftType, setDraftType] = useState<DraftType>('straight')
  const [feeders, setFeeders] = useState<Feeder[]>([
    { id: 1, yarnType: 'cotton40s', color: '#E63946', sequence: '1-2-3' },
    { id: 2, yarnType: 'polyester75d', color: '#457B9D', sequence: '2-2-1' },
    { id: 3, yarnType: 'silk20d', color: '#2A9D8F', sequence: '1-3-3' },
  ])

  const maxFeeders = LOOM_MAX_FEEDERS[loomType]

  // Build threading matrix from draftType
  const threadingMatrix: number[][] = Array.from({ length: shafts }, (_, si) =>
    Array.from({ length: Math.min(warpEnds, 16) }, (_, ei) => {
      switch (draftType) {
        case 'straight': return (ei % shafts) === si ? 1 : 0
        case 'skip': return (ei * 2 % shafts) === si ? 1 : 0
        case 'grouped': return Math.floor(ei / 2) % shafts === si ? 1 : 0
        default: return (ei % shafts) === si ? 1 : 0
      }
    })
  )

  const updateFeederCount = (n: number) => {
    const count = Math.min(n, maxFeeders)
    setNumFeeders(count)
    setFeeders(prev => {
      const next = [...prev]
      while (next.length < count) next.push({ id: next.length + 1, yarnType: 'polyester75d', color: DEFAULT_COLORS[next.length % DEFAULT_COLORS.length], sequence: '1' })
      return next.slice(0, count)
    })
  }

  // Check loom-yarn compatibility warning
  const incompatibleFeeders = feeders.filter(f => {
    const yarn = YARN_TYPES.find(y => y.id === f.yarnType)
    if (!yarn) return false
    if (loomType === 'Water-Jet Loom' && !yarn.waterjet) return true
    return false
  })

  const handleGenerate = () => {
    onGenerate({ shafts, warpEnds, loomType, feeders: numFeeders, draftType, threadingMatrix, feederList: feeders })
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="FabricaAI Logo" style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>FabricaAI Studio</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Next-Gen Weaving CAD</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-secondary" onClick={() => router.push('/dashboard')} style={{ fontSize: 12 }}>← Dashboard</button>
        </div>
      </header>

      {/* Title */}
      <div style={{ textAlign: 'center', padding: '40px 24px 24px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--primary)' }}>Loom Setup & Draft Plan</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 8 }}>Enter your loom configuration details to begin.</p>
      </div>

      {/* Compatible warning */}
      {incompatibleFeeders.length > 0 && (
        <div style={{ maxWidth: 1100, margin: '0 auto 16px', padding: '0 24px' }}>
          <div style={{ background: '#fcebeb', border: '1px solid #f0c0c0', borderRadius: 10, padding: '12px 16px', fontSize: 13, color: '#a32d2d', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠ <strong>Incompatible:</strong> Water-Jet loom cannot use hydrophilic yarns ({incompatibleFeeders.map(f => YARN_TYPES.find(y => y.id === f.yarnType)?.label).join(', ')}). Switch to Rapier loom.
          </div>
        </div>
      )}

      {/* 3-Column Grid */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '1fr 1.4fr 1.2fr', gap: 20 }}>

        {/* Column 1: Basic Config */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--primary)' }}>Basic Configuration</div>

          <div style={{ marginBottom: 16 }}>
            <label>Number of Shafts:</label>
            <select value={shafts} onChange={e => setShafts(Number(e.target.value))} style={{ height: 44 }}>
              {[2, 4, 6, 8, 12, 16, 24, 32].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Number of Warp Ends:</label>
            <input type="number" value={warpEnds} min={10} max={2000} step={10}
              onChange={e => setWarpEnds(Number(e.target.value))} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Loom Type:</label>
            <select value={loomType} onChange={e => { setLoomType(e.target.value as LoomType); updateFeederCount(Math.min(numFeeders, LOOM_MAX_FEEDERS[e.target.value as LoomType])) }} style={{ height: 44 }}>
              {LOOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>Max feeders: {maxFeeders}</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label>Number of Feeders:</label>
            <select value={numFeeders} onChange={e => updateFeederCount(Number(e.target.value))} style={{ height: 44 }}>
              {Array.from({ length: maxFeeders }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {/* Yarn DB Quick Stats */}
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: 12, fontSize: 11, color: 'var(--text-3)' }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--text-2)' }}>Surat Yarn Data (Doc 1)</div>
            <div>Polyester 75D → WJ: 800–1200 RPM</div>
            <div>PV 80/20 → Rapier: 350–500 RPM</div>
            <div>Cotton 40s → Rapier: 350–500 RPM</div>
          </div>
        </div>

        {/* Column 2: Draft Plan */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--primary)' }}>Draft Plan Setup</div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ marginBottom: 8 }}>Draft Type:</label>
            <div style={{ display: 'flex', gap: 16 }}>
              {(['straight', 'skip', 'grouped', 'custom'] as DraftType[]).map(dt => (
                <label key={dt} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, margin: 0, color: 'var(--text-2)' }}>
                  <input type="radio" name="draft" value={dt} checked={draftType === dt} onChange={() => setDraftType(dt)} style={{ width: 'auto', height: 'auto' }} />
                  {dt.charAt(0).toUpperCase() + dt.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ marginBottom: 8 }}>Threading Grid:</label>
            <ThreadingGrid matrix={threadingMatrix} shafts={shafts} />
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
              Showing first {Math.min(warpEnds, 16)} ends × {shafts} shafts
            </div>
          </div>

          {/* Draft legend */}
          <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, background: '#1B1F3B', borderRadius: 2 }} />
              Threaded
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 2 }} />
              Empty
            </div>
          </div>
        </div>

        {/* Column 3: Feeder Config */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--primary)' }}>Weft & Feeder Configuration</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Feeder', 'Yarn Type', 'Color', 'Sequence'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 4px', fontWeight: 600, fontSize: 12, color: 'var(--text-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {feeders.map((f, fi) => (
                <tr key={f.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '8px 4px', fontSize: 12, color: 'var(--text-2)' }}>F{f.id}:</td>
                  <td style={{ padding: '8px 4px' }}>
                    <select value={f.yarnType} onChange={e => {
                      const updated = [...feeders]; updated[fi] = { ...f, yarnType: e.target.value }; setFeeders(updated)
                    }} style={{ height: 30, fontSize: 11, padding: '0 6px', minWidth: 90 }}>
                      {YARN_TYPES.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: '8px 4px' }}>
                    <input type="color" value={f.color} onChange={e => {
                      const updated = [...feeders]; updated[fi] = { ...f, color: e.target.value }; setFeeders(updated)
                    }} style={{ width: 36, height: 30, padding: 2, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer' }} />
                  </td>
                  <td style={{ padding: '8px 4px' }}>
                    <input type="text" value={f.sequence} onChange={e => {
                      const updated = [...feeders]; updated[fi] = { ...f, sequence: e.target.value }; setFeeders(updated)
                    }} style={{ height: 30, fontSize: 11, padding: '0 6px', width: 60 }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Quick feeder add hint */}
          <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
            Sequence format: pick order per repeat (e.g. 1-2-3 = feeder 1, then 2, then 3)
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div style={{ textAlign: 'center', padding: '32px 24px 48px' }}>
        <button
          onClick={handleGenerate}
          className="btn-accent"
          style={{ fontSize: 16, padding: '0 48px', height: 52, borderRadius: 12, letterSpacing: '-0.01em' }}
        >
          Generate Design Options →
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — WEAVING DESIGN HUB
// ═══════════════════════════════════════════════════════════════════════════════

type HubTab = 'Weave Type' | 'Category' | 'Complexity' | 'Trending'
type HubMode = 'hub' | 'create' | 'upload'

function HubScreen({ config, onBack }: { config: Config; onBack: () => void }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<HubTab>('Weave Type')
  const [mode, setMode] = useState<HubMode>('hub')
  const [selectedCategory, setSelectedCategory] = useState<WeaveCategory | 'all'>('all')

  // Editor state
  const [editorMatrix, setEditorMatrix] = useState(() => generateMatrix('plain', 12))
  const [editorPattern, setEditorPattern] = useState<WeaveCategory>('plain')
  const warpColor = '#1B1F3B'
  const feederColors = config.feederList.map(f => f.color)

  const toggleCell = useCallback((r: number, c: number) => {
    setEditorMatrix(prev => {
      const next = prev.map(row => [...row])
      next[r][c] = next[r][c] === 1 ? 0 : 1
      return next
    })
  }, [])

  const applyPattern = (type: WeaveCategory) => {
    setEditorPattern(type)
    setEditorMatrix(generateMatrix(type, 12))
  }

  const filteredPatterns = ALL_PATTERNS.filter(p => {
    if (selectedCategory !== 'all' && p.category !== selectedCategory) return false
    if (p.shafts > config.shafts) return false
    if (p.feeders > config.feeders) return false
    return true
  })

  const categories: { key: WeaveCategory | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'plain', label: 'Plain Weaves' },
    { key: 'twill', label: 'Twill' },
    { key: 'satin', label: 'Satin' },
    { key: 'dobby', label: 'Dobby' },
    { key: 'basket', label: 'Basket / Rib' },
  ]

  if (mode === 'create') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/logo.png" alt="FabricaAI Logo" style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>Design Editor</div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-secondary" onClick={() => setMode('hub')} style={{ fontSize: 12 }}>← Back to Hub</button>
            <button className="btn-accent" onClick={() => router.push('/dashboard')} style={{ fontSize: 12 }}>Save & Exit</button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 220px', gap: 0, minHeight: 'calc(100vh - 65px)' }}>
          {/* Left: Tools */}
          <div style={{ borderRight: '1px solid var(--border)', padding: 20, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>Pattern Presets</div>
            {(['plain', 'twill', 'satin', 'basket', 'rib', 'dobby'] as WeaveCategory[]).map(type => (
              <button key={type} onClick={() => applyPattern(type)} className={editorPattern === type ? 'btn-primary' : 'btn-secondary'} style={{ fontSize: 12, height: 36, justifyContent: 'flex-start', paddingLeft: 12 }}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Weave
              </button>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, fontSize: 11, color: 'var(--text-3)' }}>
              Click cells to toggle warp/weft
            </div>
          </div>

          {/* Center: Grid */}
          <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--primary)' }}>Create Your Design</div>
            <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
              Config: {config.shafts} shafts · {config.warpEnds} ends · {config.loomType}
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 14, height: 14, background: warpColor, borderRadius: 3 }} /> Warp Up
              </div>
              {feederColors.slice(0, 3).map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 14, height: 14, background: c, borderRadius: 3 }} /> F{i+1}: {config.feederList[i]?.yarnType || ''}
                </div>
              ))}
            </div>

            <DesignEditorGrid matrix={editorMatrix} onToggle={toggleCell} warpColor={warpColor} feederColors={feederColors} />

            {/* Color Drawdown Preview (canvas) */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', marginBottom: 8 }}>Color Drawdown Preview</div>
              <PatternCanvas matrix={editorMatrix} colors={feederColors} warpColor={warpColor} size={200} />
            </div>
          </div>

          {/* Right: Feeder info */}
          <div style={{ borderLeft: '1px solid var(--border)', padding: 20, background: 'var(--surface)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', marginBottom: 16 }}>Feeder Assignment</div>
            {config.feederList.map((f, i) => {
              const yarn = YARN_TYPES.find(y => y.id === f.yarnType)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, marginBottom: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: f.color, flexShrink: 0, border: '2px solid white', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>F{f.id}: {yarn?.label || f.yarnType}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{yarn?.tenacity} · Seq: {f.sequence}</div>
                  </div>
                </div>
              )
            })}

            {/* Float check */}
            <div style={{ marginTop: 16, padding: 12, background: '#eaf3de', borderRadius: 8, fontSize: 11, color: '#3b6d11' }}>
              ✓ Float check: Max float within limits
            </div>

            {/* Export */}
            <button className="btn-primary" style={{ width: '100%', marginTop: 16, fontSize: 13 }}>
              Export Pattern →
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="FabricaAI Logo" style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'cover' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>FabricaAI Studio</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Config summary */}
          <div style={{ fontSize: 12, color: 'var(--text-2)', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', display: 'flex', gap: 16 }}>
            <span>Shafts: <strong>{config.shafts}</strong></span>
            <span>Ends: <strong>{config.warpEnds}</strong></span>
            <span>Feeders: <strong>{config.feeders}</strong></span>
            <span>Loom: <strong>{config.loomType}</strong></span>
          </div>
          <button className="btn-secondary" onClick={onBack} style={{ fontSize: 12 }}>Edit Config</button>
          <button className="btn-secondary" onClick={() => router.push('/dashboard')} style={{ fontSize: 12 }}>← Dashboard</button>
        </div>
      </header>

      {/* Title */}
      <div style={{ textAlign: 'center', padding: '32px 24px 16px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--primary)' }}>Weaving Design Hub</h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 6 }}>Select an option to create or explore weaving designs.</p>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 48px' }}>

        {/* Top 3 cards row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 20, marginBottom: 28 }}>

          {/* Create Your Own */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>Create Your Own Design</div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>Draw custom patterns directly on the grid and repeat across the fabric.</p>
            {/* Mini preview */}
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 12, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
              <PatternCanvas matrix={generateMatrix('plain', 8)} colors={['#E63946','#457B9D']} warpColor="#1B1F3B" size={80} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {['plain','twill','satin'].map((t,i) => (
                  <div key={t} style={{ fontSize: 10, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: DEFAULT_COLORS[i] }} />
                    {t.charAt(0).toUpperCase()+t.slice(1)}
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => setMode('create')}>
              Start Designing →
            </button>
          </div>

          {/* Upload */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: 'var(--primary)' }}>Upload a Design</div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>Upload an image or matrix file to create a weaving pattern.</p>
            <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 20, marginBottom: 16, border: '2px dashed var(--border)', textAlign: 'center', cursor: 'pointer' }}
              onClick={() => {}}
              onDragOver={e => e.preventDefault()}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>☁</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Drop image or WIF file here</div>
              <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 4 }}>.png · .jpg · .wif · .csv</div>
            </div>
            <button className="btn-primary" style={{ width: '100%' }} onClick={() => {}}>
              Upload Design →
            </button>
          </div>

          {/* Explore Generated — right sidebar-like */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: 'var(--primary)' }}>Explore Generated Designs</div>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 14 }}>Browse all possible designs based on your draft plan and configuration.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 280, overflowY: 'auto' }}>
              {['Plain Weaves', 'Twill Weaves', 'Satin Weaves'].map(cat => (
                <div key={cat}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {cat} <span style={{ fontSize: 10, background: 'var(--bg)', borderRadius: 4, padding: '1px 6px', color: 'var(--text-3)' }}>
                      {ALL_PATTERNS.filter(p => p.category === cat.toLowerCase().split(' ')[0]).length}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {ALL_PATTERNS.filter(p => p.category === cat.toLowerCase().split(' ')[0]).slice(0, 4).map(pattern => (
                      <div key={pattern.id} onClick={() => { setSelectedCategory(pattern.category); setMode('hub') }}
                        style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 8px', background: 'var(--bg)', borderRadius: 8, cursor: 'pointer', border: '1px solid var(--border-light)', transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-light)' }}
                      >
                        <PatternCanvas matrix={pattern.matrix} colors={pattern.colors} warpColor="#1B1F3B" size={32} />
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-1)' }}>{pattern.name}</div>
                          <div style={{ fontSize: 9, color: 'var(--text-3)', display: 'flex', gap: 4, marginTop: 2 }}>
                            {pattern.colors.slice(0,3).map((c,i) => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: c }}/>)}
                            {pattern.feeders} Feeder{pattern.feeders>1?'s':''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs + Gallery */}
        <div>
          {/* Tab bar + Category pills */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="tab-bar" style={{ borderBottom: 'none' }}>
              {(['Weave Type','Category','Complexity','Trending'] as HubTab[]).map(tab => (
                <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {categories.map(cat => (
                <button key={cat.key} onClick={() => setSelectedCategory(cat.key)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                    border: '1.5px solid', cursor: 'pointer', fontFamily: 'var(--font-body)',
                    borderColor: selectedCategory === cat.key ? 'var(--primary)' : 'var(--border)',
                    background: selectedCategory === cat.key ? 'var(--primary)' : 'var(--surface)',
                    color: selectedCategory === cat.key ? 'white' : 'var(--text-2)',
                    transition: 'all 0.15s',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pattern Grid Gallery */}
          {filteredPatterns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text-3)', fontSize: 14 }}>
              No patterns match your config ({config.shafts} shafts, {config.feeders} feeders). Try increasing shaft count.
            </div>
          ) : (
            <>
              {/* Show by category */}
              {(selectedCategory === 'all' ? (['plain','twill','satin','basket','dobby'] as WeaveCategory[]) : [selectedCategory]).map(cat => {
                const catPatterns = filteredPatterns.filter(p => p.category === cat)
                if (!catPatterns.length) return null
                const catLabel: Record<string, string> = {
                  plain: 'Plain Weaves', twill: 'Twill Weaves', satin: 'Satin Weaves',
                  basket: 'Basket / Rib Weaves', rib: 'Rib Weaves', dobby: 'Dobby Patterns',
                }
                return (
                  <div key={cat} style={{ marginBottom: 28 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)', marginBottom: 12 }}>
                      {catLabel[cat] || cat}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                      {catPatterns.map(pattern => (
                        <PatternCard key={pattern.id} pattern={pattern} warpColor="#1B1F3B" onClick={() => setMode('create')} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Pattern Card ─────────────────────────────────────────────────────────────
function PatternCard({ pattern, warpColor, onClick }: { pattern: WeavePattern; warpColor: string; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'var(--surface)', border: `1.5px solid ${hover ? 'var(--accent)' : 'var(--border-light)'}`,
        borderRadius: 12, padding: 12, cursor: 'pointer',
        boxShadow: hover ? '0 4px 16px rgba(232,168,56,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
        <PatternCanvas matrix={pattern.matrix} colors={pattern.colors} warpColor={warpColor} size={80} />
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4, lineHeight: 1.3 }}>{pattern.name}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-3)' }}>
        <span>{pattern.shafts} Shaft{pattern.shafts>1?'s':''}</span>
        <span>{pattern.feeders} Feeder{pattern.feeders>1?'s':''}</span>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        {pattern.colors.slice(0,4).map((c,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />)}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function WeavingPage() {
  const [screen, setScreen] = useState<'setup' | 'hub'>('setup')
  const [config, setConfig] = useState<Config | null>(null)

  const handleGenerate = (cfg: Config) => {
    setConfig(cfg)
    setScreen('hub')
  }

  if (screen === 'hub' && config) {
    return <HubScreen config={config} onBack={() => setScreen('setup')} />
  }

  return <SetupScreen onGenerate={handleGenerate} />
}
