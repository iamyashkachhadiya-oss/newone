'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    
    // If no Supabase configured (placeholder), go to demo
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      router.replace('/demo')
      return
    }

    // Otherwise try auth check
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace('/dashboard')
        } else {
          router.replace('/auth')
        }
      }).catch(() => {
        router.replace('/demo')
      })
    }).catch(() => {
      router.replace('/demo')
    })
  }, [router])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <style>{`
          @keyframes fabricai-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.95); }
          }
        `}</style>
        <img
          src="/logo.png"
          alt="FabricaAI Logo"
          style={{
            width: 72, height: 72,
            display: 'block',
            margin: '0 auto 16px',
            animation: 'fabricai-pulse 1.6s ease-in-out infinite',
            borderRadius: 16
          }}
        />
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>Loading FabricaAI Studio…</p>
      </div>
    </div>
  )
}
