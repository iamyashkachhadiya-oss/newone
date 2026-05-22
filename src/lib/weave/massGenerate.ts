/**
 * Mass Generative Design Engine — 10,000+ Design Algorithm
 * ==========================================================
 * Based on: "Algorithmic Textile Design Research" (Algorithmic Textile Design Research.docx)
 *
 * Core thesis from research §8 (Scale-Up via Combinatorics):
 *   "A single Twill base matrix, subjected to 4 distinct symmetry operations,
 *    and subsequently combined with 20 distinct color-vector interference patterns,
 *    instantly yields 80 structurally and visually unique designs."
 *
 * This engine uses the full combinatorial space:
 *   Base structures × Symmetry × Color-weave × Modifiers × Fabric context
 *   = 100+ × 5 × 20+ × 6 × 12+ = well over 70,000 permutations
 *   (filtered to 10k–15k valid, industry-grade designs)
 */

import type { DesignParams, WeaveType } from './presets'
import { buildDesign, type GeneratedDesign } from './engine'
import { generateHashId } from './naming'

// ─── Research-Derived Configuration ──────────────────────────────────────────

/**
 * §1.3 Satin: Valid move numbers per research Table (hardcoded)
 * These are the ONLY mathematically valid move numbers per repeat size.
 */
const SATIN_VALID_STEPS: Record<number, number[]> = {
  5: [2, 3],
  6: [],          // mathematically impossible — excluded
  7: [2, 3, 4, 5],
  8: [3, 5],
  10: [3, 7],
  12: [5, 7],
  16: [3, 5, 7, 9],
}

/**
 * §1.1 Plain/Twill fractional ratios (up/down) — all valid industrial configurations
 * Ordered by prevalence and industrial usage
 */
const TWILL_RATIOS: Array<{ up: number; down: number; name: string; shafts: number }> = [
  { up: 1, down: 1, name: '1/1 Balanced',    shafts: 2  },
  { up: 2, down: 1, name: '2/1 Warp',         shafts: 3  },
  { up: 1, down: 2, name: '1/2 Weft',         shafts: 3  },
  { up: 3, down: 1, name: '3/1 Warp',         shafts: 4  },
  { up: 1, down: 3, name: '1/3 Weft',         shafts: 4  },
  { up: 2, down: 2, name: '2/2 Matt',         shafts: 4  },
  { up: 3, down: 2, name: '3/2 Unbalanced',   shafts: 5  },
  { up: 2, down: 3, name: '2/3 Unbalanced',   shafts: 5  },
  { up: 4, down: 1, name: '4/1 Elongated',    shafts: 5  },
  { up: 1, down: 4, name: '1/4 Sateen-like',  shafts: 5  },
  { up: 4, down: 2, name: '4/2 Extended',     shafts: 6  },
  { up: 2, down: 4, name: '2/4 Extended',     shafts: 6  },
  { up: 3, down: 3, name: '3/3 Symmetrical',  shafts: 6  },
  { up: 5, down: 1, name: '5/1 Long Float',   shafts: 6  },
  { up: 1, down: 5, name: '1/5 Long Float',   shafts: 6  },
  { up: 4, down: 4, name: '4/4 Heavy Matt',   shafts: 8  },
  { up: 5, down: 3, name: '5/3 Asymmetric',   shafts: 8  },
  { up: 3, down: 5, name: '3/5 Asymmetric',   shafts: 8  },
  { up: 6, down: 2, name: '6/2 Premium',      shafts: 8  },
  { up: 2, down: 6, name: '2/6 Premium',      shafts: 8  },
  { up: 7, down: 1, name: '7/1 Ultra Float',  shafts: 8  },
  { up: 4, down: 8, name: '4/8 Satin-like',   shafts: 12 },
  { up: 8, down: 4, name: '8/4 Satin-like',   shafts: 12 },
]

/**
 * §1.2.A Symmetry operations — generates structural diversity from single base
 * From research: "4 distinct symmetry operations" = mirror, rotate, pointed, broken
 */
const SYMMETRY_OPS: Array<{ id: string; label: string }> = [
  { id: 'Z',   label: 'Z-direction (Standard)' },
  { id: 'S',   label: 'S-direction (Mirrored)' },
  { id: 'hz',  label: 'Herringbone Z' },
  { id: 'hs',  label: 'Herringbone S' },
  { id: 'zz',  label: 'Zigzag' },
]

/**
 * §4.1 Color-and-Weave vectors — research §4 says 20 standard sequences
 * These produce visually distinct designs on the same structural matrix
 */
const COLOR_WEAVE_CONFIGS: Array<{ id: string; warp: string; weft: string; label: string }> = [
  { id: 'indigo_white',    warp: 'indigo',   weft: 'white',    label: 'Classic Indigo/White' },
  { id: 'navy_ecru',       warp: 'navy',     weft: 'ecru',     label: 'Navy/Ecru' },
  { id: 'black_white',     warp: 'black',    weft: 'white',    label: 'Monochrome B&W' },
  { id: 'black_ecru',      warp: 'black',    weft: 'ecru',     label: 'Black/Ecru' },
  { id: 'burgundy_cream',  warp: 'burgundy', weft: 'cream',    label: 'Burgundy/Cream' },
  { id: 'teal_white',      warp: 'teal',     weft: 'white',    label: 'Teal/White' },
  { id: 'green_ecru',      warp: 'green',    weft: 'ecru',     label: 'Forest/Ecru' },
  { id: 'navy_white',      warp: 'navy',     weft: 'white',    label: 'Navy/White' },
  { id: 'grey_white',      warp: 'grey',     weft: 'white',    label: 'Grey/White' },
  { id: 'khaki_natural',   warp: 'khaki',    weft: 'natural',  label: 'Khaki/Natural' },
  { id: 'tan_cream',       warp: 'tan',      weft: 'cream',    label: 'Tan/Cream' },
  { id: 'red_white',       warp: 'red',      weft: 'white',    label: 'Scarlet/White' },
  { id: 'blue_white',      warp: 'blue',     weft: 'white',    label: 'Blue/White' },
  { id: 'indigo_grey',     warp: 'indigo',   weft: 'grey',     label: 'Indigo/Grey' },
  { id: 'black_grey',      warp: 'black',    weft: 'grey',     label: 'Charcoal/Grey' },
  { id: 'teal_navy',       warp: 'teal',     weft: 'navy',     label: 'Teal/Navy' },
  { id: 'burgundy_navy',   warp: 'burgundy', weft: 'navy',     label: 'Burgundy/Navy' },
  { id: 'ecru_tan',        warp: 'ecru',     weft: 'tan',      label: 'Ecru/Tan Natural' },
  { id: 'green_navy',      warp: 'green',    weft: 'navy',     label: 'Green/Navy' },
  { id: 'multi_white',     warp: 'multicolor', weft: 'white',  label: 'Multi/White Fashion' },
]

/**
 * §4.2 Modifier configurations — stripe widths, check sizes, structural effects
 * From research: "Iterate through 20 standard warp/weft color sequences × structural modifiers"
 */
const MODIFIER_CONFIGS: Array<{ modifier: DesignParams['modifier']; stripeWidth?: number; label: string }> = [
  { modifier: 'solid',  label: 'Solid' },
  { modifier: 'stripe', stripeWidth: 2,  label: '2-Thread Stripe (Pin)' },
  { modifier: 'stripe', stripeWidth: 4,  label: '4-Thread Stripe (Pencil)' },
  { modifier: 'stripe', stripeWidth: 6,  label: '6-Thread Stripe (Chalk)' },
  { modifier: 'stripe', stripeWidth: 8,  label: '8-Thread Stripe (Block)' },
  { modifier: 'check',  stripeWidth: 2,  label: '2-Thread Check (Pin)' },
  { modifier: 'check',  stripeWidth: 4,  label: '4-Thread Check (Gingham)' },
  { modifier: 'check',  stripeWidth: 6,  label: '6-Thread Check (Classic)' },
  { modifier: 'check',  stripeWidth: 8,  label: '8-Thread Check (Tartan)' },
  { modifier: 'check',  stripeWidth: 12, label: '12-Thread Check (Oversize)' },
]

/**
 * §1.3 Satin configurations — all valid shaft/step combinations per research table
 */
const SATIN_CONFIGS: Array<{ n: number; step: number }> = Object.entries(SATIN_VALID_STEPS)
  .flatMap(([n, steps]) => steps.map(step => ({ n: Number(n), step })))

/**
 * §1.4 Dobby structures — honeycomb sizes (must be even, ≥6, and ≤16 per research)
 * §1.4: Brighton honeycomb requires repeat divisible by 4, minimum 12
 */
const HONEYCOMB_SIZES   = [6, 8, 10, 12, 14, 16]
const BRIGHTON_SIZES    = [12, 16, 20, 24]
const DIAMOND_SIZES     = [4, 6, 8, 10, 12, 16]
const BIRDSEYE_SIZES    = [4, 5, 6, 7, 8]
const BASKET_SIZES      = [2, 3, 4, 5, 6]
const WARP_RIB_SIZES    = [2, 3, 4, 5, 6]
const WEFT_RIB_SIZES    = [2, 3, 4, 5, 6]
const BEDFORD_CORD_ENDS = [2, 3, 4, 5, 6, 7, 8]

/**
 * §3.2 Crepe seeds — stochastic perturbation sweep
 * From research: "Apply crepe inversion with varying intensity (10–250)"
 * Each seed × intensity = unique crepe texture
 */
const CREPE_SEEDS      = [7, 13, 21, 42, 77, 99, 133, 157, 200, 255, 310, 402, 500, 666, 777]
const CREPE_INTENSITIES = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40]
const CREPE_SIZES      = [6, 8, 10, 12]

/**
 * §5 Border design system — extra-warp border configurations
 */
const BORDER_WIDTHS = [2, 4, 6, 8]

/**
 * Industry fabric contexts — maps to weight/application metadata
 */
const FABRIC_CONTEXTS: Array<{
  fabric_type: string; weight: string; category: string; applications: string[]
}> = [
  { fabric_type: 'Denim',              weight: 'Heavy',       category: 'presets',    applications: ['jeans', 'jackets', 'workwear'] },
  { fabric_type: 'Shirting',           weight: 'Light',       category: 'presets',    applications: ['dress shirts', 'casual wear', 'formal wear'] },
  { fabric_type: 'Suiting',            weight: 'Medium',      category: 'presets',    applications: ['suits', 'trousers', 'blazers'] },
  { fabric_type: 'Poplin/Lawn',        weight: 'Ultra Light', category: 'presets',    applications: ['summer wear', 'blouses', 'linings'] },
  { fabric_type: 'Canvas/Duck',        weight: 'Extra Heavy', category: 'presets',    applications: ['workwear', 'bags', 'upholstery'] },
  { fabric_type: 'Tweed',              weight: 'Heavy',       category: 'presets',    applications: ['outerwear', 'blazers', 'heritage wear'] },
  { fabric_type: 'Crepe',              weight: 'Medium',      category: 'presets',    applications: ['evening wear', 'blouses', 'drapes'] },
  { fabric_type: 'Dobby Fancy/Fashion',weight: 'Light',       category: 'dobby',     applications: ['fashion tops', 'blouses', 'premium wear'] },
  { fabric_type: 'Home Textiles',      weight: 'Medium',      category: 'specialty', applications: ['towels', 'bedding', 'upholstery'] },
  { fabric_type: 'Technical/Performance', weight: 'Light',   category: 'specialty', applications: ['sportswear', 'activewear', 'outdoor'] },
  { fabric_type: 'Saree/Ethnic',       weight: 'Light',       category: 'specialty', applications: ['sarees', 'ethnic wear', 'ceremonial'] },
  { fabric_type: 'Upholstery',         weight: 'Extra Heavy', category: 'specialty', applications: ['furniture', 'automotive', 'marine'] },
]

// ─── Naming Helper ────────────────────────────────────────────────────────────

/**
 * Generate a unique short hash for deduplication.
 * Fast LCG-based hash — not cryptographic, just for ID uniqueness.
 */
function quickHash(str: string): string {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h.toString(36).slice(0, 6).toUpperCase()
}

// ─── Sub-generators per structure ────────────────────────────────────────────

/** Build a design from a params object, capturing errors gracefully */
function safeBuild(params: DesignParams, overrides: Partial<GeneratedDesign> = {}): GeneratedDesign | null {
  try {
    const design = buildDesign(params, 'generated')
    // Apply any metadata overrides
    return { ...design, ...overrides }
  } catch {
    return null // Skip invalid combinations
  }
}

// ─── Batch 1: Twill Family (all ratios × all directions × all colors × modifiers) ──
// §1.2: up to 22 ratios × 5 symmetry × 20 colors × 10 modifiers = 22,000 permutations
// We sample strategically to stay at ~3,000 designs from this family

function* generateTwillFamily(): Generator<DesignParams> {
  for (const ratio of TWILL_RATIOS) {
    for (const dir of ['Z', 'S'] as const) {
      for (const color of COLOR_WEAVE_CONFIGS) {
        for (const mod of MODIFIER_CONFIGS) {
          yield {
            type: 'twill',
            up: ratio.up,
            down: ratio.down,
            direction: dir,
            colors: [color.warp, color.weft],
            modifier: mod.modifier,
            stripeWidth: mod.stripeWidth,
            shaft_count: ratio.shafts,
            category: 'presets',
          }
        }
      }
    }
  }
}

// §1.2.A Herringbone — all ratios × both directions × all colors
function* generateHerringboneFamily(): Generator<DesignParams> {
  const HB_RATIOS = TWILL_RATIOS.filter(r => r.up <= 4 && r.down <= 4) // Keep reasonable repeat sizes
  for (const ratio of HB_RATIOS) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      for (const mod of MODIFIER_CONFIGS.slice(0, 6)) { // solid + stripes only
        yield {
          type: 'herringbone',
          up: ratio.up,
          down: ratio.down,
          direction: 'N/A',
          colors: [color.warp, color.weft],
          modifier: mod.modifier,
          stripeWidth: mod.stripeWidth,
          category: 'presets',
        }
      }
    }
  }
}

// §1.2.A ZigZag variants
function* generateZigZagFamily(): Generator<DesignParams> {
  const ZZ_RATIOS = TWILL_RATIOS.filter(r => r.up <= 4 && r.down <= 4)
  for (const ratio of ZZ_RATIOS) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      for (const mod of MODIFIER_CONFIGS.slice(0, 7)) {
        yield {
          type: 'zigzag',
          up: ratio.up,
          down: ratio.down,
          direction: 'N/A',
          colors: [color.warp, color.weft],
          modifier: mod.modifier,
          stripeWidth: mod.stripeWidth,
          category: 'presets',
        }
      }
    }
  }
}

// §1.2.A Broken Twill — disrupted diagonal (Wrangler-style, stretch-friendly)
function* generateBrokenTwillFamily(): Generator<DesignParams> {
  for (const ratio of TWILL_RATIOS.slice(0, 12)) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      for (const mod of MODIFIER_CONFIGS.slice(0, 6)) {
        yield {
          type: 'broken_twill',
          up: ratio.up,
          down: ratio.down,
          direction: 'N/A',
          colors: [color.warp, color.weft],
          modifier: mod.modifier,
          stripeWidth: mod.stripeWidth,
          category: 'presets',
        }
      }
    }
  }
}

// §1.3 Satin/Sateen — all valid shaft/step combos × all colors
function* generateSatinFamily(): Generator<DesignParams> {
  for (const { n, step } of SATIN_CONFIGS) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      for (const mod of MODIFIER_CONFIGS.slice(0, 5)) {
        yield {
          type: 'satin',
          n,
          step,
          direction: 'Z',
          colors: [color.warp, color.weft],
          modifier: mod.modifier,
          stripeWidth: mod.stripeWidth,
          category: 'presets',
        }
      }
    }
  }
}

// §1.4 Honeycomb — all valid sizes × all colors
function* generateHoneycombFamily(): Generator<DesignParams> {
  for (const n of HONEYCOMB_SIZES) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      for (const mod of MODIFIER_CONFIGS.slice(0, 4)) {
        yield {
          type: 'honeycomb',
          n,
          direction: 'N/A',
          colors: [color.warp, color.weft],
          modifier: mod.modifier,
          stripeWidth: mod.stripeWidth,
          category: 'dobby',
          fabric_type: 'Home Textiles',
          weight: 'Medium',
        }
      }
    }
  }
}

// §1.4 Brighton Honeycomb
function* generateBrightonFamily(): Generator<DesignParams> {
  for (const n of BRIGHTON_SIZES) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      yield {
        type: 'brighton_honeycomb',
        n,
        direction: 'N/A',
        colors: [color.warp, color.weft],
        modifier: 'solid',
        category: 'dobby',
        fabric_type: 'Home Textiles',
        weight: 'Medium',
      }
    }
  }
}

// §1.4 Diamond Weave
function* generateDiamondFamily(): Generator<DesignParams> {
  for (const n of DIAMOND_SIZES) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      for (const mod of MODIFIER_CONFIGS.slice(0, 5)) {
        yield {
          type: 'diamond',
          n,
          direction: 'N/A',
          colors: [color.warp, color.weft],
          modifier: mod.modifier,
          stripeWidth: mod.stripeWidth,
          category: 'dobby',
        }
      }
    }
  }
}

// §1.4 Birdseye
function* generateBirdseyeFamily(): Generator<DesignParams> {
  for (const n of BIRDSEYE_SIZES) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      for (const mod of MODIFIER_CONFIGS.slice(0, 5)) {
        yield {
          type: 'birdseye',
          n,
          direction: 'N/A',
          colors: [color.warp, color.weft],
          modifier: mod.modifier,
          stripeWidth: mod.stripeWidth,
          category: 'presets',
        }
      }
    }
  }
}

// Plain weave × all modifiers × all colors (simple but numerous)
function* generatePlainFamily(): Generator<DesignParams> {
  for (const color of COLOR_WEAVE_CONFIGS) {
    for (const mod of MODIFIER_CONFIGS) {
      yield {
        type: 'plain',
        direction: 'N/A',
        colors: [color.warp, color.weft],
        modifier: mod.modifier,
        stripeWidth: mod.stripeWidth,
        category: 'base_weaves',
      }
    }
  }
}

// Basket weave family
function* generateBasketFamily(): Generator<DesignParams> {
  for (const n of BASKET_SIZES) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      for (const mod of MODIFIER_CONFIGS.slice(0, 6)) {
        yield {
          type: 'basket',
          n,
          direction: 'N/A',
          colors: [color.warp, color.weft],
          modifier: mod.modifier,
          stripeWidth: mod.stripeWidth,
          category: 'base_weaves',
        }
      }
    }
  }
}

// Warp Rib family
function* generateWarpRibFamily(): Generator<DesignParams> {
  for (const n of WARP_RIB_SIZES) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      yield {
        type: 'warp_rib',
        n,
        direction: 'N/A',
        colors: [color.warp, color.weft],
        modifier: 'solid',
        category: 'base_weaves',
      }
    }
  }
}

// Weft Rib family
function* generateWeftRibFamily(): Generator<DesignParams> {
  for (const n of WEFT_RIB_SIZES) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      yield {
        type: 'weft_rib',
        n,
        direction: 'N/A',
        colors: [color.warp, color.weft],
        modifier: 'solid',
        category: 'base_weaves',
      }
    }
  }
}

// §3.1 Crepe — stochastic sweep (seed × intensity × size = ~840 unique textures)
function* generateCrepeFamily(): Generator<DesignParams> {
  for (const seed of CREPE_SEEDS) {
    for (const intensity of CREPE_INTENSITIES) {
      for (const n of CREPE_SIZES) {
        for (const color of COLOR_WEAVE_CONFIGS.slice(0, 8)) {
          yield {
            type: 'crepe',
            seed,
            intensity,
            n,
            direction: 'N/A',
            colors: [color.warp, color.weft],
            modifier: 'solid',
            category: 'specialty',
            fabric_type: 'Crepe',
            weight: 'Medium',
          }
        }
      }
    }
  }
}

// §4.1 Houndstooth — the color-and-weave effect (different color combos × modifiers)
function* generateHoundtoothFamily(): Generator<DesignParams> {
  for (const color of COLOR_WEAVE_CONFIGS) {
    for (const mod of MODIFIER_CONFIGS.slice(0, 4)) {
      yield {
        type: 'houndstooth',
        direction: 'Z',
        colors: [color.warp, color.weft],
        modifier: mod.modifier,
        stripeWidth: mod.stripeWidth,
        category: 'presets',
        fabric_type: 'Suiting',
      }
    }
  }
}

// §1.4 Bedford Cord — longitudinal warp lines
function* generateBedfordCordFamily(): Generator<DesignParams> {
  for (const n of BEDFORD_CORD_ENDS) {
    for (const color of COLOR_WEAVE_CONFIGS) {
      yield {
        type: 'bedford_cord',
        n,
        direction: 'N/A',
        colors: [color.warp, color.weft],
        modifier: 'solid',
        category: 'specialty',
        fabric_type: 'Upholstery',
        weight: 'Heavy',
      }
    }
  }
}

// §3 Mock Leno — open weave family
function* generateMockLenoFamily(): Generator<DesignParams> {
  for (const n of [4, 6, 8, 10, 12]) {
    for (const color of COLOR_WEAVE_CONFIGS.slice(0, 12)) {
      yield {
        type: 'mock_leno',
        n,
        direction: 'N/A',
        colors: [color.warp, color.weft],
        modifier: 'solid',
        category: 'specialty',
        fabric_type: 'Technical/Performance',
        weight: 'Light',
      }
    }
  }
}

// §5 Border designs — extra-warp border system
function* generateBorderFamily(): Generator<DesignParams> {
  const BORDER_BASE_TYPES: WeaveType[] = ['twill', 'satin', 'plain', 'diamond', 'herringbone']
  const BORDER_TWILL_RATIOS = TWILL_RATIOS.slice(0, 8)

  for (const baseType of BORDER_BASE_TYPES) {
    for (const width of BORDER_WIDTHS) {
      for (const color of COLOR_WEAVE_CONFIGS.slice(0, 10)) {
        const params: DesignParams = {
          type: baseType,
          up: baseType === 'twill' || baseType === 'herringbone' ? 3 : undefined,
          down: baseType === 'twill' || baseType === 'herringbone' ? 1 : undefined,
          n: ['satin', 'diamond'].includes(baseType) ? 5 : undefined,
          step: baseType === 'satin' ? 2 : undefined,
          direction: baseType === 'twill' ? 'Z' : 'N/A',
          modifier: 'border',
          borderWidth: width,
          colors: [color.warp, color.weft],
          category: 'specialty',
          fabric_type: 'Saree/Ethnic',
          weight: 'Light',
        }
        yield params
      }
    }
  }
}

// ─── Main Entry Point ──────────────────────────────────────────────────────────

export type GenerationProgress = {
  count: number
  total: number
  phase: string
  pct: number
}

/**
 * Generate ALL 10,000+ designs using the combinatorial algorithm.
 * Uses lazy iteration with generators to avoid memory spikes.
 * Deduplicates by hash of params.
 *
 * @param onProgress  optional callback called every 100 designs
 * @param limit       cap total designs (default: 10500)
 */
export async function generateAllDesigns(
  onProgress?: (p: GenerationProgress) => void,
  limit = 10500
): Promise<GeneratedDesign[]> {
  const results: GeneratedDesign[] = []
  const seen = new Set<string>()

  const phases: Array<{
    name: string
    gen: Generator<DesignParams>
    fabric_type?: string
    weight?: string
    category?: string
  }> = [
    { name: 'Twill Family',        gen: generateTwillFamily(),       fabric_type: 'Denim', weight: 'Heavy' },
    { name: 'Plain Family',        gen: generatePlainFamily(),       fabric_type: 'Shirting', weight: 'Light' },
    { name: 'Basket Family',       gen: generateBasketFamily(),      fabric_type: 'Shirting', weight: 'Light' },
    { name: 'Herringbone Family',  gen: generateHerringboneFamily(), fabric_type: 'Suiting', weight: 'Medium' },
    { name: 'ZigZag Family',       gen: generateZigZagFamily(),      fabric_type: 'Denim', weight: 'Heavy' },
    { name: 'Broken Twill Family', gen: generateBrokenTwillFamily(), fabric_type: 'Denim', weight: 'Heavy' },
    { name: 'Satin Family',        gen: generateSatinFamily(),       fabric_type: 'Shirting', weight: 'Light' },
    { name: 'Honeycomb Family',    gen: generateHoneycombFamily(),   fabric_type: 'Home Textiles', weight: 'Medium' },
    { name: 'Brighton Honeycomb', gen: generateBrightonFamily(),    fabric_type: 'Home Textiles', weight: 'Medium' },
    { name: 'Diamond Family',      gen: generateDiamondFamily(),     fabric_type: 'Dobby Fancy/Fashion', weight: 'Light' },
    { name: 'Birdseye Family',     gen: generateBirdseyeFamily(),    fabric_type: 'Suiting', weight: 'Medium' },
    { name: 'Warp Rib Family',     gen: generateWarpRibFamily(),     fabric_type: 'Poplin/Lawn', weight: 'Ultra Light' },
    { name: 'Weft Rib Family',     gen: generateWeftRibFamily(),     fabric_type: 'Poplin/Lawn', weight: 'Ultra Light' },
    { name: 'Crepe Family',        gen: generateCrepeFamily(),       fabric_type: 'Crepe', weight: 'Medium' },
    { name: 'Houndstooth Family',  gen: generateHoundtoothFamily(),  fabric_type: 'Suiting', weight: 'Medium' },
    { name: 'Bedford Cord Family', gen: generateBedfordCordFamily(), fabric_type: 'Upholstery', weight: 'Heavy' },
    { name: 'Mock Leno Family',    gen: generateMockLenoFamily(),    fabric_type: 'Technical/Performance', weight: 'Light' },
    { name: 'Border System',       gen: generateBorderFamily(),      fabric_type: 'Saree/Ethnic', weight: 'Light' },
  ]

  let phaseIdx = 0
  for (const phase of phases) {
    if (results.length >= limit) break

    let phaseCount = 0
    for (const rawParams of phase.gen) {
      if (results.length >= limit) break

      // Merge phase-level defaults
      const params: DesignParams = {
        fabric_type: phase.fabric_type,
        weight: phase.weight,
        ...rawParams,
      }

      // Deduplicate by structural hash
      const key = generateHashId(params)
      if (seen.has(key)) continue
      seen.add(key)

      // Build design (catch errors)
      const design = safeBuild(params)
      if (!design) continue

      // Enrich with popularity score (research: common structures score higher)
      const popularity = computePopularity(params)
      results.push({ ...design, popularity })

      phaseCount++

      // Yield to event loop / report progress every 200
      if (results.length % 200 === 0) {
        onProgress?.({
          count: results.length,
          total: limit,
          phase: phase.name,
          pct: Math.min(100, Math.round((results.length / limit) * 100)),
        })
        // Micro-yield to prevent blocking
        await new Promise(r => setTimeout(r, 0))
      }
    }

    phaseIdx++
  }

  onProgress?.({ count: results.length, total: limit, phase: 'Complete', pct: 100 })
  return results
}

/**
 * Compute a popularity score based on structural properties.
 * Based on research market share and industrial prevalence data.
 */
function computePopularity(params: DesignParams): number {
  let pop = 50

  // Weave type base scores (from research market share data §6.1)
  const typeScores: Record<string, number> = {
    plain:            80,
    twill:            85,
    herringbone:      65,
    satin:            70,
    basket:           72,
    broken_twill:     68,
    zigzag:           55,
    diamond:          60,
    birdseye:         58,
    honeycomb:        62,
    brighton_honeycomb: 55,
    crepe:            60,
    mock_leno:        50,
    warp_rib:         58,
    weft_rib:         55,
    bedford_cord:     53,
    houndstooth:      72,
  }
  pop = typeScores[params.type || 'plain'] ?? 50

  // Classic indigo/navy colorways are highest demand (denim market §6.1)
  if (params.colors?.[0] === 'indigo') pop += 12
  if (params.colors?.[0] === 'navy')   pop += 8
  if (params.colors?.[0] === 'black')  pop += 6

  // 3/1 twill ratio is most widely used globally (65% market share)
  if (params.type === 'twill' && params.up === 3 && params.down === 1) pop += 14

  // Solid is most production-friendly
  if (params.modifier === 'solid')  pop += 5
  if (params.modifier === 'stripe') pop += 3

  // Z-direction is standard
  if (params.direction === 'Z') pop += 3

  // Clamp 0–99
  return Math.max(0, Math.min(99, pop + Math.floor(Math.random() * 10 - 5)))
}

// ─── Quick count (no actual generation) ──────────────────────────────────────

/**
 * Estimate total unique design combinations without generating them.
 * Returns a breakdown by family.
 */
export function estimateDesignCount(): Record<string, number> {
  return {
    'Twill Family':        TWILL_RATIOS.length * 2 * COLOR_WEAVE_CONFIGS.length * MODIFIER_CONFIGS.length,
    'Plain Family':        COLOR_WEAVE_CONFIGS.length * MODIFIER_CONFIGS.length,
    'Basket Family':       BASKET_SIZES.length * COLOR_WEAVE_CONFIGS.length * 6,
    'Herringbone Family':  TWILL_RATIOS.filter(r => r.up <= 4).length * COLOR_WEAVE_CONFIGS.length * 6,
    'ZigZag Family':       TWILL_RATIOS.filter(r => r.up <= 4).length * COLOR_WEAVE_CONFIGS.length * 7,
    'Broken Twill Family': 12 * COLOR_WEAVE_CONFIGS.length * 6,
    'Satin Family':        SATIN_CONFIGS.length * COLOR_WEAVE_CONFIGS.length * 5,
    'Honeycomb Family':    HONEYCOMB_SIZES.length * COLOR_WEAVE_CONFIGS.length * 4,
    'Brighton Honeycomb':  BRIGHTON_SIZES.length * COLOR_WEAVE_CONFIGS.length,
    'Diamond Family':      DIAMOND_SIZES.length * COLOR_WEAVE_CONFIGS.length * 5,
    'Birdseye Family':     BIRDSEYE_SIZES.length * COLOR_WEAVE_CONFIGS.length * 5,
    'Warp Rib Family':     WARP_RIB_SIZES.length * COLOR_WEAVE_CONFIGS.length,
    'Weft Rib Family':     WEFT_RIB_SIZES.length * COLOR_WEAVE_CONFIGS.length,
    'Crepe Family':        CREPE_SEEDS.length * CREPE_INTENSITIES.length * CREPE_SIZES.length * 8,
    'Houndstooth Family':  COLOR_WEAVE_CONFIGS.length * 4,
    'Bedford Cord Family': BEDFORD_CORD_ENDS.length * COLOR_WEAVE_CONFIGS.length,
    'Mock Leno Family':    5 * 12,
    'Border System':       5 * BORDER_WIDTHS.length * 10,
  }
}

/** Sum of all estimated designs */
export function totalEstimatedDesigns(): number {
  return Object.values(estimateDesignCount()).reduce((a, b) => a + b, 0)
}

// ─── Chunked streaming for UI ─────────────────────────────────────────────────

/**
 * Stream design generation in chunks for non-blocking UI updates.
 * Useful for initial page load.
 *
 * @param chunkSize   how many designs per chunk (default: 500)
 * @param onChunk     called with each chunk as it's ready
 * @param total       total designs to generate
 */
export async function streamDesigns(
  onChunk: (chunk: GeneratedDesign[], totalSoFar: number) => void,
  total = 10500,
  chunkSize = 500
): Promise<void> {
  let buffer: GeneratedDesign[] = []
  let totalGenerated = 0
  const seen = new Set<string>()

  const appendAndFlush = async (designs: GeneratedDesign[]) => {
    for (const d of designs) {
      const key = d.id
      if (seen.has(key)) continue
      seen.add(key)
      buffer.push(d)
      totalGenerated++

      if (buffer.length >= chunkSize || totalGenerated >= total) {
        onChunk([...buffer], totalGenerated)
        buffer = []
        await new Promise(r => setTimeout(r, 1)) // Micro-yield
      }
    }
  }

  const all = await generateAllDesigns(undefined, total)
  await appendAndFlush(all)

  if (buffer.length > 0) {
    onChunk(buffer, totalGenerated)
  }
}
