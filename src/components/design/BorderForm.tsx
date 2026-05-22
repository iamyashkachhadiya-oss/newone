'use client'

import { useState, useMemo, useCallback } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import {
  compileBorderDesign,
  validateDesign,
  WEAVE_PRESETS,
  computeLCM,
  type Zone,
  type CrossBorder,
  type ValidationError,
  type CompiledBorderOutput,
  type WeaveMatrix,
} from '@/lib/border/engine'

// ─── Design-system helpers (same as LoomForm/WarpForm) ────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600,
      color: 'var(--text-3)', textTransform: 'uppercase',
      letterSpacing: '0.07em', marginBottom: 12,
      paddingBottom: 8, borderBottom: '1px solid var(--border-light)',
    }}>
      {children}
    </div>
  )
}

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>
      {children}
    </label>
  )
}

function ParamGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children}
      </div>
    </div>
  )
}

// ─── Mini SVG weave preview ───────────────────────────────────────────────────
function WeavePreviewGrid({
  matrix, cellPx = 8, accent = '#E0115F',
}: { matrix: WeaveMatrix; cellPx?: number; accent?: string }) {
  if (!matrix.length) return null
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  return (
    <svg width={cols * cellPx} height={rows * cellPx}
      style={{ display: 'block', imageRendering: 'pixelated', flexShrink: 0, borderRadius: 4 }}>
      {matrix.map((row, ri) => row.map((c, ci) => (
        <rect key={`${ri}-${ci}`} x={ci * cellPx} y={ri * cellPx}
          width={cellPx - 1} height={cellPx - 1} rx={cellPx > 6 ? 2 : 0}
          fill={c ? accent : '#E8EAF0'} />
      )))}
    </svg>
  )
}

// ─── Compact lifting plan grid ────────────────────────────────────────────────
function LiftingPlanGrid({ plan, maxRows = 20 }: { plan: number[][]; maxRows?: number }) {
  const displayPlan = plan.slice(0, maxRows)
  const shafts = plan[0]?.length ?? 0
  const cellPx = 10
  if (!displayPlan.length) return null
  return (
    <div style={{ overflowX: 'auto', maxHeight: 220, overflowY: 'auto' }}>
      <svg width={shafts * cellPx} height={displayPlan.length * cellPx} style={{ display: 'block' }}>
        {displayPlan.map((row, ri) => row.map((c, ci) => (
          <rect key={`${ri}-${ci}`}
            x={ci * cellPx} y={ri * cellPx}
            width={cellPx - 1} height={cellPx - 1} rx={2}
            fill={c ? '#E0115F' : '#EEF0F5'} />
        )))}
      </svg>
      {plan.length > maxRows && (
        <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4, textAlign: 'center' }}>
          Showing {maxRows} / {plan.length} picks
        </div>
      )}
    </div>
  )
}

// ─── Shaft budget visualiser ──────────────────────────────────────────────────
function ShaftBudget({ borderShafts, totalShafts }: { borderShafts: number; totalShafts: number }) {
  const bodyShafts = Math.max(0, totalShafts - borderShafts)
  const borderPct = Math.min((borderShafts / totalShafts) * 100, 100)
  const over = borderShafts > totalShafts

  return (
    <div style={{
      background: over ? '#FFF1F0' : 'var(--bg)',
      border: `1px solid ${over ? '#FCA5A5' : 'var(--border-light)'}`,
      borderRadius: 12, padding: '12px 14px',
    }}>
      {/* Bar */}
      <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden',
        background: 'rgba(0,0,0,0.07)', marginBottom: 10 }}>
        {borderShafts > 0 && (
          <div style={{
            width: `${borderPct}%`,
            background: over ? 'var(--red)' : '#EA580C',
            transition: 'width 0.3s',
          }} />
        )}
        <div style={{ flex: 1, background: over ? 'transparent' : '#E0115F', opacity: 0.3 }} />
      </div>

      {/* Labels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{
          background: over ? '#FEE2E2' : '#FFF7ED',
          border: `1px solid ${over ? '#FCA5A5' : '#FED7AA'}`,
          borderRadius: 8, padding: '7px 10px',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: over ? 'var(--red)' : '#EA580C',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            Border Shafts
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: over ? 'var(--red)' : '#C2410C',
            letterSpacing: '-0.02em' }}>
            {borderShafts}
            <span style={{ fontSize: 10, fontWeight: 500, color: over ? 'var(--red)' : '#EA580C' }}>
              /{totalShafts}
            </span>
            {over && <span style={{ marginLeft: 4, fontSize: 12 }}>❌</span>}
          </div>
        </div>
        <div style={{
          background: over ? '#FEE2E2' : 'rgba(224,17,95,0.06)',
          border: `1px solid ${over ? '#FCA5A5' : 'var(--accent-ring)'}`,
          borderRadius: 8, padding: '7px 10px',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: over ? 'var(--red)' : 'var(--accent)',
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
            Body Budget
          </div>
          <div style={{ fontSize: 17, fontWeight: 800,
            color: over ? 'var(--red)' : 'var(--accent)', letterSpacing: '-0.02em' }}>
            {bodyShafts}
            <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.65 }}> shafts</span>
            {!over && bodyShafts > 0 && <span style={{ marginLeft: 4, fontSize: 12 }}>✓</span>}
          </div>
        </div>
      </div>

      {over && (
        <div style={{ fontSize: 11, color: 'var(--red)', marginTop: 8, fontWeight: 600 }}>
          ⚠ Border requires {borderShafts} shafts but loom only has {totalShafts}. Reduce border complexity or increase shaft count in Loom tab.
        </div>
      )}
      {!over && borderShafts > 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 8 }}>
          Body peg plan should use ≤ <strong style={{ color: 'var(--text-1)' }}>{bodyShafts}</strong> shafts (shafts 1–{bodyShafts} are for body; {bodyShafts + 1}–{totalShafts} are border-reserved)
        </div>
      )}
    </div>
  )
}

// ─── Validation badges ────────────────────────────────────────────────────────
function ValidationBadge({ errors }: { errors: ValidationError[] }) {
  if (!errors.length) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      {errors.map((e, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 7,
          padding: '8px 11px', borderRadius: 9,
          background: e.severity === 'error' ? '#FFF1F0' : '#FFFBEB',
          border: `1px solid ${e.severity === 'error' ? '#FCA5A5' : '#FDE68A'}`,
          fontSize: 11.5, color: e.severity === 'error' ? '#C00E52' : '#92400E', lineHeight: 1.5,
        }}>
          <span style={{ flexShrink: 0, marginTop: 1 }}>{e.severity === 'error' ? '❌' : '⚠️'}</span>
          <span>{e.message}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Weave preset picker modal ────────────────────────────────────────────────
function WeavePickerModal({ onSelect, onClose }: { onSelect: (key: string) => void; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,15,20,0.45)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: 18, padding: 22,
        width: '100%', maxWidth: 480,
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        border: '1px solid var(--border-light)',
        animation: 'modal-in 0.22s ease',
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', marginBottom: 14 }}>
          Select Weave Preset
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
          {Object.entries(WEAVE_PRESETS).map(([key, preset]) => (
            <button key={key} onClick={() => { onSelect(key); onClose() }}
              style={{
                background: 'var(--bg)', border: '1px solid var(--border-light)',
                borderRadius: 10, padding: 10, cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent)'
                e.currentTarget.style.background = 'var(--accent-light)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-light)'
                e.currentTarget.style.background = 'var(--bg)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <WeavePreviewGrid matrix={preset.matrix} cellPx={7} />
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-2)', textAlign: 'center', lineHeight: 1.3 }}>
                {preset.name}
              </div>
            </button>
          ))}
        </div>
        <button onClick={onClose} className="btn-secondary"
          style={{ marginTop: 14, width: '100%', justifyContent: 'center' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Border zone toggle card ──────────────────────────────────────────────────
function BorderZoneEditor({
  label, accent, zone, enabled, onToggle, onUpdate,
}: {
  label: string; accent: string
  zone: Zone; enabled: boolean
  onToggle: () => void; onUpdate: (z: Zone) => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const preset = Object.entries(WEAVE_PRESETS).find(
    ([, p]) => JSON.stringify(p.matrix) === JSON.stringify(zone.weaveMatrix)
  )
  const presetName = preset ? preset[1].name : 'Custom'

  return (
    <>
      <div style={{
        border: `1px solid ${enabled ? accent + '30' : 'var(--border-light)'}`,
        borderRadius: 12, overflow: 'hidden',
        background: enabled ? `${accent}06` : 'var(--bg)',
        transition: 'all 0.2s',
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 13px',
          borderBottom: enabled ? `1px solid ${accent}20` : 'none',
          background: enabled ? `${accent}0A` : 'transparent',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: enabled ? accent : 'var(--text-3)' }}>
            {label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {enabled && (
              <div style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99,
                background: `${accent}18`, color: accent, fontWeight: 600 }}>
                {zone.widthEnds} ends
              </div>
            )}
            <button onClick={onToggle} style={{
              width: 38, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
              background: enabled ? accent : 'rgba(0,0,0,0.15)',
              position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 2, left: enabled ? 18 : 2,
                width: 18, height: 18, borderRadius: 9, background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>

        {enabled && (
          <div style={{ padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <FormLabel>Width (ends)</FormLabel>
              <input type="number" min={2} max={2000} step={2}
                value={zone.widthEnds}
                onChange={e => onUpdate({ ...zone, widthEnds: parseInt(e.target.value) || 2 })}
                style={{ height: 34, fontSize: 13 }}
              />
            </div>
            <div>
              <FormLabel>Weave Structure</FormLabel>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 9, padding: '7px 11px',
              }}>
                <WeavePreviewGrid matrix={zone.weaveMatrix} cellPx={8} accent={accent} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-1)' }}>{presetName}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    {zone.weaveMatrix.length}p × {zone.weaveMatrix[0]?.length ?? 0}e
                  </div>
                </div>
                <button onClick={() => setShowPicker(true)} style={{
                  padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 7,
                  border: `1px solid ${accent}40`, background: `${accent}10`,
                  color: accent, cursor: 'pointer', whiteSpace: 'nowrap',
                }}>
                  Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPicker && (
        <WeavePickerModal
          onSelect={key => {
            const p = WEAVE_PRESETS[key]
            if (p) onUpdate({ ...zone, weaveMatrix: p.matrix })
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}

// ─── Cross borders editor ─────────────────────────────────────────────────────
function CrossBorderEditor({ crossBorders, onChange }: {
  crossBorders: CrossBorder[]; onChange: (cbs: CrossBorder[]) => void
}) {
  const [showPicker, setShowPicker] = useState<string | null>(null)

  const add = () => {
    const lastEnd = crossBorders.reduce((m, cb) => Math.max(m, cb.startPickIndex + cb.lengthPicks), 0)
    onChange([...crossBorders, {
      id: `cb-${Date.now()}`,
      weaveMatrix: WEAVE_PRESETS.diamond.matrix,
      startPickIndex: lastEnd + 100,
      lengthPicks: 300,
    }])
  }

  const update = (id: string, u: Partial<CrossBorder>) =>
    onChange(crossBorders.map(cb => cb.id === id ? { ...cb, ...u } : cb))

  const remove = (id: string) => onChange(crossBorders.filter(cb => cb.id !== id))

  return (
    <div>
      <SectionTitle>Cross Borders (Pallu)</SectionTitle>
      {crossBorders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '14px 0', color: 'var(--text-4)',
          fontSize: 12, fontStyle: 'italic', marginBottom: 8 }}>
          No cross borders — fabric repeats continuously
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
        {crossBorders.map((cb, idx) => {
          const pe = Object.entries(WEAVE_PRESETS).find(([, p]) =>
            JSON.stringify(p.matrix) === JSON.stringify(cb.weaveMatrix))
          return (
            <div key={cb.id} style={{
              background: '#FFF1F0', border: '1px solid #FCA5A5',
              borderRadius: 10, padding: 11,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#C00E52' }}>Cross Border {idx + 1}</div>
                <button onClick={() => remove(cb.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#E0115F', fontSize: 16, lineHeight: 1 }}>
                  ×
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 9 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#E0115F', marginBottom: 4 }}>Start Pick</div>
                  <input type="number" min={0} value={cb.startPickIndex}
                    onChange={e => update(cb.id, { startPickIndex: parseInt(e.target.value) || 0 })}
                    style={{ height: 32, fontSize: 12, borderRadius: 7 }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#E0115F', marginBottom: 4 }}>Length (picks)</div>
                  <input type="number" min={1} value={cb.lengthPicks}
                    onChange={e => update(cb.id, { lengthPicks: parseInt(e.target.value) || 1 })}
                    style={{ height: 32, fontSize: 12, borderRadius: 7 }} />
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                background: 'rgba(255,255,255,0.7)', border: '1px solid #FCA5A5',
                borderRadius: 8, padding: '7px 10px',
              }}>
                <WeavePreviewGrid matrix={cb.weaveMatrix} cellPx={7} accent="#E0115F" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#C00E52' }}>{pe ? pe[1].name : 'Custom'}</div>
                  <div style={{ fontSize: 10, color: '#E0115F' }}>
                    {cb.weaveMatrix.length}p × {cb.weaveMatrix[0]?.length ?? 0}e
                  </div>
                </div>
                <button onClick={() => setShowPicker(cb.id)} style={{
                  padding: '4px 9px', fontSize: 10, fontWeight: 600, borderRadius: 6,
                  border: '1px solid #FCA5A5', background: '#fff', color: '#E0115F', cursor: 'pointer',
                }}>Change</button>
              </div>
            </div>
          )
        })}
      </div>
      <button onClick={add} style={{
        width: '100%', padding: '9px 0', borderRadius: 9,
        border: '1px dashed #FCA5A5', background: '#FFF1F0',
        color: '#E0115F', fontSize: 12, fontWeight: 600,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
      }}>
        + Add Cross Border
      </button>
      {showPicker && (
        <WeavePickerModal
          onSelect={key => {
            const p = WEAVE_PRESETS[key]
            if (p && showPicker) update(showPicker, { weaveMatrix: p.matrix })
          }}
          onClose={() => setShowPicker(null)}
        />
      )}
    </div>
  )
}

// ─── Fabric warp layout bar ───────────────────────────────────────────────────
function FabricLayoutBar({ leftEnabled, rightEnabled, leftZone, rightZone, totalBodyEnds, crossBorders }: {
  leftEnabled: boolean; rightEnabled: boolean
  leftZone: Zone; rightZone: Zone
  totalBodyEnds: number
  crossBorders: CrossBorder[]
}) {
  const leftEnds  = leftEnabled  ? leftZone.widthEnds  : 0
  const rightEnds = rightEnabled ? rightZone.widthEnds : 0
  const total = leftEnds + totalBodyEnds + rightEnds
  if (total === 0) return null

  const leftPct  = (leftEnds  / total) * 100
  const bodyPct  = (totalBodyEnds / total) * 100
  const rightPct = (rightEnds / total) * 100

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
      }}>
        <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Warp Layout Preview
        </div>
        <div style={{ fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>
          {total.toLocaleString()} total ends
        </div>
      </div>

      {/* Main proportional bar — 64px tall (Prompt 9) */}
      <div style={{ display: 'flex', height: 64, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-light)', boxShadow: 'var(--shadow-xs)' }}>
        {/* Left border section */}
        {leftEnabled && leftPct > 0 && (
          <div
            title={`Left Border: ${leftZone.widthEnds} ends (${leftPct.toFixed(1)}%)`}
            style={{
              width: `${leftPct}%`, minWidth: leftPct < 8 ? 24 : undefined,
              background: 'linear-gradient(180deg, #EFF6FF 0%, #DBEAFE 100%)',
              borderRight: '2px solid #E0115F',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              flexShrink: 0,
            }}
          >
            {leftPct >= 8 ? (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#1D4ED8', letterSpacing: '-0.01em' }}>
                  {leftZone.widthEnds}
                </div>
                <div style={{ fontSize: 7, fontWeight: 600, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: '0.06em' }}>L ends</div>
              </>
            ) : (
              <div style={{ fontSize: 8, fontWeight: 800, color: '#E0115F', writingMode: 'vertical-rl' }}>L</div>
            )}
          </div>
        )}

        {/* Body section */}
        <div
          title={`Body: ${totalBodyEnds} ends (${bodyPct.toFixed(1)}%)`}
          style={{
            flex: 1,
            background: 'repeating-linear-gradient(45deg, #F1F1F6, #F1F1F6 3px, #FAFAFA 3px, #FAFAFA 8px)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            position: 'relative',
          }}
        >
          <div style={{
            background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(4px)',
            padding: '4px 10px', borderRadius: 6,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
          }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
              {totalBodyEnds.toLocaleString()}
            </div>
            <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Body ends
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 4, right: 6, fontSize: 8, color: 'var(--text-4)', fontWeight: 500 }}>
            {bodyPct.toFixed(0)}%
          </div>
        </div>

        {/* Right border section */}
        {rightEnabled && rightPct > 0 && (
          <div
            title={`Right Border: ${rightZone.widthEnds} ends (${rightPct.toFixed(1)}%)`}
            style={{
              width: `${rightPct}%`, minWidth: rightPct < 8 ? 24 : undefined,
              background: 'linear-gradient(180deg, #FFF7ED 0%, #FFEDD5 100%)',
              borderLeft: '2px solid #EA580C',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2,
              flexShrink: 0,
            }}
          >
            {rightPct >= 8 ? (
              <>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#C2410C', letterSpacing: '-0.01em' }}>
                  {rightZone.widthEnds}
                </div>
                <div style={{ fontSize: 7, fontWeight: 600, color: '#EA580C', textTransform: 'uppercase', letterSpacing: '0.06em' }}>R ends</div>
              </>
            ) : (
              <div style={{ fontSize: 8, fontWeight: 800, color: '#EA580C', writingMode: 'vertical-rl' }}>R</div>
            )}
          </div>
        )}
      </div>

      {/* Percentage legend */}
      <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
        {leftEnabled && leftPct > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#3B82F6', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>Left {leftPct.toFixed(1)}% · {leftEnds} ends</span>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: '#AEAEB2', flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>Body {bodyPct.toFixed(1)}% · {totalBodyEnds} ends</span>
        </div>
        {rightEnabled && rightPct > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: '#EA580C', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: 'var(--text-3)', fontWeight: 500 }}>Right {rightPct.toFixed(1)}% · {rightEnds} ends</span>
          </div>
        )}
      </div>

      {/* Cross border weft timeline */}
      {crossBorders.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#E0115F', marginBottom: 4 }}>
            Cross Borders (weft direction)
          </div>
          <div style={{ display: 'flex', height: 16, background: '#F0F0F5', borderRadius: 5, overflow: 'hidden', position: 'relative' }}>
            {crossBorders.map((cb, i) => {
              const tot = crossBorders.reduce((s, c) => s + c.lengthPicks, 0) + 200
              return (
                <div key={cb.id} style={{
                  position: 'absolute',
                  left: `${(cb.startPickIndex / tot) * 100}%`,
                  width: `${(cb.lengthPicks / tot) * 100}%`,
                  height: '100%', background: '#E0115F', opacity: 0.75,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }} title={`CB ${i + 1}: picks ${cb.startPickIndex}–${cb.startPickIndex + cb.lengthPicks}`}>
                  <div style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>P{i + 1}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Compiled output section ──────────────────────────────────────────────────
function CompiledOutputSection({ output }: { output: CompiledBorderOutput }) {
  const [view, setView] = useState<'body' | 'border' | 'draft' | 'pilot'>('body')
  const tabs: { id: typeof view; label: string }[] = [
    { id: 'body', label: '⬛ Body' },
    { id: 'border', label: '🟣 Border' },
    { id: 'draft', label: '📐 Draft' },
    { id: 'pilot', label: '🔀 Pilot' },
  ]
  return (
    <div style={{ marginTop: 16 }}>
      <SectionTitle>Compiled Output</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 12 }}>
        {[
          { label: 'Total Ends', value: output.totalEnds },
          { label: 'LCM Repeat', value: output.lcmRepeat },
          { label: 'Total Picks', value: output.totalPicks },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, padding: '7px 9px' }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {label}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#166534', letterSpacing: '-0.02em' }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.05)', padding: 3,
        borderRadius: 9, marginBottom: 11, overflowX: 'auto' }}>
        {tabs.map(t => {
          const disabled = t.id === 'border' && !output.borderLiftingPlan.length
          return (
            <button key={t.id} onClick={() => !disabled && setView(t.id)} disabled={disabled}
              style={{
                padding: '4px 10px', fontSize: 10.5,
                fontWeight: view === t.id ? 700 : 500, borderRadius: 6, border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: view === t.id ? '#fff' : 'transparent',
                color: disabled ? 'var(--text-4)' : view === t.id ? 'var(--text-1)' : 'var(--text-3)',
                boxShadow: view === t.id ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
              {t.label}
            </button>
          )
        })}
      </div>

      {view === 'body' && (
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 7 }}>
            Body Lifting Plan — {output.bodyLiftingPlan.length} picks × {output.totalShaftsUsed} shafts
          </div>
          <LiftingPlanGrid plan={output.bodyLiftingPlan} />
        </div>
      )}
      {view === 'border' && output.borderLiftingPlan.length > 0 && (
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 7 }}>
            Cross Border Lifting Plan — {output.borderLiftingPlan.length} picks × {output.totalShaftsUsed} shafts
          </div>
          <LiftingPlanGrid plan={output.borderLiftingPlan} maxRows={24} />
        </div>
      )}
      {view === 'draft' && (
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 7 }}>
            Draft Array — {output.draftArray.length} ends → {output.totalShaftsUsed} shafts
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.7,
            padding: '9px 11px', background: 'var(--bg)', borderRadius: 9,
            border: '1px solid var(--border-light)', overflowX: 'auto', maxHeight: 200, overflowY: 'auto',
          }}>
            {output.draftArray.map((s, i) => (
              <span key={i} style={{
                display: 'inline-block', width: 22, textAlign: 'center',
                color: ['#E0115F', '#34C759', '#FF3B30', '#E0115F', '#E0115F', '#E0115F'][s % 6],
                fontWeight: 700,
              }}>
                {s + 1}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 5 }}>
            Color by shaft — same color = same shaft (amalgamated)
          </div>
        </div>
      )}
      {view === 'pilot' && (
        <div>
          <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginBottom: 7 }}>
            Pilot Sequence — Dobby cylinder switching
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {output.pilotSequence.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 9,
                background: entry.cylinder === 'A' ? '#EFF6FF' : '#FFF1F0',
                border: `1px solid ${entry.cylinder === 'A' ? '#BFDBFE' : '#FCA5A5'}`,
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: entry.cylinder === 'A' ? '#E0115F' : '#E0115F',
                  color: '#fff', fontSize: 11, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{entry.cylinder}</div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-1)' }}>
                    Cyl {entry.cylinder} — {entry.cylinder === 'A' ? 'Body' : 'Cross Border'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
                    Pick {entry.pick} → {entry.pick + entry.loops - 1} ({entry.loops} picks)
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-4)', marginTop: 8, padding: '6px 10px',
            background: '#FFFBEB', borderRadius: 7, border: '1px solid #FDE68A' }}>
            💡 Cyl A = body loop. Cyl B = cross border/pallu. Pilot tells dobby when to switch.
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORTED COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function BorderForm() {
  // ── Read constraints FROM the store (no duplicate controls) ──────────────
  const shaftCount        = useDesignStore(s => s.shaftCount)      // total loom shafts
  const loom              = useDesignStore(s => s.loom)
  const calcOutputs       = useDesignStore(s => s.calcOutputs)
  const setBorderCompiled = useDesignStore(s => s.setBorderCompiled)

  // Derive loop type from loom dobby_type (mechanical = cam, else dobby)
  const loopType = loom?.dobby_type === 'mechanical' ? 'cam' : 'dobby'

  // Total warp ends from calc (EPI × cloth width from Loom tab)
  const totalWarpEnds = calcOutputs?.total_warp_ends ?? 2640

  // ── Local border zone state ───────────────────────────────────────────────
  const [leftEnabled,  setLeftEnabled]  = useState(false)
  const [rightEnabled, setRightEnabled] = useState(false)
  const [loopBodyPicks, setLoopBodyPicks] = useState(100)

  const [leftZone, setLeftZone] = useState<Zone>({
    id: 'left', weaveMatrix: WEAVE_PRESETS.plain.matrix, widthEnds: 100,
  })
  const [rightZone, setRightZone] = useState<Zone>({
    id: 'right', weaveMatrix: WEAVE_PRESETS.plain.matrix, widthEnds: 100,
  })
  const [crossBorders, setCrossBorders] = useState<CrossBorder[]>([])
  const [compiled, setCompiled] = useState<CompiledBorderOutput | null>(null)

  // Body ends = total warp ends − border ends (borders eat into the body width)
  const borderEndCount = (leftEnabled ? leftZone.widthEnds : 0) + (rightEnabled ? rightZone.widthEnds : 0)
  const bodyEnds = Math.max(0, totalWarpEnds - borderEndCount)

  // Body zone is a fixed proxy — the actual weave comes from Warp/Weft/Loom tabs
  const bodyZone: Zone = useMemo(() => ({
    id: 'body',
    weaveMatrix: WEAVE_PRESETS.twill_2_2.matrix,
    widthEnds: bodyEnds,
  }), [bodyEnds])

  // Live validation (use shaftCount from store as maxShafts)
  const liveValidation = useMemo(() => validateDesign({
    leftBorder:  leftEnabled  ? leftZone  : null,
    body:        bodyZone,
    rightBorder: rightEnabled ? rightZone : null,
    crossBorders, maxShafts: shaftCount, loopBodyPicks, loopType,
  }), [leftEnabled, rightEnabled, leftZone, bodyZone, rightZone, crossBorders, shaftCount, loopBodyPicks, loopType])

  // Live LCM
  const liveLCM = useMemo(() => {
    const vals = [
      ...(leftEnabled  ? [leftZone.weaveMatrix.length]  : []),
      bodyZone.weaveMatrix.length,
      ...(rightEnabled ? [rightZone.weaveMatrix.length] : []),
    ].filter(v => v > 0)
    return computeLCM(vals.length ? vals : [1])
  }, [leftEnabled, rightEnabled, leftZone, bodyZone, rightZone])

  // Estimated shaft usage (for live shaft budget)
  const estimatedShafts = useMemo(() => {
    try {
      const out = compileBorderDesign({
        leftBorder:  leftEnabled  ? leftZone  : null,
        body:        bodyZone,
        rightBorder: rightEnabled ? rightZone : null,
        crossBorders: [], maxShafts: 9999, loopBodyPicks,
      })
      return out.totalShaftsUsed
    } catch { return 0 }
  }, [leftEnabled, rightEnabled, leftZone, bodyZone, rightZone, loopBodyPicks])

  const handleCompile = useCallback(() => {
    try {
      const out = compileBorderDesign({
        leftBorder:  leftEnabled  ? leftZone  : null,
        body:        bodyZone,
        rightBorder: rightEnabled ? rightZone : null,
        crossBorders, maxShafts: shaftCount, loopBodyPicks,
      })
      setCompiled(out)
      // ⬛ Push compiled constraints into the global store so
      // CalcPanel and PegPlanEditor can react to them
      setBorderCompiled(out.totalShaftsUsed, borderEndCount)
    } catch (e) { console.error(e) }
  }, [leftEnabled, rightEnabled, leftZone, bodyZone, rightZone,
      crossBorders, shaftCount, loopBodyPicks, setBorderCompiled, borderEndCount])

  const hasErrors = liveValidation.some(e => e.severity === 'error')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Panel header */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 3 }}>
          Border Design
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Zone-based borders · LCM sync · Shaft budget enforced from Loom tab
        </p>
      </div>

      {/* ── Loom type info (read-only from Loom tab) ─────────────────────── */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px',
          background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>Loop Type</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', textTransform: 'capitalize' }}>
            {loopType}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-4)' }}>← Loom tab</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px',
          background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>Shafts</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{shaftCount}</div>
          <div style={{ fontSize: 10, color: 'var(--text-4)' }}>← Peg Plan</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 11px',
          background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
            textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Ends</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)' }}>{totalWarpEnds}</div>
          <div style={{ fontSize: 10, color: 'var(--text-4)' }}>← Loom tab</div>
        </div>
      </div>

      {/* ── Shaft budget visualiser ──────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <SectionTitle>Shaft Budget</SectionTitle>
        <ShaftBudget borderShafts={estimatedShafts} totalShafts={shaftCount} />
        <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
          <div style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99,
            background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 600 }}>
            LCM = {liveLCM} picks
          </div>
          {borderEndCount > 0 && (
            <div style={{ fontSize: 11, padding: '3px 9px', borderRadius: 99,
              background: 'rgba(234,88,12,0.1)', color: '#C2410C', fontWeight: 600 }}>
              Body uses {bodyEnds} ends (−{borderEndCount} border)
            </div>
          )}
        </div>
      </div>

      {/* ── Body loop picks (only relevant if cross borders exist) ────────── */}
      {crossBorders.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionTitle>Body Loop</SectionTitle>
          <div>
            <FormLabel>Body Loop Picks</FormLabel>
            <input type="number" min={1} value={loopBodyPicks}
              onChange={e => setLoopBodyPicks(parseInt(e.target.value) || 100)} />
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 5 }}>
              How many body picks before switching to cross border cylinder
            </div>
          </div>
        </div>
      )}

      {/* ── Warp layout preview ──────────────────────────────────────────── */}
      <FabricLayoutBar
        leftEnabled={leftEnabled} rightEnabled={rightEnabled}
        leftZone={leftZone} rightZone={rightZone}
        totalBodyEnds={bodyEnds} crossBorders={crossBorders}
      />

      {/* ── Border zones ─────────────────────────────────────────────────── */}
      <ParamGroup title="Border Zones">
        <BorderZoneEditor label="Left Border" accent="#E0115F"
          zone={leftZone} enabled={leftEnabled}
          onToggle={() => setLeftEnabled(v => !v)} onUpdate={setLeftZone} />
        <BorderZoneEditor label="Right Border" accent="#EA580C"
          zone={rightZone} enabled={rightEnabled}
          onToggle={() => setRightEnabled(v => !v)} onUpdate={setRightZone} />
      </ParamGroup>

      {/* ── Cross borders ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <CrossBorderEditor crossBorders={crossBorders} onChange={setCrossBorders} />
      </div>

      {/* ── Validation ───────────────────────────────────────────────────── */}
      <ValidationBadge errors={liveValidation} />

      {/* ── Compile ──────────────────────────────────────────────────────── */}
      <button onClick={handleCompile} disabled={hasErrors}
        className={hasErrors ? 'btn-secondary' : 'btn-primary'}
        style={{ width: '100%', height: 42, justifyContent: 'center',
          fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em',
          opacity: hasErrors ? 0.6 : 1, marginBottom: 4 }}>
        {hasErrors ? '⚠ Fix Errors to Compile' : '⚡ Compile → Updates Calcs & Peg Plan'}
      </button>

      {compiled && compiled.totalShaftsUsed > 0 && (
        <CompiledOutputSection output={compiled} />
      )}
    </div>
  )
}
