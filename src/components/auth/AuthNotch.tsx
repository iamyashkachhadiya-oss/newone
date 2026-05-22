'use client'

import { useState, useRef, useEffect } from 'react'
import type { FabricUser } from './LoginModal'
import { useDesignStore } from '@/lib/store/designStore'

interface SavedDesign {
  id: string
  name: string
  savedAt: string
  snapshot: Record<string, unknown>
}

interface Props {
  user: FabricUser | null
  showPromo: boolean
  onLoginClick: () => void
  onLogout: () => void
  onPromoDismiss: () => void
}

/* ─── SVG Icons ─────────────────────────────────────────────────────────── */
const IconPerson = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.22s ease' }}>
    <path d="M6 9l6 6 6-6"/>
  </svg>
)

const IconSave = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
)

const IconSignOut = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

/* ─── Promo messages — no emoji, persuasive copy ─────────────────────────── */
const MESSAGES = [
  { headline: 'Your designs deserve to be saved.', sub: 'Sign in free to keep your work safe forever.' },
  { headline: 'Never lose a design again.', sub: 'Create a free account in under 30 seconds.' },
  { headline: 'Save, export, and access anywhere.', sub: 'Sign in to unlock your full design history.' },
  { headline: 'Your collections are worth remembering.', sub: 'A free account keeps every design intact.' },
]

/* ─── Pill surface styles ─────────────────────────────────────────────────── */
const PILL_BASE: React.CSSProperties = {
  background: 'linear-gradient(180deg, #1E1E22 0%, #16161A 100%)',
  border: '0.5px solid rgba(255,255,255,0.09)',
  boxShadow: '0 1px 2px rgba(0,0,0,0.4), 0 6px 20px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.05)',
  overflow: 'hidden',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  userSelect: 'none' as const,
  /* Smooth ease-out, not bouncy */
  transition: 'width 0.36s cubic-bezier(0.25,0.46,0.45,0.94), height 0.36s cubic-bezier(0.25,0.46,0.45,0.94), border-radius 0.36s cubic-bezier(0.25,0.46,0.45,0.94)',
}

export default function AuthNotch({ user, showPromo, onLoginClick, onLogout, onPromoDismiss }: Props) {
  const [menuOpen, setMenuOpen]     = useState(false)
  const [saveOpen, setSaveOpen]     = useState(false)
  const [designName, setDesignName] = useState('')
  const [savedMsg, setSavedMsg]     = useState('')
  const [msgIdx]                    = useState(() => Math.floor(Math.random() * MESSAGES.length))
  const menuRef = useRef<HTMLDivElement>(null)
  const store   = useDesignStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false); setSaveOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!showPromo) return
    const t = setTimeout(onPromoDismiss, 5500)
    return () => clearTimeout(t)
  }, [showPromo, onPromoDismiss])

  const getSaved = (): SavedDesign[] => {
    if (!user) return []
    try { return JSON.parse(localStorage.getItem(`fabricai_designs_${user.id}`) || '[]') }
    catch { return [] }
  }

  const handleSave = () => {
    if (!user || !designName.trim()) return
    const designs = getSaved()
    const newDesign: SavedDesign = {
      id: `d-${Date.now()}`,
      name: designName.trim(),
      savedAt: new Date().toISOString(),
      snapshot: {
        identity: store.identity, warpSystem: store.warpSystem,
        weftSystem: store.weftSystem, loom: store.loom,
        shaftCount: store.shaftCount, pegPlanText: store.pegPlanText,
      } as Record<string, unknown>,
    }
    designs.unshift(newDesign)
    localStorage.setItem(`fabricai_designs_${user.id}`, JSON.stringify(designs.slice(0, 50)))
    setSavedMsg(`Saved "${newDesign.name}"`)
    setDesignName('')
    setTimeout(() => { setSavedMsg(''); setSaveOpen(false); setMenuOpen(false) }, 2000)
  }

  const msg     = MESSAGES[msgIdx]
  const saved   = getSaved()

  /* ═══════════════════════  LOGGED OUT  ════════════════════════════════ */
  if (!user) {
    const expanded = showPromo
    return (
      <div ref={menuRef}>
        <div
          onClick={() => { onLoginClick(); onPromoDismiss() }}
          style={{
            ...PILL_BASE,
            width:        expanded ? 324 : 94,
            height:       expanded ? 48  : 28,
            borderRadius: expanded ? 16  : 99,
          }}
        >
          {/* ─── Compact state ─── */}
          {!expanded && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 13px',
              color: 'rgba(255,255,255,0.72)',
              animation: 'fadeIn 0.18s ease',
            }}>
              <IconPerson />
              <span style={{ fontSize: 11.5, fontWeight: 500, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                Sign in
              </span>
            </div>
          )}

          {/* ─── Expanded promo state ─── */}
          {expanded && (
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '0 16px', gap: 12, width: '100%',
              animation: 'fadeIn 0.28s ease 0.20s both',
            }}>
              {/* Left icon column */}
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: 'linear-gradient(135deg, rgba(224,17,95,0.25) 0%, rgba(224,17,95,0.10) 100%)',
                border: '0.5px solid rgba(224,17,95,0.22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#E0115F',
              }}>
                <IconSave />
              </div>

              {/* Copy */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', letterSpacing: '-0.018em', lineHeight: 1.25, marginBottom: 2 }}>
                  {msg.headline}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.42)', letterSpacing: '-0.005em', lineHeight: 1.3, fontWeight: 400 }}>
                  {msg.sub}
                </div>
              </div>

              {/* CTA */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#E0115F', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
                  Sign in free
                </span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
                {/* Dismiss */}
                <button
                  onClick={e => { e.stopPropagation(); onPromoDismiss() }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, marginLeft: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.25)', lineHeight: 1 }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ═══════════════════════  LOGGED IN  ═════════════════════════════════ */
  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      {/* Pill button */}
      <div
        onClick={() => { setMenuOpen(o => !o); setSaveOpen(false) }}
        style={{
          ...PILL_BASE,
          width: 'auto', minWidth: 120, height: 28, borderRadius: 99,
          padding: '0 10px 0 5px', gap: 7, justifyContent: 'flex-start',
        }}
      >
        {/* Avatar */}
        <div style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #C11054 0%, #E0115F 50%, #FF6B6B 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 700, color: '#fff', letterSpacing: '0.01em',
        }}>
          {user.avatar}
        </div>

        {/* Name */}
        <span style={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.80)', maxWidth: 88, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
          {user.name.split(' ')[0]}
        </span>

        {/* Separator */}
        <div style={{ width: 0.5, height: 12, background: 'rgba(255,255,255,0.12)', flexShrink: 0 }} />

        {/* Chevron */}
        <div style={{ color: 'rgba(255,255,255,0.35)', flexShrink: 0 }}>
          <IconChevron open={menuOpen} />
        </div>
      </div>

      {/* ─── Dropdown ─── */}
      {menuOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(180deg, #1E1E22 0%, #161618 100%)',
          border: '0.5px solid rgba(255,255,255,0.09)',
          borderRadius: 14,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3), 0 16px 48px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.05)',
          minWidth: 230, zIndex: 9000, overflow: 'hidden',
          animation: 'notchDropIn 0.22s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}>
          {/* User header */}
          <div style={{ padding: '14px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #C11054 0%, #E0115F 50%, #FF6B6B 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {user.avatar}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.90)', letterSpacing: '-0.02em' }}>{user.name}</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.32)', marginTop: 1, letterSpacing: '-0.005em' }}>{user.email}</div>
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#34C759', flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>
                {saved.length} design{saved.length !== 1 ? 's' : ''} saved
              </span>
            </div>
          </div>

          {/* Admin Dashboard button */}
          <a
            href="/admin"
            style={{
              width: '100%', padding: '11px 16px', fontSize: 12, fontWeight: 500,
              color: '#E0115F', background: 'none',
              border: 'none', cursor: 'pointer', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 9,
              borderBottom: '0.5px solid rgba(255,255,255,0.06)',
              textDecoration: 'none',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(224,17,95,0.06)'}
            onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.background = 'none'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            Admin Dashboard
          </a>

          {/* Save action */}
          {!saveOpen ? (
            <button
              onClick={() => setSaveOpen(true)}
              style={{
                width: '100%', padding: '11px 16px', fontSize: 12, fontWeight: 500,
                color: 'rgba(255,255,255,0.72)', background: 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                display: 'flex', alignItems: 'center', gap: 9,
                borderBottom: '0.5px solid rgba(255,255,255,0.06)',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
            >
              <span style={{ color: '#E0115F', display: 'flex' }}><IconSave /></span>
              Save current design
            </button>
          ) : (
            <div style={{ padding: '11px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
              {savedMsg ? (
                <div style={{ fontSize: 12, color: '#34C759', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {savedMsg}
                </div>
              ) : (
                <>
                  <input
                    autoFocus type="text" value={designName}
                    onChange={e => setDesignName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder="Name this design…"
                    style={{
                      width: '100%', height: 32, boxSizing: 'border-box',
                      background: 'rgba(255,255,255,0.06)',
                      border: '0.5px solid rgba(255,255,255,0.12)',
                      borderRadius: 8, padding: '0 10px',
                      fontSize: 12, color: 'rgba(255,255,255,0.85)',
                      fontFamily: 'inherit', marginBottom: 8,
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={handleSave} disabled={!designName.trim()} style={{ flex: 1, height: 28, borderRadius: 7, background: designName.trim() ? '#E0115F' : 'rgba(255,255,255,0.08)', color: designName.trim() ? '#fff' : 'rgba(255,255,255,0.3)', border: 'none', fontSize: 11.5, fontWeight: 600, cursor: designName.trim() ? 'pointer' : 'not-allowed', letterSpacing: '-0.01em' }}>Save</button>
                    <button onClick={() => { setSaveOpen(false); setDesignName('') }} style={{ height: 28, padding: '0 10px', borderRadius: 7, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: 'none', fontSize: 11.5, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Saved list */}
          {saved.length > 0 && (
            <div style={{ maxHeight: 148, overflowY: 'auto' }}>
              <div style={{ padding: '8px 16px 4px', fontSize: 9.5, fontWeight: 600, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                Saved Designs
              </div>
              {saved.map(d => (
                <div key={d.id} style={{ padding: '7px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.78)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{d.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.26)', marginTop: 1 }}>
                      {new Date(d.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={() => { onLogout(); setMenuOpen(false) }}
            style={{
              width: '100%', padding: '11px 16px', fontSize: 12, fontWeight: 400,
              color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none',
              cursor: 'pointer', textAlign: 'left',
              borderTop: '0.5px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 9,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = 'none'}
          >
            <IconSignOut /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
