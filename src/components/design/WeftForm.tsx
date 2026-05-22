'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import type { WeftYarn } from '@/lib/types'
import ColorPickerPopup from '../common/ColorPickerPopup'

/* ─── Micro Icons ─────────────────────────────────────────── */
const ChevronDown = ({ open }: { open: boolean }) => (
  <svg
    width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', flexShrink: 0 }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

/* ─── Field Components ────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
      textTransform: 'uppercase', letterSpacing: '0.07em',
      marginBottom: 6,
    }}>
      {children}
    </div>
  )
}

function SegmentedControl({
  value, options, onChange,
}: {
  value: string
  options: { label: string; val: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div style={{
      display: 'flex',
      background: 'rgba(0,0,0,0.05)',
      borderRadius: 9, padding: 3, gap: 2,
    }}>
      {options.map(opt => {
        const active = value === opt.val
        return (
          <button
            key={opt.val}
            onClick={() => onChange(opt.val)}
            style={{
              flex: 1, padding: '5px 0',
              fontSize: 12, fontWeight: active ? 600 : 500,
              color: active ? 'var(--text-1)' : 'var(--text-3)',
              background: active ? 'var(--surface)' : 'transparent',
              border: 'none', borderRadius: 7,
              cursor: 'pointer',
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.10)' : 'none',
              transition: 'all 0.15s ease',
              letterSpacing: '-0.01em',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

function StepperField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{
        display: 'flex', height: 38,
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: 10, overflow: 'hidden',
        background: '#FAFAFA',
      }}>
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          style={{
            width: 38, flexShrink: 0,
            background: 'rgba(0,0,0,0.03)',
            border: 'none', borderRight: '1px solid rgba(0,0,0,0.07)',
            cursor: 'pointer', fontSize: 17, lineHeight: 1,
            color: 'var(--text-2)', transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
        >−</button>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 600, color: 'var(--text-1)',
          letterSpacing: '-0.02em',
        }}>
          {value}
        </div>
        <button
          onClick={() => onChange(value + 1)}
          style={{
            width: 38, flexShrink: 0,
            background: 'rgba(0,0,0,0.03)',
            border: 'none', borderLeft: '1px solid rgba(0,0,0,0.07)',
            cursor: 'pointer', fontSize: 17, lineHeight: 1,
            color: 'var(--text-2)', transition: 'background 0.1s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
        >+</button>
      </div>
    </div>
  )
}

/* ─── Single Yarn Card ────────────────────────────────────── */
function YarnCard({ yarn, isFirst, expanded, onToggle, onRemove }: {
  yarn: WeftYarn
  isFirst: boolean
  expanded: boolean
  onToggle: () => void
  onRemove: () => void
}) {
  const { updateWeftYarn, recalculate } = useDesignStore()
  const [showPicker, setShowPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const set = (updates: Partial<WeftYarn>) => {
    updateWeftYarn(yarn.id, updates)
    recalculate()
  }

  return (
    <div style={{
      borderRadius: 14,
      border: '1px solid var(--border-light)',
      background: 'var(--surface)',
      overflow: 'hidden',
      transition: 'box-shadow 0.15s',
    }}>
      {/* ── Header ───────────────────────────────────────── */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex', alignItems: 'center',
          gap: 11, padding: '12px 14px',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border-light)' : 'none',
          background: expanded ? 'rgba(0,0,0,0.015)' : 'transparent',
          transition: 'background 0.15s',
          userSelect: 'none',
        }}
      >
        {/* Color swatch */}
        <div
          onClick={e => { e.stopPropagation(); setShowPicker(true) }}
          style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: yarn.colour_hex,
            border: '2px solid rgba(255,255,255,0.9)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
            cursor: 'pointer',
          }}
        />

        {/* Label + meta */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: 'var(--text-1)', letterSpacing: '-0.015em',
            display: 'flex', alignItems: 'center', gap: 7,
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {yarn.label}
            </span>
            {isFirst && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: 'var(--green)',
                background: 'rgba(52,199,89,0.10)',
                padding: '2px 6px', borderRadius: 99, flexShrink: 0,
              }}>Ground</span>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
            {yarn.material.charAt(0).toUpperCase() + yarn.material.slice(1)}
            {' · '}
            {yarn.count_value}{yarn.count_system === 'ne' ? 's Ne' : 'D'}
            {' · '}
            {yarn.ppi || 80} PPI
          </div>
        </div>

        <div style={{ color: expanded ? 'var(--accent)' : 'var(--text-4)', flexShrink: 0 }}>
          <ChevronDown open={expanded} />
        </div>
      </div>

      {/* ── Expanded Form ──────────────────────────────── */}
      {expanded && (
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Row 1: Color swatch + Name */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            {/* Color picker row */}
            <div style={{ flex: 1 }}>
              <FieldLabel>Color</FieldLabel>
              <div
                onClick={() => setShowPicker(true)}
                style={{
                  height: 38, display: 'flex', alignItems: 'center', gap: 9,
                  border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
                  background: '#FAFAFA', padding: '0 10px',
                  cursor: 'pointer', transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)')}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                  background: yarn.colour_hex, border: '1px solid rgba(0,0,0,0.10)',
                }} />
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-2)', letterSpacing: '0.02em' }}>
                  {yarn.colour_hex}
                </span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <FieldLabel>Name</FieldLabel>
              <input
                type="text"
                value={yarn.label}
                onChange={e => set({ label: e.target.value })}
                style={{ height: 38 }}
              />
            </div>
          </div>

          {/* Row 2: Fiber + Count system */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <FieldLabel>Fiber</FieldLabel>
              <div style={{ position: 'relative' }}>
                <select
                  value={yarn.material}
                  onChange={e => set({ material: e.target.value as any })}
                  style={{ appearance: 'none', paddingRight: 28, height: 38 }}
                >
                  <option value="polyester">Polyester</option>
                  <option value="cotton">Cotton</option>
                  <option value="viscose">Viscose</option>
                  <option value="zari">Zari</option>
                  <option value="silk">Silk</option>
                </select>
                <svg style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-3)' }}
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <FieldLabel>Count</FieldLabel>
              <div style={{ display: 'flex', gap: 6, height: 38 }}>
                <select
                  value={yarn.count_system}
                  onChange={e => set({ count_system: e.target.value as any })}
                  style={{ width: 68, appearance: 'none', textAlign: 'center', padding: '0 8px', height: 38, flexShrink: 0 }}
                >
                  <option value="ne">Ne</option>
                  <option value="denier">D</option>
                </select>
                <input
                  type="number" min="1"
                  value={yarn.count_value}
                  onChange={e => set({ count_value: parseFloat(e.target.value) || 0 })}
                  style={{ height: 38 }}
                />
              </div>
            </div>
          </div>

          {/* Row 3: PPI Stepper */}
          <StepperField
            label="Picks Per Inch (PPI)"
            value={yarn.ppi || 80}
            onChange={v => set({ ppi: v })}
          />

          {/* Remove */}
          {!isFirst && (
            <div style={{ paddingTop: 6, borderTop: '1px solid var(--border-light)' }}>
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12, fontWeight: 500, color: 'var(--text-4)',
                    cursor: 'pointer', transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
                >
                  <TrashIcon /> Remove yarn
                </button>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(255,59,48,0.06)', padding: '9px 12px',
                  borderRadius: 10, border: '1px solid rgba(255,59,48,0.15)',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)' }}>Remove this yarn?</span>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{ fontSize: 12, fontWeight: 500, padding: '4px 12px', background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 7, cursor: 'pointer', color: 'var(--text-1)' }}
                    >Cancel</button>
                    <button
                      onClick={onRemove}
                      style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', background: 'var(--red)', border: 'none', borderRadius: 7, cursor: 'pointer', color: '#fff' }}
                    >Delete</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Color Picker */}
      {showPicker && (
        <ColorPickerPopup
          isOpen
          initialColor={yarn.colour_hex}
          title="Yarn Color"
          onClose={() => setShowPicker(false)}
          onSave={(c: string) => { set({ colour_hex: c }); setShowPicker(false) }}
        />
      )}
    </div>
  )
}

/* ─── Main WeftForm ───────────────────────────────────────── */
export default function WeftForm() {
  const { weftSystem, addWeftYarn, removeWeftYarn, recalculate } = useDesignStore()
  const [expandedId, setExpandedId] = useState<string | null>(weftSystem.yarns[0]?.id ?? null)

  const handleAdd = () => {
    addWeftYarn()
    setTimeout(() => {
      const latest = useDesignStore.getState().weftSystem.yarns.at(-1)
      if (latest) setExpandedId(latest.id)
    }, 60)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Title ──────────────────────────────────────── */}
      <div style={{ marginBottom: 20 }}>
        <h2 style={{
          fontSize: 17, fontWeight: 700, color: 'var(--text-1)',
          letterSpacing: '-0.02em', marginBottom: 3,
        }}>Weft Yarns</h2>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Configure yarn types and picks per inch
        </p>
      </div>

      {/* ── Yarn Cards ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {weftSystem.yarns.map((yarn, i) => (
          <YarnCard
            key={yarn.id}
            yarn={yarn}
            isFirst={i === 0}
            expanded={expandedId === yarn.id}
            onToggle={() => setExpandedId(expandedId === yarn.id ? null : yarn.id)}
            onRemove={() => {
              removeWeftYarn(yarn.id)
              setExpandedId(null)
              recalculate()
            }}
          />
        ))}
      </div>

      {/* ── Add New Yarn ────────────────────────────────── */}
      <button
        onClick={handleAdd}
        style={{
          marginTop: 12,
          width: '100%', height: 42,
          background: 'rgba(224,17,95,0.06)',
          border: '1.5px dashed rgba(224,17,95,0.22)',
          borderRadius: 12,
          color: 'var(--accent)',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          cursor: 'pointer', letterSpacing: '-0.01em',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = 'rgba(224,17,95,0.11)'
          b.style.borderColor = 'rgba(224,17,95,0.38)'
        }}
        onMouseLeave={e => {
          const b = e.currentTarget as HTMLButtonElement
          b.style.background = 'rgba(224,17,95,0.06)'
          b.style.borderColor = 'rgba(224,17,95,0.22)'
        }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Yarn
      </button>

      {/* ── Summary strip ───────────────────────────────── */}
      {weftSystem.yarns.length > 1 && (
        <div style={{
          marginTop: 16,
          padding: '11px 14px',
          background: 'var(--bg)',
          border: '1px solid var(--border-light)',
          borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 8,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 4 }}>
            Yarns
          </span>
          {weftSystem.yarns.map((y, i) => (
            <div key={y.id} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', background: y.colour_hex,
                boxShadow: `0 0 0 2px ${y.colour_hex}33`,
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 500 }}>
                {String.fromCharCode(65 + i)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
