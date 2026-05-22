'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'

// Color name → hex lookup table
const COLOR_MAP: Record<string, string> = {
  'ivory': '#FFFFF0', 'cream': '#FFFDD0', 'white': '#FFFFFF', 'black': '#1B1F3B',
  'navy': '#1B1F3B', 'navy blue': '#1B1F3B', 'red': '#C41E3A', 'maroon': '#800020',
  'gold': '#E8A838', 'amber': '#E8A838', 'yellow': '#F4D03F', 'orange': '#E67E22',
  'green': '#27AE60', 'olive': '#808000', 'teal': '#008080', 'blue': '#2980B9',
  'royal blue': '#2B60DE', 'pink': '#E8909C', 'magenta': '#C2185B', 'purple': '#7B1FA2',
  'grey': '#888888', 'gray': '#888888', 'silver': '#C0C0C0', 'brown': '#6D4C41',
  'beige': '#F5F5DC', 'peach': '#FFDAB9', 'coral': '#FF6F61', 'turquoise': '#40E0D0',
  'lavender': '#B388FF', 'rose': '#E8909C',
}

function resolveColor(code: string | undefined, fallback: string): string {
  if (!code) return fallback
  if (code.startsWith('#')) return code
  const lower = code.toLowerCase().trim()
  return COLOR_MAP[lower] || fallback
}

interface SimulationPreviewProps {
  matrix: number[][]
  warpColor: string
  weftColor: string
  designName: string
}

export default function SimulationPreview({ matrix, warpColor, weftColor, designName }: SimulationPreviewProps) {
  const previewRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [rendered, setRendered] = useState(false)
  const [scale, setScale] = useState(1) // 1 = 100% (2px per cell), 0.5 = 50%, 4 = 400%

  const rowYarnMap    = useDesignStore(s => s.rowYarnMap)
  const cellYarnMap   = useDesignStore(s => s.cellYarnMap)
  const draftSequence = useDesignStore(s => s.draftSequence)
  const weftYarns     = useDesignStore(s => s.weftSystem.yarns)

  const warpHex         = resolveColor(warpColor, '#1B3A6B')
  const weftFallbackHex = resolveColor(weftColor, '#E8A838')

  const getRowColor = useCallback((rowIndex: number): string => {
    const rows = matrix.length
    if (rows === 0) return weftFallbackHex
    const repeatRow = rowIndex % rows
    const yarnId = rowYarnMap[repeatRow]
    if (yarnId) {
      const yarn = weftYarns.find(y => y.id === yarnId)
      if (yarn?.colour_hex) return yarn.colour_hex
    }
    return weftFallbackHex
  }, [rowYarnMap, weftYarns, weftFallbackHex, matrix.length])

  // ── Step 1: Build a crisp 1px-per-cell tile (source of truth) ───────────
  const buildTile = useCallback((): HTMLCanvasElement | null => {
    const rows = matrix.length
    const cols = matrix[0]?.length || 0
    if (!rows || !cols) return null

    const tile = document.createElement('canvas')
    tile.width  = cols
    tile.height = rows
    const tCtx = tile.getContext('2d')
    if (!tCtx) return null
    tCtx.imageSmoothingEnabled = false

    for (let r = 0; r < rows; r++) {
      const weftRowColor = getRowColor(r)
      for (let c = 0; c < cols; c++) {
        let color = weftRowColor
        const shaftIndex = (draftSequence[c] ?? 1) - 1
        const cellYarnId = cellYarnMap[`${r}_${shaftIndex}`]
        if (cellYarnId) {
          const yarn = weftYarns.find(y => y.id === cellYarnId)
          if (yarn) color = yarn.colour_hex
        }
        tCtx.fillStyle = matrix[r][c] === 1 ? color : warpHex
        tCtx.fillRect(c, r, 1, 1)
      }
    }
    return tile
  }, [matrix, warpHex, getRowColor, cellYarnMap, draftSequence, weftYarns])

  // ── Step 2: Tile onto destination canvas using drawImage (no smoothing) ──
  const renderToCanvas = useCallback((
    canvas: HTMLCanvasElement,
    pxPerCell: number,  // always an integer — never fractional
    minPx: number = 320
  ) => {
    const rows = matrix.length
    const cols = matrix[0]?.length || 0
    if (!rows || !cols) return

    const tile = buildTile()
    if (!tile) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const tileW = cols * pxPerCell
    const tileH = rows * pxPerCell
    const totalW = Math.max(minPx, tileW * 2)
    const totalH = Math.max(minPx, tileH * 2)

    // HiDPI support — actual canvas pixels = display pixels × dpr
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1
    canvas.width  = Math.round(totalW * dpr)
    canvas.height = Math.round(totalH * dpr)
    canvas.style.width  = `${totalW}px`
    canvas.style.height = `${totalH}px`

    // Disable ALL smoothing — this is the key to sharpness
    ctx.imageSmoothingEnabled = false
    ctx.scale(dpr, dpr)

    // Background fill
    ctx.fillStyle = getRowColor(0)
    ctx.fillRect(0, 0, totalW, totalH)

    // Tile using drawImage — nearest-neighbor when imageSmoothingEnabled = false
    const tilesX = Math.ceil(totalW / tileW)
    const tilesY = Math.ceil(totalH / tileH)
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        ctx.drawImage(tile, tx * tileW, ty * tileH, tileW, tileH)
      }
    }

    setRendered(true)
  }, [matrix, buildTile, getRowColor])

  // ── Display: zoom controls drive pxPerCell (always integer) ─────────────
  const renderDisplay = useCallback((canvas: HTMLCanvasElement) => {
    // scale 0.1–4 → pxPerCell 1–8 (always integer, never blurry)
    const pxPerCell = Math.max(1, Math.round(2 * scale))
    renderToCanvas(canvas, pxPerCell, 320)
  }, [scale, renderToCanvas])

  useEffect(() => {
    if (previewRef.current && matrix.length > 0 && matrix[0]?.length > 0) {
      const timer = setTimeout(() => {
        if (previewRef.current) renderDisplay(previewRef.current)
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [renderDisplay, matrix, rowYarnMap, cellYarnMap, scale])

  // ── Download: ALWAYS 8px per cell at 2048px min → crisp on any screen ───
  const downloadPNG = useCallback(() => {
    const rows = matrix.length
    const cols = matrix[0]?.length || 0
    if (!rows || !cols) return

    const pxPerCell = 8
    const tile = buildTile()
    if (!tile) return

    const tileW = cols * pxPerCell
    const tileH = rows * pxPerCell
    const totalW = Math.max(2048, tileW * 4)
    const totalH = Math.max(2048, tileH * 4)

    const canvas = document.createElement('canvas')
    canvas.width  = totalW
    canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    ctx.fillStyle = getRowColor(0)
    ctx.fillRect(0, 0, totalW, totalH)

    const tilesX = Math.ceil(totalW / tileW)
    const tilesY = Math.ceil(totalH / tileH)
    for (let ty = 0; ty < tilesY; ty++)
      for (let tx = 0; tx < tilesX; tx++)
        ctx.drawImage(tile, tx * tileW, ty * tileH, tileW, tileH)

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${designName.replace(/\s+/g, '_')}_fabric_simulation.png`
      a.click()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }, [matrix, buildTile, getRowColor, designName])

  const copyToClipboard = useCallback(async () => {
    const rows = matrix.length
    const cols = matrix[0]?.length || 0
    if (!rows || !cols) return

    const pxPerCell = 8
    const tile = buildTile()
    if (!tile) return

    const tileW = cols * pxPerCell
    const tileH = rows * pxPerCell
    const totalW = Math.max(2048, tileW * 4)
    const totalH = Math.max(2048, tileH * 4)

    const canvas = document.createElement('canvas')
    canvas.width  = totalW
    canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    ctx.fillStyle = getRowColor(0)
    ctx.fillRect(0, 0, totalW, totalH)

    const tilesX = Math.ceil(totalW / tileW)
    const tilesY = Math.ceil(totalH / tileH)
    for (let ty = 0; ty < tilesY; ty++)
      for (let tx = 0; tx < tilesX; tx++)
        ctx.drawImage(tile, tx * tileW, ty * tileH, tileW, tileH)

    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        alert('Image copied to clipboard!')
      } catch {
        alert('Could not copy to clipboard. Try downloading instead.')
      }
    }, 'image/png')
  }, [matrix, buildTile, getRowColor])

  // Unique yarn colors for legend
  const usedYarns   = weftYarns.filter(yarn =>
    Object.values(rowYarnMap).includes(yarn.id) || Object.values(cellYarnMap).includes(yarn.id)
  )
  const hasMultiColor = usedYarns.length > 1

  if (!matrix.length || !matrix[0]?.length) {
    return (
      <div style={{
        textAlign: 'center', padding: 40,
        color: 'var(--text-3)', fontSize: 13,
        background: 'var(--bg)', borderRadius: 14,
        border: '1.5px dashed var(--border)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" style={{ marginBottom: 4 }}>
          <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 15l6-6 4 4 4-4 4 4" />
        </svg>
        <div style={{ fontWeight: 500, color: 'var(--text-2)' }}>No simulation yet</div>
        <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Enter a peg plan to see the fabric preview</div>
      </div>
    )
  }

  const btnStyle: React.CSSProperties = {
    width: 26, height: 26, borderRadius: 6,
    border: '1px solid var(--border-light)',
    background: 'var(--surface)', cursor: 'pointer',
    fontSize: 15, fontWeight: 800, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-2)', flexShrink: 0,
  }

  return (
    <div style={{ width: '100%' }} ref={containerRef}>

      {/* Zoom Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>Zoom</span>
        <button style={btnStyle} title="Zoom out" onClick={() => setScale(s => Math.max(0.1, parseFloat((s - 0.1).toFixed(2))))}>−</button>
        <input
          type="range" min={0.1} max={4} step={0.1} value={scale}
          onChange={e => setScale(Number(e.target.value))}
          style={{ width: 110, accentColor: 'var(--accent)', cursor: 'pointer' }}
          title={`${Math.round(scale * 100)}%`}
        />
        <button style={btnStyle} title="Zoom in" onClick={() => setScale(s => Math.min(4, parseFloat((s + 0.1).toFixed(2))))}>+</button>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', minWidth: 36 }}>
          {Math.round(scale * 100)}%
        </span>
        {/* Reset button */}
        <button style={{ ...btnStyle, fontSize: 9, width: 'auto', padding: '0 6px', letterSpacing: '0.03em' }}
          onClick={() => setScale(1)} title="Reset zoom">100%</button>
      </div>

      {/* Preview canvas — scrollable when zoomed in */}
      <div className="flex justify-center mb-4">
        <div style={{
          width: 320, height: 320,
          borderRadius: 16, overflow: 'auto',
          border: '1px solid var(--border-light)',
          background: 'var(--bg)',
          boxShadow: 'var(--shadow-md)',
          flexShrink: 0,
          imageRendering: 'pixelated',    /* hint browser to keep crisp */
        }}>
          <canvas
            ref={previewRef}
            style={{
              display: 'block',
              imageRendering: 'pixelated', /* CSS pixelated = nearest-neighbor */
            }}
          />
        </div>
      </div>

      {/* Color Legend */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 16, fontSize: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: warpHex, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
          <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Warp</span>
        </div>

        {hasMultiColor ? (
          usedYarns.map((yarn, i) => (
            <div key={yarn.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, background: yarn.colour_hex, border: '1px solid var(--border)', boxShadow: `0 1px 3px ${yarn.colour_hex}55` }} />
              <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>
                {yarn.label || `Weft ${String.fromCharCode(65 + i)}`}
              </span>
            </div>
          ))
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: weftFallbackHex, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Weft</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            {matrix.length}×{matrix[0]?.length} repeat
            {hasMultiColor && ` · ${usedYarns.length} weft colors`}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
        <button onClick={downloadPNG} className="btn-primary" style={{ fontSize: 12, height: 36, padding: '0 16px' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Download Fabric Image
        </button>
        <button onClick={copyToClipboard} className="btn-secondary" style={{ fontSize: 12, height: 36 }}>
          Copy for WhatsApp
        </button>
      </div>
    </div>
  )
}
