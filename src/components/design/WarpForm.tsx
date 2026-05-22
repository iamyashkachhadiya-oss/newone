'use client'

import { useDesignStore } from '@/lib/store/designStore'
import type { CountSystem, Material, Luster } from '@/lib/types'
import MaterialSelect from './MaterialSelect'
import ColorPickerPopup from '../common/ColorPickerPopup'
import { useState } from 'react'

export default function WarpForm() {
  const warp = useDesignStore((s) => s.warp)
  const updateWarp = useDesignStore((s) => s.updateWarp)
  const recalculate = useDesignStore((s) => s.recalculate)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  if (!warp) return null

  const handleChange = (field: string, value: string | number) => {
    updateWarp({ [field]: value })
    recalculate()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="section-header">Warp Specification (Tana)</div>

      {/* Count System Toggle */}
      <div>
        <label>Count System</label>
        <div className="pill-group">
          <button
            className={`pill-btn ${warp.count_system === 'denier' ? 'active' : ''}`}
            onClick={() => handleChange('count_system', 'denier')}
          >
            Denier
          </button>
          <button
            className={`pill-btn ${warp.count_system === 'ne' ? 'active' : ''}`}
            onClick={() => handleChange('count_system', 'ne')}
          >
            Ne
          </button>
        </div>
      </div>

      {/* Count Value */}
      <div>
        <label htmlFor="warp-count">
          {warp.count_system === 'denier' ? 'Denier (e.g. 75)' : 'Count Ne (e.g. 40)'}
        </label>
        <input
          id="warp-count"
          type="number"
          value={warp.count_value || ''}
          onChange={(e) => handleChange('count_value', parseFloat(e.target.value) || 0)}
          placeholder={warp.count_system === 'denier' ? '75' : '40'}
        />
      </div>

      {/* Filament Count (only for denier) */}
      {warp.count_system === 'denier' && (
        <div>
          <label htmlFor="warp-filament">Filaments (e.g. 36 for 75/36f)</label>
          <input
            id="warp-filament"
            type="number"
            value={warp.filament_count || ''}
            onChange={(e) => handleChange('filament_count', parseInt(e.target.value) || 0)}
            placeholder="36"
          />
        </div>
      )}

      {/* Material */}
      <div>
        <label htmlFor="warp-material">Warp Material</label>
        <MaterialSelect
          id="warp-material"
          value={warp.material}
          onChange={(v) => handleChange('material', v)}
        />
      </div>

      {/* Luster */}
      <div>
        <label htmlFor="warp-luster">Luster</label>
        <select
          id="warp-luster"
          value={warp.luster}
          onChange={(e) => handleChange('luster', e.target.value as Luster)}
        >
          <option value="bright">Bright</option>
          <option value="semi_dull">Semi-Dull</option>
          <option value="dope_dyed">Dope-Dyed</option>
          <option value="matt">Matt</option>
        </select>
      </div>

      {/* Colour Code */}
      <div>
        <label htmlFor="warp-colour">Colour Code & Swatch</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setIsPickerOpen(true)}
            style={{ 
              width: 36, 
              height: 36, 
              background: warp.colour_hex || '#1B1F3B', 
              border: '1.5px solid var(--border)', 
              borderRadius: 6, 
              cursor: 'pointer',
              padding: 0,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          />
          <input
            id="warp-colour"
            type="text"
            value={warp.colour_code}
            onChange={(e) => handleChange('colour_code', e.target.value)}
            placeholder="Pantone/RAL or colour name"
          />
        </div>
      </div>

      <ColorPickerPopup
        isOpen={isPickerOpen}
        initialColor={warp.colour_hex || '#1B1F3B'}
        title="Warp Color"
        onClose={() => setIsPickerOpen(false)}
        onSave={(color) => {
          handleChange('colour_hex', color)
          setIsPickerOpen(false)
        }}
      />

      {/* Price per Kg */}
      <div>
        <label htmlFor="warp-price">Price per Kg</label>
        <div style={{ position: 'relative' }}>
          <input
            id="warp-price"
            type="number"
            value={warp.price_per_kg || ''}
            onChange={(e) => handleChange('price_per_kg', parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            style={{ paddingLeft: 30 }}
          />
          <span style={{ position: 'absolute', left: 12, top: 12, fontSize: 13, color: 'var(--text-3)' }}>$</span>
        </div>
      </div>
    </div>
  )
}
