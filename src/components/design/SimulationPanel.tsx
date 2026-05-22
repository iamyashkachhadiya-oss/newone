'use client'

import { useMemo, useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import { MATERIAL_PHYSICS, WEAVE_MODIFIERS, CATEGORY_COLORS } from '@/lib/calc/materials'

// ─── Gauge Bar Component ────────────────────────────────────────────────
function GaugeBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round(Math.min(value / max, 1) * 100)
  return (
    <div style={{
      height: 6, background: 'var(--bg-darker)', borderRadius: 3, overflow: 'hidden',
      marginTop: 6, marginBottom: 2,
    }}>
      <div style={{
        height: '100%', width: `${pct}%`, background: color, borderRadius: 3,
        transition: 'width 0.4s ease',
      }} />
    </div>
  )
}

// ─── Score Card ─────────────────────────────────────────────────────────
function ScoreCard({ label, value, unit, max, color, formula }: {
  label: string; value: string; unit: string; max: number; color: string; formula?: string
}) {
  const numVal = parseFloat(value) || 0
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-light)',
      borderRadius: 12, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{value}</span>
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{unit}</span>
      </div>
      <GaugeBar value={numVal} max={max} color={color} />
      {formula && (
        <div style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)',
          lineHeight: 1.5, marginTop: 6, wordBreak: 'break-all',
        }}>
          {formula}
        </div>
      )}
    </div>
  )
}

// ─── Radar Visualization (Pure CSS) ─────────────────────────────────────
function RadarDisplay({ scores }: { scores: Record<string, number> }) {
  const entries = Object.entries(scores)
  const n = entries.length
  const size = 220
  const cx = size / 2
  const cy = size / 2
  const maxR = size / 2 - 24

  // Compute polygon points for each ring
  const getPoints = (radius: number) =>
    entries.map((_, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2
      return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`
    }).join(' ')

  // Compute data polygon
  const dataPoints = entries.map(([, val], i) => {
    const r = (val / 100) * maxR
    const angle = (2 * Math.PI * i) / n - Math.PI / 2
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
  }).join(' ')

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1.0].map(pct => (
          <polygon
            key={pct}
            points={getPoints(maxR * pct)}
            fill="none"
            stroke="var(--border)"
            strokeWidth="0.5"
            opacity={0.6}
          />
        ))}
        {/* Axis lines */}
        {entries.map((_, i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2
          return (
            <line
              key={i}
              x1={cx} y1={cy}
              x2={cx + maxR * Math.cos(angle)}
              y2={cy + maxR * Math.sin(angle)}
              stroke="var(--border)"
              strokeWidth="0.5"
              opacity={0.4}
            />
          )
        })}
        {/* Data polygon */}
        <polygon
          points={dataPoints}
          fill="rgba(55, 138, 221, 0.12)"
          stroke="#378ADD"
          strokeWidth="2"
        />
        {/* Data points */}
        {entries.map(([, val], i) => {
          const r = (val / 100) * maxR
          const angle = (2 * Math.PI * i) / n - Math.PI / 2
          return (
            <circle
              key={i}
              cx={cx + r * Math.cos(angle)}
              cy={cy + r * Math.sin(angle)}
              r={3}
              fill="#378ADD"
            />
          )
        })}
        {/* Labels */}
        {entries.map(([key], i) => {
          const angle = (2 * Math.PI * i) / n - Math.PI / 2
          const lx = cx + (maxR + 18) * Math.cos(angle)
          const ly = cy + (maxR + 18) * Math.sin(angle)
          return (
            <text
              key={key}
              x={lx} y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: 9, fill: 'var(--text-2)', fontWeight: 500 }}
            >
              {key.replace(/_/g, ' ')}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Alert Component ────────────────────────────────────────────────────
function AlertCard({ alert }: { alert: { severity: string; message: string; fix: string } }) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    ok:     { bg: '#eaf3de', border: '#3b6d11', text: '#3b6d11' },
    info:   { bg: '#e6f1fb', border: '#185fa5', text: '#185fa5' },
    warn:   { bg: '#faeeda', border: '#ba7517', text: '#854f0b' },
    danger: { bg: '#fcebeb', border: '#a32d2d', text: '#a32d2d' },
  }
  const c = colors[alert.severity] || colors.info

  return (
    <div style={{
      fontSize: 12, padding: '10px 14px', borderRadius: 10,
      background: c.bg, borderLeft: `3px solid ${c.border}`,
      marginBottom: 8,
    }}>
      <div style={{ fontWeight: 600, color: c.text }}>{alert.message}</div>
      <div style={{ fontSize: 10, color: c.text, opacity: 0.75, marginTop: 3, fontStyle: 'italic' }}>
        Fix: {alert.fix}
      </div>
    </div>
  )
}

// ─── Fabric Structure Preview ───────────────────────────────────────────
function FabricPreview({ weaveType, coverFactor, cellPx }: { weaveType: string; coverFactor: number; cellPx: number }) {
  const cols = 24
  const rows = 16
  const warpColor = '#378ADD'
  const weftColor = '#EF9F27'
  const openColor = 'var(--bg-darker)'

  const cells = useMemo(() => {
    const result: Array<{ isWarp: boolean; cover: boolean }> = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let isWarp = false
        switch (weaveType) {
          case 'plain': isWarp = (r + c) % 2 === 0; break
          case 'twill': isWarp = (r + c) % 3 < 2; break
          case 'satin': isWarp = (r * 2 + c) % 5 === 0; break
          case 'basket': isWarp = (Math.floor(r / 2) + Math.floor(c / 2)) % 2 === 0; break
          case 'rib': isWarp = Math.floor(c / 2) % 2 === 0; break
          case 'leno': isWarp = c % 5 === 0 && r % 3 === 0; break
          case 'dobby': isWarp = (r * 3 + c) % 4 < 2; break
          case 'jacquard': isWarp = (r * 2 + c * 3) % 7 < 3; break
          default: isWarp = (r + c) % 2 === 0; break
        }
        const cover = Math.random() < coverFactor
        result.push({ isWarp, cover })
      }
    }
    return result
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weaveType, Math.round(coverFactor * 10)])

  const gap = Math.max(1, Math.round(cellPx * 0.08))
  return (
    <div style={{
      border: '1px solid var(--border-light)',
      borderRadius: 10,
      overflow: 'auto',
      padding: 4,
      maxHeight: 320,
      background: 'var(--bg-darker)',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellPx}px)`,
        gap,
        width: 'fit-content',
      }}>
        {cells.map((cell, i) => (
          <div
            key={i}
            style={{
              width: cellPx, height: cellPx,
              borderRadius: Math.max(1, Math.round(cellPx * 0.12)),
              background: cell.cover ? (cell.isWarp ? warpColor : weftColor) : openColor,
              opacity: cell.cover ? (0.6 + Math.random() * 0.4) : 1,
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Warp Yarn Summary Row ──────────────────────────────────────────────
function WarpYarnRow({ label, material, count, system, hex }: {
  label: string; material: string; count: number; system: string; hex: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
      background: 'var(--bg)', borderRadius: 8, fontSize: 12,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: hex, flexShrink: 0 }} />
      <div style={{ fontWeight: 600, flex: 1 }}>{label}</div>
      <div style={{ color: 'var(--text-3)' }}>{count}{system === 'denier' ? 'D' : 'Ne'}</div>
      <div style={{ color: 'var(--text-2)', fontWeight: 500 }}>{material}</div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SimulationPanel() {
  const calcOutputs = useDesignStore((s) => s.calcOutputs)
  const warpSystem = useDesignStore((s) => s.warpSystem)
  const weftSystem = useDesignStore((s) => s.weftSystem)
  const loom = useDesignStore((s) => s.loom)
  const warp = useDesignStore((s) => s.warp)

  // Zoom: 0.5 – 3.0, default 1.0 (cellPx = zoom * 14)
  const [zoom, setZoom] = useState(1.0)
  const cellPx = Math.round(zoom * 14)

  const sim = calcOutputs?.simulation

  if (!sim || !loom) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px', color: 'var(--text-3)', fontSize: 13,
        lineHeight: 1.6,
      }}>
        <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🔬</div>
        Fill in yarn + loom specs to see the fabric simulation engine.
        <br />
        <span style={{ fontSize: 11 }}>Shrinkage, drape, stiffness &amp; strength are computed live.</span>
      </div>
    )
  }

  const weave = WEAVE_MODIFIERS[loom.weave_type] || WEAVE_MODIFIERS.plain
  const warpMat = warp?.material ? MATERIAL_PHYSICS[warp.material] : null
  const catColors = warpMat ? CATEGORY_COLORS[warpMat.category] : null

  // Radar data
  const radarScores: Record<string, number> = {
    stability: sim.dimensional_stability,
    drape: sim.drape_index,
    softness: sim.softness,
    strength: Math.round(Math.min(sim.strength_n_per_cm / 4, 100)),
    handle: sim.handle_score,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ─── Archetype Header ─── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(232,168,56,0.1) 0%, rgba(232,168,56,0.02) 100%)',
        border: '1.5px solid rgba(232,168,56,0.3)',
        borderRadius: 14, padding: '24px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Identified Fabric Profile
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', margin: '10px 0 6px', letterSpacing: '-0.02em' }}>
          {sim.archetype.split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 340, margin: '0 auto', lineHeight: 1.5 }}>
          {sim.archetype_description}
        </p>
      </div>

      {/* ─── Material & Weave Info ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border-light)',
          borderRadius: 10, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>
            Warp Material
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>
            {warpMat?.name || warp?.material}
          </div>
          {catColors && (
            <span style={{
              fontSize: 10, padding: '2px 8px', borderRadius: 6, marginTop: 6,
              display: 'inline-block',
              background: catColors.bg, color: catColors.text, fontWeight: 600,
            }}>
              {warpMat?.category}
            </span>
          )}
        </div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border-light)',
          borderRadius: 10, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 8 }}>
            Weave Structure
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--primary)' }}>
            {weave.name}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
            {weave.hint}
          </div>
        </div>
      </div>

      {/* ─── Warp Yarn Summary (Multi-Warp) ─── */}
      {warpSystem.yarns.length > 0 && (
        <div>
          <div className="section-header" style={{ marginBottom: 10 }}>Warp Yarns ({warpSystem.yarns.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {warpSystem.yarns.filter(y => y.is_active).map(y => (
              <WarpYarnRow
                key={y.id}
                label={y.label}
                material={MATERIAL_PHYSICS[y.material]?.name || y.material}
                count={y.count_value}
                system={y.count_system}
                hex={y.colour_hex}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Weft Yarn Summary ─── */}
      {weftSystem.yarns.length > 0 && (
        <div>
          <div className="section-header" style={{ marginBottom: 10 }}>Weft Yarns ({weftSystem.yarns.filter(y => y.is_active).length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {weftSystem.yarns.filter(y => y.is_active).map(y => (
              <WarpYarnRow
                key={y.id}
                label={y.label}
                material={MATERIAL_PHYSICS[y.material]?.name || y.material}
                count={y.count_value}
                system={y.count_system}
                hex={y.colour_hex}
              />
            ))}
          </div>
        </div>
      )}

      {/* ─── Output Simulation Scores ─── */}
      <div>
        <div className="section-header" style={{ marginBottom: 12 }}>Fabric Output Simulation</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ScoreCard
            label="Shrinkage"
            value={sim.shrinkage_pct.toFixed(1)}
            unit="%"
            max={35}
            color="#a32d2d"
            formula={sim.formulas.shrinkage}
          />
          <ScoreCard
            label="Drape"
            value={String(sim.drape_index)}
            unit="/ 100"
            max={100}
            color="#185fa5"
            formula={sim.formulas.drape}
          />
          <ScoreCard
            label="Stiffness"
            value={String(sim.stiffness_index)}
            unit="/ 100"
            max={100}
            color="#854f0b"
            formula={sim.formulas.stiffness}
          />
          <ScoreCard
            label="Fabric Strength"
            value={sim.strength_n_per_cm.toFixed(1)}
            unit="N/cm"
            max={400}
            color="#3b6d11"
            formula={sim.formulas.strength}
          />
        </div>
      </div>

      {/* ─── Radar Chart ─── */}
      <div>
        <div className="section-header" style={{ marginBottom: 8 }}>Output Profile Radar</div>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border-light)',
          borderRadius: 14, padding: '16px 8px',
        }}>
          <RadarDisplay scores={radarScores} />
        </div>
      </div>

      {/* ─── Engineering Alerts ─── */}
      <div>
        <div className="section-header" style={{ marginBottom: 10 }}>Engineering Alerts</div>
        {sim.alerts.map((alert, i) => (
          <AlertCard key={i} alert={alert} />
        ))}
      </div>

      {/* ─── Fabric Structure Preview ─── */}
      <div>
        {/* Header + Zoom bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <div className="section-header" style={{ marginBottom: 0 }}>Fabric Structure Preview</div>
          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Minus button */}
            <button
              onClick={() => setZoom(z => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))))}
              style={{
                width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer',
                fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, flexShrink: 0,
              }}
              title="Zoom out"
            >−</button>

            {/* Slider */}
            <input
              type="range"
              min={0.5} max={3.0} step={0.25}
              value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              style={{ width: 90, accentColor: 'var(--accent)', cursor: 'pointer' }}
              title={`Zoom: ${zoom.toFixed(2)}×`}
            />

            {/* Plus button */}
            <button
              onClick={() => setZoom(z => Math.min(3.0, parseFloat((z + 0.25).toFixed(2))))}
              style={{
                width: 24, height: 24, borderRadius: 6, border: '1px solid var(--border)',
                background: 'var(--surface)', color: 'var(--text-1)', cursor: 'pointer',
                fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, flexShrink: 0,
              }}
              title="Zoom in"
            >+</button>

            {/* Zoom label */}
            <span style={{
              fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
              minWidth: 32, textAlign: 'right', fontFamily: 'var(--font-mono)',
            }}>
              {zoom.toFixed(2)}×
            </span>
          </div>
        </div>

        <FabricPreview weaveType={loom.weave_type} coverFactor={sim.cover_factor} cellPx={cellPx} />
        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center', marginTop: 10, fontSize: 11,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#378ADD' }} />
            <span style={{ color: 'var(--text-2)' }}>Warp</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: '#EF9F27' }} />
            <span style={{ color: 'var(--text-2)' }}>Weft</span>
          </div>
        </div>
      </div>

      {/* ─── Simulation Formulas ─── */}
      <div style={{
        background: 'var(--bg-darker)', borderRadius: 12, padding: 16,
      }}>
        <div className="section-header" style={{ marginBottom: 12, borderBottom: 'none', paddingBottom: 0 }}>
          Simulation Formulas
        </div>
        {[
          { name: 'Shrinkage %', formula: 'S% = S_base × (1 + regain/100 × 1.8) × crimp_factor × (1 + density_norm × 0.25) × (1 + tension_norm × 0.6)' },
          { name: 'Drape Index', formula: 'D = D_base × weave_drape_mod × (1 − density_norm×0.55)^0.4 × ln(Ne/10)/ln(12) × (1 − tension_norm×0.22)' },
          { name: 'Stiffness', formula: 'ST = ST_base × weave_stiff_mod × density_norm^0.6 × (30/Ne) × (1 + tension_norm×0.35)' },
          { name: 'Strength', formula: 'FS [N/cm] = (T_fiber × density/10 × weave_str_mod × cover_factor × (1+elong/200)) / (Ne/30)^0.45' },
        ].map(f => (
          <div key={f.name} style={{
            display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8,
            marginBottom: 8, alignItems: 'start', fontSize: 12,
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{f.name}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-3)', fontSize: 10, lineHeight: 1.6 }}>
              {f.formula}
            </span>
          </div>
        ))}
      </div>

      {/* ─── Live Indicator ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, color: 'var(--text-3)', justifyContent: 'center', paddingTop: 4,
      }}>
        <span className="pulse-indicator" style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#4ADE80', display: 'inline-block',
        }} />
        Simulation recalculated live
      </div>
    </div>
  )
}
