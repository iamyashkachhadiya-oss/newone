'use client'

import { useState } from 'react'

export interface FabricUser {
  id: string
  name: string
  email: string
  avatar: string
}

interface Props {
  onClose: () => void
  onLogin: (user: FabricUser) => void
}

export default function LoginModal({ onClose, onLogin }: Props) {
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const initials = (n: string) =>
    n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (tab === 'signup' && !name)  { setError('Please enter your name.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 900))

    const displayName = tab === 'signup' ? name : (email.split('@')[0])
    const user: FabricUser = {
      id: btoa(email),
      name: displayName,
      email,
      avatar: initials(displayName || email),
    }
    localStorage.setItem('fabricai_user', JSON.stringify(user))
    onLogin(user)
    setLoading(false)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(5,5,15,0.75)',
        backdropFilter: 'blur(18px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'lmFadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes lmFadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes lmSlideUp {
          from { opacity: 0; transform: translateY(28px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes lmOrb {
          0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.7; }
          50%       { transform: scale(1.15) rotate(180deg); opacity: 1; }
        }
        @keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes lmShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .lm-input {
          width: 100%; height: 48px;
          background: rgba(255,255,255,0.05) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
          padding: 0 44px 0 16px !important;
          font-size: 14px !important;
          color: #fff !important;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .lm-input::placeholder { color: rgba(255,255,255,0.28) !important; }
        .lm-input:focus {
          background: rgba(255,255,255,0.08) !important;
          border-color: rgba(224,17,95,0.6) !important;
          box-shadow: 0 0 0 3px rgba(224,17,95,0.15) !important;
        }
        .lm-tab {
          flex: 1; padding: 9px 0; font-size: 13px; font-weight: 500;
          border: none; background: transparent; cursor: pointer;
          border-radius: 8px; transition: all 0.2s; letter-spacing: -0.01em;
        }
        .lm-submit {
          width: 100%; height: 48px; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          letter-spacing: -0.01em; display: flex; align-items: center;
          justify-content: center; gap: 8px;
          transition: all 0.25s;
          position: relative; overflow: hidden;
        }
        .lm-submit:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(224,17,95,0.45) !important; }
        .lm-submit:not(:disabled):active { transform: translateY(0); }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 400,
          background: 'linear-gradient(160deg, #0f0f1a 0%, #161628 60%, #1a0f1f 100%)',
          borderRadius: 24,
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
          overflow: 'hidden',
          animation: 'lmSlideUp 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ── Decorative top glow ── */}
        <div style={{ position: 'relative', overflow: 'hidden', padding: '32px 32px 24px' }}>
          {/* Ambient orbs */}
          <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,17,95,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: -20, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

          {/* Brand */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #E0115F, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(224,17,95,0.4)',
              flexShrink: 0,
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16v16H4z"/><path d="M4 12h16M12 4v16" strokeDasharray="3 2"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', lineHeight: 1 }}>
                Fabric<span style={{ color: '#E0115F' }}>AI</span> Studio
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, letterSpacing: '0.02em' }}>
                Intelligent Textile Design Platform
              </div>
            </div>
            <button onClick={onClose} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'all 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 6 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
              {tab === 'signin' ? 'Welcome back' : 'Start for free'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 6 }}>
              {tab === 'signin' ? 'Sign in to access your designs & workspace' : 'Create your account and start designing today'}
            </div>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div style={{ padding: '0 32px 24px' }}>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3, border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['signin', 'signup'] as const).map(t => (
              <button key={t} className="lm-tab" onClick={() => { setTab(t); setError('') }} style={{
                color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
                background: tab === t ? 'rgba(255,255,255,0.1)' : 'transparent',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                fontWeight: tab === t ? 700 : 500,
              }}>
                {t === 'signin' ? '✦  Sign In' : '✧  Create Account'}
              </button>
            ))}
          </div>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} style={{ padding: '0 32px 32px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'signup' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 8, display: 'block', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input className="lm-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Yash Kachhadiya" autoFocus />
                <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              </div>
            </div>
          )}

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 8, display: 'block', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <input className="lm-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus={tab === 'signin'} />
              <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)', pointerEvents: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 8, display: 'block', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input className="lm-input" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" style={{ paddingRight: '44px' }} />
              <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 0, display: 'flex', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}
              >
                {showPass
                  ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Password strength bar (signup only) */}
          {tab === 'signup' && password.length > 0 && (
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 99,
                    background: password.length >= i * 2
                      ? i <= 1 ? '#FF3B30' : i <= 2 ? '#FF9500' : i <= 3 ? '#34C759' : '#10b981'
                      : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.3s',
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: password.length < 6 ? '#FF9500' : '#34C759', fontWeight: 500 }}>
                {password.length < 4 ? 'Weak' : password.length < 6 ? 'Almost there' : password.length < 10 ? 'Good' : 'Strong'}
              </div>
            </div>
          )}

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#FF6B6B', background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)', borderRadius: 10, padding: '10px 12px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" flexShrink={0}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="lm-submit"
            style={{
              marginTop: 4,
              background: loading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #E0115F 0%, #c0005a 100%)',
              color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(224,17,95,0.35)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: 'rgba(255,255,255,0.6)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                {tab === 'signin' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (
              <>
                {tab === 'signin' ? (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>Sign In</>
                ) : (
                  <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>Create Free Account</>
                )}
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: 500 }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            {tab === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError('') }}
              style={{ color: '#E0115F', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {tab === 'signin' ? 'Create one free →' : 'Sign in →'}
            </button>
          </div>

          {/* Trust line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', fontWeight: 500 }}>Your data is secure. No card required.</span>
          </div>
        </form>
      </div>
    </div>
  )
}
