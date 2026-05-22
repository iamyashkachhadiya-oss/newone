'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calcEPI } from '@/lib/calc/engine'

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [factoryName, setFactoryName] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Sanity check: calcEPI(60, 2) should return 60
    const epi = calcEPI(60, 2)
    console.log(`✅ FabricAI calcEPI(60, 2) = ${epi}`)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      // Insert user profile
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          name: fullName,
          factory_name: factoryName,
          city: 'Surat',
        })
      }
    }

    router.push('/dashboard')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img
            src="/logo.png"
            alt="FabricaAI Logo"
            style={{ width: 56, height: 56, display: 'inline-block', objectFit: 'cover', marginBottom: 16, borderRadius: 12 }}
          />
          <h1 style={{
            fontSize: 24, fontWeight: 700, color: 'var(--primary)',
            letterSpacing: '-0.02em',
          }}>
            FabricaAI Studio
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)', marginTop: 4 }}>
            Next-Gen Textile Design & Production
          </p>
        </div>

        {/* Auth Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 600, marginBottom: 24,
            color: 'var(--text-1)',
          }}>
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    required={!isLogin}
                  />
                </div>
                <div>
                  <label htmlFor="factoryName">Factory Name</label>
                  <input
                    id="factoryName"
                    type="text"
                    value={factoryName}
                    onChange={(e) => setFactoryName(e.target.value)}
                    placeholder="e.g. Shiv Textiles"
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@factory.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                color: '#C00E52',
                fontSize: 13,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: 4,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? (isLogin ? 'Signing in…' : 'Creating account…')
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid var(--border-light)',
          }}>
            <button
              onClick={() => { setIsLogin(!isLogin); setError('') }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {isLogin ? 'Don\'t have an account? Sign up' : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: 12,
          color: 'var(--text-3)',
          marginTop: 24,
        }}>
          Solerix Technologies · FabricaAI Studio v1.0
        </p>
      </div>
    </div>
  )
}
