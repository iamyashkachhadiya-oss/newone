'use client'

import { use, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useDesignStore } from '@/lib/store/designStore'
import IdentityForm from '@/components/design/IdentityForm'
import WarpForm from '@/components/design/WarpForm'
import WarpSystemForm from '@/components/design/WarpSystemForm'
import WeftForm from '@/components/design/WeftForm'
import LoomForm from '@/components/design/LoomForm'
import CalcPanel from '@/components/design/CalcPanel'

import SimulationPanel from '@/components/design/SimulationPanel'
import PegPlanEditor from '@/components/design/PegPlanEditor'
import BorderForm from '@/components/design/BorderForm'
import VariantsPanel from '@/components/design/VariantsPanel'
import SimulationPreview from '@/components/outputs/SimulationExport'

type DesignTab = 'Identity' | 'Warp' | 'WarpSystem' | 'Weft' | 'Loom' | 'Border' | 'AI'

export default function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<DesignTab>('Identity')
  const store = useDesignStore()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load design on mount
  useEffect(() => {
    store.loadFromSupabase(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Auto-save with 2s debounce when isDirty
  useEffect(() => {
    if (!store.isDirty) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      store.saveToSupabase()
    }, 2000)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.isDirty, store.identity, store.warp, store.weftSystem, store.loom, store.pegPlanText])

  const handlePegPlanChange = useCallback((text: string, matrix: number[][]) => {
    store.setPegPlan(text, matrix)
  }, [store])

  const handleSwitchDesign = useCallback((designId: string) => {
    router.push(`/design/${designId}`)
  }, [router])

  const tabs: DesignTab[] = ['Identity', 'Warp', 'WarpSystem', 'Weft', 'Loom', 'Border', 'AI']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 52, borderBottom: '1px solid var(--border)',
        background: 'var(--surface)', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-2)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 4,
              fontFamily: 'var(--font-body)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Back
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <img
            src="/logo.png"
            alt="FabricaAI Logo"
            style={{ width: 28, height: 28, display: 'block', objectFit: 'cover', borderRadius: 6 }}
          />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
              {store.identity.design_name || 'Untitled Design'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-3)' }}>
              {store.identity.design_number}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {store.isDirty && (
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
              {store.isSaving ? 'Saving…' : 'Unsaved changes'}
            </span>
          )}
          <button
            onClick={() => store.saveToSupabase()}
            className="btn-secondary"
            style={{ fontSize: 12 }}
          >
            Save
          </button>
          <PDFButton />
        </div>
      </header>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel — Forms */}
        <div style={{
          width: 420, flexShrink: 0, borderRight: '1px solid var(--border)',
          display: 'flex', flexDirection: 'column', background: 'var(--surface)',
        }}>
          {/* Tabs */}
          <div className="tab-bar" style={{ padding: '0 16px', flexShrink: 0 }}>
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'WarpSystem' ? 'Warp+' : tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {activeTab === 'Identity' && <IdentityForm />}
            {activeTab === 'Warp' && <WarpForm />}
            {activeTab === 'WarpSystem' && <WarpSystemForm />}
            {activeTab === 'Weft' && <WeftForm />}
            {activeTab === 'Loom' && <LoomForm />}
            {activeTab === 'Border' && <BorderForm />}
            {activeTab === 'AI' && <SimulationPanel />}
          </div>
        </div>

        {/* Center — Canvas + Variants */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Variants Panel */}
          {store.draftId && (
            <div className="card">
              <VariantsPanel
                draftId={store.draftId}
                currentDesignId={id}
                shaftCount={16}
                onSwitchDesign={handleSwitchDesign}
              />
            </div>
          )}

          {/* Peg Plan Visual (large view) - Conditional Visibility */}
          {(activeTab === 'Identity' || activeTab === 'Weft') && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="section-header" style={{ marginBottom: 0 }}>Peg Plan — Sequence Editor</div>
              </div>
              <PegPlanEditor
                shaftCount={16}
                onChange={handlePegPlanChange}
                initialText={store.pegPlanText}
              />
            </div>
          )}

          {/* Border Center Panel — shows live shaft constraint state */}
          {activeTab === 'Border' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}>

              {/* Shaft Budget Summary — always visible */}
              <div className="card">
                <div className="section-header">Shaft Budget — Live Constraint</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                  {/* Budget bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>
                        Total loom shafts: <strong style={{ color: 'var(--text-1)' }}>{store.shaftCount}</strong>
                      </span>
                      {store.borderShaftsUsed > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 600,
                          color: store.borderShaftsUsed > store.shaftCount ? 'var(--red)' : '#C2410C' }}>
                          Border reserved: {store.borderShaftsUsed}
                        </span>
                      )}
                    </div>
                    <div style={{ height: 10, borderRadius: 5, overflow: 'hidden',
                      background: 'rgba(0,0,0,0.07)', display: 'flex' }}>
                      {store.borderShaftsUsed > 0 && (
                        <div style={{
                          width: `${Math.min((store.borderShaftsUsed / store.shaftCount) * 100, 100)}%`,
                          background: store.borderShaftsUsed > store.shaftCount ? 'var(--red)' : '#EA580C',
                          transition: 'width 0.4s',
                        }} />
                      )}
                      <div style={{ flex: 1, background: '#E0115F', opacity: 0.25 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                      <span style={{ fontSize: 11, color: '#EA580C', fontWeight: 600 }}>
                        🧵 Border: {store.borderShaftsUsed} shafts
                      </span>
                      <span style={{ fontSize: 11,
                        color: store.borderShaftsUsed > store.shaftCount ? 'var(--red)' : 'var(--accent)',
                        fontWeight: 600 }}>
                        ⬛ Body budget: {Math.max(0, store.shaftCount - store.borderShaftsUsed)} shafts
                      </span>
                    </div>
                  </div>

                  {/* Constraint cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { label: 'Total Shafts', value: store.shaftCount, color: 'var(--text-1)', bg: 'var(--bg)' },
                      { label: 'Border Reserved', value: store.borderShaftsUsed, color: '#C2410C', bg: '#FFF7ED' },
                      { label: 'Body Budget', value: Math.max(0, store.shaftCount - store.borderShaftsUsed),
                        color: store.borderShaftsUsed > store.shaftCount ? 'var(--red)' : 'var(--accent)',
                        bg: store.borderShaftsUsed > store.shaftCount ? '#FEF2F2' : 'rgba(224,17,95,0.06)' },
                    ].map(({ label, value, color, bg }) => (
                      <div key={label} style={{ background: bg, border: '1px solid var(--border-light)',
                        borderRadius: 12, padding: '12px 14px' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                          textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                          {label}
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 800, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Warnings */}
                  {store.borderShaftsUsed > store.shaftCount && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2',
                      border: '1px solid #FCA5A5', fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>
                      ❌ Border requires {store.borderShaftsUsed} shafts but loom only has {store.shaftCount}.
                      Go to Peg Plan and increase shaft count, or simplify border weave patterns.
                    </div>
                  )}
                  {store.borderShaftsUsed > 0 && store.borderShaftsUsed <= store.shaftCount && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: '#F0FDF4',
                      border: '1px solid #BBF7D0', fontSize: 12, color: '#166534' }}>
                      ✓ Body peg plan must use ≤ <strong>{Math.max(0, store.shaftCount - store.borderShaftsUsed)} shafts</strong> —
                      shafts {store.borderShaftsUsed + 1}–{store.shaftCount} are reserved by the border.
                    </div>
                  )}
                  {store.borderShaftsUsed === 0 && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.03)',
                      border: '1px solid var(--border-light)', fontSize: 12, color: 'var(--text-3)' }}>
                      Configure border zones in the left panel, then click <strong>Compile</strong> to see the shaft budget split.
                    </div>
                  )}
                </div>
              </div>

              {/* Warp ends split — only after compilation */}
              {store.borderEnds > 0 && store.calcOutputs && (
                <div className="card">
                  <div className="section-header">Warp Ends Distribution</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* Visual bar */}
                    <div>
                      <div style={{ display: 'flex', height: 40, borderRadius: 10, overflow: 'hidden',
                        border: '1px solid var(--border-light)' }}>
                        <div style={{
                          width: `${(store.borderEnds / 2 / store.calcOutputs.total_warp_ends) * 100}%`,
                          background: '#EFF6FF', borderRight: '2px solid #E0115F',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 0,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#E0115F', whiteSpace: 'nowrap',
                            overflow: 'hidden', padding: '0 4px' }}>
                            L
                          </div>
                        </div>
                        <div style={{ flex: 1, background: 'repeating-linear-gradient(45deg, #F0F0F5, #F0F0F5 3px, #fff 3px, #fff 7px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
                            background: 'rgba(255,255,255,0.85)', padding: '2px 8px', borderRadius: 4 }}>
                            Body {(store.calcOutputs.total_warp_ends - store.borderEnds).toLocaleString()} ends
                          </div>
                        </div>
                        <div style={{
                          width: `${(store.borderEnds / 2 / store.calcOutputs.total_warp_ends) * 100}%`,
                          background: '#FFF7ED', borderLeft: '2px solid #EA580C',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 0,
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#EA580C', whiteSpace: 'nowrap',
                            overflow: 'hidden', padding: '0 4px' }}>
                            R
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                      {[
                        { label: 'Total Ends', value: store.calcOutputs.total_warp_ends.toLocaleString(), color: 'var(--text-1)', bg: 'var(--bg)' },
                        { label: 'Border Ends', value: store.borderEnds.toLocaleString(), color: '#C2410C', bg: '#FFF7ED' },
                        { label: 'Body Ends', value: (store.calcOutputs.total_warp_ends - store.borderEnds).toLocaleString(),
                          color: 'var(--accent)', bg: 'rgba(224,17,95,0.06)' },
                      ].map(({ label, value, color, bg }) => (
                        <div key={label} style={{ background: bg, border: '1px solid var(--border-light)',
                          borderRadius: 10, padding: '9px 11px' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-3)',
                            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
                            {label}
                          </div>
                          <div style={{ fontSize: 18, fontWeight: 800, color, letterSpacing: '-0.02em' }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Simulation Preview */}
          <div className="card">
            <div className="section-header">Fabric Simulation</div>
            <SimulationPreview
              matrix={store.pegPlanMatrix}
              warpColor={store.warp?.colour_code || '#1B1F3B'}
              weftColor={store.weftSystem.yarns[0]?.colour_hex || '#E8A838'}
              designName={store.identity.design_name || 'design'}
            />
          </div>



          {/* Fabric Output Simulation Engine */}
          <div className="card">
            <div className="section-header">Fabric Output Simulation Engine</div>
            <SimulationPanel />
          </div>
        </div>

        {/* Right — CalcPanel */}
        <div style={{
          borderLeft: '1px solid var(--border)',
          background: 'var(--surface)',
          flexShrink: 0,
        }}>
          <CalcPanel />
        </div>
      </div>
    </div>
  )
}

function PDFButton() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  return (
    <button
      onClick={() => {
        // Dynamic import for PDF to avoid SSR issues
        import('@/components/outputs/PDFExport').then((mod) => {
          mod.downloadPDF()
        })
      }}
      className="btn-accent"
      style={{ fontSize: 12, height: 36, padding: '0 16px' }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      Download PDF
    </button>
  )
}
