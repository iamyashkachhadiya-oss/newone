'use client'

import { useDesignStore } from '@/lib/store/designStore'

export default function CostingPanel() {
  const calc = useDesignStore((s) => s.calcOutputs)
  const weftSystem = useDesignStore((s) => s.weftSystem)
  const warp = useDesignStore((s) => s.warp)

  if (!calc) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">Fabric Costing Analysis</div>

      {/* Hero Cost Display */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #1B1F3B 0%, #2A2F52 100%)', 
        color: 'white',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '24px 16px'
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Estimated Cost per Linear Meter
        </div>
        <div style={{ fontSize: 40, fontWeight: 700, margin: '8px 0', display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontSize: 24, opacity: 0.6 }}>$</span>
          {calc.cost_per_meter.toFixed(2)}
        </div>
        <div style={{ fontSize: 12, opacity: 0.8 }}>
          Raw Material Cost (Warp + Weft)
        </div>
      </div>

      {/* Cost Distribution Bar */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>
          <span>Warp ({calc.warp_cost_pct}%)</span>
          <span>Weft ({calc.weft_cost_pct}%)</span>
        </div>
        <div style={{ height: 10, background: 'var(--bg-darker)', borderRadius: 5, overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${calc.warp_cost_pct}%`, background: '#1B1F3B', height: '100%' }} />
          <div style={{ width: `${calc.weft_cost_pct}%`, background: '#E8A838', height: '100%' }} />
        </div>
      </div>

      {/* Itemized Breakdown */}
      <div>
        <div className="section-header" style={{ fontSize: 10, marginBottom: 12 }}>Itemized Breakdown (per Meter)</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Warp Item */}
          <CostEntry 
            label="Main Warp (Tana)" 
            weight={calc.warp_weight_per_100m_g / 100} 
            price={warp?.price_per_kg || 0} 
            total={(calc.warp_weight_per_100m_g / 100000) * (warp?.price_per_kg || 0)}
          />

          {/* Weft Items */}
          {weftSystem.yarns.map(yarn => {
            const weight = (calc.per_yarn_weft_weights?.[yarn.id] || 0) / 100
            if (weight <= 0) return null
            return (
              <CostEntry 
                key={yarn.id}
                label={yarn.label} 
                weight={weight} 
                price={yarn.price_per_kg} 
                total={(weight / 1000) * yarn.price_per_kg}
              />
            )
          })}
        </div>
      </div>

      {/* Engineering Insight */}
      <div style={{ 
        marginTop: 12, padding: 14, borderRadius: 10, 
        background: '#FFF9F0', border: '1px solid #FFE6C7',
        fontSize: 12, color: '#7A5C2D', lineHeight: 1.5 
      }}>
        <strong>💡 Optimization Tip:</strong> {calc.weft_cost_pct > 60 ? 
          "Weft cost is dominant. Consider optimizing zari density or using a thinner pattern yarn count to reduce fabric price." : 
          "Cost distribution is balanced. Good for standard high-quality exports."}
      </div>
    </div>
  )
}

function CostEntry({ label, weight, price, total }: { label: string; weight: number; price: number; total: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border-light)', borderRadius: 8 }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
          {weight.toFixed(2)}g @ ${price}/kg
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>
        ${total.toFixed(2)}
      </div>
    </div>
  )
}
