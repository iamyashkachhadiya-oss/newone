'use client'

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { designLibrary as staticLib } from '@/data/designLibrary'
import { communityDesigns } from '@/data/communityDesigns'
import { useDesignStore } from '@/lib/store/designStore'
import {
  loadAllPresets, generateRandom, generateSimilar, buildDesign,
  exportSVG, exportWIF, getColorSwatch,
  type GeneratedDesign,
} from '@/lib/weave/engine'
import { COLOR_SWATCHES } from '@/lib/weave/variations'
import type { FabricCategory } from '@/lib/weave/presets'
import DesignTree from './DesignTree'
import {
  generateAllDesigns, estimateDesignCount, totalEstimatedDesigns,
  type GenerationProgress,
} from '@/lib/weave/massGenerate'

// ─── Types ────────────────────────────────────────────────────────────────────
type LibTab = 'generative' | 'static'
type GenCategory = 'all' | FabricCategory
type ViewMode = 'visual' | 'shaft' | 'text'
type CollectionFilter = 'all' | 'premium' | 'apple'

// ─── Static design adapter (normalise to a common shape) ─────────────────────
type SDesign = (typeof staticLib.designs)[number]

function staticToGen(d: SDesign, idx: number): GeneratedDesign {
  return {
    id: d.id,
    name_code: d.id,
    full_code: d.id,
    display_name: d.name,
    wif_name: d.id,
    params: {
      type: 'plain',
      fabric_type: d.fabric_type,
      weight: d.weight,
      tags: d.tags as string[],
      popularity: (d as any).popularity ?? 50,
      description: (d as any).description,
      applications: (d as any).applications,
    },
    matrix: typeof d.peg_matrix !== 'string' ? d.peg_matrix as number[][] : [[1,0],[0,1]],
    shaft_count: d.shaft_count,
    repeat_rows: d.repeat_size,
    repeat_cols: d.repeat_size,
    is_valid: true,
    warnings: [],
    source: 'preset',
    category: 'presets',
    fabric_type: d.fabric_type,
    weight: d.weight,
    popularity: (d as any).popularity ?? 50,
    description: (d as any).description,
    applications: (d as any).applications,
    tags: d.tags as string[],
  }
}

// ─── PegGrid ─────────────────────────────────────────────────────────────────
function PegGrid({ matrix, size }: {
  matrix: number[][]
  size: 'card' | 'modal'
}) {
  const rows = matrix.length
  const cols = matrix[0]?.length || 0
  if (!rows || !cols) return null

  const onClr = '#1D1D1F' // Apple soft black
  const offClr = '#F7F7F9' // Very soft gray for empty cells
  const maxPx = size === 'card' ? 200 : 300
  const cellPx = Math.max(4, Math.min(Math.floor(maxPx / Math.max(rows, cols)), size === 'card' ? 18 : 22))
  const w = cols * cellPx
  const h = rows * cellPx

  return (
    <div style={{
      background: '#FFFFFF', padding: size === 'card' ? 6 : 10,
      borderRadius: Math.min(10, cellPx),
      boxShadow: '0 2px 10px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      display: 'inline-flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
        {matrix.map((row, ri) =>
          row.map((c, ci) => (
            <rect
              key={`${ri}-${ci}`}
              x={ci * cellPx} y={ri * cellPx}
              width={cellPx - 0.5} height={cellPx - 0.5}
              rx={cellPx > 6 ? 1.5 : 0}
              fill={c ? onClr : offClr}
              stroke={'rgba(0,0,0,0.03)'}
              strokeWidth={0.5}
            />
          ))
        )}
      </svg>
    </div>
  )
}

// ─── Copy button ─────────────────────────────────────────────────────────────
function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false)
  const copy = () => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1600) })
  return (
    <button onClick={copy} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 12px', fontSize: 11, fontWeight: 600, borderRadius: 8,
      border: '1px solid rgba(0,0,0,0.09)',
      background: done ? 'rgba(52,199,89,0.09)' : 'rgba(0,0,0,0.035)',
      color: done ? '#1A7F37' : '#6E6E73',
      cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
      transition: 'all 0.18s ease', letterSpacing: '-0.01em',
      boxShadow: done ? 'inset 0 0 0 1px rgba(52,199,89,0.25)' : 'none',
    }}>
      {done ? '✓ Copied' : label}
    </button>
  )
}

// ─── Design Card ─────────────────────────────────────────────────────────────
const CAT_META: Record<string, { color: string; label: string; glow: string }> = {
  base_weaves: { color: '#5856D6', label: 'Base',      glow: 'rgba(88,86,214,0.35)' },
  presets:     { color: '#E0115F', label: 'Preset',    glow: 'rgba(224,17,95,0.35)' },
  dobby:       { color: '#AF52DE', label: 'Dobby',     glow: 'rgba(175,82,222,0.35)' },
  specialty:   { color: '#FF3B30', label: 'Specialty', glow: 'rgba(255,59,48,0.35)' },
  modifiers:   { color: '#FF9500', label: 'Modifier',  glow: 'rgba(255,149,0,0.35)' },
}

const CARD_PALETTES: Record<string, { from: string; to: string }> = {
  base_weaves: { from: '#f8f8ff', to: '#f0f0f5' },
  presets:     { from: '#f0f7ff', to: '#e6f0ff' },
  dobby:       { from: '#f5f0f5', to: '#ebe0eb' },
  specialty:   { from: '#fff5f5', to: '#fce8e8' },
  modifiers:   { from: '#fffbf0', to: '#fdf3d8' },
}

function DesignCard({ design, bookmarked, onOpen, onBookmark, index }: {
  design: GeneratedDesign; bookmarked: boolean
  onOpen: () => void; onBookmark: () => void; index: number
}) {
  const sw   = COLOR_SWATCHES[design.params?.colors?.[0] || 'indigo'] || COLOR_SWATCHES.indigo
  const [hovered, setHovered] = useState(false)
  const meta    = CAT_META[design.category || 'presets'] || CAT_META.presets
  const palette = CARD_PALETTES[design.category || 'presets'] || CARD_PALETTES.presets

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#FFFFFF',
        border: `1px solid ${hovered ? meta.color + '30' : 'rgba(0,0,0,0.07)'}`,
        borderRadius: 16, cursor: 'pointer', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: hovered
          ? `0 12px 32px rgba(0,0,0,0.13), 0 0 0 1px ${meta.color}22, 0 2px 8px rgba(0,0,0,0.08)`
          : '0 1px 4px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-3px) scale(1.008)' : 'translateY(0) scale(1)',
        transition: 'all 0.24s cubic-bezier(0.34,1.15,0.64,1)',
      }}
    >
      {/* Preview pane */}
      <div style={{
        background: `linear-gradient(155deg, ${palette.from} 0%, ${palette.to} 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 18, minHeight: 152, position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid bg */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '12px 12px',
        }} />

        {/* Glow behind weave */}
        {hovered && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 100, height: 100, borderRadius: '50%',
            background: meta.glow,
            filter: 'blur(28px)',
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
          }} />
        )}

        <div style={{ position: 'relative', zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.05))' }}>
          <PegGrid matrix={design.matrix} size="card" />
        </div>

        {/* Bookmark */}
        <button
          onClick={e => { e.stopPropagation(); onBookmark() }}
          style={{
            position: 'absolute', top: 9, right: 9,
            width: 28, height: 28, borderRadius: 8,
            background: bookmarked ? 'rgba(255,214,10,0.22)' : 'rgba(255,255,255,0.08)',
            border: `0.5px solid ${bookmarked ? 'rgba(255,214,10,0.4)' : 'rgba(255,255,255,0.12)'}`,
            backdropFilter: 'blur(10px)',
            cursor: 'pointer', fontSize: 13,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: bookmarked ? '#FFD60A' : 'rgba(255,255,255,0.5)',
            transition: 'all 0.18s ease',
            zIndex: 2,
          }}
        >
          {bookmarked ? '★' : '☆'}
        </button>

        {/* Bottom meta bar */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '18px 10px 7px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          zIndex: 2,
        }}>
          <span style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
            color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em',
          }}>{design.repeat_rows}×{design.repeat_cols}</span>
          <span style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 600,
            color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em',
          }}>{design.shaft_count}sh</span>
        </div>

        {/* Category colour stripe */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, ${meta.color}cc, ${meta.color}44)`,
        }} />
      </div>

      {/* Info pane */}
      <div style={{
        padding: '11px 13px 12px', flex: 1,
        display: 'flex', flexDirection: 'column', gap: 6,
        background: hovered ? '#FAFAFE' : '#FFFFFF',
        transition: 'background 0.2s ease',
      }}>
        <div style={{
          fontSize: 12, fontWeight: 700, color: '#1D1D1F',
          lineHeight: 1.33, letterSpacing: '-0.015em',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {design.display_name}
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
            padding: '2px 7px', borderRadius: 99,
            background: meta.color + '12', color: meta.color,
            textTransform: 'uppercase', border: `0.5px solid ${meta.color}30`,
          }}>
            {meta.label}
          </span>
          {design.weight && (
            <span style={{
              fontSize: 9, padding: '2px 7px', borderRadius: 99,
              background: 'rgba(0,0,0,0.04)', color: '#86868B',
              textTransform: 'capitalize',
            }}>
              {design.weight}
            </span>
          )}
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 8.5, color: '#C7C7CC',
          letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {design.name_code}
        </div>
      </div>
    </div>
  )
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DesignModal({ design, onClose, onLoad, onSimilar, bookmarked, onBookmark }: {
  design: GeneratedDesign; onClose: () => void; onLoad: () => void
  onSimilar: () => void; bookmarked: boolean; onBookmark: () => void
}) {
  const [view, setView] = useState<ViewMode>('visual')
  const sw = COLOR_SWATCHES[design.params?.colors?.[0] || 'indigo'] || COLOR_SWATCHES.indigo
  const sw2 = COLOR_SWATCHES[design.params?.colors?.[1] || 'white'] || COLOR_SWATCHES.white

  const pickText = design.matrix.map((row, i) => {
    const raised = row.map((c, j) => c ? j + 1 : null).filter(Boolean) as number[]
    return `${i + 1}-->${raised.join(',')}`
  }).join('\n')

  const shaftText = (() => {
    const m = design.matrix
    const cols = m[0]?.length || 0
    return Array.from({ length: cols }, (_, j) => {
      const picks = m.map((r, i) => r[j] ? i + 1 : null).filter(Boolean)
      return `Shaft ${j + 1}  →  ${picks.join(', ') || '(none)'}`
    }).join('\n')
  })()

  const downloadSVG = () => {
    const svg = exportSVG(design, 8, 8, 8)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${design.wif_name}.svg`; a.click()
  }

  const downloadWIF = () => {
    const wif = exportWIF(design)
    const blob = new Blob([wif], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `${design.wif_name}.wif`; a.click()
  }

  const catColor: Record<string, string> = {
    base_weaves: '#C00E52', presets: '#E0115F', dobby: '#E0115F',
    specialty: '#E0115F', modifiers: '#E0115F',
  }
  const accent = catColor[design.category || 'presets'] || '#C00E52'

  const specs = [
    { label: 'Weave Type', value: design.params?.type?.replace('_', ' ') },
    { label: 'Shafts', value: String(design.shaft_count) },
    { label: 'Repeat', value: `${design.repeat_rows}×${design.repeat_cols}` },
    { label: 'Direction', value: design.params?.direction || 'N/A' },
    design.params?.up !== undefined && { label: 'Float Up', value: String(design.params.up) },
    design.params?.down !== undefined && { label: 'Float Down', value: String(design.params.down) },
    { label: 'Category', value: design.category?.replace('_', ' ') },
    { label: 'Weight', value: design.weight },
    { label: 'Fabric', value: design.fabric_type },
    design.source && { label: 'Source', value: design.source },
  ].filter(Boolean) as { label: string; value: string | undefined }[]

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      animation: 'fadeIn 0.18s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'rgba(255,255,255,0.98)', borderRadius: 26, width: '100%', maxWidth: 800,
        maxHeight: '92vh', overflowY: 'auto',
        boxShadow: `0 0 0 0.5px rgba(0,0,0,0.12), 0 48px 96px rgba(0,0,0,0.32), 0 0 80px ${accent}18`,
        display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.22s cubic-bezier(0.34,1.1,0.64,1)',
      }}>
        {/* Gradient Header Strip */}
        <div style={{
          background: `linear-gradient(135deg, ${accent}ee 0%, ${accent}88 100%)`,
          padding: '22px 28px 20px',
          position: 'sticky', top: 0, zIndex: 10,
          borderRadius: '26px 26px 0 0',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2.5px 10px', borderRadius: 99,
                  background: 'rgba(255,255,255,0.22)', color: '#fff',
                  textTransform: 'uppercase', letterSpacing: '0.06em', backdropFilter: 'blur(8px)',
                }}>
                  {design.category?.replace('_', ' ')}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                  background: 'rgba(0,0,0,0.22)', color: 'rgba(255,255,255,0.9)',
                  padding: '2.5px 9px', borderRadius: 7, letterSpacing: '0.04em',
                }}>
                  {design.name_code}
                </span>
                <CopyBtn text={design.full_code} label="⎘ Code" />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.03em', textShadow: '0 1px 8px rgba(0,0,0,0.2)' }}>
                {design.display_name}
              </h3>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.72)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{design.shaft_count} Shafts</span>
                <span style={{ opacity: 0.5 }}>·</span>
                <span>{design.repeat_rows}×{design.repeat_cols} repeat</span>
                {design.is_valid ? (
                  <span style={{ background: 'rgba(52,199,89,0.22)', color: '#A7F3D0', fontWeight: 700, padding: '1px 8px', borderRadius: 99, fontSize: 10 }}>✓ Valid</span>
                ) : (
                  <span style={{ background: 'rgba(255,59,48,0.22)', color: '#FCA5A5', fontWeight: 700, padding: '1px 8px', borderRadius: 99, fontSize: 10 }}>⚠ {design.warnings[0]}</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexShrink: 0, marginLeft: 16 }}>
              <button onClick={onBookmark} style={{
                width: 38, height: 38, borderRadius: 11,
                background: bookmarked ? 'rgba(255,214,10,0.25)' : 'rgba(255,255,255,0.14)',
                border: `1px solid ${bookmarked ? 'rgba(255,214,10,0.5)' : 'rgba(255,255,255,0.2)'}`,
                backdropFilter: 'blur(10px)',
                cursor: 'pointer', fontSize: 17,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: bookmarked ? '#FFD60A' : 'rgba(255,255,255,0.7)',
                transition: 'all 0.15s ease',
              }}>{bookmarked ? '★' : '☆'}</button>
              <button onClick={onClose} style={{
                width: 38, height: 38, borderRadius: 11,
                background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer', fontSize: 18, color: 'rgba(255,255,255,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 300, lineHeight: 1, transition: 'all 0.15s ease',
              }}>×</button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px 0', display: 'flex', gap: 28 }}>
          {/* Left: Matrix Viewer */}
          <div style={{ width: 268, flexShrink: 0 }}>
            {/* View toggle */}
            <div style={{
              display: 'flex', background: 'rgba(0,0,0,0.05)', padding: 3,
              borderRadius: 11, marginBottom: 14, border: '0.5px solid rgba(0,0,0,0.06)',
            }}>
              {(['visual', 'shaft', 'text'] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  flex: 1, fontSize: 10.5, fontWeight: view === v ? 700 : 500,
                  padding: '5.5px 6px', border: 'none', borderRadius: 9, cursor: 'pointer',
                  background: view === v ? '#fff' : 'transparent',
                  color: view === v ? '#111' : '#86868B',
                  boxShadow: view === v ? '0 1px 5px rgba(0,0,0,0.12), 0 0.5px 1px rgba(0,0,0,0.07)' : 'none',
                  transition: 'all 0.16s ease', fontFamily: 'inherit',
                }}>
                  {v === 'visual' ? '◼ Visual' : v === 'shaft' ? '≡ Shaft' : '⌨ Text'}
                </button>
              ))}
            </div>

            {/* Preview box */}
            <div style={{
              background: '#fcfcfd',
              borderRadius: 16, padding: 20,
              border: '1px solid rgba(0,0,0,0.05)',
              minHeight: 210,
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflowX: 'auto',
              boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.02)',
            }}>
              {view === 'visual' && <PegGrid matrix={design.matrix} size="modal" />}
              {view === 'shaft' && (
                <pre style={{ margin: 0, fontSize: 10, fontFamily: 'var(--font-mono)', color: '#48484a', lineHeight: 1.9, whiteSpace: 'pre' }}>
                  {shaftText}
                </pre>
              )}
              {view === 'text' && (
                <div style={{ width: '100%' }}>
                  <textarea readOnly value={pickText} rows={Math.min(design.matrix.length + 1, 12)}
                    style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 11, lineHeight: 1.7,
                      background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 9, padding: '8px 10px', color: '#1d1d1f',
                      resize: 'none', outline: 'none', cursor: 'text' }}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <CopyBtn text={pickText} label="⎘ Copy Pick Text" />
                  </div>
                </div>
              )}
            </div>

            {/* Color swatches */}
            {design.params?.colors && design.params.colors.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', gap: 7, alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: '#AEAEB2', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Colors</span>
                {design.params.colors.map(c => (
                  <div key={c} title={c} style={{
                    width: 20, height: 20, borderRadius: 6,
                    border: '1.5px solid rgba(0,0,0,0.10)',
                    background: (COLOR_SWATCHES[c] || COLOR_SWATCHES.indigo).warp,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
                  }} />
                ))}
              </div>
            )}

            {/* Export strip */}
            <div style={{ marginTop: 14, display: 'flex', gap: 7 }}>
              <button onClick={downloadSVG} style={{
                flex: 1, height: 34, fontSize: 11, fontWeight: 700, borderRadius: 9,
                background: '#F2F2F7', color: '#48484A', border: '0.5px solid rgba(0,0,0,0.08)',
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                transition: 'background 0.15s ease',
              }}>↓ SVG</button>
              <button onClick={downloadWIF} style={{
                flex: 1, height: 34, fontSize: 11, fontWeight: 700, borderRadius: 9,
                background: '#F2F2F7', color: '#48484A', border: '0.5px solid rgba(0,0,0,0.08)',
                cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
                transition: 'background 0.15s ease',
              }}>↓ WIF</button>
            </div>
          </div>

          {/* Right: Info */}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 24 }}>
            {design.description && (
              <p style={{
                margin: '0 0 18px', fontSize: 13, color: '#48484A',
                lineHeight: 1.7, borderLeft: `3px solid ${accent}44`,
                paddingLeft: 12,
              }}>
                {design.description}
              </p>
            )}

            {/* Specs grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 14px',
              background: '#F5F5F7', borderRadius: 16, padding: '16px 18px',
              border: '0.5px solid rgba(0,0,0,0.07)', marginBottom: 20,
            }}>
              {specs.map(({ label, value }) => (
                <div key={label}>
                  <div style={{
                    fontSize: 9, fontWeight: 700, color: '#AEAEB2',
                    textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 3,
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize: 13.5, fontWeight: 700, color: '#1D1D1F',
                    textTransform: 'capitalize', letterSpacing: '-0.01em',
                  }}>
                    {value || <span style={{ color: '#C7C7CC' }}>—</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Applications */}
            {design.applications && design.applications.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{
                  fontSize: 9, fontWeight: 700, color: '#AEAEB2',
                  textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 9,
                }}>
                  Applications
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {design.applications.map(a => (
                    <span key={a} style={{
                      fontSize: 11.5, padding: '5px 12px', borderRadius: 99,
                      background: accent + '12', color: accent,
                      fontWeight: 600, border: `0.5px solid ${accent}30`,
                    }}>
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {(design.tags || []).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(design.tags || []).map(t => (
                  <span key={t} style={{
                    fontSize: 10.5, padding: '3.5px 9px', borderRadius: 99,
                    background: '#F2F2F7', color: '#86868B',
                    border: '0.5px solid rgba(0,0,0,0.08)',
                  }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 28px', borderTop: '0.5px solid rgba(0,0,0,0.08)',
          background: 'rgba(248,248,250,0.96)', backdropFilter: 'blur(12px)',
          borderRadius: '0 0 26px 26px',
          display: 'flex', gap: 10, alignItems: 'center',
          position: 'sticky', bottom: 0, zIndex: 10,
        }}>
          <button onClick={onSimilar} style={{
            height: 38, padding: '0 16px', fontSize: 12.5, fontWeight: 700,
            background: 'rgba(0,0,0,0.055)', border: '0.5px solid rgba(0,0,0,0.09)',
            borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', color: '#1D1D1F',
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.15s ease',
          }}>✦ Similar Designs</button>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            height: 38, padding: '0 16px', fontSize: 12.5, fontWeight: 500,
            background: '#fff', border: '0.5px solid rgba(0,0,0,0.12)',
            borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', color: '#86868B',
            transition: 'all 0.15s ease',
          }}>Dismiss</button>
          <button onClick={onLoad} style={{
            height: 38, padding: '0 22px', fontSize: 13, fontWeight: 800,
            background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
            color: '#fff', border: 'none', borderRadius: 10,
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: `0 4px 16px ${accent}50, inset 0 1px 0 rgba(255,255,255,0.15)`,
            letterSpacing: '-0.015em',
            transition: 'all 0.18s ease',
          }}>Load into Studio →</button>
        </div>
      </div>
    </div>
  )
}

// ─── Generation Progress Banner ──────────────────────────────────────────────
function GenerationBanner({
  progress, onStart, onCancel, generated, total, isRunning, isDone
}: {
  progress: GenerationProgress | null
  onStart: () => void
  onCancel: () => void
  generated: number
  total: number
  isRunning: boolean
  isDone: boolean
}) {
  const estimate = totalEstimatedDesigns()

  if (isDone) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(52,211,153,0.05) 100%)',
        border: '0.5px solid rgba(16,185,129,0.25)', borderRadius: 13,
        padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12,
        marginBottom: 10, flexShrink: 0,
        boxShadow: '0 1px 6px rgba(16,185,129,0.08)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'linear-gradient(135deg, #10B981, #34D399)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
          boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
        }}>✓</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#065F46', letterSpacing: '-0.01em' }}>
            {generated.toLocaleString()} designs ready
          </div>
          <div style={{ fontSize: 10.5, color: '#059669', marginTop: 1.5 }}>All loaded · use filters to explore</div>
        </div>
        <button onClick={onStart} style={{
          height: 29, padding: '0 13px', fontSize: 11, fontWeight: 600,
          border: '0.5px solid rgba(16,185,129,0.35)', borderRadius: 8,
          background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
          color: '#047857', cursor: 'pointer', fontFamily: 'inherit',
          letterSpacing: '-0.01em',
        }}>Regenerate</button>
      </div>
    )
  }

  if (isRunning && progress) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(192,14,82,0.07) 0%, rgba(99,102,241,0.04) 100%)',
        border: '0.5px solid rgba(192,14,82,0.22)', borderRadius: 13,
        padding: '11px 16px', flexShrink: 0, marginBottom: 10,
        boxShadow: '0 1px 6px rgba(192,14,82,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
          <div style={{
            width: 18, height: 18, borderRadius: '50%',
            border: '2px solid #C00E52', borderTopColor: 'transparent',
            animation: 'spin 0.7s linear infinite', flexShrink: 0,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, color: '#3730A3', letterSpacing: '-0.01em' }}>
              {progress.phase}
            </div>
            <div style={{ fontSize: 10.5, color: '#C00E52', marginTop: 1 }}>
              {progress.count.toLocaleString()} / {total.toLocaleString()}  ·  {progress.pct}%
            </div>
          </div>
          <button onClick={onCancel} style={{
            height: 26, padding: '0 11px', fontSize: 10.5, fontWeight: 600,
            border: '0.5px solid rgba(99,102,241,0.3)', borderRadius: 7,
            background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)',
            color: '#C00E52', cursor: 'pointer', fontFamily: 'inherit',
          }}>Stop</button>
        </div>
        <div style={{ height: 4, background: 'rgba(99,102,241,0.12)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 99,
            background: 'linear-gradient(90deg, #C00E52, #E0115F, #A78BFA)',
            width: `${progress.pct}%`,
            transition: 'width 0.4s cubic-bezier(0.34,1.1,0.64,1)',
            boxShadow: '0 0 8px rgba(99,102,241,0.6)',
          }} />
        </div>
      </div>
    )
  }

  // Idle state
  return (
    <div style={{
      background: '#F8FFF9',
      border: '1px solid rgba(224,17,95,0.20)', borderRadius: 12,
      padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 12,
      marginBottom: 10, flexShrink: 0,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
        background: 'linear-gradient(135deg, #E0115F, #C00E52)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
          <path d="M3 6h18M3 12h12M3 18h8"/>
        </svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1F', letterSpacing: '-0.01em' }}>
          Generative Weave Engine
        </div>
        <div style={{ fontSize: 10.5, color: '#86868B', marginTop: 1 }}>
          ~{estimate.toLocaleString()} unique combinations ready to generate
        </div>
      </div>
      <button onClick={onStart} style={{
        height: 30, padding: '0 14px', fontSize: 11.5, fontWeight: 700,
        border: 'none', borderRadius: 8,
        background: 'linear-gradient(135deg, #E0115F 0%, #C00E52 100%)',
        color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
        whiteSpace: 'nowrap', letterSpacing: '-0.01em',
        transition: 'all 0.18s ease',
        boxShadow: '0 2px 8px rgba(224,17,95,0.25)',
      }}>Generate</button>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function DesignLibrary({ onLoadDesign }: { onLoadDesign?: () => void } = {}) {
  const { setPegPlan, updateIdentity, setShaftCount } = useDesignStore()

  // ── Source / tab ──
  const [libTab, setLibTab] = useState<LibTab>('generative')

  // ── Generative presets ──
  const [genPresets, setGenPresets] = useState<GeneratedDesign[]>([])
  const [custom, setCustom] = useState<GeneratedDesign[]>([])
  const [adminCustomDesigns, setAdminCustomDesigns] = useState<GeneratedDesign[]>([])

  // ── Mass generation state ──
  const [massDesigns, setMassDesigns] = useState<GeneratedDesign[]>([])
  const [genProgress, setGenProgress] = useState<GenerationProgress | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [genDone, setGenDone] = useState(false)
  const cancelRef = useRef(false)
  const MASS_TARGET = 10500

  useEffect(() => { setGenPresets(loadAllPresets()) }, [])

  // Load custom admin designs
  useEffect(() => {
    fetch('/api/admin/designs')
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.designs) {
          setAdminCustomDesigns(data.designs.map((d: any, i: number) => {
            // override source to indicate admin
            const converted = staticToGen(d as SDesign, i)
            converted.source = 'admin'
            return converted
          }))
        }
      }).catch(console.error)
  }, [])

  // ── Filters ──
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<GenCategory>('all')
  const [fabricFilter, setFabricFilter] = useState('')
  const [shaftRange, setShaftRange] = useState('')
  const [weightFilter, setWeightFilter] = useState('')
  const [sortBy, setSortBy] = useState('popularity')
  const [showBookmarked, setShowBookmarked] = useState(false)
  const [collectionFilter, setCollectionFilter] = useState<CollectionFilter>('all')
  const [showSimilarTo, setShowSimilarTo] = useState<string | null>(null)

  // ── UI ──
  const [selected, setSelected] = useState<GeneratedDesign | null>(null)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [showTree, setShowTree] = useState(false)
  const [page, setPage] = useState(1)
  const PAGE = 24

  // ── Mass generation handler ──
  const handleMassGenerate = useCallback(async () => {
    if (isGenerating) return
    setIsGenerating(true)
    setGenDone(false)
    setGenProgress(null)
    cancelRef.current = false
    setMassDesigns([])  // clear previous mass designs

    try {
      const results = await generateAllDesigns(
        (p) => {
          if (cancelRef.current) return
          setGenProgress(p)
          // Stream into state every 500 designs to show live updates
          if (p.count % 500 === 0 || p.pct === 100) {
            // We update after full generation completes via the results array
          }
        },
        MASS_TARGET
      )

      if (!cancelRef.current) {
        setMassDesigns(results)
        setGenDone(true)
      }
    } catch (err) {
      console.error('Mass generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }, [isGenerating])

  const handleCancelGeneration = useCallback(() => {
    cancelRef.current = true
    setIsGenerating(false)
    setGenProgress(null)
  }, [])

  // ── All designs (source) ──
  const allDesigns = useMemo<GeneratedDesign[]>(() => {
    if (libTab === 'static') {
      const baseStatic = staticLib.designs.map((d, i) => staticToGen(d as SDesign, i))
      return [...adminCustomDesigns, ...baseStatic]
    }
    // Merge: mass > custom > community > presets
    const massSet = new Set(massDesigns.map(d => d.full_code))
    const customFiltered = custom.filter(d => !massSet.has(d.full_code))
    // Deduplicate community designs against existing sets
    const existingCodes = new Set([
      ...massDesigns.map(d => d.full_code),
      ...customFiltered.map(d => d.full_code),
      ...genPresets.map(d => d.full_code),
    ])
    const communityFiltered = communityDesigns.filter(d => !existingCodes.has(d.full_code))
    return [...massDesigns, ...customFiltered, ...adminCustomDesigns, ...communityFiltered, ...genPresets]
  }, [libTab, genPresets, custom, massDesigns, adminCustomDesigns])

  // ── Fabric types for sidebar ──
  const fabricTypes = useMemo(() => {
    const seen = new Set<string>()
    allDesigns.forEach(d => { if (d.fabric_type) seen.add(d.fabric_type) })
    return [...seen].sort()
  }, [allDesigns])

  // ── Filtered ──
  const filtered = useMemo(() => {
    let data = [...allDesigns]

    if (showBookmarked) data = data.filter(d => bookmarks.has(d.full_code))
    if (showSimilarTo) {
      const ref = data.find(d => d.full_code === showSimilarTo)
      if (ref) data = data.filter(d =>
        d.full_code !== showSimilarTo &&
        (d.params?.type === ref.params?.type || d.category === ref.category || d.fabric_type === ref.fabric_type)
      ).slice(0, 24)
    }

    // ── Collection filter ──
    if (collectionFilter === 'premium') {
      data = data.filter(d => (d.popularity || 0) >= 70 && d.shaft_count >= 8)
    } else if (collectionFilter === 'apple') {
      const appleTypes = new Set(['plain', 'twill', 'hopsack', 'basket'])
      const appleTags = new Set(['minimal', 'clean', 'structured', 'plain', 'simple', 'crisp'])
      data = data.filter(d =>
        (d.category === 'base_weaves' && d.repeat_rows <= 4) ||
        appleTypes.has(d.params?.type || '') ||
        (d.tags || []).some(t => appleTags.has(t.toLowerCase()))
      )
    }

    if (category !== 'all') data = data.filter(d => d.category === category)
    if (fabricFilter) data = data.filter(d => d.fabric_type === fabricFilter)
    if (weightFilter) data = data.filter(d => d.weight === weightFilter)
    if (shaftRange) {
      const [a, b] = shaftRange.split('-').map(Number)
      data = data.filter(d => d.shaft_count >= a && d.shaft_count <= b)
    }
    if (search) {
      const q = search.toLowerCase()
      data = data.filter(d =>
        d.display_name.toLowerCase().includes(q) ||
        d.name_code.toLowerCase().includes(q) ||
        (d.params?.type || '').toLowerCase().includes(q) ||
        (d.tags || []).some(t => t.toLowerCase().includes(q)) ||
        (d.description || '').toLowerCase().includes(q)
      )
    }
    data.sort((a, b) => {
      const aAdmin = a.source === 'admin' ? 1 : 0
      const bAdmin = b.source === 'admin' ? 1 : 0
      if (aAdmin !== bAdmin) return bAdmin - aAdmin
      
      if (sortBy === 'popularity') return (b.popularity || 0) - (a.popularity || 0)
      if (sortBy === 'name') return a.display_name.localeCompare(b.display_name)
      if (sortBy === 'shafts_asc') return a.shaft_count - b.shaft_count
      if (sortBy === 'shafts_desc') return b.shaft_count - a.shaft_count
      return 0
    })

    return data
  }, [allDesigns, search, category, fabricFilter, weightFilter, shaftRange, sortBy, showBookmarked, bookmarks, showSimilarTo, collectionFilter])

  const paged = useMemo(() => filtered.slice(0, page * PAGE), [filtered, page])
  const hasMore = filtered.length > paged.length
  const anyFilter = !!(search || fabricFilter || shaftRange || weightFilter || showBookmarked || showSimilarTo || category !== 'all' || collectionFilter !== 'all')

  const clearAll = () => {
    setSearch(''); setCategory('all'); setFabricFilter(''); setShaftRange('')
    setWeightFilter(''); setSortBy('popularity'); setShowBookmarked(false)
    setShowSimilarTo(null); setCollectionFilter('all'); setPage(1)
  }

  const handleRandom = () => {
    const d = generateRandom()
    setCustom(prev => [d, ...prev])
    setSelected(d)
  }

  const handleSimilar = (design: GeneratedDesign) => {
    const similar = generateSimilar(design.params, 8)
    setCustom(prev => {
      const ids = new Set(prev.map(d => d.full_code))
      const newOnes = similar.filter(d => !ids.has(d.full_code))
      return [...newOnes, ...prev]
    })
    setSelected(null)
    setShowSimilarTo(design.full_code)
    setPage(1)
  }

  const handleLoad = (design: GeneratedDesign) => {
    const text = design.matrix.map((row, i) => {
      const raised = row.map((c, j) => c ? j + 1 : null).filter(Boolean) as number[]
      return `${i + 1}-->${raised.join(',')}`
    }).join('\n')
    setShaftCount(design.shaft_count)
    setPegPlan(text, design.matrix)
    updateIdentity({ design_name: design.display_name, design_number: design.name_code })
    setSelected(null)
    if (onLoadDesign) onLoadDesign()
  }

  const toggleBookmark = (id: string) =>
    setBookmarks(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const CATEGORIES: { key: GenCategory; label: string; color: string }[] = [
    { key: 'all',         label: 'All',             color: '#1E293B' },
    { key: 'base_weaves', label: 'Base Weaves',      color: '#E0115F' },
    { key: 'presets',     label: 'Industry Presets', color: '#E0115F' },
    { key: 'dobby',       label: 'Dobby',            color: '#E0115F' },
    { key: 'specialty',   label: 'Jacquard & Pile',  color: '#E0115F' },
    { key: 'modifiers',   label: 'Surface Motifs',   color: '#E0115F' },
  ]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      background: '#fff', borderRadius: 18, border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
    }}>
      {/* ── CSS for spinner ── */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 18px 10px', borderBottom: '1px solid rgba(0,0,0,0.06)',
        flexShrink: 0, background: '#fff',
      }}>
        {/* Row 1: Title + Collection Nav + Source toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1F', letterSpacing: '-0.025em' }}>
              Design Library
            </div>
            <div style={{ fontSize: 11, color: '#86868B', marginTop: 1 }}>
              {filtered.length.toLocaleString()} / {allDesigns.length.toLocaleString()}
              {massDesigns.length > 0 && (
                <span style={{ marginLeft: 5, color: '#C00E52', fontWeight: 600 }}>
                  · {massDesigns.length.toLocaleString()} generated
                </span>
              )}
              {showSimilarTo && <span style={{ color: '#E0115F', fontWeight: 600 }}> · Similar</span>}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Collection filter — simplified, brand-colored */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            padding: 3, background: 'rgba(0,0,0,0.05)', borderRadius: 10,
          }}>
            {([{ id: 'all', label: 'All' }, { id: 'premium', label: 'Top Picks' }] as const).map(({ id, label }) => {
              const active = collectionFilter === (id as CollectionFilter)
              return (
                <button key={id}
                  onClick={() => { setCollectionFilter(id as CollectionFilter); setPage(1) }}
                  style={{
                    padding: '4px 12px', fontSize: 12, fontWeight: active ? 700 : 500,
                    border: 'none', borderRadius: 7, cursor: 'pointer',
                    background: active ? '#E0115F' : 'transparent',
                    color: active ? '#fff' : '#86868B',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap' as const,
                  }}
                >{label}</button>
              )
            })}
          </div>

          {/* Source toggle */}
          <div style={{
            display: 'flex',
            background: 'rgba(118,118,128,0.12)',
            padding: 3, borderRadius: 9,
            gap: 2,
          }}>
            {(['generative', 'static'] as LibTab[]).map(t => (
              <button key={t} onClick={() => { setLibTab(t); clearAll() }} style={{
                padding: '4px 11px', fontSize: 11.5, fontWeight: libTab === t ? 600 : 400,
                letterSpacing: '-0.01em',
                border: 'none', borderRadius: 7,
                cursor: 'pointer',
                background: libTab === t ? '#fff' : 'transparent',
                color: libTab === t ? '#1D1D1F' : '#86868B',
                boxShadow: libTab === t
                  ? '0 1px 4px rgba(0,0,0,0.13), 0 0.5px 1px rgba(0,0,0,0.08)'
                  : 'none',
                transition: 'all 0.18s ease',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", sans-serif',
                userSelect: 'none' as const,
              }}>
                {t === 'generative' ? 'Generative' : 'Static'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            height: 30, fontSize: 11.5, borderRadius: 8, padding: '0 8px', cursor: 'pointer',
          }}>
            <option value="popularity">Popular</option>
            <option value="name">A–Z</option>
            <option value="shafts_asc">Shafts ↑</option>
            <option value="shafts_desc">Shafts ↓</option>
          </select>

          {/* Bookmarks */}
          <button onClick={() => { setShowBookmarked(!showBookmarked); setPage(1) }} style={{
            height: 30, padding: '0 10px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none',
            background: showBookmarked ? '#FEF9C3' : 'rgba(0,0,0,0.05)',
            color: showBookmarked ? '#B45309' : '#64748B', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={showBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            {bookmarks.size > 0 && (
              <span style={{ background: '#E0115F', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 99 }}>
                {bookmarks.size}
              </span>
            )}
          </button>

          {/* Tree Toggle */}
          <button onClick={() => setShowTree(!showTree)} style={{
            height: 30, padding: '0 10px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none',
            background: showTree ? '#E0115F' : 'rgba(0,0,0,0.05)',
            color: showTree ? '#fff' : '#64748B', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            Tree
          </button>

          <button
            onClick={handleRandom}
            style={{
              height: 32, padding: '0 14px', fontSize: 12, fontWeight: 600, border: 'none', borderRadius: 9,
              background: 'linear-gradient(135deg, #C00E52 0%, #E0115F 100%)',
              color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 10px rgba(224,17,95,0.25)',
              transition: 'all 0.18s ease',
              whiteSpace: 'nowrap' as const,
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 5px 16px rgba(224,17,95,0.35)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ''; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 10px rgba(224,17,95,0.25)' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
            Inspire Me
          </button>

          {anyFilter && (
            <button onClick={clearAll} style={{
              height: 30, padding: '0 10px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none',
              background: '#FEF2F2', color: '#E0115F', cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Clear
            </button>
          )}
        </div>

        {/* Row 2: Search */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex', alignItems: 'center', color: '#86868B' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input
            type="text" value={search} placeholder="Search name, weave type, tag, or code…"
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ paddingLeft: 32, height: 32, fontSize: 12.5, borderRadius: 9, width: '100%', border: '1px solid rgba(0,0,0,0.09)', outline: 'none' }}
          />
        </div>

        {/* Row 3: Mass Generation Banner (generative only) */}
        {libTab === 'generative' && (
          <>
            <GenerationBanner
              progress={genProgress}
              onStart={handleMassGenerate}
              onCancel={handleCancelGeneration}
              generated={massDesigns.length}
              total={MASS_TARGET}
              isRunning={isGenerating}
              isDone={genDone}
            />
            {/* Category pills */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => { setCategory(cat.key); setPage(1) }} style={{
                  padding: '4px 12px', fontSize: 11, fontWeight: 600, border: 'none', borderRadius: 99,
                  background: category === cat.key ? cat.color : 'rgba(0,0,0,0.05)',
                  color: category === cat.key ? '#fff' : '#64748B',
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                  letterSpacing: '-0.01em',
                }}>
                  {cat.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {showTree && (
           <DesignTree 
              onClose={() => setShowTree(false)}
              onSelectDesign={(name: string, node: any) => {
                 if (!node.software) {
                    setSearch(name) // filter the library by name
                 }
              }}
           />
        )}

        {/* Sidebar */}
        <div style={{
          width: 160, flexShrink: 0,
          borderRight: '1px solid rgba(0,0,0,0.06)',
          background: '#FAFAFA', overflowY: 'auto',
          padding: '12px', display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {/* Fabric */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
              Fabric
            </div>
            {fabricTypes.map(f => {
              const cnt = allDesigns.filter(d => d.fabric_type === f).length
              const on = fabricFilter === f
              return (
                <label key={f} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, padding: '3px 5px', borderRadius: 6, cursor: 'pointer',
                  background: on ? 'rgba(224,17,95,0.10)' : 'transparent',
                }}>
                  <input type="radio" name="fabric" checked={on}
                    onChange={() => { setFabricFilter(on ? '' : f); setPage(1) }}
                    style={{ width: 11, height: 11, accentColor: '#E0115F', cursor: 'pointer', flexShrink: 0 }}
                  />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#1D1D1F' }}>{f}</span>
                  <span style={{ fontSize: 9.5, color: '#94A3B8' }}>{cnt}</span>
                </label>
              )
            })}
          </div>

          {/* Shafts */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
              Shafts
            </div>
            <select value={shaftRange} onChange={e => { setShaftRange(e.target.value); setPage(1) }}
              style={{ width: '100%', height: 28, fontSize: 11, borderRadius: 7 }}>
              <option value="">All</option>
              <option value="2-4">2–4</option>
              <option value="5-8">5–8</option>
              <option value="9-16">9–16</option>
              <option value="17-24">17–24</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7 }}>
              Weight
            </div>
            <select value={weightFilter} onChange={e => { setWeightFilter(e.target.value); setPage(1) }}
              style={{ width: '100%', height: 28, fontSize: 11, borderRadius: 7 }}>
              <option value="">All</option>
              <option value="Ultra Light">Ultra Light</option>
              <option value="Light">Light</option>
              <option value="Medium">Medium</option>
              <option value="Heavy">Heavy</option>
              <option value="Extra Heavy">Extra Heavy</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        <div style={{
          flex: 1, overflowY: 'auto', background: '#F5F5F7',
          padding: 14, display: 'flex', flexDirection: 'column', gap: 14,
        }}>
          {showSimilarTo && (
            <div style={{
              background: 'rgba(224,17,95,0.08)', border: '1px solid rgba(224,17,95,0.2)', borderRadius: 10,
              padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, color: '#047857', fontWeight: 600,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="M11 8v3l2 2"/>
              </svg>
              Showing similar designs
              <button onClick={() => { setShowSimilarTo(null); setPage(1) }} style={{
                marginLeft: 'auto', background: 'rgba(224,17,95,0.10)', border: 'none',
                borderRadius: 6, cursor: 'pointer', color: '#047857', fontSize: 12,
                fontWeight: 600, padding: '2px 10px', fontFamily: 'inherit',
              }}>Show All</button>
            </div>
          )}

          {paged.length > 0 ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {paged.map((d, i) => (
                  <DesignCard
                    key={`${d.full_code}-${i}`}
                    design={d}
                    bookmarked={bookmarks.has(d.full_code)}
                    onOpen={() => setSelected(d)}
                    onBookmark={() => toggleBookmark(d.full_code)}
                    index={i}
                  />
                ))}
              </div>
              {hasMore && (
                <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 4 }}>
                  <button onClick={() => setPage(p => p + 1)} style={{
                    padding: '9px 28px', fontSize: 13, fontWeight: 700, borderRadius: 10,
                    background: '#fff', color: '#1E293B', border: '1px solid rgba(0,0,0,0.10)',
                    cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    Load More ({filtered.length - paged.length} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '60px 24px', textAlign: 'center',
              background: '#fff', borderRadius: 14,
              border: '1px dashed rgba(0,0,0,0.12)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 12 }}>
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 6 }}>No designs found</div>
              <div style={{ fontSize: 12, color: '#64748B', marginBottom: 16 }}>Try adjusting filters or generate a random design.</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={clearAll} style={{
                  padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 9,
                  background: '#E0115F', color: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}>Clear Filters</button>
                <button onClick={handleRandom} style={{
                  padding: '8px 20px', fontSize: 13, fontWeight: 600, borderRadius: 9,
                  background: '#F1F5F9', color: '#1E293B', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                }}>Random</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {selected && (
        <DesignModal
          design={selected}
          onClose={() => setSelected(null)}
          onLoad={() => handleLoad(selected)}
          onSimilar={() => handleSimilar(selected)}
          bookmarked={bookmarks.has(selected.full_code)}
          onBookmark={() => toggleBookmark(selected.full_code)}
        />
      )}
    </div>
  )
}
