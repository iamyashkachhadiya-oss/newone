'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useDesignStore } from '@/lib/store/designStore'
import { textToMatrix } from '@/lib/pegplan/parser'
import IdentityForm from '@/components/design/IdentityForm'
import WarpSystemForm from '@/components/design/WarpSystemForm'
import WeftForm from '@/components/design/WeftForm'
import LoomForm from '@/components/design/LoomForm'
import CalcPanel from '@/components/design/CalcPanel'
import PegPlanEditor from '@/components/design/PegPlanEditor'
import SimulationExport from '@/components/outputs/SimulationExport'
import DesignLibrary from '@/components/design/DesignLibrary'
import BorderForm from '@/components/design/BorderForm'
import DraftAnalysisTool from '@/components/analysis/DraftAnalysisTool'
import AIDesignStudio from '@/components/design/AIDesignStudio'
import WeftSequencePlan from '@/components/design/WeftSequencePlan'
import AuthNotch from '@/components/auth/AuthNotch'
import LoginModal, { type FabricUser } from '@/components/auth/LoginModal'

type DemoTab = 'Identity' | 'Warp' | 'Weft' | 'Loom' | 'Border'

const NAV_TABS: { id: DemoTab; label: string }[] = [
  { id: 'Identity', label: 'Identity' },
  { id: 'Warp',     label: 'Warp'     },
  { id: 'Weft',     label: 'Weft'     },
  { id: 'Loom',     label: 'Loom'     },
  { id: 'Border',   label: 'Border'   },
]

type CompileState = 'idle' | 'compiling' | 'compiled'
type CenterMode   = 'predefined' | 'design-library' | 'ai-studio'

const ADMIN_PIN = 'yash2025'

export default function DemoPage() {
  const [activeTab, setActiveTab]         = useState<DemoTab>('Weft')
  const [centerMode, setCenterMode]       = useState<CenterMode>('predefined')
  const [initialized, setInitialized]     = useState(false)
  const [isMobileMenuOpen, setMobileMenu] = useState(false)

  /* ── Admin check (sessionStorage set by /admin page) ── */
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    setIsAdmin(sessionStorage.getItem('admin_authed') === ADMIN_PIN)
  }, [])

  /* ── Auth state ───────────────────────────────────────── */
  const [user, setUser]             = useState<FabricUser | null>(null)
  const [showLogin, setShowLogin]   = useState(false)
  const [showToast, setShowToast]   = useState(false)

  /* ── Compile state ──────────────────────────────────────────── */
  const [compileState, setCompileState]   = useState<CompileState>('idle')
  const [lastCompiledAt, setLastCompiled] = useState<Date | null>(null)
  const [changeCount, setChangeCount]     = useState(0)
  const prevRef = useRef<Record<string, unknown>>({})

  const store = useDesignStore()

  /* ── Selectors for completion & change tracking ─────────────── */
  const identity        = useDesignStore(s => s.identity)
  const warp            = useDesignStore(s => s.warp)
  const weftSystem      = useDesignStore(s => s.weftSystem)
  const loom            = useDesignStore(s => s.loom)
  const borderShafts    = useDesignStore(s => s.borderShaftsUsed)
  const pegText         = useDesignStore(s => s.pegPlanText)

  /* Tab completion rules */
  const tabCompletion: Record<DemoTab, boolean> = {
    Identity: !!(identity.design_name && identity.design_number),
    Warp:     !!(warp?.material && warp?.count_value),
    Weft:     weftSystem.yarns.length > 0 && !!(weftSystem.yarns[0]?.material && weftSystem.yarns[0]?.count_value),
    Loom:     !!(loom?.machine_type && loom?.target_ppi && loom?.machine_rpm),
    Border:   borderShafts > 0,
  }

  /* Track field changes → increment pending counter */
  useEffect(() => {
    if (!initialized) return
    const key = JSON.stringify({ warp, weftSystem, loom, identity, pegText })
    if (prevRef.current.key === key) return
    prevRef.current.key = key
    setChangeCount(c => c + 1)
    if (compileState === 'compiled') setCompileState('idle')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [warp, weftSystem, loom, identity, pegText])

  /* ── Init demo state ────────────────────────────────────────── */
  useEffect(() => {
    if (initialized) return
    const { updateIdentity, setPegPlan, recalculate } = useDesignStore.getState()
    updateIdentity({ design_name: 'Pattu Dobby Saree', design_number: 'SD-2025-001' })
    const defaultPegText = `1-->1,3,5,7,9,11,13,15\n2-->2,4,6,8,10,12,14,16\n3-->1,3,5,7,9,11,13,15\n4-->2,4,6,8,10,12,14,16\n5-->1,2,5,6,9,10,13,14\n6-->3,4,7,8,11,12,15,16\n7-->1,2,5,6,9,10,13,14\n8-->3,4,7,8,11,12,15,16`
    setPegPlan(defaultPegText, textToMatrix(defaultPegText, 16))
    recalculate()
    setInitialized(true)
    setLastCompiled(new Date())
    setCompileState('compiled')
    prevRef.current.key = JSON.stringify({ warp, weftSystem, loom, identity, pegText: defaultPegText })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Load persisted user + show first-visit toast ──────────── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fabricai_user')
      if (stored) { setUser(JSON.parse(stored)); return }
    } catch {}
    // Show welcome toast once per browser session
    const shown = sessionStorage.getItem('fabricai_toast_shown')
    if (!shown) {
      const t = setTimeout(() => {
        setShowToast(true)
        sessionStorage.setItem('fabricai_toast_shown', '1')
      }, 2200)
      return () => clearTimeout(t)
    }
  }, [])

  /* ── Keyboard shortcut: Cmd/Ctrl+Enter = Compile ────────────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleCompile()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compileState])

  /* ── Compile action ─────────────────────────────────────────── */
  const handleCompile = async () => {
    if (compileState === 'compiling') return
    setCompileState('compiling')
    await new Promise(r => setTimeout(r, 500))
    useDesignStore.getState().recalculate()
    setCompileState('compiled')
    setLastCompiled(new Date())
    setChangeCount(0)
  }

  const handlePegPlanChange = useCallback((text: string, matrix: number[][]) => {
    store.setPegPlan(text, matrix)
    store.recalculate()
  }, [store])

  const shaftCount    = store.shaftCount
  const SHAFT_OPTIONS = [4, 8, 12, 16, 24]

  /* ── Compile button appearance ──────────────────────────────── */
  const compileBtnStyle = (): React.CSSProperties => {
    if (compileState === 'compiled' && changeCount === 0) return {
      height: 36, padding: '0 22px', fontSize: 12.5, fontWeight: 700,
      background: 'transparent', color: 'var(--clr-live)',
      border: '1.5px solid rgba(34,197,94,0.4)', borderRadius: 10,
      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7,
      letterSpacing: '-0.01em', transition: 'all 0.2s ease',
    }
    return {
      height: 36, padding: '0 22px', fontSize: 12.5, fontWeight: 700,
      background: compileState === 'compiling' ? 'rgba(224,17,95,0.75)' : '#E0115F',
      color: '#fff', border: 'none', borderRadius: 10,
      cursor: compileState === 'compiling' ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', gap: 7,
      letterSpacing: '-0.01em', transition: 'all 0.2s ease',
      boxShadow: '0 2px 14px rgba(224,17,95,0.28)',
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      {/* ═══════════════════════  HEADER  ═══════════════════════ */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: 48, flexShrink: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
      }}>
        {/* Left — Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <button className="lg:hidden" onClick={() => setMobileMenu(!isMobileMenuOpen)} style={{
            width: 28, height: 28, borderRadius: 6, background: 'rgba(0,0,0,0.05)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: 'var(--text-2)', fontSize: 14,
          }}>☰</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/logo.png" alt="FabricaAI"
              style={{ width: 28, height: 28, display: 'block', objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: 1, whiteSpace: 'nowrap' }}>
              <span style={{ color: '#1D1D1F' }}>Fabrica</span>
              <span style={{ color: '#E0115F' }}>AI</span>
              <span style={{ color: '#1D1D1F' }}> Studio</span>
            </div>
          </div>

          {/* DEMO badge */}
          <span
            className="demo-badge hidden sm:inline-block"
            title="Editing a demo design. Changes are not saved."
          >Demo</span>
        </div>

        {/* Center — Auth Notch — absolute-centered in header */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
          <AuthNotch
            user={user}
            showPromo={showToast && !user}
            onLoginClick={() => setShowLogin(true)}
            onPromoDismiss={() => setShowToast(false)}
            onLogout={() => {
              setUser(null)
              localStorage.removeItem('fabricai_user')
            }}
          />
        </div>

        {/* Right — LIVE dot + Export PDF */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: 4 }}>
            <span className="pulse-indicator" style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--clr-live)', display: 'inline-block',
              boxShadow: '0 0 0 2px rgba(34,197,94,0.22)',
            }} />
            <span style={{ fontSize: 11, color: 'var(--clr-live)', fontWeight: 700, letterSpacing: '0.04em' }}>LIVE</span>
          </div>

          {/* Admin button */}
          <a href="/admin" style={{ height: 28, display: 'flex', alignItems: 'center', gap: 5, padding: '0 10px', borderRadius: 8, background: 'rgba(224,17,95,0.08)', border: '1px solid rgba(224,17,95,0.18)', color: '#E0115F', textDecoration: 'none', fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em', transition: 'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(224,17,95,0.14)'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(224,17,95,0.08)'}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Admin
          </a>

          <div style={{ width: 1, height: 18, background: 'rgba(0,0,0,0.08)' }} />

          <button
            className="btn-export"
            style={{ height: 30, fontSize: 11, padding: '0 10px' }}
            disabled={compileState !== 'compiled' || changeCount > 0}
            onClick={() => import('@/components/outputs/PDFExport').then(m => m.downloadPDF())}
            title={compileState !== 'compiled' || changeCount > 0 ? 'Compile first to enable export' : 'Download PDF report'}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════  BODY  ══════════════════════════ */}

      <div className="flex flex-col lg:flex-row" style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
            onClick={() => setMobileMenu(false)} />
        )}

        {/* ══════════════  LEFT SIDEBAR  ══════════════ */}
        <div className={`
          absolute lg:relative z-50 h-full
          w-[288px] lg:w-[272px]
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `} style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--border-light)', flexShrink: 0 }}>

          {/* ── Stepper dots ── */}
          <div style={{
            padding: '6px 10px 5px',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--sidebar-bg)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {NAV_TABS.map((tab, index) => {
                const isComplete = tabCompletion[tab.id]
                const isActive   = activeTab === tab.id
                const isLast     = index === NAV_TABS.length - 1
                return (
                  <div key={tab.id} style={{ display: 'flex', alignItems: 'center', flex: isLast ? 'none' : 1 }}>
                    <button
                      onClick={() => { setActiveTab(tab.id); setMobileMenu(false) }}
                      title={tab.label}
                      style={{ border: 'none', cursor: 'pointer', background: 'none', padding: '2px 3px' }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: isComplete ? 'var(--accent)' : 'transparent',
                        border: isActive ? '2px solid var(--accent)' : isComplete ? 'none' : '1.5px solid #D1D1D6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 7.5, fontWeight: 700,
                        color: isComplete ? '#fff' : isActive ? 'var(--accent)' : '#AEAEB2',
                        transition: 'all 0.2s ease',
                      }}>
                        {isComplete ? '✓' : index + 1}
                      </div>
                    </button>
                    {!isLast && (
                      <div style={{ flex: 1, height: 1.5, background: isComplete ? 'var(--accent)' : '#E5E5EA', transition: 'background 0.3s ease' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ── Tab label bar ── */}
          <div style={{
            display: 'flex', padding: '3px 5px', gap: 2,
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--sidebar-bg)', flexShrink: 0, overflowX: 'auto',
          }}>
            {NAV_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMobileMenu(false) }}
                style={{
                  flex: 1, padding: '4px 3px', fontSize: 10.5,
                  fontWeight: activeTab === id ? 700 : 500,
                  color: activeTab === id ? 'var(--accent)' : 'var(--text-3)',
                  background: activeTab === id ? 'var(--accent-light)' : 'transparent',
                  border: activeTab === id ? '1px solid rgba(224,17,95,0.16)' : '1px solid transparent',
                  borderRadius: 6, cursor: 'pointer',
                  transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em', minWidth: 0,
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Sidebar Content ── */}
          <div className="sidebar-form-content" style={{ flex: 1, overflowY: 'auto', padding: '14px 12px', paddingBottom: 72 }}>
            {activeTab === 'Identity' && <IdentityForm />}
            {activeTab === 'Warp'     && <WarpSystemForm />}
            {activeTab === 'Weft'     && <WeftForm />}
            {activeTab === 'Loom'     && <LoomForm />}
            {activeTab === 'Border'   && <BorderForm />}
          </div>
        </div>

        {/* ══════════════  CENTER WORKSPACE  ══════════════ */}
        <div className="flex-1 min-w-0" style={{ overflowY: 'auto', overflowX: 'hidden', padding: '12px 12px', paddingBottom: 72 }}>
          <div className="flex flex-col gap-4 w-full min-h-full">

            {/* ── Control Bar — single unified pill group (original style) ── */}
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4, paddingBottom: 2 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 2, padding: '3px',
                background: 'rgba(118,118,128,0.12)',
                backdropFilter: 'blur(20px)',
                borderRadius: 10, border: '0.5px solid rgba(0,0,0,0.07)',
              }}>
                {([
                  { id: 'predefined'     as CenterMode, label: 'Predefined'     },
                  { id: 'design-library' as CenterMode, label: 'Design Library' },
                  // ✦ AI Studio — admin only, hidden from regular users
                  ...(isAdmin ? [{ id: 'ai-studio' as CenterMode, label: '✦ AI' }] : []),
                ]).map(({ id, label }) => {
                  const active = centerMode === id
                  const isAI = id === 'ai-studio'
                  return (
                    <button key={id} onClick={() => setCenterMode(id)} style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '6px 12px', fontSize: 12,
                      fontWeight: active ? 600 : 400, letterSpacing: '-0.015em',
                      color: active ? (isAI ? '#fff' : 'var(--text-1)') : isAI ? '#E0115F' : 'var(--text-3)',
                      background: active ? (isAI ? 'linear-gradient(135deg,#E0115F,#C4006A)' : '#fff') : 'transparent',
                      border: 'none', borderRadius: 8, cursor: 'pointer',
                      whiteSpace: 'nowrap' as const,
                      transition: 'all 0.18s ease',
                      boxShadow: active ? (isAI ? '0 2px 10px rgba(224,17,95,0.35)' : '0 1px 5px rgba(0,0,0,0.14), 0 0.5px 1.5px rgba(0,0,0,0.10)') : 'none',
                    }}>
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── PREDEFINED PANELS ── */}
            {centerMode === 'predefined' && <>

              {/* 1. PEG PLAN */}
              <div className="card">
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                      Peg Plan — Bidirectional Editor
                    </h3>
                    <span style={{
                      fontSize: 10, fontWeight: 600, color: 'var(--green)',
                      background: 'rgba(52,199,89,0.10)', padding: '2px 7px',
                      borderRadius: 99, letterSpacing: '0.02em',
                    }}>LIVE</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '-0.01em' }}>Shafts</span>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.05)', borderRadius: 9, padding: 3, gap: 2 }}>
                      {SHAFT_OPTIONS.map(n => {
                        const active = shaftCount === n
                        return (
                          <button key={n} onClick={() => store.setShaftCount(n)} style={{
                            minWidth: 34, height: 26, padding: '0 8px',
                            fontSize: 12, fontWeight: active ? 700 : 500,
                            color: active ? '#fff' : 'var(--text-3)',
                            background: active ? 'var(--accent)' : 'transparent',
                            border: 'none', borderRadius: 7, cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            boxShadow: active ? '0 1px 6px rgba(224,17,95,0.30)' : 'none',
                            letterSpacing: '-0.02em',
                          }}>
                            {n}
                          </button>
                        )
                      })}
                    </div>
                    <input
                      type="number" min={2} max={32} step={2} value={shaftCount}
                      onChange={e => {
                        const v = parseInt(e.target.value)
                        if (!isNaN(v) && v >= 2 && v <= 32) store.setShaftCount(v)
                      }}
                      style={{
                        width: 52, height: 26, fontSize: 12, fontWeight: 600,
                        textAlign: 'center', padding: '0 4px', borderRadius: 8,
                        border: '1px solid var(--border)', background: 'var(--bg)',
                        color: 'var(--text-1)',
                      }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-4)', letterSpacing: '-0.005em' }}>
                      Click cells to toggle · Text syncs automatically
                    </span>
                  </div>
                </div>
                <PegPlanEditor shaftCount={shaftCount} onChange={handlePegPlanChange} initialText={store.pegPlanText} />
              </div>

              {/* 2. DRAFT ANALYSIS */}
              <div className="card">
                <DraftAnalysisTool />
              </div>

              {/* 3. WEFT SEQUENCE PLAN */}
              <div className="card">
                <WeftSequencePlan />
              </div>

              {/* 4. FABRIC SIMULATION */}
              <div className="card">
                <div style={{ marginBottom: 18 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em' }}>
                    Fabric Simulation
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                    Real-time weave structure preview
                  </div>
                </div>
                <SimulationExport
                  matrix={store.weaveMatrix.length > 0 ? store.weaveMatrix : store.pegPlanMatrix}
                  warpColor={store.warpSystem.yarns[0]?.colour_hex || store.warp?.colour_hex || store.warp?.colour_code || '#1B3A6B'}
                  weftColor={store.weftSystem.yarns[0]?.colour_hex || store.weftSystem.yarns[0]?.colour_code || '#E8A838'}
                  designName={store.identity.design_name || 'Design'}
                />
              </div>

              {/* 5. STATUS FOOTER CARDS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, flexShrink: 0 }} className="sm:grid-cols-3 lg:grid-cols-5">
                {[
                  {
                    label: 'Warp',
                    value: `${store.warp?.count_value || 75}${store.warp?.count_system === 'denier' ? 'D' : 'Ne'}`,
                    sub: store.warp?.material === 'polyester' ? 'Polyester' : store.warp?.material === 'cotton' ? 'Cotton' : store.warp?.material || 'Polyester',
                  },
                  {
                    label: 'Main Weft',
                    value: `${store.weftSystem.yarns[0]?.count_value || '--'}${store.weftSystem.yarns[0]?.count_system === 'ne' ? 'Ne' : 'D'}`,
                    sub: store.weftSystem.yarns[0]?.material || '--',
                  },
                  { label: 'Extra Yarns', value: `${Math.max(store.weftSystem.yarns.length - 1, 0)}`, sub: 'yarns' },
                  {
                    label: 'Machine',
                    value: store.loom?.machine_type === 'rapier' ? 'Rapier' : store.loom?.machine_type === 'air_jet' ? 'Air Jet' : store.loom?.machine_type === 'water_jet' ? 'Water Jet' : 'Rapier',
                    sub: `${store.loom?.machine_rpm || 500} RPM`,
                  },
                  { label: 'Mode', value: 'Advanced', sub: 'system' },
                ].map(({ label, value, sub }) => (
                  <div key={label} style={{
                    background: 'var(--surface)', border: '1px solid var(--border-light)',
                    borderRadius: 12, padding: '11px 14px', boxShadow: 'var(--shadow-xs)',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>{value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1, textTransform: 'capitalize' }}>{sub}</div>
                  </div>
                ))}
              </div>

              {/* Mobile CalcPanel */}
              <div className="lg:hidden w-full rounded-2xl overflow-hidden mt-1" style={{
                border: '1px solid var(--border-light)', background: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)', flexShrink: 0,
              }}>
                <CalcPanel />
              </div>
            </>}

            {/* ── DESIGN LIBRARY ── */}
            {centerMode === 'design-library' && (
              <DesignLibrary onLoadDesign={() => setCenterMode('predefined')} />
            )}

            {/* ── AI DESIGN STUDIO — Admin only ── */}
            {centerMode === 'ai-studio' && (
              isAdmin ? (
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                  <AIDesignStudio />
                </div>
              ) : (
                <div style={{
                  flex: 1, minHeight: 400, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  borderRadius: 16, border: '1px solid rgba(224,17,95,0.15)',
                  background: 'linear-gradient(135deg, rgba(224,17,95,0.03) 0%, rgba(186,12,93,0.06) 100%)',
                  gap: 16, padding: 40, textAlign: 'center',
                }}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#E0115F,#BA0C5D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 8px 24px rgba(224,17,95,0.3)' }}>🔒</div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.03em', marginBottom: 8 }}>AI Design Studio</div>
                    <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', lineHeight: 1.6, maxWidth: 320 }}>This feature is currently under development and restricted to admin access only.</div>
                  </div>
                  <a href="/admin" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '10px 20px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                    background: 'linear-gradient(135deg,#E0115F,#BA0C5D)', color: '#fff',
                    textDecoration: 'none', boxShadow: '0 4px 14px rgba(224,17,95,0.3)',
                    transition: 'transform 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'}
                  >
                    🛡 Admin Access Only
                  </a>
                  <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.25)', marginTop: -8 }}>Sign in as admin at /admin to unlock</div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ══════════════  RIGHT SIDEBAR — Live Calculations  ══════════════ */}
        {centerMode !== 'ai-studio' && (
          <div className="hidden lg:block lg:shrink-0" style={{
            width: 248, borderLeft: '1px solid var(--border-light)',
            background: 'var(--sidebar-bg)', overflowY: 'auto',
          }}>
            <CalcPanel />
          </div>
        )}
      </div>

      {/* ═══════════════════  STICKY COMPILE FOOTER  ════════════════════ */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: 44, zIndex: 200, flexShrink: 0,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', gap: 12,
      }}>
        {/* Left: context + change badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            {activeTab} Tab
          </span>
          {changeCount > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700,
              background: 'rgba(234,88,12,0.12)', color: 'var(--clr-warn)',
              padding: '2px 7px', borderRadius: 99, letterSpacing: '0.02em',
              flexShrink: 0,
            }}>
              {changeCount} change{changeCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Center: COMPILE button — always visible, always primary */}
        <button
          onClick={handleCompile}
          disabled={compileState === 'compiling'}
          style={compileBtnStyle()}
          aria-label={
            compileState === 'compiled' && changeCount === 0
              ? `Design compiled successfully at ${lastCompiledAt?.toLocaleTimeString()}`
              : changeCount > 0
              ? `Recompile required — ${changeCount} change${changeCount !== 1 ? 's' : ''} since last compile`
              : 'Compile design to update calculations and peg plan'
          }
        >
          {compileState === 'compiling' ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 0.9s linear infinite', lineHeight: 1 }}>⟳</span>
              Compiling…
            </>
          ) : compileState === 'compiled' && changeCount === 0 ? (
            <>
              ✓ Compiled
              {lastCompiledAt && (
                <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.75 }}>
                  &nbsp;· {lastCompiledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </>
          ) : changeCount > 0 ? (
            <>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFA500', display: 'inline-block', flexShrink: 0 }} />
              Recompile · {changeCount} change{changeCount !== 1 ? 's' : ''}
            </>
          ) : (
            <>⚡ Compile Design</>
          )}
        </button>

        {/* Right: keyboard shortcut hints */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexShrink: 0 }}>
          <span className="hidden md:inline" style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>⌘↵ compile</span>
          <span className="hidden md:inline" style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--font-mono)' }}>⌘⇧E export</span>
        </div>
      </div>
      {/* ═══════════════════════  LOGIN MODAL  ═══════════════════════ */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onLogin={(u) => {
            setUser(u)
            setShowLogin(false)
            setShowToast(false)
          }}
        />
      )}
    </div>
  )
}
