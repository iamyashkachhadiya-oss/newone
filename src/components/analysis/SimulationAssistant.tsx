'use client'

import React, { useMemo } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import { runEngineeringAnalysis, AnalysisInput } from '@/lib/calc/analysis'

export default function SimulationAssistantUI() {
  const store = useDesignStore()
  const { weftSystem, loom, warp } = store

  // Prepare input for analysis
  const input: AnalysisInput = useMemo(() => {
    const mainYarn = weftSystem.yarns[0]
    return {
      material: {
        id: mainYarn?.material || 'cotton',
        name: mainYarn?.material || 'Cotton',
        category: (mainYarn?.material === 'viscose' || mainYarn?.material === 'tencel') ? 'Regenerated' : 'Natural',
        tenacity_cntex: { min: 22, max: 44 },
        elongation_pct: { min: 5, max: 18 },
        moisture_regain_pct: 8.5,
        shrinkage_base_pct: 3.5,
        drape_base: 70,
        stiffness_base: 30
      },
      weave_type: "satin", // Mock for demo
      density_picks_per_cm: loom?.target_ppi ? Math.round(loom.target_ppi / 2.54) : 28,
      loom_tension_cN: 160,
      yarn_count_Ne: mainYarn?.count_system === 'ne' ? mainYarn.count_value : 40,
      current_outputs: {
        shrinkage_pct: 1.8,
        drape_index: 84,
        stiffness_index: 22,
        strength_Ncm: 67.4
      }
    }
  }, [weftSystem, loom, warp])

  const analysis = useMemo(() => runEngineeringAnalysis(input), [input])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '4px 0' }}>
      {/* ── Fabric Archetype Header ── */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, rgba(232, 168, 56, 0.1) 0%, rgba(232, 168, 56, 0.02) 100%)',
        border: '1.5px solid rgba(232, 168, 56, 0.3)',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
          Identified Fabric Archetype
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary)', margin: '12px 0 8px', letterSpacing: '-0.02em' }}>
          {analysis.fabric_profile.archetype.split(' ').map(s => s[0].toUpperCase() + s.slice(1)).join(' ')}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 280, margin: '0 auto', lineHeight: 1.5 }}>
          {analysis.fabric_profile.description}
        </p>
      </div>

      {/* ── Score Radar (Simplified for UI) ── */}
      <div className="section">
        <div className="section-header" style={{ marginBottom: 16 }}>Output Analysis Radar</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {Object.entries(analysis.fabric_profile.scores).map(([key, value]) => (
            <div key={key} style={{ 
              background: 'var(--bg)', 
              borderRadius: 10, 
              padding: 12, 
              border: '1px solid var(--border-light)'
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 4 }}>
                {key.replace(/_/g, ' ')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--primary)' }}>{value}</span>
                <div style={{ flex: 1, height: 4, background: '#E2E2E2', borderRadius: 2 }}>
                  <div style={{ width: `${value}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Smart Alerts Feed ── */}
      <div className="section">
        <div className="section-header" style={{ marginBottom: 12 }}>AI Engineering Intelligence</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {analysis.alerts.map((alert, i) => (
            <div key={i} style={{ 
              padding: '12px 16px', 
              borderRadius: 10, 
              background: alert.severity === 'critical' ? '#FFF5F5' : alert.severity === 'warning' ? '#FFF9F0' : '#F0F9FF',
              border: `1px solid ${alert.severity === 'critical' ? '#FEB2B2' : alert.severity === 'warning' ? '#FBD38D' : '#BEE3F8'}`,
              display: 'flex', gap: 12
            }}>
              <div style={{ color: alert.severity === 'critical' ? '#C53030' : alert.severity === 'warning' ? '#B7791F' : '#3182CE', marginTop: 2 }}>
                {alert.severity === 'critical' ? (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/></svg>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>{alert.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', fontStyle: 'italic', marginTop: 2 }}>Recommended: {alert.fix}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Advanced Recommendations ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Yarn Analysis</div>
          <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4 }}>{analysis.yarn_count_analysis.assessment}</div>
          <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 600, marginTop: 8 }}>Optimal Ne: {analysis.yarn_count_analysis.optimal_Ne_range.join(' - ')}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>Finishing Path</div>
          {analysis.finishing_recommendations.slice(0,1).map((f, i) => (
            <div key={i}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{f.treatment}</div>
              <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
                ΔShrink: {f.delta_shrinkage} <br/>
                ΔDrape: {f.delta_drape}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Material Substitution ── */}
      {analysis.material_substitution && (
        <div style={{ 
          background: 'var(--primary)', 
          color: 'white', 
          borderRadius: 12, 
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase' }}>Sub-optimal Strength detected</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>Switch to {analysis.material_substitution.suggested_material_id.replace(/-/g, ' ')}?</div>
            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>{analysis.material_substitution.reason}</div>
          </div>
          <button className="btn-accent" style={{ height: 32, fontSize: 11, padding: '0 12px', border: 'none' }}>Swap Material</button>
        </div>
      )}
    </div>
  )
}
