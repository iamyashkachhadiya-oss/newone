'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import WeaveCanvas from './WeaveCanvas'

interface Variant {
  id: string
  design_name: string
  peg_plan_matrix: number[][]
}

interface VariantsPanelProps {
  draftId: string
  currentDesignId: string
  shaftCount: number
  onSwitchDesign: (id: string) => void
}

export default function VariantsPanel({ draftId, currentDesignId, shaftCount, onSwitchDesign }: VariantsPanelProps) {
  const [variants, setVariants] = useState<Variant[]>([])

  useEffect(() => {
    if (!draftId) return
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('designs')
        .select('id, design_name, peg_plan_matrix')
        .eq('draft_id', draftId)
        .order('created_at', { ascending: true })

      setVariants(data || [])
    }
    load()
  }, [draftId])

  const createVariant = async () => {
    const supabase = createClient()

    // Get current design data to duplicate
    const { data: current } = await supabase
      .from('designs')
      .select('*')
      .eq('id', currentDesignId)
      .single()

    if (!current) return

    const { data: newDesign } = await supabase
      .from('designs')
      .insert({
        draft_id: current.draft_id,
        user_id: current.user_id,
        design_name: `Variant ${variants.length + 1}`,
        design_number: `${current.design_number}-V${variants.length + 1}`,
        quality_name: current.quality_name,
        customer_ref: current.customer_ref,
        weave_matrix: current.weave_matrix,
        peg_plan_text: '',
        peg_plan_matrix: [],
        lifting_plan_matrix: [],
        repeat_w: 0,
        repeat_h: 0,
        version: 1,
      })
      .select()
      .single()

    if (newDesign) {
      setVariants((prev) => [...prev, { id: newDesign.id, design_name: newDesign.design_name, peg_plan_matrix: [] }])
      onSwitchDesign(newDesign.id)
    }
  }

  const generateVariations = async () => {
    const supabase = createClient()

    const { data: current } = await supabase
      .from('designs')
      .select('*')
      .eq('id', currentDesignId)
      .single()

    if (!current || !current.peg_plan_matrix?.length) return

    const matrix: number[][] = current.peg_plan_matrix
    const transforms: { name: string; fn: (m: number[][]) => number[][] }[] = [
      { name: 'H-Mirror', fn: (m) => m.map((row) => [...row].reverse()) },
      { name: 'V-Flip', fn: (m) => [...m].reverse() },
      { name: 'Phase+1', fn: (m) => m.map((row) => row.map((_, j) => row[(j + m[0].length - 1) % m[0].length])) },
      { name: 'Transpose', fn: (m) => m[0].map((_, c) => m.map((row) => row[c])) },
    ]

    for (const t of transforms) {
      const newMatrix = t.fn(matrix)
      const { data: newDesign } = await supabase
        .from('designs')
        .insert({
          draft_id: current.draft_id,
          user_id: current.user_id,
          design_name: `${current.design_name} — ${t.name}`,
          design_number: `${current.design_number}-${t.name.toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
          quality_name: current.quality_name,
          customer_ref: current.customer_ref,
          weave_matrix: current.weave_matrix,
          peg_plan_text: '',
          peg_plan_matrix: newMatrix,
          lifting_plan_matrix: [],
          repeat_w: newMatrix[0]?.length || 0,
          repeat_h: newMatrix.length,
          version: 1,
        })
        .select()
        .single()

      if (newDesign) {
        setVariants((prev) => [...prev, { id: newDesign.id, design_name: newDesign.design_name, peg_plan_matrix: newMatrix }])
      }
    }
  }

  if (!draftId) return null

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div className="section-header" style={{ marginBottom: 0 }}>Design Variants</div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={generateVariations} className="btn-secondary" style={{ fontSize: 11, height: 30 }}>
            Generate variations
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 8,
      }}>
        {variants.map((v) => (
          <div
            key={v.id}
            onClick={() => onSwitchDesign(v.id)}
            style={{
              minWidth: 140,
              width: 140,
              height: 160,
              borderRadius: 10,
              border: v.id === currentDesignId
                ? '2px solid var(--accent)'
                : '1.5px solid var(--border)',
              background: 'var(--surface)',
              padding: 10,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
              flexShrink: 0,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{
              flex: 1,
              borderRadius: 6,
              overflow: 'hidden',
              background: 'var(--bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {v.peg_plan_matrix?.length > 0 ? (
                <div style={{ transform: 'scale(0.45)', transformOrigin: 'center' }}>
                  <WeaveCanvas
                    matrix={v.peg_plan_matrix}
                    shaftCount={shaftCount}
                    readOnly
                  />
                </div>
              ) : (
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>Empty</span>
              )}
            </div>
            <div style={{
              fontSize: 11, fontWeight: 500, color: 'var(--text-1)',
              marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {v.design_name}
            </div>
            {v.id === currentDesignId && (
              <div style={{
                fontSize: 9, fontWeight: 600, color: 'var(--accent)',
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Active
              </div>
            )}
          </div>
        ))}

        {/* Add Variant Button */}
        <div
          onClick={createVariant}
          style={{
            minWidth: 140, width: 140, height: 160,
            borderRadius: 10, border: '1.5px dashed var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, color: 'var(--text-3)' }}>+</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>New Variant</div>
          </div>
        </div>
      </div>
    </div>
  )
}
