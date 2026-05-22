'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { designLibrary } from '@/data/designLibrary'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EpiParams {
  epi: string
  inch: string
}

interface DesignEntry {
  id: string
  name: string
  fabric_type: string
  peg_matrix: number[][]
  tags: string[]
  weave_type: string
  description: string
  popularity: number
}

interface PlacedBlock {
  id: string
  name: string
  matrix: number[][]
  baseMatrix: number[][]
  startCol: number
  startRow: number
  zone: 'left-border' | 'body' | 'right-border'
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Pull valid designs from the shared library
const ALL_DESIGNS: DesignEntry[] = (designLibrary.designs as DesignEntry[]).filter(
  d => Array.isArray(d.peg_matrix) && Array.isArray(d.peg_matrix[0])
)

const BASE_CELL = 16
const MIN_GRID_ROWS = 40
const MAX_GRID_ROWS = 1000
const MIN_ZOOM = 0.3
const MAX_ZOOM = 2.5
const STABLE_WIDTH = 1200 // Target width to fit within when ends are high

// Compute how many columns each zone gets based on total ends
function computeZoneCols(borderEnds: number, bodyEnds: number) {
  const borderCols = Math.max(2, borderEnds)
  const bodyCols   = Math.max(4, bodyEnds)
  const GRID_COLS  = borderCols * 2 + bodyCols
  return { GRID_COLS, borderCols, bodyCols }
}

// ─── Mini B&W Matrix Preview ──────────────────────────────────────────────────

function MatrixPreview({ matrix, size = 32 }: { matrix: number[][], size?: number }) {
  const rows = matrix.length
  const cols = matrix[0]?.length || 1
  const cell = Math.max(1, Math.floor(size / Math.max(rows, cols)))
  const w = cols * cell
  const h = rows * cell
  return (
    <svg width={w} height={h} style={{ display: 'block', imageRendering: 'pixelated' }}>
      {matrix.map((row, r) => row.map((v, c) => (
        <rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell}
          fill={v === 1 ? '#1D1D1F' : '#fff'} />
      )))}
    </svg>
  )
}

// ─── Block Canvas (B&W) ──────────────────────────────────────────────────────

function BlockCanvas({ matrix, width, height, cell }: { matrix: number[][], width: number, height: number, cell: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#1D1D1F'
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < (matrix[r]?.length || 0); c++) {
        if (matrix[r][c] === 1) ctx.fillRect(c * cell, r * cell, cell, cell)
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 0.5
    ctx.beginPath()
    for (let r = 0; r <= matrix.length; r++) { ctx.moveTo(0, r * cell); ctx.lineTo(width, r * cell) }
    for (let c = 0; c <= (matrix[0]?.length || 0); c++) { ctx.moveTo(c * cell, 0); ctx.lineTo(c * cell, height) }
    ctx.stroke()
  }, [matrix, width, height, cell])
  return <canvas ref={canvasRef} width={width} height={height} style={{ display: 'block', pointerEvents: 'none' }} />
}

// ─── Fabric Simulation Canvas ─────────────────────────────────────────────────
// Renders zone-aware pixel-level woven fabric from placed blocks.
// Border zones get warp=#1B3A6B / weft=#E0115F; body gets warp=#1B3A6B / weft=#E8A838.

function FabricSimulationCanvas({
  placedBlocks, borderCols, bodyCols, GRID_COLS, GRID_ROWS,
}: {
  placedBlocks: PlacedBlock[]
  borderCols: number
  bodyCols: number
  GRID_COLS: number
  GRID_ROWS: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cellSize, setCellSize] = useState(2)   // px per cell (zoom-controlled, 1–8)
  const SIM_ROWS = 420  // canvas pixel height
  const SIM_CELL = cellSize

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = GRID_COLS * SIM_CELL
    const H = SIM_ROWS
    canvas.width  = W
    canvas.height = H
    canvas.style.width  = `${W}px`
    canvas.style.height = `${H}px`

    const rightBorderStart = borderCols + bodyCols

    // Separate blocks by zone
    const borderBlocks = placedBlocks.filter(b => b.zone === 'left-border' || b.zone === 'right-border')
    const bodyBlocks   = placedBlocks.filter(b => b.zone === 'body')

    // Prefer the most-recently placed (last) block in each zone for the simulation pattern
    const borderMat = borderBlocks[borderBlocks.length - 1]?.baseMatrix ?? null
    const bodyMat   = bodyBlocks[bodyBlocks.length - 1]?.baseMatrix ?? null

    // Colours
    const WARP_COLOR       = '#3A2080' // deep indigo warp (shared)
    const WEFT_BORDER      = '#E0115F' // hot pink for border weft
    const WEFT_BODY        = '#E8A838' // gold for body weft
    const EMPTY_BORDER     = 'rgba(224,17,95,0.10)'
    const EMPTY_BODY       = 'rgba(238,238,238,0.80)'

    // ── Render pixel by pixel ────────────────────────────────────────────────
    for (let simRow = 0; simRow < H / SIM_CELL; simRow++) {
      const y = simRow * SIM_CELL

      for (let col = 0; col < GRID_COLS; col++) {
        const x = col * SIM_CELL
        const isBorder = col < borderCols || col >= rightBorderStart
        const mat = isBorder ? borderMat : bodyMat

        let fill: string
        if (!mat || mat.length === 0) {
          fill = isBorder ? EMPTY_BORDER : EMPTY_BODY
        } else {
          const matCols = mat[0]?.length || 1
          const matRows = mat.length
          // Within the border zone, use column relative to zone start
          const zoneStart = col < borderCols ? 0 : col >= rightBorderStart ? rightBorderStart : borderCols
          const relCol = (col - zoneStart) % matCols
          const relRow = simRow % matRows
          const val    = mat[relRow]?.[relCol] ?? 0
          const weft   = isBorder ? WEFT_BORDER : WEFT_BODY
          fill = val === 1 ? WARP_COLOR : weft
        }

        ctx.fillStyle = fill
        ctx.fillRect(x, y, SIM_CELL, SIM_CELL)
      }
    }

    // ── Zone boundary lines ─────────────────────────────────────────────────
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'
    ctx.lineWidth   = 1.5
    ctx.setLineDash([4, 3])
    ctx.beginPath()
    ctx.moveTo(borderCols * SIM_CELL, 0)
    ctx.lineTo(borderCols * SIM_CELL, H)
    ctx.moveTo(rightBorderStart * SIM_CELL, 0)
    ctx.lineTo(rightBorderStart * SIM_CELL, H)
    ctx.stroke()
    ctx.setLineDash([])

    // ── Zone labels ─────────────────────────────────────────────────────────
    ctx.font = 'bold 9px system-ui'
    ctx.textAlign = 'center'

    const zones = [
      { label: 'BORDER', x: borderCols / 2, color: '#fff' },
      { label: 'BODY',   x: borderCols + bodyCols / 2, color: 'rgba(255,255,255,0.7)' },
      { label: 'BORDER', x: rightBorderStart + borderCols / 2, color: '#fff' },
    ]
    zones.forEach(z => {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.fillRect(z.x * SIM_CELL - 22, 4, 44, 14)
      ctx.fillStyle = z.color
      ctx.fillText(z.label, z.x * SIM_CELL, 14)
    })

  }, [placedBlocks, borderCols, bodyCols, GRID_COLS, GRID_ROWS, cellSize])

  const hasBlocks = placedBlocks.length > 0

  if (!hasBlocks) {
    return (
      <div style={{
        width: '100%', height: 160,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 8, color: 'rgba(0,0,0,0.3)', fontSize: 12,
        background: 'repeating-linear-gradient(45deg, #f0f0f2 0, #f0f0f2 8px, #e8e8ea 8px, #e8e8ea 16px)',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15l6-6 4 4 4-4 4 4"/>
        </svg>
        <span style={{ fontWeight: 600 }}>Drop designs onto the canvas</span>
        <span style={{ fontSize: 10 }}>Fabric simulation appears automatically</span>
      </div>
    )
  }

  // ── Zoom toolbar styles
  const btnStyle: React.CSSProperties = {
    width: 26, height: 26, borderRadius: 7,
    border: '1.5px solid rgba(0,0,0,0.14)',
    background: '#fff', cursor: 'pointer',
    fontSize: 16, fontWeight: 800, lineHeight: 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#1D1D1F', flexShrink: 0,
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    transition: 'background 0.15s',
  }

  return (
    <div style={{ width: '100%' }}>
      {/* ── Zoom toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
        background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid rgba(0,0,0,0.07)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.4)', marginRight: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Zoom</span>
        <button style={btnStyle} title="Zoom out"
          onClick={() => setCellSize(s => Math.max(1, s - 1))}>−</button>
        <input
          type="range" min={1} max={8} step={1} value={cellSize}
          onChange={e => setCellSize(Number(e.target.value))}
          style={{ width: 100, accentColor: '#3A2080', cursor: 'pointer' }}
          title={`${cellSize}px per cell`}
        />
        <button style={btnStyle} title="Zoom in"
          onClick={() => setCellSize(s => Math.min(8, s + 1))}>+</button>
        <span style={{
          fontSize: 10, fontWeight: 700, fontFamily: 'monospace',
          color: '#3A2080', minWidth: 28,
        }}>{cellSize}px</span>
      </div>

      {/* ── Canvas ── */}
      <div style={{ overflowX: 'auto', overflowY: 'auto', width: '100%', maxHeight: 440 }}>
        <canvas ref={canvasRef}
          style={{ display: 'block', imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  )
}

// ─── Design Card ──────────────────────────────────────────────────────────────

function DesignCard({ design, onDragStart }: { design: DesignEntry; onDragStart: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
        background: hov ? '#f5f5f7' : '#fff', borderRadius: 8,
        border: `1.5px solid ${hov ? '#E0115F' : 'rgba(0,0,0,0.08)'}`,
        cursor: 'grab', userSelect: 'none', transition: 'all 0.13s',
        boxShadow: hov ? '0 2px 8px rgba(224,17,95,0.12)' : 'none',
        flexShrink: 0,
      }}
    >
      <div style={{ flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden', background: '#fff' }}>
        <MatrixPreview matrix={design.peg_matrix} size={28} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{design.name}</div>
        <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', marginTop: 1 }}>
          {design.peg_matrix.length}×{design.peg_matrix[0]?.length} · {design.weave_type}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.18)', flexShrink: 0 }}>⠿</div>
    </div>
  )
}

// ─── EPI Panel ────────────────────────────────────────────────────────────────

function EndsPanel({ ends, onChange, label, color }: { ends: string; onChange: (ends: string) => void; label: string; color: string }) {
  const val = parseInt(ends) || 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.01em' }}>{label}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color, background: `${color}10`, padding: '2px 6px', borderRadius: 4, border: `1px solid ${color}20` }}>
          {val} boxes
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="number"
          value={ends}
          min={1}
          max={400}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, height: 36, borderRadius: 10, border: '1.5px solid rgba(0,0,0,0.1)',
            padding: '0 10px', fontSize: 13, fontWeight: 700, background: '#fafafa', outline: 'none', boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={() => onChange(String(val + 1))} style={{ width: 20, height: 16, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 3, background: '#fff', fontSize: 10, cursor: 'pointer' }}>+</button>
          <button onClick={() => onChange(String(Math.max(1, val - 1)))} style={{ width: 20, height: 16, border: '1px solid rgba(0,0,0,0.1)', borderRadius: 3, background: '#fff', fontSize: 10, cursor: 'pointer' }}>-</button>
        </div>
      </div>
      <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.4)', marginTop: 2 }}>
        Controls horizontal boxes in matrix
      </div>
    </div>
  )
}

// ─── Fabric Grid ──────────────────────────────────────────────────────────────

type ResizeState = {
  id: string
  handle: 'se'|'s'|'sw'|'e'|'w'|'ne'|'n'|'nw'
  startX: number; startY: number
  origCols: number; origRows: number
  baseCols: number; baseRows: number
} | null

function FabricGrid({
  placedBlocks, dragging, draggingDesign,
  borderCols, bodyCols, GRID_COLS, GRID_ROWS,
  selectedId, zoom, cellSize,
  onDropAtCell, onDeleteBlock, onSelectBlock,
  onMoveBlock, onRepeatBlock, onFillFabric, onScaleH, onScaleV,
}: {
  placedBlocks: PlacedBlock[]
  dragging: boolean
  draggingDesign: DesignEntry | null
  borderCols: number; bodyCols: number; GRID_COLS: number; GRID_ROWS: number
  selectedId: string | null
  zoom: number
  cellSize: number
  onDropAtCell: (col: number, row: number) => void
  onDeleteBlock: (id: string) => void
  onSelectBlock: (id: string | null) => void
  onMoveBlock: (id: string, col: number, row: number) => void
  onRepeatBlock: (id: string, repX: number, repY: number) => void
  onFillFabric: (id: string) => void
  onScaleH: (id: string) => void
  onScaleV: (id: string) => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [hoverCell, setHoverCell] = useState<{ col: number; row: number } | null>(null)
  const [innerDrag, setInnerDrag] = useState<{ id: string; dx: number; dy: number; startX: number; startY: number; origCol: number; origRow: number } | null>(null)
  const [resizeState, setResizeState] = useState<ResizeState>(null)
  const [popRepX, setPopRepX] = useState(2)
  const [popRepY, setPopRepY] = useState(2)

  const rightBorderStart = borderCols + bodyCols

  const getZoneRange = (zone: PlacedBlock['zone']) => {
    if (zone === 'left-border')  return { minCol: 0,               maxCol: borderCols }
    if (zone === 'body')         return { minCol: borderCols,       maxCol: rightBorderStart }
    return                               { minCol: rightBorderStart, maxCol: GRID_COLS }
  }

  const getCellFromEvent = (e: React.MouseEvent | React.DragEvent) => {
    const rect = gridRef.current?.getBoundingClientRect()
    if (!rect) return null
    const col = Math.floor((e.clientX - rect.left) / zoom / cellSize)
    const row = Math.floor((e.clientY - rect.top) / zoom / cellSize)
    return { col: Math.max(0, Math.min(col, GRID_COLS - 1)), row: Math.max(0, Math.min(row, GRID_ROWS - 1)) }
  }

  const totalW = GRID_COLS * cellSize
  const totalH = GRID_ROWS * cellSize

  // Optimize: skip grid lines if they are too thin (performance)
  const shouldDrawLines = cellSize * zoom > 2

  return (
    <div
      ref={gridRef}
      style={{ position: 'relative', width: totalW, height: totalH, cursor: dragging ? 'crosshair' : 'default', flexShrink: 0 }}
      onDragOver={e => { e.preventDefault(); const cell = getCellFromEvent(e); if (cell) setHoverCell(cell) }}
      onDragLeave={() => setHoverCell(null)}
      onDrop={e => { e.preventDefault(); const cell = getCellFromEvent(e); if (cell) onDropAtCell(cell.col, cell.row); setHoverCell(null) }}
      onClick={() => onSelectBlock(null)}
    >
      {/* Zone backgrounds */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
        <div style={{ width: borderCols * cellSize, background: 'rgba(224,17,95,0.05)' }} />
        <div style={{ width: bodyCols * cellSize, background: 'rgba(255,255,255,0.6)' }} />
        <div style={{ flex: 1, background: 'rgba(224,17,95,0.05)' }} />
      </div>

      {/* Grid lines - Performance optimized */}
      {shouldDrawLines && (
        <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width={totalW} height={totalH}>
          {/* Only draw vertical lines if they aren't insane - maybe every 1 cell if < 1000, else skip or group */}
          {GRID_COLS < 1000 && Array.from({ length: GRID_COLS + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * cellSize} y1={0} x2={i * cellSize} y2={totalH}
              stroke={i === borderCols || i === rightBorderStart ? 'rgba(224,17,95,0.6)' : 'rgba(0,0,0,0.06)'}
              strokeWidth={i === borderCols || i === rightBorderStart ? 1.5 : 0.4} />
          ))}
          {/* Horizonatal lines */}
          {GRID_ROWS < 600 && Array.from({ length: GRID_ROWS + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * cellSize} x2={totalW} y2={i * cellSize}
              stroke="rgba(0,0,0,0.05)" strokeWidth={0.4} />
          ))}
          
          {/* Minimal zone boundary markers if dense */}
          {GRID_COLS >= 1000 && (
            <>
               <line x1={borderCols * cellSize} y1={0} x2={borderCols * cellSize} y2={totalH} stroke="#E0115F" strokeWidth={2} />
               <line x1={rightBorderStart * cellSize} y1={0} x2={rightBorderStart * cellSize} y2={totalH} stroke="#E0115F" strokeWidth={2} />
            </>
          )}

          {!shouldDrawLines && (
             <>
               <line x1={borderCols * cellSize} y1={0} x2={borderCols * cellSize} y2={totalH} stroke="#E0115F" strokeWidth={2} strokeDasharray="6,4" />
               <line x1={rightBorderStart * cellSize} y1={0} x2={rightBorderStart * cellSize} y2={totalH} stroke="#E0115F" strokeWidth={2} strokeDasharray="6,4" />
             </>
          )}
        </svg>
      )}

      {/* Zone labels */}
      <div style={{ position: 'absolute', top: 6, left: 0, width: borderCols * cellSize, textAlign: 'center', pointerEvents: 'none', zIndex: 2 }}>
        <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(224,17,95,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: 4 }}>Border</span>
      </div>
      <div style={{ position: 'absolute', top: 6, left: borderCols * cellSize, width: bodyCols * cellSize, textAlign: 'center', pointerEvents: 'none', zIndex: 2 }}>
        <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(0,0,0,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: 4 }}>Body</span>
      </div>
      <div style={{ position: 'absolute', top: 6, left: rightBorderStart * cellSize, right: 0, textAlign: 'center', pointerEvents: 'none', zIndex: 2 }}>
        <span style={{ fontSize: 8, fontWeight: 800, color: 'rgba(224,17,95,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', background: 'rgba(255,255,255,0.9)', padding: '2px 6px', borderRadius: 4 }}>Border</span>
      </div>

      {/* Placed blocks */}
      {placedBlocks.map(block => {
        const { matrix } = block
        const rows = matrix.length
        const cols = matrix[0]?.length || 1
        const isSelected = selectedId === block.id
        const isDraggingThis = innerDrag?.id === block.id
        const isResizingThis = resizeState?.id === block.id

        const currentLeft = isDraggingThis ? (block.startCol * cellSize) + innerDrag.dx : block.startCol * cellSize
        const currentTop  = isDraggingThis ? (block.startRow * cellSize) + innerDrag.dy : block.startRow * cellSize

        const { minCol, maxCol } = getZoneRange(block.zone)
        const zoneW = (maxCol - minCol) * cellSize
        const baseCols = block.baseMatrix[0]?.length || 1
        const baseRows = block.baseMatrix.length
        const maxRepX = Math.max(1, Math.floor((maxCol - block.startCol) / baseCols))
        const maxRepY = Math.max(1, Math.floor((GRID_ROWS - block.startRow) / baseRows))

        return (
          <div key={block.id}
            onPointerDown={e => {
              if ((e.target as HTMLElement).dataset.handle) return
              e.stopPropagation()
              e.currentTarget.setPointerCapture(e.pointerId)
              onSelectBlock(block.id)
              setInnerDrag({ id: block.id, dx: 0, dy: 0, startX: e.clientX, startY: e.clientY, origCol: block.startCol, origRow: block.startRow })
            }}
            onClick={e => e.stopPropagation()} // prevent parent deselect from firing
            onPointerMove={e => {
              if (!innerDrag || innerDrag.id !== block.id) return
              const rawDx = (e.clientX - innerDrag.startX) / zoom
              const rawDy = (e.clientY - innerDrag.startY) / zoom
              setInnerDrag(s => s ? { ...s, dx: rawDx, dy: rawDy } : s)
            }}
            onPointerUp={e => {
              if (!innerDrag || innerDrag.id !== block.id) return
              e.currentTarget.releasePointerCapture(e.pointerId)
              const newCol = Math.round((innerDrag.origCol * cellSize + innerDrag.dx) / cellSize)
              const newRow = Math.round((innerDrag.origRow * cellSize + innerDrag.dy) / cellSize)
              onMoveBlock(block.id, newCol, newRow)
              setInnerDrag(null)
            }}
            style={{
              position: 'absolute',
              left: currentLeft, top: currentTop,
              width: cols * cellSize, height: rows * cellSize,
              cursor: isDraggingThis ? 'grabbing' : 'grab',
              zIndex: isSelected || isDraggingThis ? 10 : 5,
              boxShadow: isDraggingThis ? '0 12px 32px rgba(0,0,0,0.2)' : isSelected ? '0 0 0 2px #E0115F' : 'none',
              transform: isDraggingThis ? 'scale(1.02)' : 'scale(1)',
              transition: isDraggingThis || isResizingThis ? 'none' : 'box-shadow 0.2s, transform 0.18s',
              touchAction: 'none',
            }}>
            <BlockCanvas matrix={matrix} width={cols * cellSize} height={rows * cellSize} cell={cellSize} />

            {/* Selection overlay */}
            {isSelected && !isDraggingThis && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(224,17,95,0.06)', zIndex: 2, pointerEvents: 'none' }} />
            )}

            {/* Resize handles + dashed border */}
            {isSelected && !isDraggingThis && (() => {
              const handles = [
                { key: 'nw' as const, x: '0%',   y: '0%',   cur: 'nw-resize' },
                { key: 'n'  as const, x: '50%',  y: '0%',   cur: 'n-resize' },
                { key: 'ne' as const, x: '100%', y: '0%',   cur: 'ne-resize' },
                { key: 'e'  as const, x: '100%', y: '50%',  cur: 'e-resize' },
                { key: 'se' as const, x: '100%', y: '100%', cur: 'se-resize' },
                { key: 's'  as const, x: '50%',  y: '100%', cur: 's-resize' },
                { key: 'sw' as const, x: '0%',   y: '100%', cur: 'sw-resize' },
                { key: 'w'  as const, x: '0%',   y: '50%',  cur: 'w-resize' },
              ]
              return (
                <>
                  {/* Dashed pink border */}
                  <div style={{ position: 'absolute', inset: -1, border: '1.5px dashed #E0115F', zIndex: 3, pointerEvents: 'none', borderRadius: 2 }} />
                  {handles.map(h => (
                    <div
                      key={h.key}
                      data-handle="1"
                      onPointerDown={e => {
                        e.stopPropagation(); e.preventDefault()
                        e.currentTarget.setPointerCapture(e.pointerId)
                        setResizeState({ id: block.id, handle: h.key, startX: e.clientX, startY: e.clientY, origCols: cols, origRows: rows, baseCols, baseRows })
                      }}
                      onPointerMove={e => {
                        if (!resizeState || resizeState.id !== block.id) return
                        const dxPx = (e.clientX - resizeState.startX) / zoom
                        const dyPx = (e.clientY - resizeState.startY) / zoom
                        const hKey = resizeState.handle
                        let newW = resizeState.origCols * cellSize
                        let newH = resizeState.origRows * cellSize
                        if (hKey.includes('e')) newW = Math.max(baseCols * cellSize, resizeState.origCols * cellSize + dxPx)
                        if (hKey.includes('w')) newW = Math.max(baseCols * cellSize, resizeState.origCols * cellSize - dxPx)
                        if (hKey.includes('s')) newH = Math.max(baseRows * cellSize, resizeState.origRows * cellSize + dyPx)
                        if (hKey.includes('n')) newH = Math.max(baseRows * cellSize, resizeState.origRows * cellSize - dyPx)
                        const newRepX = Math.max(1, Math.min(Math.round(newW / (baseCols * cellSize)), maxRepX))
                        const newRepY = Math.max(1, Math.min(Math.round(newH / (baseRows * cellSize)), maxRepY))
                        onRepeatBlock(block.id, newRepX, newRepY)
                      }}
                      onPointerUp={e => { e.currentTarget.releasePointerCapture(e.pointerId); setResizeState(null) }}
                      style={{
                        position: 'absolute',
                        left: h.x, top: h.y,
                        transform: `translate(-50%, -50%) scale(${1 / zoom})`,
                        width: 12, height: 12,
                        background: '#fff',
                        border: '2.5px solid #E0115F',
                        borderRadius: 3,
                        boxShadow: '0 2px 6px rgba(224,17,95,0.5)',
                        cursor: h.cur,
                        zIndex: 40,
                        touchAction: 'none',
                      }}
                    />
                  ))}

                  {/* Floating toolbar */}
                  <div
                    data-handle="1"
                    onPointerDown={e => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      bottom: '100%', left: '50%',
                      transform: `translateX(-50%) translateY(-6px) scale(${1 / zoom})`,
                      transformOrigin: 'bottom center',
                      display: 'flex', gap: 4, alignItems: 'center',
                      background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)',
                      padding: '6px 10px', borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                      whiteSpace: 'nowrap', zIndex: 50,
                    }}>
                    {/* Multiply inputs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(0,0,0,0.35)', textTransform: 'uppercase' }}>Repeat</span>
                      <input type="number" min={1} value={popRepX} onChange={e => setPopRepX(Math.max(1, Number(e.target.value)))}
                        style={{ width: 32, height: 24, borderRadius: 5, border: '1px solid rgba(0,0,0,0.1)', textAlign: 'center', fontSize: 12, fontWeight: 700, background: '#f5f5f7', outline: 'none' }} />
                      <span style={{ fontSize: 11, color: '#aaa' }}>×</span>
                      <input type="number" min={1} value={popRepY} onChange={e => setPopRepY(Math.max(1, Number(e.target.value)))}
                        style={{ width: 32, height: 24, borderRadius: 5, border: '1px solid rgba(0,0,0,0.1)', textAlign: 'center', fontSize: 12, fontWeight: 700, background: '#f5f5f7', outline: 'none' }} />
                      <button onClick={() => onRepeatBlock(block.id, popRepX, popRepY)}
                        style={{ height: 24, padding: '0 8px', fontSize: 10, fontWeight: 700, background: '#E0115F', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>Apply</button>
                    </div>
                    <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.08)' }} />
                    <button onClick={() => onScaleH(block.id)} title="Fill zone horizontally"
                      style={{ height: 24, padding: '0 7px', fontSize: 10, fontWeight: 700, background: '#f5f5f7', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 5, cursor: 'pointer' }}>↔ H</button>
                    <button onClick={() => onScaleV(block.id)} title="Fill vertically"
                      style={{ height: 24, padding: '0 7px', fontSize: 10, fontWeight: 700, background: '#f5f5f7', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 5, cursor: 'pointer' }}>↕ V</button>
                    <button onClick={() => onRepeatBlock(block.id, maxRepX, maxRepY)} title="Fill entire zone"
                      style={{ height: 24, padding: '0 7px', fontSize: 10, fontWeight: 700, background: '#f5f5f7', color: '#1D1D1F', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 5, cursor: 'pointer' }}>⬜ Zone</button>
                    <button onClick={() => onFillFabric(block.id)} title="Fill entire fabric"
                      style={{ height: 24, padding: '0 8px', fontSize: 10, fontWeight: 700, background: 'linear-gradient(135deg,#BA0C5D,#E0115F)', color: '#fff', border: 'none', borderRadius: 5, cursor: 'pointer' }}>🌐 Fabric</button>
                    <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.08)' }} />
                    <button onClick={() => { onDeleteBlock(block.id); onSelectBlock(null) }}
                      style={{ height: 24, width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff0f0', color: '#E0115F', border: '1px solid rgba(224,17,95,0.15)', borderRadius: 5, cursor: 'pointer' }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                    </button>
                  </div>
                </>
              )
            })()}
          </div>
        )
      })}

      {/* Live ghost preview when dragging from sidebar */}
      {hoverCell && dragging && draggingDesign && (() => {
        const mat = draggingDesign.peg_matrix
        const dRows = mat.length; const dCols = mat[0]?.length || 1
        const clampedCol = Math.max(0, Math.min(hoverCell.col, GRID_COLS - dCols))
        const clampedRow = Math.max(0, Math.min(hoverCell.row, GRID_ROWS - dRows))
        return (
          <div style={{
            position: 'absolute', left: clampedCol * cellSize, top: clampedRow * cellSize,
            width: dCols * cellSize, height: dRows * cellSize,
            pointerEvents: 'none', zIndex: 20, opacity: 0.8,
            border: '2px dashed #E0115F', borderRadius: 2, overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(224,17,95,0.25)',
          }}>
            <BlockCanvas matrix={mat} width={dCols * cellSize} height={dRows * cellSize} cell={cellSize} />
          </div>
        )
      })()}
    </div>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const panelStyle: React.CSSProperties = {
  background: '#fff', borderRight: '1px solid rgba(0,0,0,0.06)',
  display: 'flex', flexDirection: 'column', overflow: 'hidden',
}

export default function AIDesignStudio() {
  // Ends (Beam boxes) state
  const [borderEnds, setBorderEnds] = useState('16')
  const [bodyEnds, setBodyEnds] = useState('48')

  // Picks / fabric length (controls vertical grid size)
  const [ppi, setPpi] = useState('60')        // picks per inch
  const [fabricLength, setFabricLength] = useState('100') // cm (fabric length)

  // Derived: GRID_ROWS = ppi * (length / 2.54) — picks over the length in inches
  const gridRows = useMemo(() => {
    const p = parseFloat(ppi) || 60
    const l = parseFloat(fabricLength) || 100
    const inches = l / 2.54
    return Math.max(MIN_GRID_ROWS, Math.min(MAX_GRID_ROWS, Math.round(p * inches)))
  }, [ppi, fabricLength])

  // Design search
  const [borderSearch, setBorderSearch] = useState('')
  const [bodySearch, setBodySearch] = useState('')
  const [customDesigns, setCustomDesigns] = useState<DesignEntry[]>([])

  useEffect(() => {
    fetch('/api/admin/designs')
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.designs) setCustomDesigns(data.designs)
      }).catch(console.error)
  }, [])

  const combinedLibrary = useMemo(() => {
    return [...customDesigns, ...ALL_DESIGNS]
  }, [customDesigns])


  // Drag & drop
  const [draggingDesign, setDraggingDesign] = useState<DesignEntry | null>(null)
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.45)
  const [viewMode, setViewMode] = useState<'grid' | 'sim'>('grid')
  // Canvas pan offset (pixels in screen space)
  const [panX, setPanX] = useState(20)
  const [panY, setPanY] = useState(20)
  const canvasViewportRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const panStartRef = useRef({ x: 0, y: 0, px: 0, py: 0 })
  const spaceDownRef = useRef(false)

  // Derived zone geometry
  const { GRID_COLS, borderCols, bodyCols } = useMemo(() => computeZoneCols(
    parseInt(borderEnds) || 16, parseInt(bodyEnds) || 48
  ), [borderEnds, bodyEnds])

  // DYNAMIC CELL SIZE: Shrink cells to fit within 1200px if ends are high
  const cellSize = useMemo(() => {
    const idealWidth = GRID_COLS * BASE_CELL
    if (idealWidth <= STABLE_WIDTH) return BASE_CELL
    return Math.max(0.5, STABLE_WIDTH / GRID_COLS)
  }, [GRID_COLS])

  const rightBorderStart = borderCols + bodyCols

  const filterDesigns = (q: string) => {
    const lq = q.toLowerCase().trim()
    if (!lq) return combinedLibrary.slice(0, 40)
    return combinedLibrary.filter(d =>
      d.name.toLowerCase().includes(lq) ||
      d.weave_type?.toLowerCase().includes(lq) ||
      d.fabric_type?.toLowerCase().includes(lq) ||
      (d.tags || []).some((t: string) => t.toLowerCase().includes(lq))
    ).slice(0, 40)
  }

  // Drop: clamp to the zone the user dropped into
  const handleDropAtCell = useCallback((col: number, row: number) => {
    if (!draggingDesign) return
    const mat = draggingDesign.peg_matrix
    const dRows = mat.length; const dCols = mat[0]?.length || 1

    let zone: PlacedBlock['zone']
    let minCol: number; let maxCol: number
    if (col < borderCols) {
      zone = 'left-border'; minCol = 0; maxCol = borderCols
    } else if (col < rightBorderStart) {
      zone = 'body'; minCol = borderCols; maxCol = rightBorderStart
    } else {
      zone = 'right-border'; minCol = rightBorderStart; maxCol = GRID_COLS
    }

    const safeCol = Math.max(minCol, Math.min(col, maxCol - dCols))
    const safeRow = Math.max(0, Math.min(row, gridRows - dRows))

    setPlacedBlocks(prev => [...prev, {
      id: `${draggingDesign.id}-${Date.now()}`,
      name: draggingDesign.name,
      matrix: mat, baseMatrix: mat,
      startCol: safeCol, startRow: safeRow,
      zone,
    }])
    setDraggingDesign(null)
  }, [draggingDesign, borderCols, rightBorderStart, GRID_COLS, gridRows])

  const handleDeleteBlock = useCallback((id: string) => setPlacedBlocks(p => p.filter(b => b.id !== id)), [])

  // Move: enforce zone boundaries
  const handleMoveBlock = useCallback((id: string, newCol: number, newRow: number) => {
    setPlacedBlocks(prev => prev.map(block => {
      if (block.id !== id) return block
      const cols = block.matrix[0]?.length || 1
      const rows = block.matrix.length
      let minCol: number; let maxCol: number
      if (block.zone === 'left-border')  { minCol = 0;               maxCol = borderCols }
      else if (block.zone === 'body')    { minCol = borderCols;       maxCol = rightBorderStart }
      else                               { minCol = rightBorderStart; maxCol = GRID_COLS }
      const safeCol = Math.max(minCol, Math.min(newCol, maxCol - cols))
      const safeRow = Math.max(0, Math.min(newRow, gridRows - rows))
      return { ...block, startCol: safeCol, startRow: safeRow }
    }))
  }, [borderCols, rightBorderStart, GRID_COLS, gridRows])

  // Repeat: always tile from baseMatrix, stays in zone
  const handleRepeatBlock = useCallback((id: string, repX: number, repY: number) => {
    setPlacedBlocks(prev => prev.map(block => {
      if (block.id !== id) return block
      const base = block.baseMatrix
      const bRows = base.length; const bCols = base[0]?.length || 1
      let maxCol: number
      if (block.zone === 'left-border')  maxCol = borderCols
      else if (block.zone === 'body')    maxCol = rightBorderStart
      else                               maxCol = GRID_COLS
      const maxRepX = Math.max(1, Math.floor((maxCol - block.startCol) / bCols))
      const maxRepY = Math.max(1, Math.floor((gridRows - block.startRow) / bRows))
      const safeRepX = Math.min(repX, maxRepX)
      const safeRepY = Math.min(repY, maxRepY)
      const newMat = Array(bRows * safeRepY).fill(0).map((_, r) =>
        Array(bCols * safeRepX).fill(0).map((_, c) => base[r % bRows][c % bCols])
      )
      return { ...block, matrix: newMat }
    }))
  }, [borderCols, rightBorderStart, GRID_COLS, gridRows])

  // Scale H: fill zone horizontally
  const handleScaleH = useCallback((id: string) => {
    setPlacedBlocks(prev => prev.map(block => {
      if (block.id !== id) return block
      const base = block.baseMatrix
      const bRows = base.length; const bCols = base[0]?.length || 1
      let maxCol: number
      if (block.zone === 'left-border')  maxCol = borderCols
      else if (block.zone === 'body')    maxCol = rightBorderStart
      else                               maxCol = GRID_COLS
      const repX = Math.max(1, Math.floor((maxCol - block.startCol) / bCols))
      const newMat = Array(bRows).fill(0).map((_, r) =>
        Array(bCols * repX).fill(0).map((_, c) => base[r % bRows][c % bCols])
      )
      return { ...block, matrix: newMat }
    }))
  }, [borderCols, rightBorderStart, GRID_COLS])

  // Scale V: fill remaining height
  const handleScaleV = useCallback((id: string) => {
    setPlacedBlocks(prev => prev.map(block => {
      if (block.id !== id) return block
      const base = block.baseMatrix
      const bRows = base.length; const bCols = base[0]?.length || 1
      const repY = Math.max(1, Math.floor((gridRows - block.startRow) / bRows))
      const newMat = Array(bRows * repY).fill(0).map((_, r) =>
        Array(bCols).fill(0).map((_, c) => base[r % bRows][c % bCols])
      )
      return { ...block, matrix: newMat }
    }))
  }, [gridRows])

  // Fill Fabric: tile across entire grid
  const handleFillFabric = useCallback((id: string) => {
    setPlacedBlocks(prev => prev.map(block => {
      if (block.id !== id) return block
      const base = block.baseMatrix
      const bRows = base.length; const bCols = base[0]?.length || 1
      const repX = Math.max(1, Math.floor(GRID_COLS / bCols))
      const repY = Math.max(1, Math.floor(gridRows / bRows))
      const newMat = Array(bRows * repY).fill(0).map((_, r) =>
        Array(bCols * repX).fill(0).map((_, c) => base[r % bRows][c % bCols])
      )
      return { ...block, matrix: newMat, startCol: 0, startRow: 0, zone: 'left-border' as const }
    }))
  }, [GRID_COLS, gridRows])

  // Stable ref so the event handlers always see the latest geometry without changing dep array size
  const zoneRef = useRef({ borderCols, rightBorderStart, GRID_COLS })
  useEffect(() => { zoneRef.current = { borderCols, rightBorderStart, GRID_COLS } }, [borderCols, rightBorderStart, GRID_COLS])

  // Listen for FabricaAI commands & design updates
  useEffect(() => {
    // 1. Simple text commands (clear, reset)
    const cmdHandler = (e: Event) => {
      const text = (e as CustomEvent).detail?.text?.toLowerCase() || ''
      if (text.includes('clear') || text.includes('reset')) {
        setPlacedBlocks([])
        setSelectedId(null)
      }
    }

    // 2. AI design result → auto-place matching pattern from library onto canvas
    const designHandler = (e: Event) => {
      const result = (e as CustomEvent).detail?.result
      if (!result || result.report || result.action || result.answer) return
      const { borderCols: bc } = zoneRef.current
      // It's a design spec — find best matching pattern in library
      const weave = (result.weave_type || '').toLowerCase()
      const placement = (result.placement || '').toLowerCase()
      const matches = combinedLibrary.filter(d => {
        if (weave && d.weave_type?.toLowerCase().includes(weave)) return true
        if (d.tags?.some((t: string) => t.toLowerCase().includes(weave))) return true
        return false
      })
      const best = matches[0] || combinedLibrary[0]
      if (!best) return

      let zone: PlacedBlock['zone'] = 'body'
      if (placement.includes('border')) zone = 'left-border'

      const mat = best.peg_matrix
      setPlacedBlocks(prev => [...prev, {
        id: `ai-${best.id}-${Date.now()}`,
        name: `✦ ${best.name}`,
        matrix: mat, baseMatrix: mat,
        startCol: zone === 'left-border' ? 0 : bc,
        startRow: 0,
        zone,
      }])
    }

    window.addEventListener('ai-command', cmdHandler)
    window.addEventListener('ai-design-update', designHandler)
    return () => {
      window.removeEventListener('ai-command', cmdHandler)
      window.removeEventListener('ai-design-update', designHandler)
    }
  }, [combinedLibrary]) // stable — reads latest values via zoneRef and uses merged library

  // Keyboard shortcuts: +/- zoom, 0=fit, Space=pan mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') { spaceDownRef.current = true; e.preventDefault() }
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))
      if (e.key === '-') setZoom(z => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))
      if (e.key === '0') { setZoom(0.45); setPanX(20); setPanY(20) }
    }
    const onKeyUp = (e: KeyboardEvent) => { if (e.code === 'Space') spaceDownRef.current = false }
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKeyUp)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp) }
  }, [])

  // Wheel zoom — ONLY activates with Ctrl/Meta held (avoids accidental zoom on normal scroll)
  const handleCanvasWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return  // let browser handle normal scrolling
    e.preventDefault()
    const rect = canvasViewportRef.current?.getBoundingClientRect()
    if (!rect) return
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const factor = Math.exp(-e.deltaY * 0.005)
    setZoom(prev => {
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev * factor))
      const scale = next / prev
      setPanX(px => cx - scale * (cx - px))
      setPanY(py => cy - scale * (cy - py))
      return next
    })
  }, [])

  // Middle-mouse or Space+drag panning
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button === 1 || (e.button === 0 && spaceDownRef.current)) {
      e.preventDefault()
      isPanningRef.current = true
      panStartRef.current = { x: e.clientX, y: e.clientY, px: panX, py: panY }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
  }, [panX, panY])

  const handleCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanningRef.current) return
    setPanX(panStartRef.current.px + e.clientX - panStartRef.current.x)
    setPanY(panStartRef.current.py + e.clientY - panStartRef.current.y)
  }, [])

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent) => {
    isPanningRef.current = false
    ;(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  const totalEndsLabel = `Total Design Boxes: ${GRID_COLS} | Left: ${borderCols} | Body: ${bodyCols} | Right: ${borderCols}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#f5f5f7' }}>
      {/* Top header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
        background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.07)', flexShrink: 0,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.02em' }}>
          <span style={{ fontSize: 16 }}>✦</span> AI Fabric Studio
        </span>
        <div style={{ flex: 1, fontSize: 11, color: draggingDesign ? '#E0115F' : selectedId ? '#E0115F' : 'rgba(0,0,0,0.35)', fontWeight: draggingDesign || selectedId ? 600 : 400 }}>
          {draggingDesign
            ? `📍 Drop "${draggingDesign.name}" onto a zone in the fabric`
            : selectedId
            ? '✦ Drag handles to resize · Drag to move · Use toolbar to fill zone'
            : `Drag designs from panels onto the fabric grid · ${totalEndsLabel}`}
        </div>
        {/* View toggle + Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f5f5f7', borderRadius: 8, padding: '3px' }}>
          <button
            onClick={() => setViewMode('grid')}
            style={{ height: 22, padding: '0 10px', fontSize: 9, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: viewMode === 'grid' ? '#1D1D1F' : 'transparent', color: viewMode === 'grid' ? '#fff' : 'rgba(0,0,0,0.45)' }}
          >⊞ Grid</button>
          <button
            onClick={() => setViewMode('sim')}
            style={{ height: 22, padding: '0 10px', fontSize: 9, fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.15s',
              background: viewMode === 'sim' ? '#E0115F' : 'transparent', color: viewMode === 'sim' ? '#fff' : 'rgba(0,0,0,0.45)' }}
          >🧶 Fabric Sim</button>
        </div>
        {/* Zoom — only in grid mode */}
        {viewMode === 'grid' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f5f7', borderRadius: 8, padding: '4px 10px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.4)' }}>Zoom</span>
            <input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={0.05} value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              style={{ width: 90, accentColor: '#E0115F', cursor: 'pointer' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1F', minWidth: 32, textAlign: 'right' }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))}
              style={{ height: 22, width: 22, fontSize: 14, fontWeight: 700, borderRadius: 5, border: '1px solid rgba(0,0,0,0.1)', color: '#1D1D1F', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
            <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))}
              style={{ height: 22, width: 22, fontSize: 14, fontWeight: 700, borderRadius: 5, border: '1px solid rgba(0,0,0,0.1)', color: '#1D1D1F', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <button onClick={() => { setZoom(0.45); setPanX(20); setPanY(20) }}
              style={{ height: 22, padding: '0 7px', fontSize: 9, fontWeight: 700, borderRadius: 5, border: '1px solid rgba(224,17,95,0.3)', color: '#E0115F', background: 'rgba(224,17,95,0.05)', cursor: 'pointer' }}>Fit</button>
            <button onClick={() => setZoom(1)}
              style={{ height: 22, padding: '0 7px', fontSize: 9, fontWeight: 700, borderRadius: 5, border: '1px solid rgba(0,0,0,0.1)', color: '#1D1D1F', background: '#fff', cursor: 'pointer' }}>1:1</button>
          </div>
        )}
        <button onClick={() => { setPlacedBlocks([]); setSelectedId(null) }}
          style={{ height: 28, padding: '0 10px', fontSize: 11, fontWeight: 700, borderRadius: 7, border: '1px solid rgba(224,17,95,0.2)', color: '#E0115F', background: 'rgba(224,17,95,0.04)', cursor: 'pointer' }}>
          Clear All
        </button>
      </div>

      {/* 3-column layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT — Border panel */}
        <div style={{ ...panelStyle, width: 220, flexShrink: 0 }}>
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(224,17,95,0.8)' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.01em' }}>Border Zone</span>
            </div>
            <EndsPanel ends={borderEnds} onChange={setBorderEnds} label="Beam Ends (Border)" color="#E0115F" />
          </div>
          <div style={{ padding: '10px 12px 6px' }}>
            <input style={{ width: '100%', height: 30, borderRadius: 6, border: '1.5px solid rgba(0,0,0,0.1)', padding: '0 10px', fontSize: 11, outline: 'none', boxSizing: 'border-box', background: '#fafafa' }}
              placeholder="Search designs…" value={borderSearch} onChange={e => setBorderSearch(e.target.value)} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {filterDesigns(borderSearch).map(d => (
              <DesignCard key={d.id} design={d} onDragStart={() => setDraggingDesign(d)} />
            ))}
          </div>
        </div>

        {/* CENTER — Body panel */}
        <div style={{ ...panelStyle, width: 220, flexShrink: 0 }}>
          <div style={{ padding: '12px 12px 8px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.3)' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.01em' }}>Body Zone</span>
            </div>
            <EndsPanel ends={bodyEnds} onChange={setBodyEnds} label="Beam Ends (Body)" color="#444" />
          </div>
          <div style={{ padding: '10px 12px 6px' }}>
            <input style={{ width: '100%', height: 30, borderRadius: 6, border: '1.5px solid rgba(0,0,0,0.1)', padding: '0 10px', fontSize: 11, outline: 'none', boxSizing: 'border-box', background: '#fafafa' }}
              placeholder="Search designs…" value={bodySearch} onChange={e => setBodySearch(e.target.value)} />
          </div>
          {/* PPI + Length controls */}
          <div style={{ padding: '0 12px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Picks (Weft Rows)</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.35)', marginBottom: 3 }}>PPI</div>
                <input type="number" value={ppi} min={10} max={300} onChange={e => setPpi(e.target.value)}
                  style={{ width: '100%', height: 30, borderRadius: 6, border: '1.5px solid rgba(0,0,0,0.1)', padding: '0 8px', fontSize: 12, fontWeight: 700, background: '#fafafa', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, color: 'rgba(0,0,0,0.35)', marginBottom: 3 }}>Length (cm)</div>
                <input type="number" value={fabricLength} min={5} max={500} onChange={e => setFabricLength(e.target.value)}
                  style={{ width: '100%', height: 30, borderRadius: 6, border: '1.5px solid rgba(0,0,0,0.1)', padding: '0 8px', fontSize: 12, fontWeight: 700, background: '#fafafa', outline: 'none', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ marginTop: 5, fontSize: 10, fontWeight: 600, color: '#16a34a', background: 'rgba(52,199,89,0.08)', border: '1px solid rgba(52,199,89,0.18)', borderRadius: 5, padding: '3px 8px' }}>
              {gridRows} total picks &nbsp;·&nbsp; {(gridRows / (parseFloat(ppi)||60)).toFixed(1)}" ≈ {((gridRows / (parseFloat(ppi)||60)) * 2.54).toFixed(1)} cm
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {filterDesigns(bodySearch).map(d => (
              <DesignCard key={d.id} design={d} onDragStart={() => setDraggingDesign(d)} />
            ))}
          </div>
        </div>

        {/* RIGHT — Fabric canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f0f0f2' }}>
          {/* Canvas info bar */}
          <div style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.8)', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, fontSize: 10, color: 'rgba(0,0,0,0.4)', fontWeight: 600 }}>
            <span>Grid: {GRID_COLS}×{gridRows}</span>
            <span>·</span>
            <span>Border: {borderCols} boxes</span>
            <span>·</span>
            <span>Body: {bodyCols} boxes</span>
            <span>·</span>
            <span>Picks: {gridRows} ({ppi} PPI × {fabricLength} cm)</span>
            <span>·</span>
            <span style={{ color: placedBlocks.length > 0 ? '#E0115F' : 'rgba(0,0,0,0.3)', fontWeight: placedBlocks.length > 0 ? 700 : 600 }}>{placedBlocks.length} block{placedBlocks.length !== 1 ? 's' : ''} placed</span>
            {/* Placed block pills */}
            {placedBlocks.length > 0 && (
              <div style={{ display: 'flex', gap: 4, marginLeft: 4, flexWrap: 'wrap' }}>
                {placedBlocks.map(b => (
                  <span key={b.id} onClick={() => setSelectedId(b.id)}
                    style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: selectedId === b.id ? '#E0115F' : 'rgba(0,0,0,0.07)', color: selectedId === b.id ? '#fff' : '#1D1D1F', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {b.name.split(' ').slice(0, 2).join(' ')} @{b.startCol},{b.startRow}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ── FABRIC SIMULATION VIEW ── */}
          {viewMode === 'sim' && (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
              {/* Sim header */}
              <div style={{ padding: '10px 16px 6px', background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.01em', marginBottom: 2 }}>🧶 Fabric Simulation</div>
                <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.4)' }}>
                  Border: <span style={{ color: '#E0115F', fontWeight: 700 }}>Pink weft</span> · Body: <span style={{ color: '#C8891A', fontWeight: 700 }}>Gold weft</span> · Warp: <span style={{ color: '#3A2080', fontWeight: 700 }}>Indigo</span>
                </div>
              </div>
              {/* Simulation canvas */}
              <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: '#f0f0f2', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <FabricSimulationCanvas
                    placedBlocks={placedBlocks}
                    borderCols={borderCols}
                    bodyCols={bodyCols}
                    GRID_COLS={GRID_COLS}
                    GRID_ROWS={gridRows}
                  />
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    { color: '#3A2080', label: 'Warp (shared)' },
                    { color: '#E0115F', label: 'Weft — Border' },
                    { color: '#E8A838', label: 'Weft — Body' },
                  ].map(({ color, label }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, background: color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.1)' }} />
                      <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(0,0,0,0.55)' }}>{label}</span>
                    </div>
                  ))}
                </div>
                {placedBlocks.length === 0 && (
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>
                    Drop a Border design and a Body design onto the canvas, then the simulation will show the full fabric.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── GRID VIEW ── */}
          {viewMode === 'grid' && (
          <div
            ref={canvasViewportRef}
            onWheel={handleCanvasWheel}
            onPointerDown={handleCanvasPointerDown}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handleCanvasPointerUp}
            style={{
              flex: 1,
              overflow: 'hidden',
              position: 'relative',
              cursor: isPanningRef.current ? 'grabbing' : spaceDownRef.current ? 'grab' : 'default',
              background: 'repeating-conic-gradient(#e8e8ea 0% 25%, #f0f0f2 0% 50%) 0 0 / 20px 20px',
            }}
          >
            {/* The entire canvas is transformed by pan+zoom */}
            <div style={{
              position: 'absolute',
              left: 0, top: 0,
              transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
              transformOrigin: '0 0',
              willChange: 'transform',
            }}
              onClick={() => setSelectedId(null)}
            >
              {/* Box shadow wrapper */}
              <div style={{
                boxShadow: '0 4px 32px rgba(0,0,0,0.18)',
                borderRadius: 8,
                border: '1.5px solid rgba(0,0,0,0.1)',
                background: '#fff',
                overflow: 'visible',
              }}>
                <FabricGrid
                  placedBlocks={placedBlocks}
                  dragging={!!draggingDesign}
                  draggingDesign={draggingDesign}
                  borderCols={borderCols}
                  bodyCols={bodyCols}
                  GRID_COLS={GRID_COLS}
                  GRID_ROWS={gridRows}
                  selectedId={selectedId}
                  zoom={zoom}
                  cellSize={cellSize}
                  onDropAtCell={handleDropAtCell}
                  onDeleteBlock={handleDeleteBlock}
                  onSelectBlock={setSelectedId}
                  onMoveBlock={handleMoveBlock}
                  onRepeatBlock={handleRepeatBlock}
                  onFillFabric={handleFillFabric}
                  onScaleH={handleScaleH}
                  onScaleV={handleScaleV}
                />
              </div>
            </div>

            {/* Zoom hint overlay */}
            <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 9, color: 'rgba(0,0,0,0.3)', fontWeight: 600, pointerEvents: 'none', background: 'rgba(255,255,255,0.7)', padding: '3px 7px', borderRadius: 6 }}>
              Ctrl+Scroll to zoom · Space+drag or middle-click to pan · +/− keys
            </div>
          </div>
          )}

          {/* Legend */}
          <div style={{ padding: '6px 14px', background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16, fontSize: 10, color: 'rgba(0,0,0,0.45)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, background: '#1D1D1F', borderRadius: 2 }} />
              <span>Warp Up (1)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, background: '#fff', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 2 }} />
              <span>Weft Up (0)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(224,17,95,0.06)', border: '1px solid rgba(224,17,95,0.3)', borderRadius: 2 }} />
              <span>Border zones</span>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 600 }}>Click block to select · Drag handles to resize · Stays within zone</div>
          </div>
        </div>
      </div>
    </div>
  )
}
