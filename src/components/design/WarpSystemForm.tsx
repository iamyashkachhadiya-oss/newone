'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import type { WarpYarn, CountSystem } from '@/lib/types'
import ColorPickerPopup from '../common/ColorPickerPopup'

function ALabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5, display: 'block', letterSpacing: '-0.005em' }}>
      {children}
    </label>
  )
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <ALabel>{label}</ALabel>
      <div style={{
        display: 'flex', height: 44, // Prompt 13: 44px touch targets
        border: '1px solid var(--border)',
        borderRadius: 12, overflow: 'hidden',
        background: '#FAFAFA',
      }}>
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          style={{ width: 44, background: 'rgba(0,0,0,0.04)', border: 'none', borderRight: '1px solid var(--border-light)', cursor: 'pointer', fontSize: 18, color: 'var(--text-2)', transition: 'background 0.1s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
        >−</button>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
          {value}
        </div>
        <button
          onClick={() => onChange(value + 1)}
          style={{ width: 44, background: 'rgba(0,0,0,0.04)', border: 'none', borderLeft: '1px solid var(--border-light)', cursor: 'pointer', fontSize: 18, color: 'var(--text-2)', transition: 'background 0.1s' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.04)')}
        >+</button>
      </div>
    </div>
  )
}

function WarpYarnCard({ yarn, index, expanded, onToggle }: {
  yarn: WarpYarn; index: number; expanded: boolean; onToggle: () => void
}) {
  const { updateWarpYarn, recalculate, shaftCount } = useDesignStore()
  const [showPicker, setShowPicker] = useState(false)

  const handleUpdate = (updates: Partial<WarpYarn>) => {
    updateWarpYarn(yarn.id, updates)
    recalculate()
  }

  const seqPositions = [1,3,5,7,2,4,6,8].map(n => n + yarn.sort_order * 2)

  return (
    <div style={{
      border: '1px solid var(--border-light)',
      borderRadius: 14,
      overflow: 'hidden',
      background: 'var(--surface)',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Header */}
      <div
        onClick={onToggle}
        style={{
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: expanded ? '1px solid var(--border-light)' : 'none',
          background: expanded ? 'rgba(0,0,0,0.015)' : 'transparent',
          transition: 'background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            onClick={(e) => { e.stopPropagation(); setShowPicker(true) }}
            style={{
              width: 30, height: 30, borderRadius: 8,
              background: yarn.colour_hex || '#1D1D1F',
              border: '1.5px solid rgba(255,255,255,0.8)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
              cursor: 'pointer', flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '-0.015em' }}>
              Warp {index + 1}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>
              {yarn.material} · {yarn.count_value}{yarn.count_system === 'ne' ? 's' : 'D'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: 'var(--text-2)',
            background: 'rgba(0,0,0,0.05)',
            padding: '3px 9px', borderRadius: 99,
          }}>
            {yarn.epi_share} EPI
          </span>
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-3)' }}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 14, background: 'rgba(0,0,0,0.012)' }}>
          {/* Color */}
          <div>
            <ALabel>Color</ALabel>
            <div
              onClick={() => setShowPicker(true)}
              style={{
                height: 40, display: 'flex', alignItems: 'center', gap: 10,
                border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
                background: '#FAFAFA', padding: '0 10px',
                cursor: 'pointer', transition: 'border-color 0.15s',
              }}
            >
              <div style={{ width: 24, height: 24, borderRadius: 6, background: yarn.colour_hex, border: '1px solid rgba(0,0,0,0.10)' }} />
              <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{yarn.colour_hex}</span>
            </div>
          </div>

          {/* Material + count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <ALabel>Fiber</ALabel>
              <select value={yarn.material} onChange={(e) => handleUpdate({ material: e.target.value as any })}>
                <option value="cotton">Cotton</option>
                <option value="polyester">Polyester</option>
                <option value="viscose">Viscose</option>
                <option value="silk">Silk</option>
              </select>
            </div>
            <div>
              <ALabel>Yarn Count</ALabel>
              <input
                type="text"
                value={yarn.count_value + (yarn.count_system === 'ne' ? 's' : 'D')}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0
                  handleUpdate({ count_value: val })
                }}
              />
            </div>
          </div>

          {/* Steppers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Stepper
              label="Warp Count (EPI)"
              value={yarn.epi_share}
              onChange={(val) => handleUpdate({ epi_share: Math.max(0, val) })}
            />
            <Stepper
              label="Filament Count"
              value={yarn.filament_count || 1}
              onChange={(val) => handleUpdate({ filament_count: Math.max(1, val) })}
            />
          </div>

          {/* Drawing-in Validation (Prompt 8) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <ALabel>Drawing-In Sequence</ALabel>
              <div style={{
                fontSize: 10, fontWeight: 700,
                color: seqPositions.some(p => p > shaftCount) ? 'var(--red)' : 'var(--clr-live)',
                background: seqPositions.some(p => p > shaftCount) ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                padding: '1px 6px', borderRadius: 4,
              }}>
                {seqPositions.some(p => p > shaftCount) ? '⚠ Invalid shaft index' : '✓ Valid'}
              </div>
            </div>
            <input
              type="text"
              readOnly
              value={seqPositions.join(', ')}
              style={{
                background: seqPositions.some(p => p > shaftCount) ? 'rgba(239,68,68,0.04)' : '#FAFAFA',
                borderColor: seqPositions.some(p => p > shaftCount) ? 'var(--red)' : 'var(--border)',
                cursor: 'default',
              }}
            />
            {seqPositions.some(p => p > shaftCount) && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--red)', lineHeight: 1.4 }}>
                Warp cannot be threaded to shaft {Math.max(...seqPositions)} because only {shaftCount} shafts are available. Increase Shafts in Peg Plan.
              </div>
            )}
          </div>
        </div>
      )}

      {showPicker && (
        <ColorPickerPopup
          isOpen={true}
          initialColor={yarn.colour_hex}
          title={`Color — Warp ${index + 1}`}
          onClose={() => setShowPicker(false)}
          onSave={(c) => { handleUpdate({ colour_hex: c }); setShowPicker(false) }}
        />
      )}
    </div>
  )
}

export default function WarpSystemForm() {
  const { warpSystem, addWarpYarn } = useDesignStore()
  const [expandedCard, setExpandedCard] = useState<string | null>(warpSystem.yarns[0]?.id || null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 3 }}>
          Warp Configuration
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Thread system and yarn properties
        </p>
      </div>



      {/* Add warp button */}
      <button
        onClick={addWarpYarn}
        style={{
          width: '100%', height: 42,
          background: 'rgba(224,17,95,0.07)',
          border: '1.5px dashed rgba(224,17,95,0.25)',
          borderRadius: 12, color: 'var(--accent)',
          fontSize: 13, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          cursor: 'pointer', marginBottom: 14,
          transition: 'all 0.15s',
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(224,17,95,0.12)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(224,17,95,0.40)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(224,17,95,0.07)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(224,17,95,0.25)'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Warp Type
      </button>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {warpSystem.yarns.map((yarn, i) => (
          <WarpYarnCard
            key={yarn.id}
            yarn={yarn}
            index={i}
            expanded={expandedCard === yarn.id}
            onToggle={() => setExpandedCard(expandedCard === yarn.id ? null : yarn.id)}
          />
        ))}
      </div>
    </div>
  )
}
