/**
 * Generative Design Engine
 * =========================
 * Orchestrates: generator → variation → naming → validation
 * 
 * Core philosophy:
 *   ✅ Stores parameters + metadata only
 *   ✅ Generates matrices on demand
 *   ✅ Validates against float/shaft constraints
 *   ✅ Produces 1000+ variations from ~20 base algorithms
 */

import type { DesignParams, DesignPreset, WeaveType } from './presets'
import { DESIGN_PRESETS } from './presets'
import {
  generatePlain, generateWarpRib, generateWeftRib, generateBasket,
  generateTwill, generateBrokenTwill, generateHerringbone, generateZigZag,
  generateSatin, generateHoneycomb, generateBrightonHoneycomb, generateBirdseye,
  generateDiamond, generateMockLeno, generateCrepe, generateBedfordCord,
  generateHoundstooth, validateMatrix, countRequiredShafts,
  type WeaveMatrix,
} from './generators'
import {
  applyBorder, mirrorX, mirrorY, flipDirection, tensorExpand,
  makeStripeVector, makeCheckVector, renderToImageData,
  COLOR_SWATCHES, type ColorSwatch,
} from './variations'
import {
  getNameCode, getDisplayName, generateHashId, getWIFName, getFullDesignCode,
} from './naming'

// ─── Generated Design Object ──────────────────────────────────────────────────

export interface GeneratedDesign {
  id:           string       // 6-char hash
  name_code:    string       // PLN-1x1-Z-R8-INDIGO
  full_code:    string       // name_code#hash
  display_name: string       // Human-readable
  wif_name:     string       // WIF-compatible filename
  params:       DesignParams
  matrix:       WeaveMatrix  // Generated on demand
  shaft_count:  number       // Computed from matrix
  repeat_rows:  number
  repeat_cols:  number
  is_valid:     boolean
  warnings:     string[]
  // Metadata from preset (if applicable)
  category?:    string
  fabric_type?: string
  weight?:      string
  popularity?:  number
  description?: string
  applications?: string[]
  tags?:        string[]
  // Source
  source:       'preset' | 'generated' | 'random' | 'user' | 'admin'
  preset_id?:   string
}

// ─── 1. Core Matrix Generator ─────────────────────────────────────────────────

/**
 * Generate the base weave matrix from params.
 * Applies modifiers (border, stripe, check, tensor) on top of base structure.
 */
export function generateMatrix(params: DesignParams): WeaveMatrix {
  // 1. Generate base structure
  let matrix: WeaveMatrix = getBaseMatrix(params)

  // 2. Apply direction flip (S direction)
  if (params.direction === 'S') {
    matrix = flipDirection(matrix)
  }

  // 3. Apply tensor expansion (rib/basket scaling)
  if (params.tensorN && params.tensorN > 1) {
    matrix = tensorExpand(matrix, params.tensorN)
  }

  // 4. Apply border modifier
  if (params.modifier === 'border' && params.borderWidth) {
    const borderMatrix = generatePlain()
    matrix = applyBorder(matrix, borderMatrix, params.borderWidth)
  }

  return matrix
}

function getBaseMatrix(params: DesignParams): WeaveMatrix {
  switch (params.type as WeaveType) {
    case 'plain':
      return generatePlain()
    case 'warp_rib':
      return generateWarpRib(params.n ?? 2)
    case 'weft_rib':
      return generateWeftRib(params.n ?? 2)
    case 'basket':
      return generateBasket(params.n ?? 2)
    case 'twill':
      return generateTwill(params.up ?? 3, params.down ?? 1, params.direction === 'S' ? 'S' : 'Z')
    case 'broken_twill':
      return generateBrokenTwill(params.up ?? 3, params.down ?? 1)
    case 'herringbone':
      return generateHerringbone(params.up ?? 2, params.down ?? 2)
    case 'zigzag':
      return generateZigZag(params.up ?? 2, params.down ?? 2)
    case 'satin':
      return generateSatin(params.n ?? 5, params.step ?? 2)
    case 'honeycomb':
      return generateHoneycomb(params.n ?? 8)
    case 'brighton_honeycomb':
      return generateBrightonHoneycomb(params.n ?? 12)
    case 'birdseye':
      return generateBirdseye(params.n ?? 4)
    case 'diamond':
      return generateDiamond(params.n ?? 8)
    case 'mock_leno':
      return generateMockLeno(params.n ?? 8)
    case 'crepe':
      return generateCrepe(params.seed ?? 42, params.n ?? 8, params.intensity ?? 0.2)
    case 'bedford_cord':
      return generateBedfordCord(params.n ?? 4)
    case 'houndstooth':
      return generateHoundstooth()
    default:
      return generatePlain()
  }
}

// ─── 2. Full Design Object Builder ───────────────────────────────────────────

let _variantCounter = 1

export function buildDesign(
  params: DesignParams,
  source: GeneratedDesign['source'] = 'generated',
  presetId?: string,
  presetMeta?: Partial<GeneratedDesign>
): GeneratedDesign {
  const matrix = generateMatrix(params)
  const shaftCount = countRequiredShafts(matrix)
  const warnings = validateMatrix(matrix, {
    maxShafts: params.shaft_count ?? 24,
  })

  const id = generateHashId(params)
  const nameCode = getNameCode(params)
  const displayName = presetMeta?.display_name ?? getDisplayName(params)
  const wifName = getWIFName(params, _variantCounter++)

  return {
    id,
    name_code: nameCode,
    full_code: `${nameCode}#${id}`,
    display_name: displayName,
    wif_name: wifName,
    params,
    matrix,
    shaft_count: shaftCount,
    repeat_rows: matrix.length,
    repeat_cols: matrix[0]?.length ?? 0,
    is_valid: warnings.length === 0,
    warnings,
    source,
    preset_id: presetId,
    category: presetMeta?.category ?? params.category,
    fabric_type: presetMeta?.fabric_type ?? params.fabric_type,
    weight: presetMeta?.weight ?? params.weight,
    popularity: presetMeta?.popularity ?? params.popularity ?? 50,
    description: presetMeta?.description ?? params.description,
    applications: presetMeta?.applications ?? params.applications,
    tags: presetMeta?.tags ?? params.tags ?? [],
  }
}

// ─── 3. Preset Loader ─────────────────────────────────────────────────────────

let _presetCache: GeneratedDesign[] | null = null

/** Load all presets as GeneratedDesign objects (cached). */
export function loadAllPresets(): GeneratedDesign[] {
  if (_presetCache) return _presetCache

  _presetCache = DESIGN_PRESETS.map(preset =>
    buildDesign(
      preset.params,
      'preset',
      preset.id,
      {
        display_name: preset.display_name,
        category: preset.category,
        fabric_type: preset.params.fabric_type,
        weight: preset.params.weight,
        popularity: preset.params.popularity,
        description: preset.params.description,
        applications: preset.params.applications,
        tags: preset.params.tags,
      }
    )
  )
  return _presetCache
}

/** Invalidate preset cache (call when user modifies presets). */
export function invalidatePresetCache(): void {
  _presetCache = null
}

// ─── 4. Variation Generator (Similar Designs) ────────────────────────────────

/**
 * Generate N variations of a design by permuting its parameters.
 * Used for "Generate Similar" feature.
 */
export function generateSimilar(
  baseParams: DesignParams,
  count: number = 6
): GeneratedDesign[] {
  const results: GeneratedDesign[] = []
  const seen = new Set<string>()

  // Direction flip
  if (baseParams.direction === 'Z' || baseParams.direction === 'S') {
    const flipped = { ...baseParams, direction: baseParams.direction === 'Z' ? 'S' as const : 'Z' as const }
    const h = generateHashId(flipped)
    if (!seen.has(h)) { seen.add(h); results.push(buildDesign(flipped, 'generated')) }
  }

  // Color variations
  const colorVariations = ['indigo', 'navy', 'black', 'ecru', 'grey', 'cream', 'teal', 'burgundy']
  for (const color of colorVariations) {
    if (results.length >= count) break
    const variant = { ...baseParams, colors: [color, baseParams.colors?.[1] ?? 'white'] }
    const h = generateHashId(variant)
    if (!seen.has(h)) { seen.add(h); results.push(buildDesign(variant, 'generated')) }
  }

  // Repeat / size variations
  if (baseParams.type === 'twill' && baseParams.up !== undefined) {
    const configs: Array<[number, number]> = [[2, 1], [2, 2], [3, 1], [4, 1], [1, 3]]
    for (const [up, down] of configs) {
      if (results.length >= count) break
      if (up === baseParams.up && down === baseParams.down) continue
      const variant = { ...baseParams, up, down }
      const h = generateHashId(variant)
      if (!seen.has(h)) { seen.add(h); results.push(buildDesign(variant, 'generated')) }
    }
  }

  // Modifier variations
  const modifiers: DesignParams['modifier'][] = ['solid', 'stripe', 'check']
  for (const mod of modifiers) {
    if (results.length >= count) break
    if (mod === baseParams.modifier) continue
    const variant: DesignParams = { ...baseParams, modifier: mod }
    if (mod === 'stripe' || mod === 'check') variant.stripeWidth = 4
    const h = generateHashId(variant)
    if (!seen.has(h)) { seen.add(h); results.push(buildDesign(variant, 'generated')) }
  }

  return results.slice(0, count)
}

// ─── 5. Random Design Generator ──────────────────────────────────────────────

const RANDOM_TYPES: WeaveType[] = [
  'plain', 'basket', 'twill', 'broken_twill', 'herringbone', 'zigzag',
  'satin', 'honeycomb', 'birdseye', 'diamond', 'mock_leno', 'crepe',
]

const RANDOM_COLORS = Object.keys(COLOR_SWATCHES)

/**
 * Generate a random valid design.
 * Optionally constrained by fabric type or max shaft count.
 */
export function generateRandom(constraints: {
  fabric_type?: string
  max_shafts?: number
  weave_type?: WeaveType
} = {}): GeneratedDesign {
  const rng = () => Math.random()

  for (let attempt = 0; attempt < 20; attempt++) {
    const type = constraints.weave_type ??
      RANDOM_TYPES[Math.floor(rng() * RANDOM_TYPES.length)]

    const up = Math.floor(rng() * 3) + 1      // 1–3
    const down = Math.floor(rng() * 3) + 1    // 1–3
    const n = (Math.floor(rng() * 4) + 2) * 2  // 4, 6, 8, 10
    const direction = rng() > 0.5 ? 'Z' : 'S' as const
    const color = RANDOM_COLORS[Math.floor(rng() * RANDOM_COLORS.length)]
    const color2 = RANDOM_COLORS[Math.floor(rng() * RANDOM_COLORS.length)]
    const modifier: DesignParams['modifier'] =
      rng() > 0.7 ? (rng() > 0.5 ? 'stripe' : 'check') : 'solid'

    const params: DesignParams = {
      type,
      up: ['twill', 'broken_twill', 'herringbone', 'zigzag'].includes(type) ? up : undefined,
      down: ['twill', 'broken_twill', 'herringbone', 'zigzag'].includes(type) ? down : undefined,
      n: ['satin', 'honeycomb', 'birdseye', 'diamond', 'mock_leno', 'crepe', 'basket', 'warp_rib'].includes(type) ? n : undefined,
      step: type === 'satin' ? undefined : undefined,  // will use default valid step
      direction: ['twill', 'satin', 'plain'].includes(type) ? direction : 'N/A',
      modifier,
      stripeWidth: modifier !== 'solid' ? (Math.floor(rng() * 3) + 2) * 2 : undefined,
      colors: [color, color2],
      seed: type === 'crepe' ? Math.floor(rng() * 1000) : undefined,
      intensity: type === 'crepe' ? 0.1 + rng() * 0.3 : undefined,
      category: 'presets',
      popularity: Math.floor(50 + rng() * 50),
    }

    const design = buildDesign(params, 'random')
    if (design.shaft_count <= (constraints.max_shafts ?? 24)) {
      return design
    }
  }

  // Fallback: plain
  return buildDesign({ type: 'plain', colors: ['indigo', 'white'], modifier: 'solid' }, 'random')
}

// ─── 6. Export: SVG ──────────────────────────────────────────────────────────

/**
 * Export design as an SVG string (tiled pattern).
 * @param design   GeneratedDesign
 * @param cellPx   pixels per cell
 * @param tilesX   horizontal repetitions
 * @param tilesY   vertical repetitions
 */
export function exportSVG(
  design: GeneratedDesign,
  cellPx: number = 8,
  tilesX: number = 6,
  tilesY: number = 6
): string {
  const { matrix, params } = design
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const colorKey = params.colors?.[0] ?? 'indigo'
  const color2Key = params.colors?.[1] ?? 'white'
  const swatch = COLOR_SWATCHES[colorKey] ?? COLOR_SWATCHES.indigo
  const swatch2 = COLOR_SWATCHES[color2Key] ?? COLOR_SWATCHES.white
  const warpColor = swatch.warp
  const weftColor = swatch2.weft

  const width = cols * cellPx * tilesX
  const height = rows * cellPx * tilesY

  const rects: string[] = []
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const x = (tx * cols + j) * cellPx
          const y = (ty * rows + i) * cellPx
          const fill = matrix[i][j] ? warpColor : weftColor
          rects.push(`<rect x="${x}" y="${y}" width="${cellPx}" height="${cellPx}" fill="${fill}"/>`)
        }
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <title>${design.display_name}</title>
  <desc>${design.full_code}</desc>
  ${rects.join('\n  ')}
</svg>`
}

// ─── 7. Export: WIF Text ──────────────────────────────────────────────────────

/**
 * Export design as a .wif (Weaving Information File) text string.
 * ASCII INI-style format per WIF 1.1 specification.
 * File name constraint from research: max 15 chars, no special chars.
 */
export function exportWIF(design: GeneratedDesign): string {
  const { matrix, params, display_name, wif_name } = design
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const today = new Date().toISOString().split('T')[0]

  // Build threading (straight draft)
  const threading = Array.from({ length: cols }, (_, i) => i + 1)
  const tieup = matrix.map((row, i) =>
    row.map((_, j) => matrix[i][j]).join(' ')
  )

  const lines: string[] = [
    '[WIF]',
    'Version=1.1',
    `Date=${today}`,
    `Developers=TextileAI Generative Engine`,
    `Source Program=FabricAI Studio`,
    `Source Version=3.0`,
    '',
    '[CONTENTS]',
    'Color Palette=true',
    'Threading=true',
    'Tieup=true',
    'Treadling=true',
    'Warp=true',
    'Weft=true',
    '',
    '[COLOR PALETTE]',
    'Entries=2',
    'Form=RGB',
    'Range=0,255',
    '',
    '[COLOR TABLE]',
    '1=0,0,128',   // warp color (indigo-like)
    '2=255,255,255', // weft color
    '',
    '[WARP]',
    `Threads=${cols}`,
    `Units=Decipoints`,
    `Thickness=10`,
    '',
    '[WEFT]',
    `Threads=${rows}`,
    `Units=Decipoints`,
    `Thickness=10`,
    '',
    '[THREADING]',
    ...threading.map((shaft, i) => `${i + 1}=${shaft}`),
    '',
    '[TIEUP]',
    ...tieup.map((row, i) => {
      const shafts = matrix[i]
        .map((v, j) => v ? j + 1 : null)
        .filter(Boolean)
        .join(',')
      return `${i + 1}=${shafts || '0'}`
    }),
    '',
    '[TREADLING]',
    ...Array.from({ length: rows }, (_, i) => `${i + 1}=${i + 1}`),
    '',
    '[NOTES]',
    `${display_name.slice(0, 32)}`,
    `Code: ${design.name_code}`,
    `ID: ${design.id}`,
  ]

  return lines.join('\r\n')
}

// ─── 8. Color Swatch Access ───────────────────────────────────────────────────

export function getColorSwatch(colorKey: string): ColorSwatch {
  return COLOR_SWATCHES[colorKey] ?? COLOR_SWATCHES.indigo
}

export { COLOR_SWATCHES, DESIGN_PRESETS }
export type { DesignParams, DesignPreset, WeaveMatrix, ColorSwatch }
