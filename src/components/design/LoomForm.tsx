'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import type { MachineType, DobbyType, ExportFormat, WeaveType } from '@/lib/types'
import { WEAVE_MODIFIERS } from '@/lib/calc/materials'

function FormLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>
      {children}
    </label>
  )
}

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

export default function LoomForm() {
  const loom = useDesignStore((s) => s.loom)
  const updateLoom = useDesignStore((s) => s.updateLoom)
  const recalculate = useDesignStore((s) => s.recalculate)
  const [pneumaticOpen, setPneumaticOpen] = useState(false)

  if (!loom) return null

  const handleChange = (field: string, value: string | number) => {
    updateLoom({ [field]: value })
    recalculate()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 3 }}>
          Machine System
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Calibrate loom physics & output formats
        </p>
      </div>

      <ParamGroup title="Hardware">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <FormLabel>Machine Type</FormLabel>
            <select value={loom.machine_type} onChange={(e) => handleChange('machine_type', e.target.value as MachineType)}>
              <option value="air_jet">Air Jet</option>
              <option value="rapier">Rapier</option>
              <option value="water_jet">Water Jet</option>
              <option value="power_loom">Power Loom</option>
              <option value="projectile">Projectile</option>
            </select>
          </div>
          <div>
            <FormLabel>Dobby Type</FormLabel>
            <select value={loom.dobby_type} onChange={(e) => handleChange('dobby_type', e.target.value as DobbyType)}>
              <option value="mechanical">Mechanical</option>
              <option value="staubli">Stäubli</option>
              <option value="grosse">Grosse</option>
              <option value="picanol">Picanol</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {loom.dobby_type !== 'mechanical' && (
          <div>
            <FormLabel>Output Format</FormLabel>
            <select value={loom.export_format} onChange={(e) => handleChange('export_format', e.target.value as ExportFormat)}>
              <option value=".EP">.EP (Stäubli)</option>
              <option value=".JC5">.JC5 (Electronic)</option>
              <option value=".DES">.DES (Picanol)</option>
              <option value=".WEA">.WEA (Grosse)</option>
              <option value="text">Debug Text</option>
            </select>
          </div>
        )}

        <div>
          <FormLabel>Weave Type</FormLabel>
          <select value={loom.weave_type} onChange={(e) => handleChange('weave_type', e.target.value as WeaveType)}>
            {Object.entries(WEAVE_MODIFIERS).map(([key, mod]) => (
              <option key={key} value={key}>{mod.name}</option>
            ))}
          </select>
          {WEAVE_MODIFIERS[loom.weave_type] && (
            <div style={{
              marginTop: 7, padding: '8px 11px',
              background: 'rgba(224,17,95,0.05)',
              borderRadius: 8,
              fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5,
              border: '1px solid rgba(224,17,95,0.10)',
            }}>
              {WEAVE_MODIFIERS[loom.weave_type].hint}
            </div>
          )}
        </div>
      </ParamGroup>

      <ParamGroup title="Geometry">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <FormLabel>Reed (Stockport)</FormLabel>
            <select value={loom.reed_count_stockport} onChange={(e) => handleChange('reed_count_stockport', parseInt(e.target.value))}>
              {[44,48,52,56,60,64,68,72,76,80,84,88,92,96,100].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <FormLabel>Ends / Dent</FormLabel>
            <select value={loom.ends_per_dent} onChange={(e) => handleChange('ends_per_dent', parseInt(e.target.value))}>
              {[1,2,3,4].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div>
          <FormLabel>Cloth Width (inches)</FormLabel>
          <input type="number" value={loom.cloth_width_inches || ''} onChange={(e) => handleChange('cloth_width_inches', parseFloat(e.target.value) || 0)} />
        </div>
      </ParamGroup>

      <ParamGroup title="Operation">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <FormLabel>Machine RPM</FormLabel>
            <input type="number" value={loom.machine_rpm || ''} onChange={(e) => handleChange('machine_rpm', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <FormLabel>Target PPI</FormLabel>
            <input type="number" value={loom.target_ppi || ''} onChange={(e) => handleChange('target_ppi', parseInt(e.target.value) || 0)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <FormLabel>Warp Crimp %</FormLabel>
            <input type="number" step="0.5" value={loom.warp_crimp_pct || ''} onChange={(e) => handleChange('warp_crimp_pct', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <FormLabel>Weft Crimp %</FormLabel>
            <input type="number" step="0.5" value={loom.weft_crimp_pct || ''} onChange={(e) => handleChange('weft_crimp_pct', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <FormLabel>Wastage %</FormLabel>
            <input type="number" step="0.5" value={loom.wastage_pct || ''} onChange={(e) => handleChange('wastage_pct', parseFloat(e.target.value) || 0)} />
          </div>
          <div>
            <FormLabel>Efficiency %</FormLabel>
            <input type="number" value={loom.loom_efficiency_pct || ''} onChange={(e) => handleChange('loom_efficiency_pct', parseInt(e.target.value) || 0)} />
          </div>
        </div>

        {/* Tension slider — colored zones (Prompt 8) */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <FormLabel>Loom Tension (cN)</FormLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: (loom.loom_tension_cN || 180) < 100 ? 'var(--green)'
                  : (loom.loom_tension_cN || 180) < 250 ? '#EA580C' : 'var(--red)',
                background: (loom.loom_tension_cN || 180) < 100 ? 'rgba(52,199,89,0.10)'
                  : (loom.loom_tension_cN || 180) < 250 ? 'rgba(234,88,12,0.10)' : 'rgba(255,59,48,0.10)',
                borderRadius: 6, padding: '0 7px', lineHeight: '22px',
              }}>
                {loom.loom_tension_cN || 180}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                color: (loom.loom_tension_cN || 180) < 100 ? 'var(--green)'
                  : (loom.loom_tension_cN || 180) < 250 ? '#EA580C' : 'var(--red)',
              }}>
                {(loom.loom_tension_cN || 180) < 100 ? 'Low'
                  : (loom.loom_tension_cN || 180) < 250 ? 'Medium' : 'High'}
              </span>
            </div>
          </div>
          {/* Colored zone track */}
          <div style={{ position: 'relative', marginBottom: 6 }}>
            {/* Gradient track behind the slider */}
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0,
              height: 6, borderRadius: 99, transform: 'translateY(-50%)',
              background: 'linear-gradient(to right, #34C759 0%, #34C759 25%, #FF9500 25%, #FF9500 63%, #FF3B30 63%, #FF3B30 100%)',
              opacity: 0.35, pointerEvents: 'none',
            }} />
            <input
              type="range" min={40} max={400} step={5}
              value={loom.loom_tension_cN || 180}
              onChange={(e) => handleChange('loom_tension_cN', parseInt(e.target.value))}
              style={{ width: '100%', accentColor: (loom.loom_tension_cN || 180) < 100 ? 'var(--green)' : (loom.loom_tension_cN || 180) < 250 ? '#EA580C' : 'var(--red)', margin: '4px 0', position: 'relative', zIndex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-4)', marginTop: 2 }}>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>▔ Low (40–100)</span>
            <span style={{ color: '#EA580C', fontWeight: 600 }}>Medium (100–250)</span>
            <span style={{ color: 'var(--red)', fontWeight: 600 }}>High (250+) ▔</span>
          </div>
        </div>
      </ParamGroup>

      {/* Advanced Air Settings */}
      <div style={{
        border: '1px solid var(--border-light)',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'var(--bg)',
      }}>
        <button
          onClick={() => setPneumaticOpen(!pneumaticOpen)}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)' }}>
            Advanced Air Settings (SV1–SV5)
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: pneumaticOpen ? 'rotate(180deg)' : 'none', transition: '0.2s', color: 'var(--text-3)' }}>
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {pneumaticOpen && (
          <div style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'sv1_psi', label: 'SV1 — Cloth Storage' },
              { key: 'sv2_psi', label: 'SV2 — Beater' },
              { key: 'sv3_psi', label: 'SV3 — Dobby' },
              { key: 'sv4_psi', label: 'SV4 — Air Brake' },
              { key: 'sv5_psi', label: 'SV5 — Accumulator' },
            ].map(({ key, label }) => (
              <div key={key}>
                <FormLabel>{label}</FormLabel>
                <input
                  type="number"
                  value={(loom as unknown as Record<string, number>)[key] || ''}
                  onChange={(e) => handleChange(key, parseInt(e.target.value) || 0)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
