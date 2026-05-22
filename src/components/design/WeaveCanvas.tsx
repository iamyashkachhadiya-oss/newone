'use client'

import { useRef, useEffect, useCallback } from 'react'

interface WeaveCanvasProps {
  matrix: number[][]
  onToggle?: (row: number, col: number) => void
  shaftCount: number
  repeatW?: number
  repeatH?: number
  readOnly?: boolean
  rowColors?: string[]      // per-row weft yarn color (hex). Length = matrix.length
  cellColorMap?: Record<string, string> // per-cell weft yarn color (hex)
  warpColor?: string        // color shown for lowered (warp-face) cells
}

const CELL_SIZE = 20
const LABEL_MARGIN = 28
const LOWERED_COLOR = '#FFFFFF'
const GRID_COLOR = 'rgba(0,0,0,0.08)'
const REPEAT_COLOR = '#E0115F'
const LABEL_COLOR = '#86868B'

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export default function WeaveCanvas({
  matrix,
  onToggle,
  shaftCount,
  repeatW,
  repeatH,
  readOnly = false,
  rowColors,
  cellColorMap,
  warpColor,
}: WeaveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rows = matrix.length
  const cols = shaftCount

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = LABEL_MARGIN + cols * CELL_SIZE + 1
    const h = LABEL_MARGIN + rows * CELL_SIZE + 1
    canvas.width = w * (window.devicePixelRatio || 1)
    canvas.height = h * (window.devicePixelRatio || 1)
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1)

    // Clear
    ctx.clearRect(0, 0, w, h)

    // Draw shaft labels (top)
    ctx.font = '600 10px "Inter", -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = LABEL_COLOR
    for (let c = 0; c < cols; c++) {
      ctx.fillText(`${c + 1}`, LABEL_MARGIN + c * CELL_SIZE + CELL_SIZE / 2, LABEL_MARGIN / 2)
    }

    // Draw pick labels (left)
    ctx.textAlign = 'right'
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = LABEL_COLOR
      ctx.fillText(`${r + 1}`, LABEL_MARGIN - 4, LABEL_MARGIN + r * CELL_SIZE + CELL_SIZE / 2 + 1)
      
      // Cramming detection: count unique yarns in this row
      const uniqueColors = new Set<string>()
      if (rowColors?.[r]) uniqueColors.add(rowColors[r])
      for (let c = 0; c < cols; c++) {
        if (cellColorMap?.[`${r}_${c}`]) {
          uniqueColors.add(cellColorMap[`${r}_${c}`])
        }
      }
      
      if (uniqueColors.size > 1) {
        ctx.fillStyle = '#EA580C' // bright orange indicator
        ctx.font = '800 8px "Inter", sans-serif'
        ctx.fillText('WC', LABEL_MARGIN - 16, LABEL_MARGIN + r * CELL_SIZE + CELL_SIZE / 2 - 4)
        ctx.font = '600 10px "Inter", -apple-system, sans-serif' // restore font
      }
    }

    // Draw cells
    for (let r = 0; r < rows; r++) {
      const raisedColor = rowColors?.[r] ?? '#1D1D1F'
      const loweredColor = warpColor ? hexToRgba(warpColor, 0.12) : LOWERED_COLOR

      // Draw a subtle left-side color stripe for the row (yarn indicator)
      if (rowColors?.[r]) {
        ctx.fillStyle = hexToRgba(raisedColor, 0.18)
        ctx.fillRect(0, LABEL_MARGIN + r * CELL_SIZE, LABEL_MARGIN - 4, CELL_SIZE)
        // Left accent bar
        ctx.fillStyle = hexToRgba(raisedColor, 0.9)
        ctx.fillRect(LABEL_MARGIN - 4, LABEL_MARGIN + r * CELL_SIZE + 2, 3, CELL_SIZE - 4)
      }

      for (let c = 0; c < cols; c++) {
        const x = LABEL_MARGIN + c * CELL_SIZE
        const y = LABEL_MARGIN + r * CELL_SIZE
        const val = matrix[r]?.[c] ?? 0

        let cellRaisedColor = raisedColor
        if (cellColorMap && cellColorMap[`${r}_${c}`]) {
          cellRaisedColor = cellColorMap[`${r}_${c}`]
        }

        ctx.fillStyle = val === 1 ? cellRaisedColor : loweredColor
        ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE)

        // Grid line
        ctx.strokeStyle = GRID_COLOR
        ctx.lineWidth = 1
        ctx.strokeRect(x + 0.5, y + 0.5, CELL_SIZE - 1, CELL_SIZE - 1)
        
        // Add a small indicator for explicitly colored cells to differentiate them
        if (val === 1 && cellColorMap && cellColorMap[`${r}_${c}`]) {
          ctx.fillStyle = 'rgba(255,255,255,0.6)'
          ctx.fillRect(x + CELL_SIZE - 5, y + 1, 4, 4)
        }
      }
    }

    // Draw repeat boundary
    if (repeatW && repeatH && repeatW > 0 && repeatH > 0) {
      ctx.strokeStyle = REPEAT_COLOR
      ctx.lineWidth = 2
      ctx.strokeRect(
        LABEL_MARGIN,
        LABEL_MARGIN,
        repeatW * CELL_SIZE,
        repeatH * CELL_SIZE
      )
    }
  }, [matrix, cols, rows, repeatW, repeatH])

  useEffect(() => {
    draw()
  }, [draw])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (readOnly || !onToggle) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left - LABEL_MARGIN
    const y = e.clientY - rect.top - LABEL_MARGIN

    if (x < 0 || y < 0) return

    const col = Math.floor(x / CELL_SIZE)
    const row = Math.floor(y / CELL_SIZE)

    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      onToggle(row, col)
    }
  }

  return (
    <div style={{
      overflow: 'auto',
      maxWidth: cols > 20 ? 20 * CELL_SIZE + LABEL_MARGIN + 20 : undefined,
      maxHeight: rows > 30 ? 30 * CELL_SIZE + LABEL_MARGIN + 20 : undefined,
    }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          cursor: readOnly ? 'default' : 'crosshair',
          display: 'block',
        }}
      />
    </div>
  )
}

export function getCanvasImage(canvasRef: React.RefObject<HTMLCanvasElement | null>): string {
  if (!canvasRef.current) return ''
  return canvasRef.current.toDataURL('image/png')
}
