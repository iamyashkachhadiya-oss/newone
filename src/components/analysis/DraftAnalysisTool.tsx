'use client'

import { useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'

export default function DraftAnalysisTool() {
  const store = useDesignStore()
  const { draftSequence, setDraftSequence, shaftCount } = store
  const [seqOpen, setSeqOpen] = useState(false)  // Prompt 12: progressive disclosure

  const ends = draftSequence.length || shaftCount
  const shafts = shaftCount

  const setDraftCell = (endIndex: number, shaftIndex: number) => {
    const newDraft = [...draftSequence]
    newDraft[endIndex] = shaftIndex
    setDraftSequence(newDraft)
  }

  const handleRandomDraft = () =>
    setDraftSequence(Array.from({ length: ends }, () => Math.floor(Math.random() * shafts) + 1))

  const handleStraightDraft = () =>
    setDraftSequence(Array.from({ length: ends }, (_, i) => (i % shafts) + 1))

  const handlePointedDraft = () => {
    const seq: number[] = []
    let dir = 1, curr = 1
    for (let i = 0; i < ends; i++) {
      seq.push(curr)
      if (curr === shafts) dir = -1
      if (curr === 1 && i > 0) dir = 1
      curr += dir
    }
    setDraftSequence(seq)
  }

  return (
    <div style={{ color: 'var(--text-1)', fontFamily: 'var(--font-body)' }}>

      {/* Header — renamed to Threading Draft (Prompt 12) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-1)', letterSpacing: '-0.01em', marginBottom: 2 }}>
            Threading Draft
          </h3>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Click cells to assign shaft threading</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleStraightDraft} className="btn-secondary">Straight</button>
          <button onClick={handlePointedDraft} className="btn-secondary">Pointed</button>
          <button onClick={handleRandomDraft} className="btn-secondary">Random</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 w-full">

        {/* Threading Draft Grid */}
        <div className="flex-1 min-w-0" style={{
          border: '1px solid var(--border-light)',
          borderRadius: 12, padding: 14,
          background: 'var(--bg)',
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'var(--text-3)',
            letterSpacing: '0.07em', marginBottom: 12, textTransform: 'uppercase',
          }}>
            Threading Draft — Click to assign shaft
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: `28px repeat(${ends}, 22px)`, gap: 1 }}>
            {/* Header */}
            <div style={{ background: 'transparent' }} />
            {Array.from({ length: ends }).map((_, c) => (
              <div key={c} style={{
                background: 'rgba(0,0,0,0.04)',
                color: 'var(--text-3)', fontSize: 10, fontWeight: 600,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 22, borderRadius: 3,
              }}>
                {c + 1}
              </div>
            ))}

            {/* Rows */}
            {Array.from({ length: shafts }).map((_, r) => {
              const shaftNum = r + 1
              return (
                <div key={r} style={{ display: 'contents' }}>
                  <div style={{
                    background: 'rgba(0,0,0,0.04)',
                    color: 'var(--text-3)', fontSize: 10, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: 22, borderRadius: 3,
                  }}>
                    {shaftNum}
                  </div>
                  {Array.from({ length: ends }).map((_, c) => {
                    const isSelected = draftSequence[c] === shaftNum
                    return (
                      <div
                        key={c}
                        onClick={() => setDraftCell(c, shaftNum)}
                        style={{
                          background: isSelected ? 'var(--accent)' : 'var(--surface)',
                          border: '1px solid var(--border-light)',
                          height: 22,
                          cursor: 'pointer',
                          borderRadius: 2,
                          transition: 'background 0.1s',
                        }}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Draft Sequence Array — collapsed by default (Prompt 12) */}
        <div className="w-full lg:w-[256px] shrink-0" style={{
          border: '1px solid var(--border-light)',
          borderRadius: 12,
          background: 'var(--bg)',
          overflow: 'hidden',
        }}>
          {/* Collapsible header */}
          <button
            onClick={() => setSeqOpen(o => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', border: 'none', background: 'none', cursor: 'pointer',
            }}
            aria-expanded={seqOpen}
          >
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Sequence Data
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 500 }}>{draftSequence.length} ends</span>
              <span style={{ display: 'inline-block', transition: 'transform 0.2s ease', transform: seqOpen ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: 10, color: 'var(--text-3)' }}>▾</span>
            </div>
          </button>

          {/* Expandable content */}
          <div style={{
            overflow: 'hidden',
            maxHeight: seqOpen ? 240 : 0,
            opacity: seqOpen ? 1 : 0,
            transition: 'max-height 0.25s ease, opacity 0.2s ease',
          }}>
            <div style={{
              background: 'var(--surface)', borderTop: '1px solid var(--border-light)',
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)', fontSize: 12,
              color: 'var(--text-1)', lineHeight: 1.65,
              maxHeight: 200, overflowY: 'auto',
            }}>
              {draftSequence.map((sh, end) => (
                <div key={end} style={{ color: end % 2 === 0 ? 'var(--text-1)' : 'var(--text-2)' }}>
                  Warp {end + 1} &rarr; Shaft {sh}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
