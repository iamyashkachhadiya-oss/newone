'use client'

import { MATERIAL_GROUPS, MATERIAL_PHYSICS, CATEGORY_COLORS } from '@/lib/calc/materials'
import type { Material } from '@/lib/types'

interface MaterialSelectProps {
  id?: string
  value: Material
  onChange: (value: Material) => void
  showBadge?: boolean
}

export default function MaterialSelect({ id, value, onChange, showBadge = true }: MaterialSelectProps) {
  const mat = MATERIAL_PHYSICS[value]
  const catColor = mat ? CATEGORY_COLORS[mat.category] : null

  return (
    <div>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as Material)}
      >
        {MATERIAL_GROUPS.map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.items.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      {/* Material info badge */}
      {showBadge && mat && (
        <div style={{
          marginTop: 6,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 8,
          background: catColor ? catColor.bg : 'var(--bg)',
          border: `1px solid ${catColor ? catColor.text + '33' : 'var(--border-light)'}`,
        }}>
          <span style={{
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
            padding: '2px 6px', borderRadius: 4,
            background: catColor ? catColor.bg : 'var(--bg)',
            color: catColor ? catColor.text : 'var(--text-3)',
            border: `1px solid ${catColor ? catColor.text + '55' : 'var(--border)'}`,
            flexShrink: 0, marginTop: 1,
          }}>
            {mat.category}
          </span>
          <span style={{ fontSize: 10, color: catColor ? catColor.text : 'var(--text-3)', lineHeight: 1.5 }}>
            Shrink: {mat.shrink_base}% · Drape: {mat.drape_base} · Stiff: {mat.stiff_base} · Tenacity: {mat.tenacity_base} N/cm
            {mat.felting && <strong style={{ color: '#a32d2d' }}> · ⚠ Felting Risk</strong>}
            {mat.note && <><br /><span style={{ opacity: 0.8 }}>{mat.note}</span></>}
          </span>
        </div>
      )}
    </div>
  )
}
