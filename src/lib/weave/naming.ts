/**
 * Design Naming System
 * =====================
 * Deterministic name codes, display names, and hash IDs for generated designs.
 *
 * Format: [WeaveType]-[Structure]-[Params]-[Modifiers]-[Color]
 * Example: TWL-3x1-Z-R8-INDIGO
 *
 * Based on Medallion Data Schema and industrial naming conventions from research.
 */

import type { DesignParams } from './presets'

// ─── Type Code Mapping ────────────────────────────────────────────────────────

export const WEAVE_TYPE_CODES: Record<string, string> = {
  plain:           'PLN',
  warp_rib:        'WRB',
  weft_rib:        'FRB',
  basket:          'BKT',
  twill:           'TWL',
  broken_twill:    'BTW',
  herringbone:     'HRB',
  zigzag:          'ZZG',
  satin:           'SAT',
  honeycomb:       'HCB',
  brighton_honeycomb: 'BHC',
  birdseye:        'BRD',
  diamond:         'DMD',
  mock_leno:       'MLN',
  crepe:           'CRP',
  bedford_cord:    'BFC',
  houndstooth:     'HND',
  dobby:           'DOB',
}

export const MODIFIER_CODES: Record<string, string> = {
  stripe:  'STRP',
  check:   'CHK',
  border:  'BDR',
  texture: 'TXT',
  solid:   'SLD',
  houndstooth: 'HND',
}

export const COLOR_CODES: Record<string, string> = {
  indigo:      'INDIGO',
  navy:        'NAVY',
  white:       'WHITE',
  black:       'BLACK',
  ecru:        'ECRU',
  khaki:       'KHAKI',
  red:         'RED',
  blue:        'BLUE',
  green:       'GREEN',
  grey:        'GREY',
  cream:       'CREAM',
  tan:         'TAN',
  burgundy:    'BURG',
  teal:        'TEAL',
  multicolor:  'MULTI',
  natural:     'NAT',
}

// ─── FNV-1a Hash (6-char alphanumeric ID) ─────────────────────────────────────

function fnv1a(str: string): number {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash
}

const CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateHashId(params: DesignParams): string {
  const key = JSON.stringify(params)
  const h = fnv1a(key)
  let id = ''
  let v = h
  for (let i = 0; i < 6; i++) {
    id += CHARSET[v % CHARSET.length]
    v = Math.floor(v / CHARSET.length)
  }
  return id
}

// ─── Name Code Generator ──────────────────────────────────────────────────────

/**
 * Generate a deterministic design name code.
 * Format: [TypeCode]-[StructParam]-[Direction]-[RepeatCode]-[ColorCode]
 * Example: TWL-3x1-Z-R8-INDIGO
 */
export function getNameCode(params: DesignParams): string {
  const typeCode = WEAVE_TYPE_CODES[params.type] ?? params.type.slice(0, 3).toUpperCase()

  const parts: string[] = [typeCode]

  // Structure parameter
  if (params.up !== undefined && params.down !== undefined) {
    parts.push(`${params.up}x${params.down}`)
  } else if (params.n !== undefined) {
    parts.push(`N${params.n}`)
  } else if (params.step !== undefined) {
    parts.push(`J${params.step}`)
  }

  // Direction
  if (params.direction && params.direction !== 'N/A') {
    parts.push(params.direction)
  }

  // Repeat / size
  if (params.repeat) {
    parts.push(`R${params.repeat}`)
  }

  // Modifier
  if (params.modifier && params.modifier !== 'solid') {
    parts.push(MODIFIER_CODES[params.modifier] ?? params.modifier.toUpperCase().slice(0, 4))
  }
  if (params.stripeWidth) {
    parts.push(`W${params.stripeWidth}`)
  }

  // Color
  const colorKey = (params.colors?.[0] ?? '').toLowerCase()
  const colorCode = COLOR_CODES[colorKey] ?? colorKey.toUpperCase().slice(0, 6)
  if (colorCode) parts.push(colorCode)

  return parts.join('-')
}

// ─── Display Name Generator ───────────────────────────────────────────────────

const WEAVE_DISPLAY_NAMES: Record<string, string> = {
  plain:              'Plain Weave',
  warp_rib:           'Warp Rib',
  weft_rib:           'Weft Rib',
  basket:             'Basket / Matt',
  twill:              'Twill',
  broken_twill:       'Broken Twill',
  herringbone:        'Herringbone',
  zigzag:             'Zig-Zag Twill',
  satin:              'Satin',
  honeycomb:          'Honeycomb',
  brighton_honeycomb: 'Brighton Honeycomb',
  birdseye:           'Birdseye',
  diamond:            'Diamond',
  mock_leno:          'Mock Leno',
  crepe:              'Crepe / Moss Crepe',
  bedford_cord:       'Bedford Cord',
  houndstooth:        'Houndstooth',
  dobby:              'Dobby',
}

const COLOR_DISPLAY: Record<string, string> = {
  indigo:    'Indigo',
  navy:      'Navy Blue',
  white:     'White',
  black:     'Black',
  ecru:      'Ecru',
  khaki:     'Khaki',
  red:       'Red',
  blue:      'Blue',
  green:     'Green',
  grey:      'Grey',
  cream:     'Cream',
  tan:       'Tan',
  burgundy:  'Burgundy',
  teal:      'Teal',
  multicolor:'Multicolor',
  natural:   'Natural',
}

/**
 * Generate a human-readable display name.
 * Example: "3/1 Z Twill (Repeat 8) – Indigo"
 */
export function getDisplayName(params: DesignParams): string {
  const base = WEAVE_DISPLAY_NAMES[params.type] ?? params.type

  let detail = ''
  if (params.up !== undefined && params.down !== undefined) {
    detail = `${params.up}/${params.down} `
  }
  if (params.direction && params.direction !== 'N/A') {
    detail += `${params.direction}-direction `
  }

  let name = `${detail}${base}`

  const extras: string[] = []
  if (params.repeat) extras.push(`Repeat ${params.repeat}`)
  if (params.n && params.type === 'satin') extras.push(`${params.n}-end`)
  if (params.stripeWidth) extras.push(`Stripe W${params.stripeWidth}`)
  if (params.modifier && params.modifier !== 'solid') {
    extras.push(params.modifier.charAt(0).toUpperCase() + params.modifier.slice(1))
  }
  if (extras.length) name += ` (${extras.join(', ')})`

  const colorKey = (params.colors?.[0] ?? '').toLowerCase()
  const colorLabel = COLOR_DISPLAY[colorKey]
  if (colorLabel) name += ` – ${colorLabel}`

  return name.trim()
}

// ─── WIF File Name Generator ──────────────────────────────────────────────────

/**
 * Generate a WIF-compatible file name (max 15 chars, snake_case, no specials).
 * Format: shrt_twl3x1_16S_32x32_hth_v042 (trimmed to fit)
 */
export function getWIFName(params: DesignParams, variantNum: number = 1): string {
  const typeAbbr = WEAVE_TYPE_CODES[params.type]?.toLowerCase().slice(0, 3) ?? 'ukn'
  const ratio = params.up && params.down ? `${params.up}x${params.down}` : ''
  const n = params.n ?? (params.up && params.down ? params.up + params.down : 4)
  const cat = (params.category ?? 'gen').slice(0, 4)
  const raw = `${cat}_${typeAbbr}${ratio}_${n}S_v${String(variantNum).padStart(3, '0')}`
  // Strip special chars, limit to 15
  return raw.replace(/[^a-z0-9_]/g, '').slice(0, 15)
}

// ─── Full Design Code (with hash) ─────────────────────────────────────────────

/**
 * Full unique design identifier in the format: TWL-3x1-Z-R8-INDIGO#A7F3K2
 */
export function getFullDesignCode(params: DesignParams): string {
  return `${getNameCode(params)}#${generateHashId(params)}`
}
