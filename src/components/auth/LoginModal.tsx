'use client'

import { useState } from 'react'

export interface FabricUser {
  id: string
  name: string
  email: string
  avatar: string // initials or URL
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

  const initials = (n: string) =>
    n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (tab === 'signup' && !name)  { setError('Please enter your name.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    await new Promise(r => setTimeout(r, 800)) // simulate network

    // Mock auth — store in localStorage
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
        background: 'rgba(10,10,20,0.50)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.18s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, width: '100%', maxWidth: 380,
          boxShadow: '0 32px 80px rgba(0,0,0,0.22)', overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Brand bar */}
        <div style={{
          background: 'linear-gradient(135deg, #1D1D1F 0%, #2D1B2E 100%)',
          padding: '22px 24px 18px',
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.04em', color: '#fff', marginBottom: 4 }}>
            Fabric<span style={{ color: '#E0115F' }}>AI</span> Studio
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>
            Save designs · Export reports · Access anywhere
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex', margin: '18px 20px 0',
          background: '#F2F2F7', borderRadius: 10, padding: 3,
        }}>
          {(['signin', 'signup'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex: 1, padding: '7px 0', fontSize: 13, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? '#1D1D1F' : '#8E8E93',
              background: tab === t ? '#fff' : 'transparent',
              border: 'none', borderRadius: 8, cursor: 'pointer',
              boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
              transition: 'all 0.15s',
            }}>
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tab === 'signup' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#6E6E73', marginBottom: 5, display: 'block', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Full Name
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Yash Kachhadiya" autoFocus
                style={{ width: '100%', height: 40, border: '1px solid #E5E5EA', borderRadius: 10, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6E6E73', marginBottom: 5, display: 'block', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Email
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" autoFocus={tab === 'signin'}
              style={{ width: '100%', height: 40, border: '1px solid #E5E5EA', borderRadius: 10, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#6E6E73', marginBottom: 5, display: 'block', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Password
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              style={{ width: '100%', height: 40, border: '1px solid #E5E5EA', borderRadius: 10, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {error && (
            <div style={{ fontSize: 12, color: '#E0115F', background: '#FFF1F5', border: '1px solid rgba(224,17,95,0.2)', borderRadius: 8, padding: '7px 11px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 42, borderRadius: 12, border: 'none',
              background: loading ? '#8E8E93' : 'var(--accent, #E0115F)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 4, letterSpacing: '-0.01em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'background 0.2s',
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                {tab === 'signin' ? 'Signing in…' : 'Creating account…'}
              </>
            ) : (
              tab === 'signin' ? 'Sign In' : 'Create Free Account'
            )}
          </button>

          <div style={{ textAlign: 'center', fontSize: 11, color: '#8E8E93', marginTop: 2 }}>
            {tab === 'signin' ? 'No account yet? ' : 'Already have one? '}
            <button type="button" onClick={() => { setTab(tab === 'signin' ? 'signup' : 'signin'); setError('') }}
              style={{ color: '#E0115F', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11 }}>
              {tab === 'signin' ? 'Create one free' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
