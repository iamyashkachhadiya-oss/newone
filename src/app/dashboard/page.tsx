'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const router = useRouter()
  const [designs, setDesigns] = useState<Array<{ id: string; design_name: string; design_number: string; created_at: string }>>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')
  const [factoryName, setFactoryName] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.replace('/auth')
        return
      }

      // Load user profile
      const { data: profile } = await supabase
        .from('users')
        .select('name, factory_name')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUserName(profile.name || '')
        setFactoryName(profile.factory_name || '')
      }

      // Load designs
      const { data } = await supabase
        .from('designs')
        .select('id, design_name, design_number, created_at')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      setDesigns(data || [])
      setLoading(false)
    }
    load()
  }, [router])

  const createNewDesign = async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Create draft first
    const { data: draft } = await supabase
      .from('drafts')
      .insert({
        user_id: session.user.id,
        name: 'New Draft',
        shaft_count: 16,
        draft_type: 'straight',
        threading_sequence: Array.from({ length: 16 }, (_, i) => (i % 16) + 1),
        tie_up_matrix: [],
      })
      .select()
      .single()

    if (!draft) return

    // Create design
    const { data: design } = await supabase
      .from('designs')
      .insert({
        draft_id: draft.id,
        user_id: session.user.id,
        design_name: 'Untitled Design',
        design_number: `SD-${Date.now().toString(36).toUpperCase()}`,
        quality_name: '',
        customer_ref: '',
        weave_matrix: [],
        peg_plan_text: '',
        peg_plan_matrix: [],
        lifting_plan_matrix: [],
        repeat_w: 0,
        repeat_h: 0,
        version: 1,
      })
      .select()
      .single()

    if (design) {
      router.push(`/design/${design.id}`)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/auth')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 32px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/logo.png"
            alt="FabricaAI Logo"
            style={{ width: 36, height: 36, display: 'block', objectFit: 'cover', borderRadius: 8 }}
          />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>FabricaAI Studio</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{factoryName || 'Your Factory'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.push('/weaving')} className="btn-accent" style={{ fontSize: 12, height: 36, padding: '0 14px' }}>
            🧵 Weaving CAD
          </button>
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{userName}</span>
          <button onClick={handleLogout} className="btn-secondary" style={{ fontSize: 12 }}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main */}
      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>

        {/* ─── Weaving CAD Banner ──────────────────────── */}
        <div style={{
          background: 'linear-gradient(135deg, #1B1F3B 0%, #2A2F52 60%, #3a4070 100%)',
          borderRadius: 16, padding: '28px 32px',
          marginBottom: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          overflow: 'hidden', position: 'relative',
        }}>
          {/* Decorative grid */}
          <div style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 300, opacity: 0.08,
            backgroundImage: 'repeating-linear-gradient(0deg, white 0px, white 1px, transparent 1px, transparent 18px), repeating-linear-gradient(90deg, white 0px, white 1px, transparent 1px, transparent 18px)',
          }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 8 }}>NEW TOOL</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 6 }}>Weaving CAD Engine</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', maxWidth: 420, lineHeight: 1.6 }}>
              Configure looms, set up draft threading plans, assign feeder colors, and explore all generated weave patterns — Plain, Twill, Satin, Dobby.
            </p>
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {['Rapier · Dobby · Water-Jet · Jacquard', 'Surat Yarn DB (3 verified yarns)', 'Color Drawdown Preview', 'Float Violation Detection'].map((feat, i) => (
                <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ color: '#E8A838' }}>✓</span> {feat}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => router.push('/weaving')}
            style={{
              background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 12,
              padding: '14px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              flexShrink: 0, transition: 'all 0.2s', fontFamily: 'var(--font-body)',
              boxShadow: '0 4px 16px rgba(232,168,56,0.4)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
          >
            Open Weaving CAD →
          </button>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 32,
        }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>Designs</h1>
            <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
              {designs.length} design{designs.length !== 1 ? 's' : ''} in your workspace
            </p>
          </div>
          <button onClick={createNewDesign} className="btn-accent">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Design
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-3)' }}>
            Loading designs…
          </div>
        ) : designs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: 'var(--bg)',
              margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <rect x="3" y="3" width="22" height="22" rx="3" stroke="var(--border)" strokeWidth="2"/>
                <path d="M10 14h8M14 10v8" stroke="var(--text-3)" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
              No designs yet
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>
              Create your first design to get started with peg plans, calculations, and exports.
            </p>
            <button onClick={createNewDesign} className="btn-primary">
              Create Your First Design
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {designs.map((d) => (
              <div
                key={d.id}
                className="card"
                onClick={() => router.push(`/design/${d.id}`)}
                style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(232,168,56,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-light)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)'
                }}
              >
                <div style={{
                  width: '100%', height: 80, borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--bg) 0%, var(--bg-darker) 100%)',
                  border: '1px solid var(--border-light)',
                  marginBottom: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="7" height="7" fill="var(--primary)" rx="1"/>
                    <rect x="14" y="3" width="7" height="7" fill="var(--border)" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" fill="var(--border)" rx="1"/>
                    <rect x="14" y="14" width="7" height="7" fill="var(--primary)" rx="1"/>
                  </svg>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                  {d.design_name || 'Untitled Design'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                  {d.design_number} · {new Date(d.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
