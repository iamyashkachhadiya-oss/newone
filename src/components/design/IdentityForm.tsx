'use client'

import { useDesignStore } from '@/lib/store/designStore'

export default function IdentityForm() {
  const identity = useDesignStore((s) => s.identity)
  const updateIdentity = useDesignStore((s) => s.updateIdentity)

  const fields = [
    { id: 'design-name',   label: 'Design Name',                 key: 'design_name',   placeholder: 'e.g. Pattu Dobby, Poly Stripe 24S' },
    { id: 'design-number', label: 'Design Number / Style Code',  key: 'design_number', placeholder: 'e.g. SD-2024-001' },
    { id: 'quality-name',  label: 'Quality Name',                key: 'quality_name',  placeholder: 'Grade reference for repeat orders' },
    { id: 'customer-ref',  label: 'Customer / Client Reference', key: 'customer_ref',  placeholder: 'Buyer name for sampling approval' },
  ] as const

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Section Title */}
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.02em', marginBottom: 3 }}>
          Design Identity
        </h2>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
          Project metadata and client references
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {fields.map(({ id, label, key, placeholder }) => (
          <div key={id}>
            <label htmlFor={id} style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 5, display: 'block' }}>
              {label}
            </label>
            <input
              id={id}
              type="text"
              value={(identity as unknown as Record<string, string>)[key] || ''}
              onChange={(e) => updateIdentity({ [key]: e.target.value })}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
