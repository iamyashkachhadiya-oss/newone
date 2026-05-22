'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { designLibrary } from '@/data/designLibrary'

// ─── Types ────────────────────────────────────────────────────────────────────
interface AnalyticsData {
  total: number
  sessions: number
  users: number
  byType: Record<string, number>
  byPage: Record<string, number>
  byDay: Record<string, number>
  topLabels: { label: string; count: number }[]
  recent: any[]
}

interface NewDesign {
  id: string; name: string; fabric_type: string; weave_type: string
  shaft_count: number; repeat_size: number; description: string
  tags: string; applications: string; popularity: number
  peg_matrix_text: string; weight: string; direction: string
}

const ADMIN_PIN = 'yash2025'

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  bg:      '#F5F5F7',
  surface: '#FFFFFF',
  card:    '#FFFFFF',
  border:  'rgba(0,0,0,0.08)',
  pink:    '#E0115F',
  text:    '#1D1D1F',
  muted:   'rgba(0,0,0,0.40)',
  dim:     'rgba(0,0,0,0.18)',
}

const TYPE_COLORS: Record<string, string> = {
  page_view:      '#3B82F6', button_click:   '#10B981',
  tab_switch:     '#8B5CF6', ai_query:       '#F59E0B',
  design_applied: '#E0115F', export:         '#06B6D4',
  login:          '#34D399', signup:         '#F472B6',
  error:          '#EF4444',
}

// ─── Components ───────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, color: color ?? C.pink, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{sub}</div>}
    </div>
  )
}

function SectionHead({ title, count }: { title: string; count?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>{title}</div>
      {count !== undefined && (
        <div style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${C.pink}18`, color: C.pink, border: `1px solid ${C.pink}30` }}>
          {count}
        </div>
      )}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const router = useRouter()
  const [authed,   setAuthed]   = useState(false)
  const [pin,      setPin]      = useState('')
  const [pinErr,   setPinErr]   = useState(false)
  const [tab,      setTab]      = useState<'analytics' | 'library' | 'users' | 'logs'>('analytics')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading,  setLoading]  = useState(false)

  // Design library: base + custom (loaded from API)
  const [baseDesigns,   setBaseDesigns]   = useState<any[]>(designLibrary.designs.slice())
  const [customDesigns, setCustomDesigns] = useState<any[]>([])
  const [libLoading,    setLibLoading]    = useState(false)
  const designs = [...customDesigns, ...baseDesigns]  // custom first

  // Add design form
  const [addOpen,  setAddOpen]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [saveErr,  setSaveErr]  = useState('')
  const [newD, setNewD] = useState<NewDesign>({
    id: '', name: '', fabric_type: 'Shirting', weave_type: 'Twill',
    shaft_count: 8, repeat_size: 8, description: '', tags: '',
    applications: '', popularity: 70, peg_matrix_text: '',
    weight: 'Medium', direction: 'Z',
  })

  // ── Auth check
  useEffect(() => {
    const ok = sessionStorage.getItem('admin_authed')
    if (ok === ADMIN_PIN) setAuthed(true)
  }, [])

  // ── Load custom designs from API
  const loadCustomDesigns = useCallback(async () => {
    setLibLoading(true)
    try {
      const r = await fetch('/api/admin/designs')
      if (r.ok) {
        const json = await r.json()
        setCustomDesigns(json.designs || [])
      }
    } finally { setLibLoading(false) }
  }, [])

  useEffect(() => {
    if (authed) loadCustomDesigns()
  }, [authed, loadCustomDesigns])

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/analytics')
      if (r.ok) setAnalytics(await r.json())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (authed && tab === 'analytics') fetchAnalytics()
  }, [authed, tab, fetchAnalytics])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('admin_authed', ADMIN_PIN)
      setAuthed(true); setPinErr(false)
    } else { setPinErr(true) }
  }

  async function handleAddDesign(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveErr('')
    try {
      const payload = {
        id:           newD.id,
        name:         newD.name,
        fabric_type:  newD.fabric_type,
        weave_type:   newD.weave_type,
        shaft_count:  newD.shaft_count,
        repeat_size:  newD.repeat_size,
        description:  newD.description,
        tags:         newD.tags,
        applications: newD.applications,
        popularity:   newD.popularity,
        weight:       newD.weight,
        direction:    newD.direction,
        peg_matrix_text: newD.peg_matrix_text,
      }
      const res = await fetch('/api/admin/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setSaveErr(json.error || 'Failed to save design.')
        setSaving(false)
        return
      }
      // Refresh custom designs from server
      await loadCustomDesigns()
      setSaving(false)
      setSaved(true)
      // Reset form after success
      setTimeout(() => {
        setSaved(false)
        setAddOpen(false)
        setNewD({ id: '', name: '', fabric_type: 'Shirting', weave_type: 'Twill',
          shaft_count: 8, repeat_size: 8, description: '', tags: '',
          applications: '', popularity: 70, peg_matrix_text: '',
          weight: 'Medium', direction: 'Z' })
      }, 1800)
    } catch (err: any) {
      setSaveErr(err.message || 'Network error')
      setSaving(false)
    }
  }

  async function handleDeleteDesign(id: string) {
    if (!confirm(`Delete design ${id}? This cannot be undone.`)) return
    try {
      const res = await fetch('/api/admin/designs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (res.ok) await loadCustomDesigns()
    } catch { /* silent */ }
  }

  // ── PIN GATE ──────────────────────────────────────────────────────────────
  if (!authed) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ width: 360, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: 32, boxShadow: '0 4px 40px rgba(0,0,0,0.10)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg, #C11054, ${C.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>Admin Access</div>
            <div style={{ fontSize: 11, color: C.muted }}>FabricaAI Studio</div>
          </div>
        </div>
        <form onSubmit={handleLogin}>
          <input
            type="password" value={pin} onChange={e => { setPin(e.target.value); setPinErr(false) }}
            placeholder="Enter admin PIN…" autoFocus
            style={{ width: '100%', boxSizing: 'border-box', height: 42, background: '#F5F5F7', border: `1px solid ${pinErr ? '#EF4444' : C.border}`, borderRadius: 10, padding: '0 14px', fontSize: 14, color: C.text, fontFamily: 'inherit', marginBottom: 8, outline: 'none' }}
          />
          {pinErr && <div style={{ fontSize: 11, color: '#EF4444', marginBottom: 8 }}>Wrong PIN. You're not Yash 🫡</div>}
          <button type="submit" style={{ width: '100%', height: 42, background: `linear-gradient(135deg, #C11054, ${C.pink})`, border: 'none', borderRadius: 10, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.01em' }}>
            Enter Dashboard
          </button>
        </form>
        <button onClick={() => router.push('/demo')} style={{ width: '100%', marginTop: 10, padding: '8px 0', background: 'none', border: 'none', color: C.muted, fontSize: 12, cursor: 'pointer' }}>
          ← Back to Studio
        </button>
      </div>
    </div>
  )

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'library',   label: '🧶 Design Library' },
    { id: 'users',     label: '👥 Users' },
    { id: 'logs',      label: '📋 Event Log' },
  ] as const

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'system-ui, -apple-system, sans-serif', color: C.text }}>
      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 16, position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, #C11054, ${C.pink})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>🛡</div>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.02em' }}>FabricaAI Admin</span>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: `${C.pink}18`, color: C.pink, fontWeight: 700 }}>RESTRICTED</span>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={() => router.push('/demo')} style={{ fontSize: 11, color: C.muted, background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          ← Studio
        </button>
        <button onClick={() => { sessionStorage.removeItem('admin_authed'); setAuthed(false) }} style={{ fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 2, padding: '12px 28px 0', borderBottom: `1px solid ${C.border}` }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 16px', borderRadius: '10px 10px 0 0', background: tab === t.id ? C.card : 'none', border: `1px solid ${tab === t.id ? C.border : 'transparent'}`, borderBottom: 'none', color: tab === t.id ? C.text : C.muted, fontSize: 12, fontWeight: tab === t.id ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 28px', maxWidth: 1280, margin: '0 auto' }}>

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>Site Analytics</div>
              <button onClick={fetchAnalytics} style={{ fontSize: 11, color: C.muted, background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
                {loading ? '⟳ Loading…' : '↻ Refresh'}
              </button>
            </div>

            {analytics ? (
              <>
                {/* Top stats */}
                <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                  <StatCard label="Total Events"   value={analytics.total}    sub="All time"        color={C.pink} />
                  <StatCard label="Sessions"        value={analytics.sessions} sub="Unique visits"   color="#3B82F6" />
                  <StatCard label="Users Tracked"   value={analytics.users}    sub="Logged-in"       color="#10B981" />
                  <StatCard label="Designs Applied" value={analytics.byType?.design_applied ?? 0} sub="AI actions" color="#F59E0B" />
                  <StatCard label="AI Queries"      value={analytics.byType?.ai_query ?? 0}       sub="Chat messages" color="#8B5CF6" />
                </div>

                {/* By type + Top labels */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                    <SectionHead title="Events by Type" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(analytics.byType).sort((a,b) => b[1]-a[1]).map(([type, count]) => {
                        const pct = analytics.total ? (count / analytics.total * 100).toFixed(0) : 0
                        return (
                          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: TYPE_COLORS[type] ?? C.muted, flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: C.text, flex: 1, fontWeight: 500 }}>{type.replace(/_/g,' ')}</span>
                            <span style={{ fontSize: 11, color: C.muted }}>{count}</span>
                            <div style={{ width: 60, height: 4, borderRadius: 99, background: C.border, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: TYPE_COLORS[type] ?? C.muted, borderRadius: 99 }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                    <SectionHead title="Top Actions" count={analytics.topLabels.length} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      {analytics.topLabels.slice(0, 10).map(({ label, count }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: C.pink }}>{count}×</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* By page */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                  <SectionHead title="Top Pages" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                    {Object.entries(analytics.byPage).sort((a,b) => b[1]-a[1]).map(([page, count]) => (
                      <div key={page} style={{ background: '#F5F5F7', borderRadius: 10, padding: '10px 14px', border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 3 }}>{page}</div>
                        <div style={{ fontSize: 11, color: C.muted }}>{count} events</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 13 }}>
                {loading ? '⟳ Loading analytics…' : 'No analytics data yet. Users need to visit the site first.'}
              </div>
            )}
          </div>
        )}

        {/* ── DESIGN LIBRARY TAB ── */}
        {tab === 'library' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>Design Library</div>
              <button onClick={() => setAddOpen(o => !o)} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: `linear-gradient(135deg, #C11054, ${C.pink})`, border: 'none', borderRadius: 10, padding: '8px 16px', cursor: 'pointer' }}>
                + Add Design
              </button>
            </div>

            {/* Add form */}
            {addOpen && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 24 }}>
                <SectionHead title="New Design" />
                <form onSubmit={handleAddDesign}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
                    {[
                      { key: 'id',          label: 'ID (optional)',   type: 'text',   ph: 'D201…' },
                      { key: 'name',        label: 'Design Name *',   type: 'text',   ph: 'Classic 3/1 Twill…' },
                      { key: 'fabric_type', label: 'Fabric Type *',   type: 'text',   ph: 'Denim, Shirting…' },
                      { key: 'weave_type',  label: 'Weave Type *',    type: 'text',   ph: 'Twill, Plain…' },
                      { key: 'weight',      label: 'Weight',          type: 'text',   ph: 'Medium, Heavy…' },
                      { key: 'direction',   label: 'Direction',       type: 'text',   ph: 'Z, S, N/A…' },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>{f.label}</label>
                        <input value={(newD as any)[f.key]} onChange={e => setNewD(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.ph} required={f.label.endsWith('*')}
                          style={{ width: '100%', boxSizing: 'border-box', height: 36, background: '#F5F5F7', border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 10px', fontSize: 12, color: C.text, fontFamily: 'inherit', outline: 'none' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Shafts</label>
                      <input type="number" value={newD.shaft_count} onChange={e => setNewD(p => ({ ...p, shaft_count: +e.target.value }))}
                        style={{ width: '100%', boxSizing: 'border-box', height: 36, background: '#F5F5F7', border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 10px', fontSize: 12, color: C.text, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Popularity (0-100)</label>
                      <input type="number" min={0} max={100} value={newD.popularity} onChange={e => setNewD(p => ({ ...p, popularity: +e.target.value }))}
                        style={{ width: '100%', boxSizing: 'border-box', height: 36, background: '#F5F5F7', border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 10px', fontSize: 12, color: C.text, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Tags (comma-separated)</label>
                      <input value={newD.tags} onChange={e => setNewD(p => ({ ...p, tags: e.target.value }))} placeholder="indigo, classic, formal…"
                        style={{ width: '100%', boxSizing: 'border-box', height: 36, background: '#F5F5F7', border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 10px', fontSize: 12, color: C.text, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Applications (comma-separated)</label>
                      <input value={newD.applications} onChange={e => setNewD(p => ({ ...p, applications: e.target.value }))} placeholder="jeans, workwear, jackets…"
                        style={{ width: '100%', boxSizing: 'border-box', height: 36, background: '#F5F5F7', border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 10px', fontSize: 12, color: C.text, fontFamily: 'inherit', outline: 'none' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Description</label>
                    <textarea value={newD.description} onChange={e => setNewD(p => ({ ...p, description: e.target.value }))} rows={2} placeholder="Brief description of this weave structure…"
                      style={{ width: '100%', boxSizing: 'border-box', background: '#F5F5F7', border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, color: C.text, fontFamily: 'inherit', outline: 'none', resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>
                      Peg Matrix — Paste Surat format <span style={{ color: C.dim }}>(1--&gt;1,2 OR [[0,1],[1,0]])</span>
                    </label>
                    <textarea value={newD.peg_matrix_text} onChange={e => setNewD(p => ({ ...p, peg_matrix_text: e.target.value }))} rows={4} placeholder={'1-->1,2\n2-->2,3\n3-->3,4\n4-->4,1'}
                      style={{ width: '100%', boxSizing: 'border-box', background: '#F0F9F0', border: `1px solid rgba(16,185,129,0.20)`, borderRadius: 8, padding: '8px 10px', fontSize: 11, color: '#059669', fontFamily: '"SF Mono", "Fira Code", monospace', outline: 'none', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button type="submit" disabled={!newD.name.trim() || saving}
                      style={{ padding: '9px 20px', background: saved ? '#10B981' : `linear-gradient(135deg, #C11054, ${C.pink})`, border: 'none', borderRadius: 10, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {saving ? '⟳ Saving…' : saved ? '✓ Saved!' : 'Add to Library'}
                    </button>
                    <button type="button" onClick={() => setAddOpen(false)}
                      style={{ padding: '9px 16px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, color: C.muted, fontSize: 12, cursor: 'pointer' }}>
                      Cancel
                    </button>
                    {saveErr && (
                      <span style={{ color: '#E0115F', fontSize: 11, fontWeight: 600, marginLeft: 10 }}>⚠️ {saveErr}</span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Design list */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 80px 60px 80px 40px', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: '#F5F5F7' }}>
                {['ID', 'Name / Description', 'Fabric Type', 'Weave', 'Shafts', 'Quality', ''].map((h, i) => (
                  <div key={i} style={{ fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</div>
                ))}
              </div>

              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {designs.map((d: any) => (
                  <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 120px 80px 60px 80px 40px', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${C.border}`, transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#F5F5F7'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'none'}>
                    <div style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {d.source === 'admin' && <span title="Custom Admin Design" style={{ color: '#10B981', fontSize: 13 }}>•</span>}
                      {d.id}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.text, letterSpacing: '-0.01em', marginBottom: 2 }}>{d.name}</div>
                      {d.tags && Array.isArray(d.tags) && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {d.tags.slice(0, 4).map((t: string) => (
                           <span key={t} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.06)', color: C.muted }}>{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, paddingTop: 1 }}>{d.fabric_type}</div>
                    <div style={{ fontSize: 11, color: C.muted, paddingTop: 1 }}>{d.weave_type}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.pink, paddingTop: 1 }}>{d.shaft_count}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingTop: 3 }}>
                      <div style={{ flex: 1, height: 4, borderRadius: 99, background: C.border, overflow: 'hidden' }}>
                        <div style={{ width: `${d.popularity ?? 50}%`, height: '100%', background: `linear-gradient(90deg, ${C.pink}, #F59E0B)`, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 10, color: C.muted }}>{d.popularity}</span>
                    </div>
                    <div>
                      {d.source === 'admin' ? (
                        <button onClick={() => handleDeleteDesign(d.id)} title="Delete custom design"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#EF4444', opacity: 0.7, padding: 4 }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.7'}>
                          ×
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20 }}>User Sessions</div>
            {analytics ? (
              <>
                <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
                  <StatCard label="Total Sessions"  value={analytics.sessions} sub="Including anonymous" color="#3B82F6" />
                  <StatCard label="Logged-in Users" value={analytics.users}    sub="With accounts"       color="#10B981" />
                  <StatCard label="Login Events"    value={analytics.byType?.login  ?? 0} color="#34D399" />
                  <StatCard label="Signup Events"   value={analytics.byType?.signup ?? 0} color="#F472B6" />
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'grid', gridTemplateColumns: '160px 1fr 120px 140px' }}>
                    {['Session ID', 'Action', 'Page', 'Time'].map(h => <div key={h}>{h}</div>)}
                  </div>
                  <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {analytics.recent.filter((e: any) => ['login','signup'].includes(e.type)).map((e: any) => (
                      <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 120px 140px', padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 11 }}>
                        <div style={{ color: C.muted, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.sessionId}</div>
                        <div style={{ color: C.text }}>{e.label}</div>
                        <div style={{ color: C.muted }}>{e.page}</div>
                        <div style={{ color: C.muted }}>{new Date(e.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    ))}
                    {analytics.recent.filter((e: any) => ['login','signup'].includes(e.type)).length === 0 && (
                      <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 12 }}>No user login events yet.</div>
                    )}
                  </div>
                </div>
              </>
            ) : <div style={{ textAlign: 'center', padding: 60, color: C.muted, fontSize: 13 }}>Switch to Analytics first to load data.</div>}
          </div>
        )}

        {/* ── EVENT LOG TAB ── */}
        {tab === 'logs' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>Live Event Log</div>
              <button onClick={fetchAnalytics} style={{ fontSize: 11, color: C.muted, background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>↻ Refresh</button>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden' }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', display: 'grid', gridTemplateColumns: '90px 120px 1fr 100px 140px' }}>
                {['Type', 'Session', 'Label / Value', 'Page', 'Time'].map(h => <div key={h}>{h}</div>)}
              </div>
              <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                {(analytics?.recent ?? []).map((e: any) => (
                  <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '90px 120px 1fr 100px 140px', padding: '9px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 11, transition: 'background 0.1s' }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLDivElement).style.background = '#F5F5F7'}
                    onMouseLeave={ev => (ev.currentTarget as HTMLDivElement).style.background = 'none'}>
                    <div>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: `${TYPE_COLORS[e.type] ?? '#666'}22`, color: TYPE_COLORS[e.type] ?? C.muted, fontWeight: 700 }}>
                        {e.type?.replace(/_/g,' ')}
                      </span>
                    </div>
                    <div style={{ color: C.muted, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10 }}>{e.sessionId?.slice(0, 16)}…</div>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: C.text }}>{e.label}</span>
                      {e.value && <span style={{ color: C.muted }}> · {e.value}</span>}
                    </div>
                    <div style={{ color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.page}</div>
                    <div style={{ color: C.muted }}>{new Date(e.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                ))}
                {!analytics?.recent?.length && (
                  <div style={{ padding: 40, textAlign: 'center', color: C.muted, fontSize: 12 }}>No events tracked yet. Refresh after some site activity.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
