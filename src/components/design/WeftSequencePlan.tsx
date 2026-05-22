'use client'

import { useMemo } from 'react'
import { useDesignStore } from '@/lib/store/designStore'

// ── Helpers ──────────────────────────────────────────────────────────────────

function countLabel(yarn: { count_value: number; count_system: string }) {
  return `${yarn.count_value}${yarn.count_system === 'denier' ? 'D' : yarn.count_system === 'ne' ? 'Ne' : yarn.count_system}`
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

function contrastColor(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#222' : '#fff'
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function WeftSequencePlan() {
  const weftSystem = useDesignStore(s => s.weftSystem)
  const rowYarnMap = useDesignStore(s => s.rowYarnMap)
  const cellYarnMap = useDesignStore(s => s.cellYarnMap)
  const pegPlanMatrix = useDesignStore(s => s.pegPlanMatrix)
  const loom = useDesignStore(s => s.loom)

  const yarns = weftSystem.yarns

  // Build ordered pick list from rowYarnMap + cramming overlay from cellYarnMap
  const picks = useMemo(() => {
    const rows = pegPlanMatrix.length
    if (rows === 0) return []

    const flattenedPicks: any[] = []
    let sequentialPick = 1

    for (let r = 0; r < rows; r++) {
      const baseYarnId = rowYarnMap[r] ?? yarns[0]?.id ?? ''

      // Collect all unique yarns across cells in this row (reveals cramming)
      const uniqueYarns = new Set<string>()
      if (baseYarnId) uniqueYarns.add(baseYarnId)
      
      const cols = pegPlanMatrix[0]?.length ?? 0
      for (let c = 0; c < cols; c++) {
        const cellKey = `${r}_${c}`
        if (cellYarnMap[cellKey]) uniqueYarns.add(cellYarnMap[cellKey])
      }

      const isCramming = uniqueYarns.size > 1

      // Add a distinct pick row for each yarn in the set
      Array.from(uniqueYarns).forEach(yarnId => {
        const yarn = yarns.find(y => y.id === yarnId)
        flattenedPicks.push({
          pick: sequentialPick++,
          rowIdx: r,
          yarn,
          yarnId,
          nozzle: yarn?.nozzle_config?.sequence?.[0] ?? 1,
          isCramming,
        })
      })
    }

    return flattenedPicks
  }, [pegPlanMatrix, rowYarnMap, cellYarnMap, yarns])

  // Per-yarn pick count for the donut summary bar
  const yarnCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    picks.forEach(p => {
      counts[p.yarnId] = (counts[p.yarnId] || 0) + 1
    })
    return counts
  }, [picks])

  const totalPicks = picks.length
  const uniqueCrammedRows = new Set(picks.filter(p => p.isCramming).map(p => p.rowIdx)).size

  const loomPPI = loom?.target_ppi ?? 60
  const clothLength = 5.5 // metres — fixed reference for "total repeats" estimate
  const picksPerMetre = loomPPI * 39.37
  const totalRepeats = totalPicks > 0 ? Math.round((picksPerMetre * clothLength) / totalPicks) : 0

  if (yarns.length === 0 || picks.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
        No peg plan rows found. Set up your Peg Plan and assign weft yarns first.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
            Weft Sequence Plan
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
            Repeat: {totalPicks} picks &nbsp;·&nbsp; Est. {totalRepeats} repeats / {clothLength} m fabric
            {uniqueCrammedRows > 0 && (
              <span style={{ marginLeft: 8, color: '#EA580C', fontWeight: 600 }}>
                · {uniqueCrammedRows} WC row{uniqueCrammedRows > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Sync badge */}
        <span style={{
          fontSize: 10, fontWeight: 700,
          color: 'var(--accent)',
          background: 'var(--accent-light)',
          padding: '4px 10px', borderRadius: 99,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}>
          ↺ Auto-Synced from Peg Plan
        </span>
      </div>

      {/* ── Pick Table ── */}
      <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border-light)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 560 }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-light)' }}>
              {['Pick #', 'Yarn', 'Nozzle', 'Color', 'Count', 'Shed Type'].map(h => (
                <th key={h} style={{
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: 10, fontWeight: 700,
                  color: 'var(--text-3)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {picks.map((p, idx) => {
              const colorHex = p.yarn?.colour_hex ?? '#888'
              const fgColor = contrastColor(colorHex)
              const isEven = idx % 2 === 0

              return (
                <tr
                  key={p.pick}
                  style={{
                    borderBottom: '1px solid var(--border-light)',
                    background: isEven ? 'transparent' : 'rgba(0,0,0,0.015)',
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Pick number */}
                  <td style={{ padding: '7px 12px', fontWeight: 700, color: 'var(--text-2)', tabularNums: true } as React.CSSProperties}>
                    {p.pick}
                  </td>

                  {/* Yarn label */}
                  <td style={{ padding: '7px 12px', color: 'var(--text-1)', fontWeight: 500, maxWidth: 160, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                    {p.yarn?.label ?? '—'}
                  </td>

                  {/* Nozzle */}
                  <td style={{ padding: '7px 12px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22,
                      borderRadius: '50%',
                      background: 'var(--accent-light)',
                      color: 'var(--accent)',
                      fontSize: 10, fontWeight: 800,
                    }}>
                      N{p.nozzle}
                    </span>
                  </td>

                  {/* Color swatch */}
                  <td style={{ padding: '7px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{
                        display: 'inline-block',
                        width: 28, height: 16,
                        borderRadius: 4,
                        background: colorHex,
                        border: '1px solid rgba(0,0,0,0.10)',
                        flexShrink: 0,
                      }} />
                      <span style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                        {colorHex.toUpperCase()}
                      </span>
                    </div>
                  </td>

                  {/* Count */}
                  <td style={{ padding: '7px 12px', color: 'var(--text-2)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {p.yarn ? countLabel(p.yarn) : '—'}
                  </td>

                  {/* Shed Type */}
                  <td style={{ padding: '7px 12px' }}>
                    {p.isCramming ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        background: '#FFF0E6',
                        color: '#EA580C',
                        fontWeight: 700, fontSize: 10,
                        padding: '2px 8px', borderRadius: 99,
                        letterSpacing: '0.03em',
                        border: '1px solid rgba(234,88,12,0.2)',
                      }}>
                        WC · Row {p.rowIdx + 1}
                      </span>
                    ) : (
                      <span style={{
                        color: 'var(--text-3)',
                        fontSize: 11,
                      }}>
                        Normal
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Nozzle Ratio Summary ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        padding: '14px 16px',
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
          Yarn Contribution Ratio
        </div>

        {/* Segmented bar */}
        <div style={{ display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 10 }}>
          {yarns.map(yarn => {
            const count = yarnCounts[yarn.id] ?? 0
            const pct = totalPicks > 0 ? (count / totalPicks) * 100 : 0
            if (pct === 0) return null
            return (
              <div
                key={yarn.id}
                style={{ width: `${pct}%`, background: yarn.colour_hex, transition: 'width 0.3s ease' }}
                title={`${yarn.label}: ${pct.toFixed(1)}%`}
              />
            )
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
          {yarns.map(yarn => {
            const count = yarnCounts[yarn.id] ?? 0
            const pct = totalPicks > 0 ? ((count / totalPicks) * 100).toFixed(1) : '0'
            return (
              <div key={yarn.id} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span style={{
                  width: 10, height: 10, borderRadius: 2,
                  background: yarn.colour_hex,
                  border: '1px solid rgba(0,0,0,0.1)',
                  display: 'inline-block', flexShrink: 0,
                }} />
                <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>N{yarn.nozzle_config?.sequence?.[0] ?? 1}:</span>
                <span style={{ color: 'var(--text-3)' }}>{yarn.label}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
