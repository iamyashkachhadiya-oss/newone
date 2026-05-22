'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useSiteContext } from '@/hooks/useSiteContext'
import { useDesignStore } from '@/lib/store/designStore'
import { textToMatrix } from '@/lib/pegplan/parser'

// ─── Markdown Text Renderer (ChatGPT-style, no external deps) ────────────────
function MarkdownText({ text, color = '#222' }: { text: string; color?: string }) {
  // Split by newline and process each line
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Numbered list item: "1. " or "1) "
    const numberedMatch = trimmed.match(/^(\d+)[.)\s]\s*(.+)/)
    // Bullet item: "- " or "• " or "* "
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/)

    if (numberedMatch) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4, alignItems: 'flex-start' }}>
          <span style={{ fontWeight: 700, color: '#111', minWidth: 18, fontSize: 13, flexShrink: 0 }}>{numberedMatch[1]}.</span>
          <span style={{ flex: 1, lineHeight: 1.7 }}>{renderInline(numberedMatch[2])}</span>
        </div>
      )
    } else if (bulletMatch) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, alignItems: 'flex-start' }}>
          <span style={{ color: '#111', fontWeight: 800, fontSize: 15, marginTop: -1, flexShrink: 0 }}>·</span>
          <span style={{ flex: 1, lineHeight: 1.7 }}>{renderInline(bulletMatch[1])}</span>
        </div>
      )
    } else if (trimmed === '') {
      elements.push(<div key={i} style={{ height: 6 }} />)
    } else {
      elements.push(
        <div key={i} style={{ marginBottom: 2, lineHeight: 1.75 }}>{renderInline(trimmed)}</div>
      )
    }
    i++
  }

  return <div style={{ fontSize: 13, color, letterSpacing: '-0.01em' }}>{elements}</div>
}

// Render inline markdown: **bold**, *italic*, `code`
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  // Combined regex for **bold**, *italic*, `code`
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(<span key={key++}>{text.slice(last, match.index)}</span>)
    }
    if (match[1] !== undefined) {
      // **bold**
      parts.push(<strong key={key++} style={{ fontWeight: 700, color: '#1D1D1F' }}>{match[1]}</strong>)
    } else if (match[2] !== undefined) {
      // *italic*
      parts.push(<em key={key++} style={{ fontStyle: 'italic', color: '#555' }}>{match[2]}</em>)
    } else if (match[3] !== undefined) {
      // `code`
      parts.push(
        <code key={key++} style={{ background: 'rgba(0,0,0,0.07)', borderRadius: 4, padding: '1px 5px', fontSize: 11.5, fontFamily: 'monospace', color: '#111', fontWeight: 600 }}>{match[3]}</code>
      )
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>)
  return parts
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface DesignResult {
  motif?: string; placement?: string; repeat_pattern?: string
  pattern_style?: string; color_palette?: string[]; fabric_type?: string
  weave_type?: string; design_complexity?: string; notes?: string; answer?: string
  report?: {
    title: string; status: 'healthy' | 'warning' | 'error'
    summary: string
    sections: { label: string; value: string; flag: 'ok' | 'warn' | 'error' }[]
    recommendations: string[]
  }
  action?: {
    type: 'SET_PEG_PLAN' | 'UPDATE_LOOM' | 'SET_SHAFT_COUNT' | 'NAVIGATE'
    description: string
    payload: Record<string, unknown>
  }
  /** Populated when the deterministic nlpBridge ran server-side */
  bridge?: {
    displayName: string
    shaftCount: number
    loomTarget: 'dobby' | 'jacquard'
    interlacement: string
    maxFloat: number
    repeatSize: string
    warnings: string[]
    errors: string[]
  }
}
interface ChatMessage {
  role: 'user' | 'ai'; text?: string; result?: DesignResult
  loading?: boolean; error?: boolean; warning?: boolean
  imageResult?: { thumbnailUrl: string; matrix: number[][]; text: string; cols: number; rows: number }
}
interface DesignWarning { id: string; message: string; severity: 'warn' | 'error' }

// ─── Weave Engine Card ────────────────────────────────────────────────────────
function WeaveCard({ b }: { b: NonNullable<DesignResult['bridge']> }) {
  const loomColor = b.loomTarget === 'jacquard' ? '#E0115F' : '#7c3aed'
  const floatOk   = b.maxFloat <= 6
  const hasIssues = b.errors.length > 0 || b.warnings.length > 0
  
  const safePct = floatOk ? 100 : (b.maxFloat < 12 ? 65 : 40)
  const warnPct = floatOk ? 0 : (b.maxFloat < 12 ? 30 : 45)
  const errPct = 100 - safePct - warnPct

  return (
    <div style={{ marginTop: 16, background: '#fff', borderRadius: 16, border: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(0,0,0,0.04)', background: '#fafafa' }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: `linear-gradient(135deg, ${loomColor}, #222)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Engine Output</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, padding: '4px 10px', borderRadius: 99, background: 'rgba(52, 199, 89, 0.1)', color: '#28A745', letterSpacing: '0.05em' }}>COMPLETED</span>
      </div>

      {/* Grid Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', padding: '16px' }}>
        {[
          ['Design', b.displayName],
          ['Repeat', b.repeatSize],
          ['Shafts Req.', `${b.shaftCount} (${b.loomTarget})`],
          ['Interlace', b.interlacement],
          ['Max Float', `${b.maxFloat} px`, floatOk],
          ['Warnings', String(b.warnings.length), b.warnings.length === 0],
        ].map(([label, val, ok]) => (
          <div key={label as string} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: ok === false ? '#FF3B30' : (ok === true && label === 'Warnings' ? '#34C759' : '#111') }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Float Distribution Chart */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Float Distribution</div>
        <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', background: '#eee' }}>
          {safePct > 0 && <div style={{ width: `${safePct}%`, background: '#34C759' }} />}
          {warnPct > 0 && <div style={{ width: `${warnPct}%`, background: '#FF9500' }} />}
          {errPct > 0 && <div style={{ width: `${errPct}%`, background: '#FF3B30' }} />}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, fontWeight: 500, color: '#666' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34C759' }}/>1-6px ({safePct}%)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF9500' }}/>7-12px ({warnPct}%)</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF3B30' }}/>13px+ ({errPct}%)</span>
        </div>
      </div>

      {/* Warnings block */}
      {hasIssues && (
        <div style={{ padding: '12px 16px', background: 'rgba(255, 149, 0, 0.05)', borderTop: '1px solid rgba(255, 149, 0, 0.1)' }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Analysis Warnings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {b.errors.map((e, i) => <div key={i} style={{ fontSize: 11, color: '#FF3B30', display: 'flex', gap: 6, fontWeight: 500 }}><span style={{marginTop: 1}}>❌</span> <span>{e}</span></div>)}
            {b.warnings.map((w, i) => <div key={i} style={{ fontSize: 11, color: '#d97706', display: 'flex', gap: 6, fontWeight: 500 }}><span style={{marginTop: 1}}>⚠️</span> <span>{w}</span></div>)}
          </div>
        </div>
      )}

      {/* Actions Grid */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.04)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#fafafa' }}>
        {[
          { icon: '👁️', label: 'Preview on canvas' },
          { icon: '📥', label: 'Export peg plan' },
          { icon: '📊', label: 'View float map' },
          { icon: '💾', label: 'Save to library' },
        ].map(act => (
          <button key={act.label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 8, fontSize: 11, fontWeight: 600, color: '#444', cursor: 'pointer', transition: 'all 0.15s' }} 
            onMouseEnter={e => e.currentTarget.style.borderColor = loomColor} 
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'}>
            <span style={{ fontSize: 12 }}>{act.icon}</span> {act.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Action Card ─────────────────────────────────────────────────────────────
function ActionCard({ a, answer }: { a: NonNullable<DesignResult['action']>; answer?: string }) {
  const iconPaths: Record<string, any> = { 
    SET_PEG_PLAN: <path d="M4 4h16v16H4zM4 12h16M12 4v16"/>, 
    UPDATE_LOOM: <circle cx="12" cy="12" r="10"/>, 
    SET_SHAFT_COUNT: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>, 
    NAVIGATE: <polygon points="3 11 22 2 13 21 11 13 3 11"/> 
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingBottom: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(16,185,129,0.3)' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {iconPaths[a.type] ?? <polyline points="20 6 9 17 4 12"/>}
          </svg>
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Action Applied</span>
        <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>{a.type.replace(/_/g, ' ')}</span>
      </div>
      <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6, fontWeight: 500 }}>{a.description}</div>
      {answer && <MarkdownText text={answer} />}
    </div>
  )
}

// ─── Report Card ─────────────────────────────────────────────────────────────
function ReportCard({ r }: { r: NonNullable<DesignResult['report']> }) {
  const sc: Record<string, string> = { healthy: '#10b981', warning: '#f59e0b', error: '#ef4444' }
  const bgC: Record<string, string> = { healthy: 'rgba(16, 185, 129, 0.1)', warning: 'rgba(245, 158, 11, 0.1)', error: 'rgba(239, 68, 68, 0.1)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#111', letterSpacing: '-0.01em' }}>Design Report</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: bgC[r.status] || '#f5f5f5', color: sc[r.status] || '#666', textTransform: 'lowercase' }}>{r.status}</span>
      </div>

      {/* Summary */}
      <div style={{ fontSize: 13, color: '#333', lineHeight: 1.6, fontWeight: 400 }}>{r.summary}</div>

      {/* Sections Grid */}
      {r.sections?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {r.sections.map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '-0.01em' }}>{s.label}</span>
              <span style={{ fontSize: 13, color: '#666', lineHeight: 1.4 }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {r.recommendations?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '-0.01em', marginBottom: 2 }}>Recommendations</span>
          {r.recommendations.map((rec, i) => (
            <div key={i} style={{ fontSize: 13, color: '#666', lineHeight: 1.5, display: 'flex', gap: 6 }}>
              <span>•</span>
              <span>{rec}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Design Card ─────────────────────────────────────────────────────────────
function DesignCard({ r }: { r: DesignResult }) {
  if (r.answer) return <MarkdownText text={r.answer} />

  const rows = [
    { k: 'Motif', v: r.motif }, { k: 'Placement', v: r.placement },
    { k: 'Repeat', v: r.repeat_pattern }, { k: 'Style', v: r.pattern_style },
    { k: 'Fabric', v: r.fabric_type }, { k: 'Weave', v: r.weave_type },
  ]
  const cc: Record<string, string> = { simple: '#16a34a', moderate: '#d97706', complex: '#111', 'highly complex': '#111' }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(0,0,0,0.07)', marginBottom: 2 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: '#111', textTransform: 'uppercase', letterSpacing: '0.1em' }}> Design Spec</span>
        {r.design_complexity && (
          <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: `${cc[r.design_complexity] ?? '#888'}14`, color: cc[r.design_complexity] ?? '#888', border: `1px solid ${cc[r.design_complexity] ?? '#888'}30`, textTransform: 'capitalize' }}>{r.design_complexity}</span>
        )}
      </div>
      {rows.filter(r => r.v).map(({ k, v }) => (
        <div key={k} style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.35)', minWidth: 62, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 1 }}>{k}</span>
          <span style={{ fontSize: 12, color: '#1D1D1F', lineHeight: 1.5, flex: 1 }}>{v}</span>
        </div>
      ))}
      {r.color_palette?.length && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,0,0,0.35)', minWidth: 62, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Colors</span>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {r.color_palette.map((c, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: 'rgba(0,0,0,0.05)', color: '#333', border: '1px solid rgba(0,0,0,0.1)' }}>{c}</span>
            ))}
          </div>
        </div>
      )}
      {r.notes && (
        <div style={{ marginTop: 6, padding: '8px 10px', background: 'rgba(224,17,95,0.04)', borderRadius: 8, border: '1px solid rgba(224,17,95,0.12)', fontSize: 11, color: '#555', lineHeight: 1.6 }}>
          <span style={{ fontWeight: 700, color: '#111' }}>Notes: </span>{r.notes}
        </div>
      )}
    </div>
  )
}

// ─── Image → Peg Plan Converter (Zero API, pure browser canvas) ──────────────
async function convertImageToPegPlan(
  file: File,
  gridSize: number,
  threshold: number = 128
): Promise<{ thumbnailUrl: string; matrix: number[][]; text: string; cols: number; rows: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const thumbnailUrl = URL.createObjectURL(file)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = gridSize
      canvas.height = gridSize
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('No canvas')); return }

      // Draw image scaled to gridSize×gridSize
      ctx.drawImage(img, 0, 0, gridSize, gridSize)
      const { data } = ctx.getImageData(0, 0, gridSize, gridSize)

      const matrix: number[][] = []
      const lines: string[] = []

      for (let r = 0; r < gridSize; r++) {
        const row: number[] = []
        const raised: number[] = []
        for (let c = 0; c < gridSize; c++) {
          const idx = (r * gridSize + c) * 4
          // Grayscale luminance (NTSC)
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
          const val = gray < threshold ? 1 : 0
          row.push(val)
          if (val === 1) raised.push(c + 1)
        }
        matrix.push(row)
        lines.push(`${r + 1}-->${raised.join(',')}`)
      }

      resolve({ thumbnailUrl, matrix, text: lines.join('\n'), cols: gridSize, rows: gridSize })
    }
    img.onerror = reject
    img.src = thumbnailUrl
  })
}

// ─── Image Result Card ────────────────────────────────────────────────────────
function ImageCard({ r }: { r: NonNullable<ChatMessage['imageResult']> }) {
  const store = useDesignStore()
  const [applied, setApplied] = React.useState(false)
  const density = r.matrix.flat().filter(v => v === 1).length / (r.cols * r.rows)

  const handleApply = () => {
    // CRITICAL ORDER: Set text first, so setShaftCount re-parses correctly
    store.setPegPlan(r.text, r.matrix)
    store.setShaftCount(r.cols)
    setApplied(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #E0115F, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(224,17,95,0.4)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>Image Converted</span>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Successfully generated peg plan</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>{r.cols}×{r.rows} Grid</span>
      </div>

      {/* Side-by-side: original + grid preview */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        {/* Original thumbnail */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Original Image</div>
          <div style={{ flex: 1, minHeight: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {r.thumbnailUrl ? (
              <img src={r.thumbnailUrl} alt="Original" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Source Image</span>
            )}
          </div>
        </div>

        {/* Binary grid mini-preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Generated Weave</div>
          <div style={{
            flex: 1,
            display: 'grid',
            gridTemplateColumns: `repeat(${r.cols}, 1fr)`,
            gap: 0, borderRadius: 8, overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.15)',
            aspectRatio: '1', background: 'rgba(255,255,255,0.1)'
          }}>
            {r.matrix.flat().map((v, i) => (
              <div key={i} style={{ background: v === 1 ? '#fff' : 'transparent', aspectRatio: '1' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 500, padding: '8px 0', background: 'rgba(255,255,255,0.06)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }}/>
          {r.rows} picks × {r.cols} shafts
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E0115F' }}/>
          {Math.round(density * 100)}% warp density
        </div>
      </div>

      {/* Apply button */}
      <button
        onClick={handleApply}
        disabled={applied}
        style={{
          width: '100%', padding: '10px 0', borderRadius: 8, cursor: applied ? 'default' : 'pointer',
          background: applied ? 'rgba(22,163,74,0.15)' : '#fff',
          color: applied ? '#4ade80' : '#111',
          fontSize: 13, fontWeight: 700,
          border: applied ? '1px solid rgba(74,222,128,0.4)' : '1px solid rgba(255,255,255,0.8)',
          boxShadow: applied ? 'none' : '0 4px 15px rgba(0,0,0,0.15)',
          transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}
      >
        {applied ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Applied to Workspace
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            Apply to Peg Plan
          </>
        )}
      </button>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#111', animation: `jdot 1.2s ${i * 0.2}s infinite`, opacity: 0.7 }} />
      ))}
      <style>{`@keyframes jdot{0%,80%,100%{transform:translateY(0);opacity:.5}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}

// ─── Orb FAB ─────────────────────────────────────────────────────────────────
function OrbButton({ onClick, warnings }: { onClick: () => void; warnings: DesignWarning[]; side: 'left' | 'right' }) {
  const [showWelcome, setShowWelcome] = useState(false)
  const [hovered, setHovered] = useState(false)
  
  useEffect(() => {
    const showTimer = setTimeout(() => setShowWelcome(true), 1400)
    const hideTimer = setTimeout(() => setShowWelcome(false), 6000)
    return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
  }, [])

  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9998 }}>
      <style>{`
        @keyframes aiCorePulse {
          0%   { box-shadow: 0 0 0 0 rgba(224,17,95,0.4), 0 8px 32px rgba(0,0,0,0.3); }
          70%  { box-shadow: 0 0 0 14px rgba(224,17,95,0), 0 8px 32px rgba(0,0,0,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(224,17,95,0), 0 8px 32px rgba(0,0,0,0.3); }
        }
        @keyframes aiRingSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbWelcomeFadeIn {
          from { opacity: 0; transform: translateY(8px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-4px); }
        }
        .orb-fab {
          width: 56px; height: 56px; border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(135deg, #1a0a2e 0%, #0f172a 50%, #1e0a3c 100%);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: visible;
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
          animation: aiCorePulse 2.8s ease-out infinite;
        }
        .orb-fab:hover {
          transform: scale(1.1) translateY(-2px) !important;
          box-shadow: 0 12px 40px rgba(224,17,95,0.5), 0 4px 16px rgba(0,0,0,0.3) !important;
        }
        .orb-fab:active { transform: scale(0.96) !important; }
      `}</style>

      {/* Tooltip above */}
      {(showWelcome || hovered) && (
        <div
          onClick={() => { onClick(); setShowWelcome(false) }}
          style={{
            position: 'absolute', bottom: 68, right: 0,
            background: 'linear-gradient(135deg, #0f0f1a, #1a0f2e)',
            color: '#fff',
            padding: '13px 16px', borderRadius: 14, width: 230,
            fontSize: 12, lineHeight: 1.6, fontWeight: 500,
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04) inset',
            animation: 'orbWelcomeFadeIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards',
            cursor: 'pointer',
          }}
        >
          {/* caret */}
          <div style={{ position: 'absolute', bottom: -6, right: 22, width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1a0f2e' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: 6, background: 'linear-gradient(135deg, #E0115F, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span style={{ color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: 9 }}>Design Assistant · Jarvis</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Let&rsquo;s make some crazy fabric designs together! ✦</div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Press</span>
            <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 4, padding: '1px 5px', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>⌘J</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>to open anytime</span>
          </div>
        </div>
      )}

      <button
        className="orb-fab"
        onClick={() => { onClick(); setShowWelcome(false) }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Open AI Design Assistant (⌘J)"
      >
        {/* Spinning rings */}
        <div style={{ position: 'absolute', inset: 3, borderRadius: '50%', border: '1.5px dashed rgba(56,189,248,0.45)', borderTopColor: '#E0115F', animation: 'aiRingSpin 5s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 7, borderRadius: '50%', border: '1px solid rgba(124,58,237,0.45)', borderLeftColor: '#38bdf8', animation: 'aiRingSpin 3s linear infinite reverse' }} />
        {/* Core glow */}
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'radial-gradient(circle, #fff 30%, #38bdf8 70%)', boxShadow: '0 0 10px 4px rgba(56,189,248,0.6), 0 0 18px rgba(224,17,95,0.5)', position: 'relative', zIndex: 1 }} />
      </button>

      {/* Warning badge */}
      {warnings.length > 0 && (
        <div style={{ position: 'absolute', top: -3, right: -3, width: 18, height: 18, background: '#FF3B30', borderRadius: '50%', border: '2px solid #fff', fontSize: 9, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, boxShadow: '0 2px 8px rgba(255,59,48,0.4)' }}>{warnings.length}</div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function GlobalAIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [side, setSide] = useState<'left' | 'right'>('right')
  const [panelWidth, setPanelWidth] = useState(400)
  const [chatLog, setChatLog] = useState<ChatMessage[]>([{
    role: 'ai',
    text: `Hi! I'm Design Assistant — your intelligent design assistant.\n\nI monitor your workspace in real time and warn you about design errors. Ask me anything while you keep working — the panel stays open beside your canvas.\n\nTry: "Evaluate my border design" or "What weave suits this motif?"`,
  }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toPromptString, snapshot } = useSiteContext()
  const store = useDesignStore()
  const [warnings, setWarnings] = useState<DesignWarning[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resizeRef = useRef<{ startX: number; startW: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)
  const [imgProcessing, setImgProcessing] = useState(false)
  const [imgGridSize, setImgGridSize] = useState(16)

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') { e.preventDefault(); setIsOpen(v => !v) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'l' && isOpen) { e.preventDefault(); setChatLog([{ role: 'ai', text: 'Chat cleared. Ready.' }]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  useEffect(() => {
    if (isOpen) { setTimeout(() => inputRef.current?.focus(), 80); chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }
  }, [isOpen, chatLog])

  // ── Panel resize drag ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isResizing) return
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return
      const delta = side === 'right' ? resizeRef.current.startX - e.clientX : e.clientX - resizeRef.current.startX
      setPanelWidth(Math.max(300, Math.min(720, resizeRef.current.startW + delta)))
    }
    const onUp = () => setIsResizing(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [isResizing, side])


  useEffect(() => {
    const h = (e: Event) => { const text = (e as CustomEvent).detail?.text; if (text) setChatLog(prev => [...prev, { role: 'ai', text }]) }
    window.addEventListener('ai-response', h)
    return () => window.removeEventListener('ai-response', h)
  }, [])

  // ── Proactive warnings ────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: Event) => {
      const result = (e as CustomEvent).detail?.result as DesignResult | undefined
      if (!result) return
      const add: DesignWarning[] = []
      if (result.design_complexity === 'highly complex') add.push({ id: 'hc', severity: 'warn', message: 'Highly complex design — confirm your loom supports the required shaft count.' })
      if (result.weave_type === 'jacquard' && result.fabric_type?.includes('georgette')) add.push({ id: 'jg', severity: 'error', message: 'Jacquard + Georgette is high risk — open weave structure may distort at high shaft counts.' })
      if (result.notes?.toLowerCase().includes('300')) add.push({ id: 'hd', severity: 'warn', message: 'Thread density > 300/inch detected — verify your reed capacity.' })
      if (add.length) setWarnings(prev => { const ids = new Set(prev.map(w => w.id)); return [...prev, ...add.filter(w => !ids.has(w.id))] })
    }
    window.addEventListener('ai-design-update', h)
    return () => window.removeEventListener('ai-design-update', h)
  }, [])

  // ── Execute site actions ─────────────────────────────────────────────────
  const executeAction = useCallback((action: NonNullable<DesignResult['action']>) => {
    const { type, payload } = action
    try {
      if (type === 'SET_PEG_PLAN') {
        const text = (payload.text as string) ?? ''
        const shaftCount = (payload.shaftCount as number) ?? store.shaftCount ?? 16
        // ✅ CRITICAL ORDER: set peg plan text FIRST so editor has correct text,
        // THEN update shaftCount — if reversed, editor re-parses OLD text with new
        // shaft count causing a corrupted output (e.g. 8-pick plain weave instead of 4-pick twill)
        const matrix = textToMatrix(text, shaftCount)
        store.setPegPlan(text, matrix)
        if (shaftCount && shaftCount !== store.shaftCount) {
          store.setShaftCount(shaftCount)
        }
        // ✅ Apply warp / weft colours from AI prompt (e.g. "pink weft, yellow warp")
        const warpHex = payload.warpColorHex as string | undefined
        const weftHex = payload.weftColorHex as string | undefined
        if (warpHex) {
          const firstWarp = store.warpSystem?.yarns?.[0]
          if (firstWarp?.id) store.updateWarpYarn(firstWarp.id, { colour_hex: warpHex })
        }
        if (weftHex) {
          const firstWeft = store.weftSystem?.yarns?.[0]
          if (firstWeft?.id) store.updateWeftYarn(firstWeft.id, { colour_hex: weftHex })
        }
      } else if (type === 'UPDATE_LOOM') {
        store.updateLoom(payload as Parameters<typeof store.updateLoom>[0])
      } else if (type === 'SET_SHAFT_COUNT') {
        store.setShaftCount(payload.count as number)
      } else if (type === 'NAVIGATE') {
        // Dispatch to the tab system
        window.dispatchEvent(new CustomEvent('ai-navigate', { detail: { tab: payload.tab } }))
      }
    } catch (e) {
      console.warn('[Design Assistant] Action failed:', e)
    }
  }, [store])

  // ── Image upload → Peg Plan ───────────────────────────────────────────────
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset so same file can be re-selected

    setImgProcessing(true)
    setChatLog(prev => [...prev,
      { role: 'user', text: ` Image uploaded: ${file.name} (converting to ${imgGridSize}×${imgGridSize} peg plan…)` },
      { role: 'ai', loading: true },
    ])

    try {
      const result = await convertImageToPegPlan(file, imgGridSize)
      setChatLog(prev => [
        ...prev.slice(0, -1),
        {
          role: 'ai',
          text: `Converted **${file.name}** to a **${result.rows}×${result.cols}** peg plan grid. Dark pixels become warp-up (1), light pixels become weft-up (0). Click Apply to load it into your design!`,
          imageResult: result,
        }
      ])
    } catch {
      setChatLog(prev => [...prev.slice(0, -1), { role: 'ai', text: 'Error: Could not process image. Please try a PNG or JPG.', error: true }])
    } finally {
      setImgProcessing(false)
    }
  }, [imgGridSize])

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isLoading) return
    const history = chatLog
      .filter(m => !m.loading && !m.error && (m.text || m.result))
      .map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text ?? (m.result ? JSON.stringify(m.result) : '') }))
    setInput('')
    setIsLoading(true)
    setChatLog(prev => [...prev, { role: 'user', text }, { role: 'ai', loading: true }])
    window.dispatchEvent(new CustomEvent('ai-command', { detail: { text } }))
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          context: snapshot.activeSection,
          siteContext: `${toPromptString()}\n[UI State: The user has explicitly selected a ${imgGridSize}x${imgGridSize} grid in the UI controls. If they ask to generate a peg plan, YOU MUST use exactly ${imgGridSize} shafts and a ${imgGridSize} pick repeat.]`,
        })
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setChatLog(prev => [...prev.slice(0, -1), { role: 'ai', text: data.error ?? 'Something went wrong.', error: true }])
      } else {
        const result = data.result as DesignResult
        // Execute any site action BEFORE updating chat
        if (result?.action) {
          executeAction(result.action)
        }
        setChatLog(prev => [...prev.slice(0, -1), { role: 'ai', result }])
        window.dispatchEvent(new CustomEvent('ai-design-update', { detail: { result } }))
      }
    } catch {
      setChatLog(prev => [...prev.slice(0, -1), { role: 'ai', text: 'Network error.', error: true }])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, chatLog, snapshot, toPromptString, executeAction])

  const isLeft = side === 'left'
  const borderEdge = isLeft ? 'borderRight' : 'borderLeft'

  return (
    <>
      <style>{`
        @keyframes panelslide-right{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes panelslide-left{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes msgin{from{transform:translateY(6px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .jmsg{animation:msgin 0.2s ease}
        .jchip:hover{background:rgba(224,17,95,0.06)!important;border-color:rgba(224,17,95,0.3)!important;color:#111!important}
      `}</style>

      {/* Warning toasts */}
      {warnings.slice(0, 1).map(w => (
        <div key={w.id} style={{
          position: 'fixed', bottom: 96, [isLeft ? 'left' : 'right']: 28, zIndex: 9997,
          background: w.severity === 'error' ? '#FF3B30' : '#FF9F0A',
          color: '#fff', padding: '10px 14px', borderRadius: 12, maxWidth: 280,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)', display: 'flex', gap: 8, alignItems: 'flex-start',
          fontSize: 12, lineHeight: 1.5, animation: 'msgin 0.3s ease',
        }}>
          <span style={{ fontSize: 15, flexShrink: 0 }}>{w.severity === 'error' ? '' : ''}</span>
          <div><div style={{ fontWeight: 700, marginBottom: 2 }}>Design Warning</div><div style={{ opacity: 0.92 }}>{w.message}</div></div>
          <button onClick={() => setWarnings(p => p.filter(x => x.id !== w.id))} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: 14, padding: 0, marginLeft: 2 }}>✕</button>
        </div>
      ))}

      {/* FAB */}
      {!isOpen && <OrbButton onClick={() => setIsOpen(true)} warnings={warnings} side={side} />}

      {/* Side Panel — non-blocking (no backdrop) so user can interact with site */}
      {isOpen && (
        <div style={{
          position: 'fixed', top: 0, bottom: 0, [side]: 0,
          width: panelWidth,
          background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(30px) saturate(200%)',
          [borderEdge]: '1px solid rgba(0,0,0,0.1)',
          zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          boxShadow: isLeft ? '4px 0 24px rgba(0,0,0,0.08)' : '-4px 0 24px rgba(0,0,0,0.08)',
          animation: `panelslide-${side} 0.28s cubic-bezier(0.32,0.72,0,1)`,
        }}>

          {/* Drag-to-resize handle on the inner edge */}
          <div
            onPointerDown={e => {
              e.preventDefault()
              setIsResizing(true)
              resizeRef.current = { startX: e.clientX, startW: panelWidth }
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            style={{
              position: 'absolute', top: 0, bottom: 0,
              [isLeft ? 'right' : 'left']: 0,
              width: 6, cursor: 'ew-resize', zIndex: 10,
              background: isResizing ? 'rgba(224,17,95,0.15)' : 'transparent',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,17,95,0.1)'}
            onMouseLeave={e => { if (!isResizing) e.currentTarget.style.background = 'transparent' }}
          />

          {/* ── Header ── */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.05)', background: '#fff', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Logo */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #312E81, #4C1D95)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', boxShadow: '0 2px 8px rgba(76,29,149,0.2)' }}>AI</div>
              </div>

              {/* Title */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111', letterSpacing: '-0.01em' }}>Design Assistant</div>
                <div style={{ fontSize: 11, color: '#666', fontWeight: 500 }}>Your weaving expert</div>
              </div>

              {/* Controls */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', color: '#888' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <button onClick={() => setIsOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            {/* Context bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.6)', border: '1px solid #eee', borderRadius: 6, padding: '6px 10px', marginTop: 12 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#111', display: 'none', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#777', fontWeight: 500 }}>Live in</span>
              <span style={{ fontSize: 11, color: '#333', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{snapshot.activeSection}</span>
              <span style={{ fontSize: 10, color: '#999', whiteSpace: 'nowrap' }}>⌘J · ⌘L</span>
            </div>
          </div>
          {/* ── Chat log ── */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16, background: 'transparent' }}>
            {chatLog.map((msg, i) => (
              <div key={i} className="jmsg" style={{ display: 'flex', gap: 8, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start' }}>
                {msg.role === 'ai' && (
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, #E0115F, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <div style={{fontSize:10, fontWeight: 600, color:"#fff"}}>AI</div>
                  </div>
                )}
                <div style={{
                  maxWidth: '86%',
                  padding: msg.result ? '11px 13px' : '10px 14px',
                  fontSize: 13, lineHeight: 1.65,
                  background: msg.role === 'user' ? 'linear-gradient(135deg, #FFF0F5, #FCE7F3)' : 'rgba(255,255,255,0.65)',
                  color: msg.role === 'user' ? '#4c1d95' : '#111',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '14px 14px 14px 3px',
                  boxShadow: msg.role === 'user' ? '0 2px 10px rgba(224,17,95,0.06)' : '0 2px 12px rgba(0,0,0,0.06)',
                  border: msg.role === 'ai' ? '1px solid #eee' : '1px solid rgba(224,17,95,0.1)',
                  borderLeft: msg.error ? '3px solid #FF3B30' : undefined,
                  whiteSpace: msg.result ? undefined : 'pre-wrap',
                }}>
                  {msg.loading && <TypingDots />}
                  {msg.imageResult && <ImageCard r={msg.imageResult} />}
                  {msg.result?.action && <ActionCard a={msg.result.action} answer={msg.result.answer} />}
                  {msg.result?.bridge && <WeaveCard b={msg.result.bridge} />}
                  {msg.result?.report && !msg.result.action && <ReportCard r={msg.result.report} />}
                  {msg.result && !msg.result.report && !msg.result.action && !msg.result.bridge && <DesignCard r={msg.result} />}
                  {msg.text && !msg.loading && (
                    msg.role === 'user'
                      ? (
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: 13, lineHeight: 1.65 }}>{msg.text}</span>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                              <span style={{ fontSize: 9, color: '#E0115F', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                                10:24 AM <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/><polyline points="20 10 15 15" opacity="0.4"/></svg>
                              </span>
                            </div>
                          </div>
                        )
                      : <MarkdownText text={msg.text} />
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} style={{ height: 8 }} />
          </div>

          {/* Active warnings */}
          {warnings.length > 0 && (
            <div style={{ padding: '12px 16px 0', flexShrink: 0, background: 'transparent' }}>
              {warnings.map(w => (
                <div key={w.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: w.severity === 'error' ? 'rgba(255,59,48,0.06)' : 'rgba(255,159,10,0.06)', border: `1px solid ${w.severity === 'error' ? 'rgba(255,59,48,0.2)' : 'rgba(255,159,10,0.2)'}`, borderRadius: 9, padding: '7px 10px', marginBottom: 5 }}>
                  <span style={{ fontSize: 12 }}>{w.severity === 'error' ? '' : ''}</span>
                  <span style={{ fontSize: 11, color: '#444', lineHeight: 1.5, flex: 1 }}>{w.message}</span>
                  <button onClick={() => setWarnings(p => p.filter(x => x.id !== w.id))} style={{ background: 'none', border: 'none', color: 'rgba(0,0,0,0.3)', cursor: 'pointer', fontSize: 12, padding: 0 }}>✕</button>
                </div>
              ))}
            </div>
          )}

          {/* Quick chips */}
          <div style={{ padding: '12px 16px 8px', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, background: 'transparent' }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Evaluate my design', 'Suggest colors', 'Check loom settings'].map(q => (
                <button key={q} className="jchip" onClick={() => { setInput(q); inputRef.current?.focus() }}
                  style={{ fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', color: '#555', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                >{q}</button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['Create tiger stripe 8x8', 'Generate floral 12x12', 'Make heart shape', 'Place peacock feather 16x16', 'Create wave pattern', 'Generate diamond 8x8'].map(q => (
                <button key={q} className="jchip" onClick={() => { setInput(q); inputRef.current?.focus() }}
                  style={{ fontSize: 11, fontWeight: 500, padding: '5px 10px', borderRadius: 6, border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(124,58,237,0.04)', color: '#7c3aed', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
                >{q}</button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div style={{ padding: '16px 20px 20px', flexShrink: 0, background: '#fff', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 12, fontWeight: 500 }}>Ask anything about your design...</div>
            
            <div style={{ position: 'relative' }}>
              <textarea
                ref={inputRef} value={input} disabled={isLoading}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder=""
                rows={1}
                style={{ width: '100%', resize: 'none', padding: '14px 48px 14px 84px', borderRadius: 99, border: '1px solid rgba(0,0,0,0.1)', background: '#fafafa', fontSize: 13, lineHeight: 1.4, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', color: '#111' }}
              />
              
              {/* Left Icons */}
              <div style={{ position: 'absolute', left: 6, top: 6, display: 'flex', gap: 4 }}>
                <div style={{ position: 'relative' }}>
                  <input ref={imgInputRef} type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={handleImageUpload} title="Upload image" />
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(124,58,237,0.1)', color: '#4C1D95', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {imgProcessing ? <TypingDots /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>}
                  </div>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'transparent', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                </div>
              </div>
              
              {/* Right Send Button */}
              <button onClick={handleSend} disabled={!input.trim() || isLoading}
                style={{ position: 'absolute', right: 6, top: 6, width: 34, height: 34, borderRadius: '50%', background: input.trim() && !isLoading ? '#E0115F' : '#eee', color: input.trim() && !isLoading ? '#fff' : '#aaa', border: 'none', flexShrink: 0, cursor: input.trim() && !isLoading ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              >
                {isLoading ? <TypingDots /> : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>}
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, paddingLeft: 8 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E0115F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              <span style={{ fontSize: 10, color: '#888', fontWeight: 500 }}>Powered by <span style={{fontWeight:700, color:'#555'}}>FabricaAI</span> · Accurate. Fast. Reliable.</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
