'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { textToMatrix, matrixToText } from '@/lib/pegplan/parser'
import WeaveCanvas from './WeaveCanvas'
import { useDesignStore } from '@/lib/store/designStore'

interface PegPlanEditorProps {
  shaftCount: number
  onChange: (text: string, matrix: number[][]) => void
  initialText?: string
}

export default function PegPlanEditor({ shaftCount, onChange, initialText = '' }: PegPlanEditorProps) {
  const [text, setText] = useState(initialText)
  const [matrix, setMatrix] = useState<number[][]>(() => textToMatrix(initialText, shaftCount))
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUpdatingFromGrid = useRef(false)
  const isUpdatingFromText = useRef(false)

  // Multi-color weft state
  const weftYarns = useDesignStore(s => s.weftSystem.yarns)
  const warpColor = useDesignStore(s => s.warpSystem.yarns[0]?.colour_hex ?? s.warp?.colour_code ?? '#1B3A6B')
  const rowYarnMapStore = useDesignStore(s => s.rowYarnMap)
  const setRowYarnMapStore = useDesignStore(s => s.setRowYarnMap)
  const cellYarnMapStore = useDesignStore(s => s.cellYarnMap)
  const setCellYarnMapStore = useDesignStore(s => s.setCellYarnMap)
  const [selectedYarnId, setSelectedYarnId] = useState<string>(() => weftYarns[0]?.id ?? '')
  const [rowYarnMap, setRowYarnMap] = useState<Record<number, string>>(rowYarnMapStore)
  const [cellYarnMap, setCellYarnMap] = useState<Record<string, string>>(cellYarnMapStore)
  const [paintMode, setPaintMode] = useState<'row' | 'cell'>('row')

  // Keep selectedYarnId valid
  useEffect(() => {
    if (!weftYarns.find(y => y.id === selectedYarnId) && weftYarns.length > 0) {
      setSelectedYarnId(weftYarns[0].id)
    }
  }, [weftYarns, selectedYarnId])

  // Sync text + matrix when initialText OR shaftCount changes.
  // CRITICAL: merged into ONE effect to prevent stale-closure bug.
  // When AI applies a new peg plan + shaft count simultaneously:
  //   - Two separate effects would let the shaftCount effect re-parse the OLD text
  //   - One merged effect always uses the freshest text (initialText if it changed)
  useEffect(() => {
    if (initialText !== text) {
      // External update (e.g. AI applied a weave) — sync both text and matrix
      setText(initialText)
      setMatrix(textToMatrix(initialText, shaftCount))
    } else {
      // Only shaftCount changed — re-parse current text with new shaft count
      setMatrix(textToMatrix(text, shaftCount))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText, shaftCount])

  // TEXT → GRID (debounced 300ms)
  const handleTextChange = useCallback((newText: string) => {
    if (isUpdatingFromGrid.current) return
    setText(newText)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      isUpdatingFromText.current = true
      const newMatrix = textToMatrix(newText, shaftCount)
      setMatrix(newMatrix)
      onChange(newText, newMatrix)
      isUpdatingFromText.current = false
    }, 300)
  }, [shaftCount, onChange])

  // GRID → TEXT
  const handleToggle = useCallback((row: number, col: number) => {
    if (isUpdatingFromText.current) return
    isUpdatingFromGrid.current = true

    const newMatrix = matrix.map((r, ri) =>
      ri === row ? r.map((c, ci) => ci === col ? (c === 1 ? 0 : 1) : c) : [...r]
    )

    // If toggling beyond existing rows, expand
    while (newMatrix.length <= row) {
      newMatrix.push(new Array(shaftCount).fill(0))
    }

    // Assign color maps first so matrixToText knows about the color change
    let newRowYarnMap = { ...rowYarnMap }
    let newCellYarnMap = { ...cellYarnMap }

    if (selectedYarnId) {
      if (paintMode === 'row') {
        newRowYarnMap = { ...rowYarnMap, [row]: selectedYarnId }
        setRowYarnMap(newRowYarnMap)
        setRowYarnMapStore(newRowYarnMap)
      } else {
        const key = `${row}_${col}`
        newCellYarnMap = { ...cellYarnMap, [key]: selectedYarnId }
        setCellYarnMap(newCellYarnMap)
        setCellYarnMapStore(newCellYarnMap)
      }
    }

    setMatrix(newMatrix)
    const newText = matrixToText(newMatrix, newRowYarnMap, newCellYarnMap, weftYarns)
    setText(newText)
    onChange(newText, newMatrix)

    isUpdatingFromGrid.current = false
  }, [matrix, shaftCount, onChange, selectedYarnId, rowYarnMap, setRowYarnMapStore, paintMode, cellYarnMap, setCellYarnMapStore, weftYarns])

  const handleClear = () => {
    setText('')
    setMatrix([])
    setRowYarnMap({})
    setRowYarnMapStore({})
    setCellYarnMap({})
    setCellYarnMapStore({})
    onChange('', [])
  }

  const handleStraightDraft = () => {
    const newMatrix: number[][] = []
    for (let i = 0; i < shaftCount; i++) {
      const row = new Array(shaftCount).fill(0)
      row[i] = 1
      newMatrix.push(row)
    }
    setMatrix(newMatrix)
    const newText = matrixToText(newMatrix, rowYarnMap, cellYarnMap, weftYarns)
    setText(newText)
    onChange(newText, newMatrix)
  }

  // Row colors for canvas
  const rowColors = matrix.map((_, i) => {
    const yarnId = rowYarnMap[i]
    return weftYarns.find(y => y.id === yarnId)?.colour_hex ?? weftYarns[0]?.colour_hex ?? '#1D1D1F'
  })

  const cellColorMap: Record<string, string> = {}
  Object.entries(cellYarnMap).forEach(([key, yarnId]) => {
    const yarn = weftYarns.find(y => y.id === yarnId)
    if (yarn) cellColorMap[key] = yarn.colour_hex
  })

  const picks = matrix.length
  const shafts = shaftCount
  const repeatW = matrix[0]?.length || 0
  const repeatH = picks

  const selectedYarn = weftYarns.find(y => y.id === selectedYarnId)

  // Read border shaft reservation from global store
  const borderShaftsUsed = useDesignStore(s => s.borderShaftsUsed)
  const bodyBudget = Math.max(0, shaftCount - borderShaftsUsed)
  const bodyShaftsOver = borderShaftsUsed > 0 &&
    matrix.some(row => row.some((_, ci) => ci >= bodyBudget && row[ci] === 1))

  return (
    <div style={{ width: '100%' }}>

      {/* ── Shaft reservation banner ── */}
      {borderShaftsUsed > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px', borderRadius: 10, marginBottom: 14,
          background: bodyShaftsOver ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${bodyShaftsOver ? '#FCA5A5' : '#BBF7D0'}`,
        }}>
          <div style={{ fontSize: 18 }}>{bodyShaftsOver ? '❌' : '✓'}</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700,
              color: bodyShaftsOver ? '#E0115F' : '#166534' }}>
              {bodyShaftsOver
                ? `Body peg plan exceeds shaft budget!`
                : `Body shaft budget: ${bodyBudget} of ${shaftCount} shafts`}
            </div>
            <div style={{ fontSize: 11, color: bodyShaftsOver ? '#E0115F' : '#15803D', marginTop: 2 }}>
              Border Design has claimed {borderShaftsUsed} shaft{borderShaftsUsed !== 1 ? 's' : ''}.
              {' '}Body peg plan must only use shafts 1–{bodyBudget}.
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99,
              background: '#FFF7ED', color: '#EA580C', fontWeight: 700, whiteSpace: 'nowrap' }}>
              🧵 Border: {borderShaftsUsed}
            </div>
            <div style={{ fontSize: 11, padding: '3px 10px', borderRadius: 99,
              background: bodyShaftsOver ? '#FEE2E2' : 'rgba(224,17,95,0.1)',
              color: bodyShaftsOver ? '#E0115F' : '#E0115F',
              fontWeight: 700, whiteSpace: 'nowrap' }}>
              ⬛ Body: {bodyBudget}
            </div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* LEFT — Text Input */}
        {/* Weft Yarn Palette */}
      <div style={{
        marginBottom: 16, padding: '12px 14px', background: 'var(--surface)',
        border: '1px solid var(--border-light)', borderRadius: 12,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
          🧵 Weft Yarn Palette
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {weftYarns.map((yarn, i) => {
            const isActive = yarn.id === selectedYarnId
            return (
              <button
                key={yarn.id}
                onClick={() => setSelectedYarnId(yarn.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 11px', borderRadius: 10,
                  border: isActive ? `2px solid ${yarn.colour_hex}` : '2px solid transparent',
                  background: isActive ? `${yarn.colour_hex}18` : 'rgba(0,0,0,0.04)',
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: 3, background: yarn.colour_hex }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? yarn.colour_hex : 'var(--text-2)' }}>
                  {yarn.label || `Yarn ${String.fromCharCode(65 + i)}`}
                </span>
              </button>
            )
          })}
        </div>
        {selectedYarn && (
          <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-4)' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 6, fontWeight: 500, color: 'var(--text-2)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="radio" checked={paintMode === 'row'} onChange={() => setPaintMode('row')} />
                Apply to entire row
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                <input type="radio" checked={paintMode === 'cell'} onChange={() => setPaintMode('cell')} />
                Apply to single cell
              </label>
            </div>
            <span style={{ fontStyle: 'italic', fontSize: 10 }}>
              Click any {paintMode === 'row' ? 'row' : 'cell'} on the grid below to assign <strong>{selectedYarn.label}</strong>.
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
          <div className="w-full lg:w-[340px] shrink-0">
            <label style={{ marginBottom: 6, display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
              Peg Plan — Text Format
            </label>
            <textarea
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`1-->1,3,5,6\n---\n2-->2,4,6,8\n---\n3-->1,3,5,7`}
              rows={Math.max(16, text.split('\n').length)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12.5,
                lineHeight: 1.65,
                background: 'var(--bg)',
                borderRadius: 10,
                width: '100%',
              }}
            />
            <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 5, letterSpacing: '-0.005em' }}>
              Format: pick--&gt;shaft,shaft,shaft
            </div>
          </div>

          {/* RIGHT — Visual Grid */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <label style={{ marginBottom: 6, display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
              Peg Plan — Visual Grid
            </label>
            <div style={{
              background: 'var(--bg)',
              borderRadius: 12,
              padding: 16,
              border: '1px solid var(--border-light)',
              minHeight: 200,
              overflow: 'auto',
            }}>
              {matrix.length > 0 ? (
                <WeaveCanvas
                  matrix={matrix}
                  shaftCount={shaftCount}
                  onToggle={handleToggle}
                  repeatW={repeatW}
                  repeatH={repeatH}
                  rowColors={rowColors}
                  cellColorMap={cellColorMap}
                  warpColor={typeof warpColor === 'string' ? warpColor : undefined}
                />
              ) : (
                <div style={{
                  textAlign: 'center',
                  color: 'var(--text-4)',
                  fontSize: 13,
                  paddingTop: 60,
                }}>
                  Enter peg plan text or click to draw
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-5 pt-4 gap-3 sm:gap-0" style={{ borderTop: '1px solid var(--border-light)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[`Picks: ${picks}`, `Shafts: ${shafts}`, `Repeat: ${repeatW}×${repeatH}`].map(s => (
            <span key={s} style={{
              fontSize: 11, fontWeight: 600,
              color: 'var(--text-2)',
              background: 'rgba(0,0,0,0.05)',
              padding: '3px 9px', borderRadius: 99,
              letterSpacing: '-0.01em',
            }}>{s}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleClear} className="btn-secondary">
            Clear
          </button>
          <button onClick={handleStraightDraft} className="btn-secondary">
            Straight Draft
          </button>
        </div>
      </div>
    </div>
  )
}
