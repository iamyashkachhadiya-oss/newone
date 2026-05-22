'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'

export default function CalcPanel() {
  const calcOutputs      = useDesignStore(s => s.calcOutputs)
  const weftSystem       = useDesignStore(s => s.weftSystem)
  const borderShaftsUsed = useDesignStore(s => s.borderShaftsUsed)
  const borderEnds       = useDesignStore(s => s.borderEnds)
  const shaftCount       = useDesignStore(s => s.shaftCount)

  // Tier 3 collapse state
  const [tier3Open, setTier3Open] = useState(false)

  if (!calcOutputs) {
    return (
      <div style={{
        padding: 24, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', color: 'var(--text-3)', fontSize: 13,
        lineHeight: 1.6, gap: 8, minHeight: 200,
      }}>
        <div style={{ fontSize: 28, marginBottom: 4 }}>📐</div>
        <div style={{ fontWeight: 500, color: 'var(--text-2)' }}>No data yet</div>
        <div style={{ fontSize: 12 }}>Fill in yarn + loom specs to see calculations</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Panel header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
          Live Calculations
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="pulse-indicator" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--clr-live)', display: 'inline-block' }} />
          <span style={{ fontSize: 10, color: 'var(--clr-live)', fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* ════════════════════════════════════
          TIER 1 — Always visible (3 metrics)
          GSM · EPI · Production
      ════════════════════════════════════ */}

      {/* GSM — Hero metric */}
      <div style={{
        background: 'linear-gradient(135deg, #E0115F14 0%, #E0115F06 100%)',
        border: '1px solid rgba(224,17,95,0.14)', borderRadius: 14, padding: '16px 16px',
      }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          GSM
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 40, fontWeight: 700, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {calcOutputs.gsm.toFixed(1)}
          </span>
          <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 500, opacity: 0.7 }}>g/m²</span>
        </div>
      </div>

      {/* EPI + Production — side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MetricCard label="ENDS PER INCH" value={String(calcOutputs.epi)} accent />
        <MetricCard label="PRODUCTION" value={calcOutputs.production_m_per_hr.toFixed(2)} unit="m/hr" />
      </div>

      {/* Border Impact card (only when border compiled) */}
      {borderShaftsUsed > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #FF660014 0%, #EA580C08 100%)',
          border: '1px solid rgba(234,88,12,0.18)', borderRadius: 14, padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#C2410C', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            🧵 Border Impact
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '9px 11px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Border Shafts</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#C2410C', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {borderShaftsUsed}
                <span style={{ fontSize: 10, fontWeight: 500, color: '#EA580C' }}>/{shaftCount}</span>
              </div>
            </div>
            <div style={{
              background: borderShaftsUsed > shaftCount ? '#FEF2F2' : 'rgba(224,17,95,0.06)',
              border: `1px solid ${borderShaftsUsed > shaftCount ? '#FCA5A5' : 'var(--accent-ring)'}`,
              borderRadius: 10, padding: '9px 11px',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: borderShaftsUsed > shaftCount ? 'var(--red)' : 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Body Budget</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: borderShaftsUsed > shaftCount ? 'var(--red)' : 'var(--accent)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                {Math.max(0, shaftCount - borderShaftsUsed)}
                <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.65 }}> shafts</span>
              </div>
            </div>
          </div>
          {calcOutputs && borderEnds > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: 10, padding: '9px 11px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Border Ends</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#C2410C', letterSpacing: '-0.02em' }}>{borderEnds.toLocaleString()}</div>
              </div>
              <div style={{ background: 'rgba(224,17,95,0.06)', border: '1px solid var(--accent-ring)', borderRadius: 10, padding: '9px 11px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Body Ends</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.02em' }}>
                  {Math.max(0, calcOutputs.total_warp_ends - borderEnds).toLocaleString()}
                </div>
              </div>
            </div>
          )}
          {borderShaftsUsed > shaftCount && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--red)', fontWeight: 600, padding: '7px 10px', background: '#FEF2F2', borderRadius: 8, border: '1px solid #FCA5A5' }}>
              ⚠ Border exceeds loom shaft capacity! Increase shaft count or simplify border weaves.
            </div>
          )}
          {borderShaftsUsed <= shaftCount && borderShaftsUsed > shaftCount * 0.6 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#92400E', padding: '7px 10px', background: '#FFFBEB', borderRadius: 8, border: '1px solid #FDE68A' }}>
              ⚠ Border using {Math.round((borderShaftsUsed / shaftCount) * 100)}% of shafts — body design heavily constrained.
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════
          TIER 2 — Visible but less prominent
          Reed Space · Total Ends · Linear Wt · Oz/Yd²
      ════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MetricSmall label="REED SPACE"  value={calcOutputs.reed_space_inches.toFixed(1)} unit="in" />
        <MetricSmall label="TOTAL ENDS"  value={calcOutputs.total_warp_ends.toLocaleString()} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <MetricSmall label="LINEAR WT"   value={calcOutputs.linear_meter_weight_g.toFixed(1)} unit="g/m" />
        <MetricSmall label="OZ/YD²"      value={calcOutputs.oz_per_sq_yard.toFixed(2)} />
      </div>

      {/* ════════════════════════════════════
          TIER 3 — Collapsed by default
          Warp Wt · Weft Wt · Weft Breakdown · Warp Consumed
      ════════════════════════════════════ */}
      <button
        onClick={() => setTier3Open(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', border: 'none', background: 'none', cursor: 'pointer',
          padding: '6px 2px', color: 'var(--text-3)', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.02em',
        }}
        aria-expanded={tier3Open}
      >
        <span>More metrics</span>
        <span style={{
          display: 'inline-block', transition: 'transform 0.2s ease',
          transform: tier3Open ? 'rotate(180deg)' : 'rotate(0deg)',
          fontSize: 10,
        }}>▾</span>
      </button>

      {/* Tier 3 expanded content */}
      <div style={{
        overflow: 'hidden',
        maxHeight: tier3Open ? 400 : 0,
        opacity: tier3Open ? 1 : 0,
        transition: 'max-height 0.25s ease, opacity 0.2s ease',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 2 }}>
          {/* Warp + Weft weights */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <MetricSmall label="WARP WT"  value={calcOutputs.warp_weight_per_100m_g.toFixed(0)} unit="g/100m" />
            <MetricSmall label="WEFT WT"  value={calcOutputs.weft_weight_per_100m_g.toFixed(0)} unit="g/100m" />
          </div>

          {/* Weft breakdown */}
          {calcOutputs.per_yarn_weft_weights && Object.keys(calcOutputs.per_yarn_weft_weights).length >= 1 && (
            <div style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '13px 14px' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                Weft Breakdown
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {Object.entries(calcOutputs.per_yarn_weft_weights).map(([id, weight], idx) => (
                  <YarnWeightRow key={id} id={id} weight={weight as number} index={idx} />
                ))}
              </div>
            </div>
          )}

          {/* Warp consumed */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 12, padding: '13px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
              Warp Consumed
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
                {calcOutputs.warp_consumed_m_per_hr.toFixed(2)}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>m/hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════
          EXPORT PREVIEW — labeled thumbnail
      ════════════════════════════════════ */}
      <div style={{ marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 6 }}>
          Export Reports
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Button 1: Tech Report */}
          <button
            onClick={() => import('@/components/outputs/PDFExport').then(m => m.downloadPDF())}
            title="Click to download the full engineering report as PDF"
            style={{
              width: '100%', border: '1px solid var(--border-light)', borderRadius: 10,
              padding: '10px 12px', background: 'var(--bg)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clr-export)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 2px rgba(15,118,110,0.12)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-light)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }}
          >
            {/* Mini PDF page icon */}
            <div style={{
              width: 32, height: 40, borderRadius: 4, flexShrink: 0,
              background: 'linear-gradient(160deg, #fff 0%, #F0FFFE 100%)',
              border: '1px solid rgba(15,118,110,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <div style={{ width: 18, height: 1.5, borderRadius: 1, background: '#E0115F' }} />
              <div style={{ width: 16, height: 1, borderRadius: 1, background: '#CBD5E1' }} />
              <div style={{ width: 16, height: 1, borderRadius: 1, background: '#CBD5E1' }} />
              <div style={{ width: 12, height: 1, borderRadius: 1, background: '#CBD5E1' }} />
            </div>
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--clr-export)', letterSpacing: '-0.01em' }}>
                Download PDF Report
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-4)', marginTop: 1, lineHeight: 1.4 }}>
                2-page engineering report
              </div>
            </div>
            <div style={{ marginLeft: 'auto', color: 'var(--clr-export)', fontSize: 13, opacity: 0.6 }}>↓</div>
          </button>

          {/* Button 2: Traditional Report */}
          <button
            onClick={() => import('@/components/outputs/TraditionalExport').then(m => m.downloadTraditionalPDF())}
            title="Click to download traditional factory report"
            style={{
              width: '100%', border: '1px solid var(--border-light)', borderRadius: 10,
              padding: '10px 12px', background: 'var(--bg)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 10,
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = '#EA580C'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 0 2px rgba(234,88,12,0.12)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-light)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
            }}
          >
            {/* Mini traditional paper icon */}
            <div style={{
              width: 32, height: 40, borderRadius: 4, flexShrink: 0,
              background: 'linear-gradient(160deg, #fff 0%, #FFF7ED 100%)',
              border: '1px solid rgba(234,88,12,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <div style={{ width: 20, height: 14, border: '1px dotted rgba(234,88,12,0.5)', borderRadius: 1 }} />
              <div style={{ width: 16, height: 1, borderRadius: 1, background: '#FDBA74' }} />
              <div style={{ width: 14, height: 1, borderRadius: 1, background: '#FDBA74' }} />
            </div>
            <div style={{ textAlign: 'left', minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#EA580C', letterSpacing: '-0.01em' }}>
                Factory format (Gujarati)
              </div>
              <div style={{ fontSize: 9.5, color: 'var(--text-4)', marginTop: 1, lineHeight: 1.4 }}>
                Traditional hand-written style
              </div>
            </div>
            <div style={{ marginLeft: 'auto', color: '#EA580C', fontSize: 13, opacity: 0.6 }}>↓</div>
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────── */

function MetricCard({ label, value, unit, accent }: { label: string; value: string; unit?: string; accent?: boolean }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-light)',
      borderRadius: 12, padding: '13px 14px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: accent ? 'var(--accent)' : 'var(--text-1)', letterSpacing: '-0.03em', lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  )
}

function MetricSmall({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 10, padding: '10px 11px' }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>{unit}</span>}
      </div>
    </div>
  )
}

function YarnWeightRow({ id, weight, index }: { id: string; weight: number; index: number }) {
  const yarn = useDesignStore(s => s.weftSystem.yarns.find(y => y.id === id))
  if (!yarn) return null
  const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const letter  = letters[index] || String(index + 1)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: yarn.colour_hex, boxShadow: `0 0 0 2px ${yarn.colour_hex}33`, flexShrink: 0 }} />
        <span style={{ color: 'var(--text-2)', fontWeight: 500, letterSpacing: '-0.01em' }}>
          {letter} — {yarn.label}
        </span>
      </div>
      <span style={{ color: 'var(--text-1)', fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        {weight.toFixed(0)}<small style={{ fontWeight: 400, opacity: 0.5, fontSize: 10 }}>g</small>
      </span>
    </div>
  )
}
