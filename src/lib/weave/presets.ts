/**
 * Design Presets & Parameter Registry
 * =====================================
 * Stores 60+ parameterized design entries — NOT full matrices.
 * Full matrices are generated on-demand by the engine.
 *
 * Each preset stores:
 *   id, name_code, display_name, category, fabric_type, params
 *
 * Categories:
 *   base_weaves  – fundamental structures
 *   modifiers    – pattern variations
 *   presets      – industry-standard fabric presets (denim, shirting, suiting, etc.)
 *   dobby        – complex dobby patterns
 *   specialty    – advanced / research-derived designs
 */

export type WeaveType =
  | 'plain' | 'warp_rib' | 'weft_rib' | 'basket'
  | 'twill' | 'broken_twill' | 'herringbone' | 'zigzag'
  | 'satin' | 'honeycomb' | 'brighton_honeycomb' | 'birdseye'
  | 'diamond' | 'mock_leno' | 'crepe' | 'bedford_cord' | 'houndstooth'

export type FabricCategory = 'base_weaves' | 'modifiers' | 'presets' | 'dobby' | 'specialty'

export interface DesignParams {
  type:          WeaveType
  // Twill / rib / basket
  up?:           number       // warp-up count  (e.g. 3 for 3/1 twill)
  down?:         number       // warp-down count (e.g. 1 for 3/1 twill)
  direction?:    'Z' | 'S' | 'N/A'
  // Repeat / size
  repeat?:       number       // explicit repeat override
  n?:            number       // general size param (satin ends, honeycomb n, etc.)
  step?:         number       // satin move number
  // Crepe
  seed?:         number       // RNG seed for crepe
  intensity?:    number       // crepe flip intensity
  // Variations
  modifier?:     'solid' | 'stripe' | 'check' | 'border' | 'texture' | 'houndstooth'
  stripeWidth?:  number       // stripe band width in threads
  borderWidth?:  number       // border width in threads
  tensorN?:      number       // tensor expansion factor
  colors?:       string[]     // color palette (references COLOR_SWATCHES keys)
  // Metadata
  category?:     FabricCategory
  fabric_type?:  string
  weight?:       string
  shaft_count?:  number
  applications?: string[]
  tags?:         string[]
  popularity?:   number
  description?:  string
}

export interface DesignPreset {
  id:           string
  name_code:    string   // internal code e.g. PLN-1x1-ALT-STRP-W2-BLKWH
  display_name: string   // human readable
  category:     FabricCategory
  params:       DesignParams
}

// ─── Color Scheme Helpers ─────────────────────────────────────────────────────

const denim     = ['indigo', 'white']
const shirting  = ['white', 'blue']
const suiting   = ['grey', 'black']
const natural   = ['natural', 'ecru']
const navy      = ['navy', 'white']
const multi     = ['multicolor', 'ecru']
const indigo    = ['indigo']
const cream     = ['cream', 'tan']
const burgundy  = ['burgundy', 'cream']
const teal      = ['teal', 'white']

// ─── Preset Registry ─────────────────────────────────────────────────────────

export const DESIGN_PRESETS: DesignPreset[] = [

  // ──────────────────────────────────────────────────────────────────
  // BASE WEAVES
  // ──────────────────────────────────────────────────────────────────

  {
    id: 'BW001',
    name_code: 'PLN-1x1-NA-SLD-WHITE',
    display_name: 'Plain Weave (Base)',
    category: 'base_weaves',
    params: { type: 'plain', direction: 'N/A', modifier: 'solid', colors: ['white', 'grey'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 2, popularity: 95,
      tags: ['plain', 'basic', 'universal'],
      description: 'The most fundamental weave structure. Maximum interlacement, highest stability.' },
  },
  {
    id: 'BW002',
    name_code: 'WRB-N2-NA-SLD-ECRU',
    display_name: 'Warp Rib (2-end)',
    category: 'base_weaves',
    params: { type: 'warp_rib', n: 2, direction: 'N/A', modifier: 'solid', colors: ['ecru', 'cream'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 2, popularity: 72,
      tags: ['rib', 'warp', 'textured'],
      description: '2-end warp rib weave. Pronounced horizontal cord effect.' },
  },
  {
    id: 'BW003',
    name_code: 'FRB-N2-NA-SLD-WHITE',
    display_name: 'Weft Rib (2-end)',
    category: 'base_weaves',
    params: { type: 'weft_rib', n: 2, direction: 'N/A', modifier: 'solid', colors: ['white', 'ecru'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 2, popularity: 68,
      tags: ['rib', 'weft', 'textured'],
      description: '2-end weft rib. Pronounced vertical cord effect.' },
  },
  {
    id: 'BW004',
    name_code: 'WRB-N4-NA-SLD-ECRU',
    display_name: 'Warp Rib (4-end)',
    category: 'base_weaves',
    params: { type: 'warp_rib', n: 4, direction: 'N/A', modifier: 'solid', colors: ['ecru', 'white'],
      fabric_type: 'Canvas/Duck', weight: 'Heavy', shaft_count: 4, popularity: 60,
      tags: ['rib', 'warp', 'heavy'],
      description: 'Heavy 4-end warp rib. Used in canvas and furnishing fabrics.' },
  },
  {
    id: 'BW005',
    name_code: 'BKT-N2-NA-SLD-BLUE',
    display_name: 'Basket Weave (2×2)',
    category: 'base_weaves',
    params: { type: 'basket', n: 2, direction: 'N/A', modifier: 'solid', colors: ['blue', 'white'],
      fabric_type: 'Shirting', weight: 'Medium', shaft_count: 4, popularity: 82,
      tags: ['basket', 'oxford', 'classic'],
      description: '2×2 basket weave. Classic Oxford shirting structure.' },
  },
  {
    id: 'BW006',
    name_code: 'BKT-N3-NA-SLD-NAT',
    display_name: 'Basket Weave (3×3)',
    category: 'base_weaves',
    params: { type: 'basket', n: 3, direction: 'N/A', modifier: 'solid', colors: natural,
      fabric_type: 'Canvas/Duck', weight: 'Heavy', shaft_count: 4, popularity: 65,
      tags: ['basket', 'canvas', 'heavy'],
      description: '3×3 basket weave for heavy canvas and upholstery.' },
  },

  // Twills
  {
    id: 'BW007',
    name_code: 'TWL-2x1-Z-SLD-GREY',
    display_name: '2/1 Z Twill',
    category: 'base_weaves',
    params: { type: 'twill', up: 2, down: 1, direction: 'Z', modifier: 'solid', colors: ['grey', 'white'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 3, repeat: 3, popularity: 78,
      tags: ['twill', '2/1', 'light'],
      description: '2/1 warp-faced twill. Light drape, good hand feel.' },
  },
  {
    id: 'BW008',
    name_code: 'TWL-3x1-Z-SLD-INDIGO',
    display_name: '3/1 Z Twill (Denim Classic)',
    category: 'base_weaves',
    params: { type: 'twill', up: 3, down: 1, direction: 'Z', modifier: 'solid', colors: indigo,
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 4, repeat: 4, popularity: 99,
      tags: ['twill', '3/1', 'denim', 'classic'],
      description: 'Gold standard of denim weave. Maximum warp visibility, strong diagonal.' },
  },
  {
    id: 'BW009',
    name_code: 'TWL-3x1-S-SLD-INDIGO',
    display_name: '3/1 S Twill (Left-Hand)',
    category: 'base_weaves',
    params: { type: 'twill', up: 3, down: 1, direction: 'S', modifier: 'solid', colors: indigo,
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 4, repeat: 4, popularity: 90,
      tags: ['twill', '3/1', 'left-hand', 'selvedge'],
      description: 'Left-hand (S direction) 3/1 twill. Japanese selvedge denim signature.' },
  },
  {
    id: 'BW010',
    name_code: 'TWL-2x2-Z-SLD-GREY',
    display_name: '2/2 Balanced Twill',
    category: 'base_weaves',
    params: { type: 'twill', up: 2, down: 2, direction: 'Z', modifier: 'solid', colors: ['grey', 'cream'],
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 4, repeat: 4, popularity: 88,
      tags: ['twill', '2/2', 'balanced', 'suiting'],
      description: 'Perfectly balanced 2/2 twill. Equal warp/weft visibility. Excellent drape.' },
  },
  {
    id: 'BW011',
    name_code: 'TWL-1x3-Z-SLD-INDIGO',
    display_name: '1/3 Weft-Faced Twill',
    category: 'base_weaves',
    params: { type: 'twill', up: 1, down: 3, direction: 'Z', modifier: 'solid', colors: indigo,
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 4, repeat: 4, popularity: 60,
      tags: ['twill', '1/3', 'weft-faced', 'reverse'],
      description: '1/3 weft-faced reverse twill. Soft face, unique fade patterns.' },
  },
  {
    id: 'BW012',
    name_code: 'TWL-4x1-Z-SLD-INDIGO',
    display_name: '4/1 Elongated Twill',
    category: 'base_weaves',
    params: { type: 'twill', up: 4, down: 1, direction: 'Z', modifier: 'solid', colors: indigo,
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 5, repeat: 5, popularity: 62,
      tags: ['twill', '4/1', 'long-float', 'luxury'],
      description: 'Long warp floats (4:1) produce silkier, more lustrous surface.' },
  },

  // Broken Twill
  {
    id: 'BW013',
    name_code: 'BTW-3x1-ZS-SLD-INDIGO',
    display_name: 'Broken Twill (3/1)',
    category: 'base_weaves',
    params: { type: 'broken_twill', up: 3, down: 1, direction: 'Z', modifier: 'solid', colors: indigo,
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 8, popularity: 88,
      tags: ['broken-twill', 'stretch', 'no-diagonal'],
      description: 'Disrupted diagonal prevents fabric twist. Preferred for stretch denim.' },
  },
  {
    id: 'BW014',
    name_code: 'BTW-2x2-ZS-SLD-GREY',
    display_name: 'Broken Twill (2/2)',
    category: 'base_weaves',
    params: { type: 'broken_twill', up: 2, down: 2, direction: 'Z', modifier: 'solid', colors: ['grey', 'white'],
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 8, popularity: 72,
      tags: ['broken-twill', 'balanced', 'suiting'],
      description: 'Balanced 2/2 broken twill for suiting with subtle texture.' },
  },

  // Herringbone
  {
    id: 'BW015',
    name_code: 'HRB-2x2-ZS-SLD-GREY',
    display_name: 'Herringbone (2/2)',
    category: 'base_weaves',
    params: { type: 'herringbone', up: 2, down: 2, modifier: 'solid', colors: ['grey', 'black'],
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 8, popularity: 85,
      tags: ['herringbone', 'classic', 'V-pattern', 'suiting'],
      description: 'Classic herringbone V-pattern. Iconic in suiting and outwear fabrics.' },
  },
  {
    id: 'BW016',
    name_code: 'HRB-3x1-ZS-SLD-INDIGO',
    display_name: 'Herringbone (3/1) Denim',
    category: 'base_weaves',
    params: { type: 'herringbone', up: 3, down: 1, modifier: 'solid', colors: indigo,
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 8, popularity: 72,
      tags: ['herringbone', 'denim', 'luxury'],
      description: '3/1 herringbone denim. Distinctive V-pattern on premium denim.'  },
  },
  {
    id: 'BW017',
    name_code: 'HRB-1x1-ZS-SLD-GREY',
    display_name: 'Herringbone (1/1) Fine',
    category: 'base_weaves',
    params: { type: 'herringbone', up: 1, down: 1, modifier: 'solid', colors: ['grey', 'cream'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 4, popularity: 70,
      tags: ['herringbone', 'fine', 'shirting'],
      description: 'Fine 1/1 herringbone for shirting fabrics.' },
  },

  // Zig-Zag
  {
    id: 'BW018',
    name_code: 'ZZG-2x2-Z-SLD-NAVY',
    display_name: 'Zig-Zag Twill (2/2)',
    category: 'base_weaves',
    params: { type: 'zigzag', up: 2, down: 2, direction: 'Z', modifier: 'solid', colors: navy,
      fabric_type: 'Shirting', weight: 'Medium', shaft_count: 8, popularity: 68,
      tags: ['zigzag', 'dynamic', 'fashion'],
      description: 'Reversing diagonal creates zig-zag visual effect across fabric.' },
  },
  {
    id: 'BW019',
    name_code: 'ZZG-3x1-Z-SLD-INDIGO',
    display_name: 'Zig-Zag Twill (3/1) Denim',
    category: 'base_weaves',
    params: { type: 'zigzag', up: 3, down: 1, direction: 'Z', modifier: 'solid', colors: indigo,
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 8, popularity: 58,
      tags: ['zigzag', 'denim', 'designer'],
      description: 'Designer 3/1 zig-zag denim with dramatic diagonal movement.' },
  },

  // Satin
  {
    id: 'BW020',
    name_code: 'SAT-N5-J2-SLD-WHITE',
    display_name: '5-End Satin (Step 2)',
    category: 'base_weaves',
    params: { type: 'satin', n: 5, step: 2, modifier: 'solid', colors: ['white', 'cream'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 5, popularity: 78,
      tags: ['satin', '5-end', 'lustrous', 'smooth'],
      description: 'Classic 5-end satin weave. Lustrous surface, long warp floats.' },
  },
  {
    id: 'BW021',
    name_code: 'SAT-N5-J3-SLD-WHITE',
    display_name: '5-End Satin (Step 3)',
    category: 'base_weaves',
    params: { type: 'satin', n: 5, step: 3, modifier: 'solid', colors: ['white', 'ecru'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 5, popularity: 74,
      tags: ['satin', '5-end', 'sateen'],
      description: '5-end satin with step 3 — reverse sateen arrangement.' },
  },
  {
    id: 'BW022',
    name_code: 'SAT-N8-J3-SLD-WHITE',
    display_name: '8-End Satin (Step 3)',
    category: 'base_weaves',
    params: { type: 'satin', n: 8, step: 3, modifier: 'solid', colors: ['white', 'cream'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 8, popularity: 70,
      tags: ['satin', '8-end', 'premium', 'lustrous'],
      description: '8-end satin with coprime step 3. Premium lustrous fabric.' },
  },
  {
    id: 'BW023',
    name_code: 'SAT-N8-J5-SLD-CREAM',
    display_name: '8-End Satin (Step 5)',
    category: 'base_weaves',
    params: { type: 'satin', n: 8, step: 5, modifier: 'solid', colors: cream,
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 8, popularity: 65,
      tags: ['satin', '8-end', 'irregular', 'luxury'],
      description: '8-end irregular satin with step 5 (coprime). Subtle scattered luminosity.' },
  },
  {
    id: 'BW024',
    name_code: 'SAT-N12-J5-SLD-WHITE',
    display_name: '12-End Satin (Step 5)',
    category: 'base_weaves',
    params: { type: 'satin', n: 12, step: 5, modifier: 'solid', colors: ['white', 'cream'],
      fabric_type: 'Suiting', weight: 'Medium', shaft_count: 12, popularity: 62,
      tags: ['satin', '12-end', 'complex'],
      description: '12-end satin with step 5. Complex scattered structure for premium suiting.' },
  },
  {
    id: 'BW025',
    name_code: 'SAT-N16-J3-SLD-WHITE',
    display_name: '16-End Satin (Step 3)',
    category: 'base_weaves',
    params: { type: 'satin', n: 16, step: 3, modifier: 'solid', colors: ['white', 'ecru'],
      fabric_type: 'Suiting', weight: 'Medium', shaft_count: 16, popularity: 58,
      tags: ['satin', '16-end', 'luxury'],
      description: '16-end satin — maximum float with minimal twill line visibility.' },
  },

  // ──────────────────────────────────────────────────────────────────
  // DOBBY / COMPLEX STRUCTURES
  // ──────────────────────────────────────────────────────────────────

  {
    id: 'DOB001',
    name_code: 'HCB-N8-NA-SLD-TEAL',
    display_name: 'Honeycomb (8-end)',
    category: 'dobby',
    params: { type: 'honeycomb', n: 8, direction: 'N/A', modifier: 'solid', colors: teal,
      fabric_type: 'Home Textiles', weight: 'Medium', shaft_count: 8, popularity: 75,
      tags: ['honeycomb', '3D-texture', 'absorbent', 'towel'],
      description: 'Cellular honeycomb structure. Deep 3D texture, highly absorbent. Ideal for towels.' },
  },
  {
    id: 'DOB002',
    name_code: 'HCB-N12-NA-SLD-TEAL',
    display_name: 'Honeycomb (12-end)',
    category: 'dobby',
    params: { type: 'honeycomb', n: 12, direction: 'N/A', modifier: 'solid', colors: teal,
      fabric_type: 'Home Textiles', weight: 'Medium', shaft_count: 12, popularity: 68,
      tags: ['honeycomb', 'large-cell', 'absorbent'],
      description: 'Large 12-end honeycomb cell. Enhanced moisture absorption for premium towels.' },
  },
  {
    id: 'DOB003',
    name_code: 'BHC-N12-NA-SLD-CREAM',
    display_name: 'Brighton Honeycomb (12)',
    category: 'dobby',
    params: { type: 'brighton_honeycomb', n: 12, direction: 'N/A', modifier: 'solid', colors: cream,
      fabric_type: 'Home Textiles', weight: 'Medium', shaft_count: 12, popularity: 60,
      tags: ['brighton-honeycomb', 'complex', 'premium'],
      description: 'Brighton honeycomb: complex derivative on 12-shaft. Deep, intricate cellular texture.' },
  },
  {
    id: 'DOB004',
    name_code: 'BHC-N16-NA-SLD-CREAM',
    display_name: 'Brighton Honeycomb (16)',
    category: 'dobby',
    params: { type: 'brighton_honeycomb', n: 16, direction: 'N/A', modifier: 'solid', colors: cream,
      fabric_type: 'Home Textiles', weight: 'Medium', shaft_count: 16, popularity: 55,
      tags: ['brighton-honeycomb', 'complex', '16-shaft'],
      description: '16-shaft Brighton honeycomb for premium terry and waffle weaves.' },
  },
  {
    id: 'DOB005',
    name_code: 'BRD-N4-NA-SLD-NAT',
    display_name: 'Birdseye (4-shaft)',
    category: 'dobby',
    params: { type: 'birdseye', n: 4, direction: 'N/A', modifier: 'solid', colors: natural,
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 4, popularity: 72,
      tags: ['birdseye', 'pointed-twill', 'diamond', 'classic'],
      description: 'Small diamond figures with central dot. 4-shaft classic dobby pattern.' },
  },
  {
    id: 'DOB006',
    name_code: 'BRD-N8-NA-SLD-NAT',
    display_name: 'Birdseye (8-shaft)',
    category: 'dobby',
    params: { type: 'birdseye', n: 8, direction: 'N/A', modifier: 'solid', colors: natural,
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 8, popularity: 65,
      tags: ['birdseye', '8-shaft', 'classic'],
      description: 'Larger 8-shaft birdseye with more elaborate diamond motifs.' },
  },
  {
    id: 'DOB007',
    name_code: 'DMD-N8-NA-SLD-GREY',
    display_name: 'Diamond Weave (8)',
    category: 'dobby',
    params: { type: 'diamond', n: 8, direction: 'N/A', modifier: 'solid', colors: ['grey', 'white'],
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 8, popularity: 70,
      tags: ['diamond', 'pointed-twill', 'geometric'],
      description: 'Symmetric diamond motif derived from pointed twill. Classic suiting structure.' },
  },
  {
    id: 'DOB008',
    name_code: 'DMD-N12-NA-SLD-NAVY',
    display_name: 'Diamond Weave (12)',
    category: 'dobby',
    params: { type: 'diamond', n: 12, direction: 'N/A', modifier: 'solid', colors: navy,
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 12, popularity: 63,
      tags: ['diamond', 'navy', 'luxury'],
      description: 'Large 12-end diamond structure with prominent geometric motif.' },
  },
  {
    id: 'DOB009',
    name_code: 'MLN-N8-NA-SLD-WHITE',
    display_name: 'Mock Leno (8)',
    category: 'dobby',
    params: { type: 'mock_leno', n: 8, direction: 'N/A', modifier: 'solid', colors: ['white', 'ecru'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 8, popularity: 65,
      tags: ['mock-leno', 'open-weave', 'breathable'],
      description: 'Open weave simulating leno (gauze) structure. Highly breathable, summer fabric.' },
  },
  {
    id: 'DOB010',
    name_code: 'CRP-N8-SLD-BLUE',
    display_name: 'Crepe / Moss Crepe (8)',
    category: 'dobby',
    params: { type: 'crepe', n: 8, seed: 42, intensity: 0.2, modifier: 'solid', colors: ['blue', 'ecru'],
      fabric_type: 'Crepe', weight: 'Light', shaft_count: 8, popularity: 73,
      tags: ['crepe', 'moss', 'pebbly', 'pseudo-random'],
      description: 'Pseudo-random bit distribution creates pebbly crepe surface. Weft ≤3, warp ≤2 float validated.' },
  },
  {
    id: 'DOB011',
    name_code: 'CRP-N12-SLD-GREY',
    display_name: 'Crepe / Moss Crepe (12)',
    category: 'dobby',
    params: { type: 'crepe', n: 12, seed: 88, intensity: 0.25, modifier: 'solid', colors: ['grey', 'cream'],
      fabric_type: 'Crepe', weight: 'Light', shaft_count: 12, popularity: 65,
      tags: ['crepe', 'moss', '12-end', 'textured'],
      description: 'Larger 12-end crepe for pronounced moss texture. Stochastically generated.' },
  },
  {
    id: 'DOB012',
    name_code: 'BFC-N4-NA-SLD-NAT',
    display_name: 'Bedford Cord (4-end)',
    category: 'dobby',
    params: { type: 'bedford_cord', n: 4, direction: 'N/A', modifier: 'solid', colors: natural,
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 8, popularity: 62,
      tags: ['bedford-cord', 'warp-lines', 'formal'],
      description: 'Prominent longitudinal warp cords with sunken lines between. Repeat = cordEnds × 2.' },
  },
  {
    id: 'DOB013',
    name_code: 'HND-2x2-Z-HND-BLKWH',
    display_name: 'Houndstooth Classic',
    category: 'specialty',
    params: { type: 'houndstooth', up: 2, down: 2, direction: 'Z', modifier: 'houndstooth',
      colors: ['black', 'white'], fabric_type: 'Suiting', weight: 'Medium', shaft_count: 4, popularity: 88,
      tags: ['houndstooth', 'classic', 'check', 'suiting'],
      description: 'Classic houndstooth check via color-weave interference on 2/2 twill. Warp/weft: 4+4 alternating.' },
  },

  // ──────────────────────────────────────────────────────────────────
  // MODIFIERS (Stripes, Checks, Borders)
  // ──────────────────────────────────────────────────────────────────

  {
    id: 'MOD001',
    name_code: 'PLN-1x1-NA-STRP-W4-NAVY',
    display_name: 'Plain Weave Warp Stripe (W4, Navy)',
    category: 'modifiers',
    params: { type: 'plain', direction: 'N/A', modifier: 'stripe', stripeWidth: 4,
      colors: ['navy', 'white'], fabric_type: 'Shirting', weight: 'Light', shaft_count: 2, popularity: 82,
      tags: ['stripe', 'navy', 'formal', 'shirting'],
      description: 'Classic 4-thread navy/white warp stripe on plain weave ground.' },
  },
  {
    id: 'MOD002',
    name_code: 'PLN-1x1-NA-STRP-W2-BLKWH',
    display_name: 'Pinstripe (W2, Black/White)',
    category: 'modifiers',
    params: { type: 'plain', direction: 'N/A', modifier: 'stripe', stripeWidth: 2,
      colors: ['black', 'white'], fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 2, popularity: 85,
      tags: ['pinstripe', 'black', 'white', 'formal', 'suiting'],
      description: 'Fine 2-thread pinstripe. Formal suiting classic.' },
  },
  {
    id: 'MOD003',
    name_code: 'PLN-1x1-NA-STRP-W8-MULTI',
    display_name: 'Wide Stripe (W8, Multicolor)',
    category: 'modifiers',
    params: { type: 'plain', direction: 'N/A', modifier: 'stripe', stripeWidth: 8,
      colors: ['red', 'white', 'blue'], fabric_type: 'Shirting', weight: 'Light', shaft_count: 2, popularity: 75,
      tags: ['stripe', 'wide', 'multicolor', 'casual'],
      description: 'Bold 8-thread wide stripe in tricolor. Casual shirting.' },
  },
  {
    id: 'MOD004',
    name_code: 'TWL-2x2-Z-STRP-W4-INDIGO',
    display_name: 'Twill Stripe (2/2, Indigo)',
    category: 'modifiers',
    params: { type: 'twill', up: 2, down: 2, direction: 'Z', modifier: 'stripe', stripeWidth: 4,
      colors: ['indigo', 'ecru'], fabric_type: 'Denim', weight: 'Heavy', shaft_count: 4, popularity: 78,
      tags: ['twill', 'stripe', 'denim', 'indigo'],
      description: '4-thread indigo/ecru stripe on 2/2 twill ground.' },
  },
  {
    id: 'MOD005',
    name_code: 'PLN-1x1-NA-CHK-W4-BLUE',
    display_name: 'Gingham Check (W4, Blue)',
    category: 'modifiers',
    params: { type: 'plain', direction: 'N/A', modifier: 'check', stripeWidth: 4,
      colors: ['blue', 'white'], fabric_type: 'Shirting', weight: 'Light', shaft_count: 2, popularity: 88,
      tags: ['gingham', 'check', 'blue', 'casual', 'classic'],
      description: 'Classic gingham check: symmetric 4-thread blue/white bands on plain weave.' },
  },
  {
    id: 'MOD006',
    name_code: 'PLN-1x1-NA-CHK-W2-NAVY',
    display_name: 'Mini Check (W2, Navy)',
    category: 'modifiers',
    params: { type: 'plain', direction: 'N/A', modifier: 'check', stripeWidth: 2,
      colors: ['navy', 'white'], fabric_type: 'Shirting', weight: 'Light', shaft_count: 2, popularity: 80,
      tags: ['check', 'mini', 'navy', 'formal'],
      description: 'Mini check pattern. Sophisticated formal shirting.' },
  },
  {
    id: 'MOD007',
    name_code: 'TWL-3x1-Z-BDR-W8-INDIGO',
    display_name: 'Denim with Plain Border',
    category: 'modifiers',
    params: { type: 'twill', up: 3, down: 1, direction: 'Z', modifier: 'border', borderWidth: 8,
      colors: ['indigo', 'white'], fabric_type: 'Denim', weight: 'Heavy', shaft_count: 8, popularity: 68,
      tags: ['border', 'denim', 'structured', 'designer'],
      description: '3/1 twill body with plain weave border. Shaft allocation: 1-4 body, 5-8 border.' },
  },
  {
    id: 'MOD008',
    name_code: 'SAT-N5-J2-BDR-W12-WHITE',
    display_name: 'Satin with Twill Border',
    category: 'modifiers',
    params: { type: 'satin', n: 5, step: 2, modifier: 'border', borderWidth: 12,
      colors: ['white', 'cream'], fabric_type: 'Shirting', weight: 'Light', shaft_count: 9, popularity: 58,
      tags: ['satin', 'border', 'formal', 'premium'],
      description: 'Smooth 5-end satin body with structured border detail.' },
  },

  // ──────────────────────────────────────────────────────────────────
  // INDUSTRY PRESETS — Denim
  // ──────────────────────────────────────────────────────────────────

  {
    id: 'PRE_DEN001',
    name_code: 'TWL-3x1-Z-SLD-INDIGO',
    display_name: 'Classic Denim (3/1 RHT)',
    category: 'presets',
    params: { type: 'twill', up: 3, down: 1, direction: 'Z', modifier: 'solid', colors: ['indigo', 'ecru'],
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 4, repeat: 4, popularity: 99,
      applications: ['5-pocket jeans', 'workwear', 'jackets'],
      tags: ['denim', 'classic', '3/1', 'RHT', 'indigo'],
      description: 'Industry benchmark: 3/1 right-hand twill. 65% global denim market share.' },
  },
  {
    id: 'PRE_DEN002',
    name_code: 'BTW-3x1-ZS-SLD-INDIGO',
    display_name: 'Wrangler Broken Twill Denim',
    category: 'presets',
    params: { type: 'broken_twill', up: 3, down: 1, direction: 'Z', modifier: 'solid', colors: ['indigo', 'white'],
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 8, popularity: 88,
      applications: ['stretch jeans', 'athletic wear', 'comfortable fit'],
      tags: ['broken-twill', 'stretch', 'Wrangler', 'comfort'],
      description: 'Wrangler-signature broken twill. Eliminates twisted diagonal, stretch-compatible.' },
  },
  {
    id: 'PRE_DEN003',
    name_code: 'HRB-3x1-ZS-SLD-INDIGO',
    display_name: 'Herringbone Denim (Premium)',
    category: 'presets',
    params: { type: 'herringbone', up: 3, down: 1, modifier: 'solid', colors: indigo,
      fabric_type: 'Denim', weight: 'Heavy', shaft_count: 8, popularity: 72,
      applications: ['premium jeans', 'designer denim', 'fashion collections'],
      tags: ['herringbone', 'premium', 'denim', 'fashion'],
      description: 'High-end herringbone denim. Statement V-pattern on warp-faced structure.' },
  },

  // ──────────────────────────────────────────────────────────────────
  // INDUSTRY PRESETS — Shirting
  // ──────────────────────────────────────────────────────────────────

  {
    id: 'PRE_SHRT001',
    name_code: 'PLN-1x1-NA-SLD-WHITE',
    display_name: 'Broadcloth Shirting',
    category: 'presets',
    params: { type: 'plain', direction: 'N/A', modifier: 'solid', colors: ['white', 'grey'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 2, popularity: 95,
      applications: ['formal shirts', 'dress shirts', 'business wear'],
      tags: ['broadcloth', 'plain', 'formal', 'classic'],
      description: 'Classic broadcloth. Smooth crisp surface, formal aesthetic. Universal appeal.' },
  },
  {
    id: 'PRE_SHRT002',
    name_code: 'BKT-N2-NA-SLD-BLUE',
    display_name: 'Oxford Shirting',
    category: 'presets',
    params: { type: 'basket', n: 2, direction: 'N/A', modifier: 'solid', colors: ['blue', 'white'],
      fabric_type: 'Shirting', weight: 'Medium', shaft_count: 4, popularity: 92,
      applications: ['button-down shirts', 'casual wear', 'business casual'],
      tags: ['oxford', 'basket', 'casual', 'classic', 'American'],
      description: 'Classic Oxford basket weave. Textured surface, casual-formal versatility.' },
  },
  {
    id: 'PRE_SHRT003',
    name_code: 'PLN-1x1-NA-CHK-W4-BLUE',
    display_name: 'Gingham Shirting (Blue/White)',
    category: 'presets',
    params: { type: 'plain', direction: 'N/A', modifier: 'check', stripeWidth: 4,
      colors: ['blue', 'white'], fabric_type: 'Shirting', weight: 'Light', shaft_count: 2, popularity: 88,
      applications: ['casual shirts', 'summer wear', 'weekend shirts'],
      tags: ['gingham', 'check', 'blue', 'classic', 'summer'],
      description: 'Classic blue/white gingham. Timeless American casual shirting.' },
  },
  {
    id: 'PRE_SHRT004',
    name_code: 'SAT-N5-J2-SLD-WHITE',
    display_name: 'Satin Dress Shirt (5-end)',
    category: 'presets',
    params: { type: 'satin', n: 5, step: 2, modifier: 'solid', colors: ['white', 'cream'],
      fabric_type: 'Shirting', weight: 'Light', shaft_count: 5, popularity: 65,
      applications: ['formal evening wear', 'dress shirts', 'luxury market'],
      tags: ['satin', 'formal', 'luxury', 'smooth', 'lustrous'],
      description: 'Smooth satin formal shirt. Long warp floats create lustrous surface.' },
  },
  {
    id: 'PRE_SHRT005',
    name_code: 'HND-2x2-Z-HND-BLKWH',
    display_name: 'Houndstooth Shirting',
    category: 'presets',
    params: { type: 'houndstooth', up: 2, down: 2, direction: 'Z', modifier: 'houndstooth',
      colors: ['black', 'white'], fabric_type: 'Shirting', weight: 'Light', shaft_count: 4, popularity: 78,
      applications: ['fashion shirts', 'statement pieces', 'casual formal'],
      tags: ['houndstooth', 'classic', 'shirting', 'monochrome'],
      description: 'Classic monochrome houndstooth shirting via color-weave interference.' },
  },

  // ──────────────────────────────────────────────────────────────────
  // INDUSTRY PRESETS — Suiting
  // ──────────────────────────────────────────────────────────────────

  {
    id: 'PRE_SUIT001',
    name_code: 'TWL-2x2-Z-SLD-GREY',
    display_name: 'Classic Suiting 2/2 Twill',
    category: 'presets',
    params: { type: 'twill', up: 2, down: 2, direction: 'Z', modifier: 'solid', colors: ['grey', 'black'],
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 4, popularity: 88,
      applications: ['suits', 'blazers', 'formal trousers'],
      tags: ['suiting', 'twill', 'classic', 'grey', 'formal'],
      description: '2/2 balanced twill suiting. Excellent drape, formal character.' },
  },
  {
    id: 'PRE_SUIT002',
    name_code: 'HRB-2x2-ZS-SLD-GREY',
    display_name: 'Herringbone Suiting',
    category: 'presets',
    params: { type: 'herringbone', up: 2, down: 2, modifier: 'solid', colors: ['grey', 'charcoal'],
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 8, popularity: 85,
      applications: ['business suits', 'overcoats', 'blazers'],
      tags: ['herringbone', 'suiting', 'classic', 'formal'],
      description: 'Classic herringbone suiting. Timeless formal aesthetic with V-pattern.' },
  },
  {
    id: 'PRE_SUIT003',
    name_code: 'PLN-1x1-NA-SLD-GREY',
    display_name: 'Plain Weave Suiting',
    category: 'presets',
    params: { type: 'plain', direction: 'N/A', modifier: 'solid', colors: ['grey', 'white'],
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 2, popularity: 75,
      applications: ['summer suits', 'tropical suiting', 'unlined jackets'],
      tags: ['plain', 'suiting', 'formal', 'summer'],
      description: 'Plain weave suiting. Crisp formal surface, suitable for tropical climates.' },
  },
  {
    id: 'PRE_SUIT004',
    name_code: 'PLN-1x1-NA-STRP-W2-GREY',
    display_name: 'Pinstripe Suiting',
    category: 'presets',
    params: { type: 'plain', direction: 'N/A', modifier: 'stripe', stripeWidth: 2,
      colors: ['black', 'grey'], fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 2, popularity: 82,
      applications: ['business suits', 'formal trousers', 'corporate wear'],
      tags: ['pinstripe', 'suiting', 'formal', 'classic'],
      description: 'Fine pinstripe on plain ground. Corporate formal classic.' },
  },
  {
    id: 'PRE_SUIT005',
    name_code: 'HND-2x2-Z-HND-GREY',
    display_name: 'Houndstooth Suiting',
    category: 'presets',
    params: { type: 'houndstooth', up: 2, down: 2, direction: 'Z', modifier: 'houndstooth',
      colors: ['black', 'grey'], fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 4, popularity: 80,
      applications: ['blazers', 'sport coats', 'fashion suits'],
      tags: ['houndstooth', 'suiting', 'classic', 'grey'],
      description: 'Houndstooth suiting in black/grey colorway. Sophisticated check via color interference.' },
  },

  // ──────────────────────────────────────────────────────────────────
  // HOME TEXTILES / SPECIALTY
  // ──────────────────────────────────────────────────────────────────

  {
    id: 'PRE_HOME001',
    name_code: 'HCB-N8-NA-SLD-TEAL',
    display_name: 'Waffle / Honeycomb Towel',
    category: 'presets',
    params: { type: 'honeycomb', n: 8, direction: 'N/A', modifier: 'solid', colors: teal,
      fabric_type: 'Home Textiles', weight: 'Medium', shaft_count: 8, popularity: 78,
      applications: ['towels', 'bath accessories', 'spa textiles'],
      tags: ['honeycomb', 'waffle', 'towel', 'absorbent'],
      description: 'Waffle/honeycomb structure optimized for maximum moisture absorption.' },
  },
  {
    id: 'PRE_HOME002',
    name_code: 'MLN-N8-NA-SLD-WHITE',
    display_name: 'Open Weave Sheer (Mock Leno)',
    category: 'presets',
    params: { type: 'mock_leno', n: 8, direction: 'N/A', modifier: 'solid', colors: ['white', 'ecru'],
      fabric_type: 'Home Textiles', weight: 'Light', shaft_count: 8, popularity: 65,
      applications: ['curtains', 'sheers', 'summer drapes'],
      tags: ['mock-leno', 'sheer', 'curtains', 'lightweight'],
      description: 'Open gauze-like structure for sheer curtains and drapes.' },
  },
  {
    id: 'PRE_HOME003',
    name_code: 'CRP-N8-SLD-BLUE',
    display_name: 'Moss Crepe (Fashion)',
    category: 'presets',
    params: { type: 'crepe', n: 8, seed: 77, intensity: 0.22, modifier: 'solid', colors: ['blue', 'ecru'],
      fabric_type: 'Crepe', weight: 'Light', shaft_count: 8, popularity: 72,
      applications: ['blouses', 'dresses', 'fashion fabric'],
      tags: ['crepe', 'moss', 'fashion', 'pebbly'],
      description: 'Authentic moss crepe with stochastic surface texture. Elastic recovery, good drape.' },
  },
  {
    id: 'PRE_HOME004',
    name_code: 'BFC-N4-NA-SLD-CREAM',
    display_name: 'Bedford Cord (Upholstery)',
    category: 'presets',
    params: { type: 'bedford_cord', n: 4, direction: 'N/A', modifier: 'solid', colors: cream,
      fabric_type: 'Technical/Performance', weight: 'Extra Heavy', shaft_count: 8, popularity: 60,
      applications: ['upholstery', 'furnishing fabrics', 'formal trousers'],
      tags: ['bedford-cord', 'warp-lines', 'upholstery', 'heavy'],
      description: 'Bedford cord upholstery: prominent longitudinal rib lines, heavy structure.' },
  },

  // ──────────────────────────────────────────────────────────────────
  // SPECIALTY / RESEARCH-DERIVED
  // ──────────────────────────────────────────────────────────────────

  {
    id: 'SPE001',
    name_code: 'PLN-1x1-NA-CHK-W8-MULTI',
    display_name: 'Tartan Check (Multi)',
    category: 'specialty',
    params: { type: 'plain', direction: 'N/A', modifier: 'check', stripeWidth: 8,
      colors: ['red', 'green', 'navy', 'white'], fabric_type: 'Tweed', weight: 'Heavy', shaft_count: 2, popularity: 70,
      applications: ['kilts', 'blankets', 'Highland wear'],
      tags: ['tartan', 'check', 'multicolor', 'Scottish', 'heritage'],
      description: 'Tartan-style multicolor check. Color vectors create plaid without changing structure.' },
  },
  {
    id: 'SPE002',
    name_code: 'TWL-3x1-Z-TXT-SLD-BURG',
    display_name: 'Textured Twill (Burgundy)',
    category: 'specialty',
    params: { type: 'twill', up: 3, down: 1, direction: 'Z', modifier: 'texture', colors: burgundy,
      fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 8, popularity: 65,
      tags: ['twill', 'textured', 'burgundy', 'premium'],
      description: 'Twill with texture modifier overlay. Rich burgundy coloring for premium suiting.' },
  },
  {
    id: 'SPE003',
    name_code: 'SAT-N8-J3-STRP-W6-CREAM',
    display_name: 'Satin Stripe Shirting',
    category: 'specialty',
    params: { type: 'satin', n: 8, step: 3, modifier: 'stripe', stripeWidth: 6,
      colors: ['cream', 'ecru'], fabric_type: 'Shirting', weight: 'Light', shaft_count: 8, popularity: 68,
      applications: ['luxury dress shirts', 'formal evening wear'],
      tags: ['satin', 'stripe', 'luxury', 'cream', 'lustrous'],
      description: 'Satin stripe: lustrous bands of 8-end satin alternating with plain ground.' },
  },
  {
    id: 'SPE004',
    name_code: 'HRB-2x2-ZS-CHK-W4-GREY',
    display_name: 'Herringbone Check (Grey)',
    category: 'specialty',
    params: { type: 'herringbone', up: 2, down: 2, modifier: 'check', stripeWidth: 4,
      colors: ['grey', 'white'], fabric_type: 'Suiting', weight: 'Heavy', shaft_count: 8, popularity: 72,
      applications: ['sport coats', 'season-transition suiting', 'stylish casual'],
      tags: ['herringbone', 'check', 'grey', 'suiting'],
      description: 'Herringbone structure with 4-thread color check overlay. Textural and visual depth.' },
  },
  {
    id: 'SPE005',
    name_code: 'CRP-N8-STRP-W4-TEAL',
    display_name: 'Crepe Stripe (Teal)',
    category: 'specialty',
    params: { type: 'crepe', n: 8, seed: 101, intensity: 0.2, modifier: 'stripe', stripeWidth: 4,
      colors: teal, fabric_type: 'Crepe', weight: 'Light', shaft_count: 8, popularity: 60,
      tags: ['crepe', 'stripe', 'teal', 'fashion', 'contemporary'],
      description: 'Crepe ground with teal/white stripe overlay. Contemporary fashion fabric.' },
  },
]

// ─── Exported metadata ────────────────────────────────────────────────────────

export const PRESET_METADATA = {
  version: '3.0.0-generative',
  total_presets: DESIGN_PRESETS.length,
  categories: ['base_weaves', 'modifiers', 'presets', 'dobby', 'specialty'] as FabricCategory[],
  fabric_types: [
    'Denim', 'Shirting', 'Suiting', 'Canvas/Duck',
    'Home Textiles', 'Crepe', 'Tweed', 'Technical/Performance',
  ],
  weave_types: Object.keys({
    plain: 1, warp_rib: 1, weft_rib: 1, basket: 1,
    twill: 1, broken_twill: 1, herringbone: 1, zigzag: 1,
    satin: 1, honeycomb: 1, brighton_honeycomb: 1, birdseye: 1,
    diamond: 1, mock_leno: 1, crepe: 1, bedford_cord: 1, houndstooth: 1,
  }),
  architecture: 'parametric-generative',
  notes: 'Designs generated at runtime from parameter objects. No full matrices stored.',
}
