/**
 * Community Design Library  – 52 curated designs from Data.txt
 * Each design uses buildDesign() so the engine generates the matrix,
 * validates shafts and assigns name-codes automatically.
 *
 * Category mapping (Data.txt → engine):
 *   Basic Weaves / Twill / Satin  →  base_weaves
 *   Dobby Designs                 →  dobby
 *   Jacquard Designs              →  specialty
 *   Structural Weaves             →  specialty
 *   Surface / Motif Layer         →  modifiers
 */

import { buildDesign } from '@/lib/weave/engine'
import type { GeneratedDesign } from '@/lib/weave/engine'
import type { DesignParams } from '@/lib/weave/presets'

// ─── Helper ───────────────────────────────────────────────────────────────────
function d(
  params: DesignParams,
  displayName: string,
  meta: {
    category: string
    fabric_type: string
    weight: string
    popularity: number
    description: string
    applications: string[]
    tags: string[]
  }
): GeneratedDesign {
  const design = buildDesign(params, 'preset', displayName, {
    display_name: displayName,
    ...meta,
  })
  return { ...design, display_name: displayName }
}

// ─── 1. BASIC WEAVES ─────────────────────────────────────────────────────────
const basicWeaves: GeneratedDesign[] = [

  d({ type: 'plain', colors: ['natural', 'white'], modifier: 'solid' },
    '1×1 Plain Weave',
    { category: 'base_weaves', fabric_type: 'Shirting', weight: 'Light', popularity: 90,
      description: 'The fundamental weaving pattern — each warp alternates over and under consecutive weft. Simplest and most versatile textile structure.',
      applications: ['basic shirting', 'lining', 'cotton basics', 'canvas', 'muslin', 'poplin'],
      tags: ['foundational', 'timeless', 'universal', 'smooth', 'flat', 'breathable'] }),

  d({ type: 'warp_rib', n: 2, colors: ['grey', 'white'], modifier: 'solid' },
    'Warp Rib 2×1',
    { category: 'base_weaves', fabric_type: 'Shirting', weight: 'Light', popularity: 78,
      description: 'Pairs of warp threads grouped to create prominent vertical ridges. Classic shirting structure.',
      applications: ['casual shirting', 'dress shirts', 'polo shirts', 'casual trousers'],
      tags: ['structured', 'tactile', 'textured', 'classic', 'professional', 'vertical', 'ribs'] }),

  d({ type: 'warp_rib', n: 4, colors: ['navy', 'white'], modifier: 'solid' },
    'Warp Rib 4×1',
    { category: 'base_weaves', fabric_type: 'Shirting', weight: 'Medium', popularity: 70,
      description: 'Wider 4-end warp rib for bold textural ribs — more pronounced ridges, modern aesthetic.',
      applications: ['casual shirting', 'suiting', 'contemporary jackets'],
      tags: ['ribs', 'bold', 'contemporary', 'structured', 'vertical'] }),

  d({ type: 'weft_rib', n: 2, colors: ['cream', 'grey'], modifier: 'solid' },
    'Weft Rib 2×1',
    { category: 'base_weaves', fabric_type: 'Shirting', weight: 'Light', popularity: 72,
      description: 'Multiple weft threads grouped to create prominent horizontal ridges. Softer, more casual than warp rib.',
      applications: ['casual shirting', 'loungewear', 'blankets'],
      tags: ['structured', 'tactile', 'cozy', 'horizontal', 'casual', 'ribs'] }),

  d({ type: 'weft_rib', n: 4, colors: ['burgundy', 'cream'], modifier: 'solid' },
    'Weft Rib 4×1',
    { category: 'base_weaves', fabric_type: 'Home Textiles', weight: 'Medium', popularity: 62,
      description: 'Heavy weft rib with 4 picks per group — cosy, dimensional, ideal for home textiles.',
      applications: ['upholstery', 'blankets', 'home textiles'],
      tags: ['cozy', 'heavy', 'home', 'dimensional', 'horizontal', 'ribs'] }),

  d({ type: 'basket', n: 2, colors: ['natural', 'cream'], modifier: 'solid' },
    '2×2 Basket Weave',
    { category: 'base_weaves', fabric_type: 'Shirting', weight: 'Light', popularity: 82,
      description: 'Pairs of warp and weft interlace in synchronised pattern — balanced checkerboard texture with casual elegance.',
      applications: ['casual shirting', 'linen wear', 'summer apparel', 'throws'],
      tags: ['classic', 'timeless', 'casual-chic', 'basket', 'textured', 'breathable', 'linen'] }),

  d({ type: 'basket', n: 3, colors: ['grey', 'natural'], modifier: 'solid' },
    '3×3 Basket Weave',
    { category: 'base_weaves', fabric_type: 'Canvas/Duck', weight: 'Medium', popularity: 68,
      description: 'Triplets of warp and weft interlace — larger grid with pronounced dimensional quality.',
      applications: ['statement wear', 'outdoor textiles', 'upholstery', 'throws'],
      tags: ['statement', 'textured', 'artistic', 'bold', 'dimensional', 'outdoor'] }),

  d({ type: 'basket', n: 4, colors: ['navy', 'cream'], modifier: 'solid' },
    '4×4 Basket Weave',
    { category: 'base_weaves', fabric_type: 'Canvas/Duck', weight: 'Heavy', popularity: 60,
      description: 'Quadruplets interlace — bold checkerboard with strong dimensional quality for statement pieces.',
      applications: ['statement jackets', 'heavy upholstery', 'throws', 'wall hangings'],
      tags: ['bold', 'dramatic', 'statement', 'contemporary', 'dimensional', 'upholstery'] }),

  d({ type: 'plain', colors: ['ecru', 'white'], modifier: 'solid' },
    'Matt Weave',
    { category: 'base_weaves', fabric_type: 'Shirting', weight: 'Light', popularity: 65,
      description: 'High thread-count balanced plain weave with refined matte finish — no sheen, pure understated elegance.',
      applications: ['fine dress shirts', 'luxury casual', 'refined suiting', 'premium basics'],
      tags: ['refined', 'subtle', 'minimalist', 'elegant', 'matte', 'luxury', 'premium'] }),

  d({ type: 'basket', n: 2, colors: ['natural', 'ecru'], modifier: 'solid' },
    'Panama Weave',
    { category: 'base_weaves', fabric_type: 'Shirting', weight: 'Light', popularity: 73,
      description: 'Equal 2×2 groups of warp and weft — open, breathable structure ideal for summer. Named after Panama hats.',
      applications: ['summer wear', 'lightweight shirts', 'casual apparel'],
      tags: ['summery', 'open-weave', 'casual', 'breezy', 'panama', 'breathable', 'linen'] }),
]

// ─── 2. TWILL WEAVES ──────────────────────────────────────────────────────────
const twillWeaves: GeneratedDesign[] = [

  d({ type: 'twill', up: 2, down: 1, direction: 'Z', colors: ['navy', 'white'], modifier: 'solid' },
    '2/1 Z-Twill',
    { category: 'base_weaves', fabric_type: 'Denim', weight: 'Medium', popularity: 88,
      description: '2 over / 1 under Z-twill — workhorse of textiles. Durable diagonal with excellent balance of strength and comfort.',
      applications: ['denim base', 'chinos', 'work pants', 'casual suiting'],
      tags: ['classic', 'workwear', 'durable', 'timeless', 'diagonal', '2/1', 'denim'] }),

  d({ type: 'twill', up: 2, down: 1, direction: 'S', colors: ['indigo', 'white'], modifier: 'solid' },
    '2/1 S-Twill',
    { category: 'base_weaves', fabric_type: 'Denim', weight: 'Medium', popularity: 75,
      description: 'Mirror-image S-direction 2/1 twill — distinct left-hand diagonal. Iconic in Japanese selvedge denim tradition.',
      applications: ['premium jeans', 'selvedge denim', 'heritage wear'],
      tags: ['S-twill', 'left-hand', 'heritage', 'selvedge', 'japanese', '2/1', 'denim'] }),

  d({ type: 'twill', up: 3, down: 1, direction: 'Z', colors: ['charcoal', 'white'], modifier: 'solid' },
    '3/1 Z-Twill',
    { category: 'base_weaves', fabric_type: 'Suiting', weight: 'Heavy', popularity: 92,
      description: '3 over / 1 under twill — pronounced diagonal, dominant warp face. Foundation of premium suiting.',
      applications: ['suiting', 'dress pants', 'professional wear', 'formal jackets'],
      tags: ['classic', 'suiting', 'professional', 'formal', 'diagonal', '3/1', 'pronounced'] }),

  d({ type: 'twill', up: 2, down: 2, direction: 'Z', colors: ['grey', 'ecru'], modifier: 'solid' },
    '2/2 Balanced Twill',
    { category: 'base_weaves', fabric_type: 'Suiting', weight: 'Medium', popularity: 80,
      description: 'Balanced 2/2 twill — equal warp and weft visibility, smooth diagonal. Refined and versatile.',
      applications: ['casual suiting', 'dress pants', 'contemporary wear'],
      tags: ['balanced', 'refined', 'versatile', 'diagonal', '2/2', 'casual-suiting'] }),

  d({ type: 'herringbone', up: 2, down: 2, colors: ['charcoal', 'white'], modifier: 'solid' },
    'Herringbone Twill',
    { category: 'base_weaves', fabric_type: 'Suiting', weight: 'Heavy', popularity: 85,
      description: 'Classic V-shaped herringbone — twill reverses at regular intervals. Iconic in British tailoring tradition.',
      applications: ['suiting', 'tailoring', 'formal wear', 'luxury casual'],
      tags: ['classic', 'formal', 'timeless', 'iconic', 'herringbone', 'V-pattern', 'british'] }),

  d({ type: 'herringbone', up: 3, down: 1, colors: ['navy', 'cream'], modifier: 'solid' },
    '3/1 Herringbone',
    { category: 'base_weaves', fabric_type: 'Suiting', weight: 'Heavy', popularity: 72,
      description: '3/1 herringbone — more pronounced rib with bolder V-pattern. Popular in luxury suiting.',
      applications: ['luxury suiting', 'premium jackets', 'dress trousers'],
      tags: ['luxury', 'bold', 'herringbone', 'pronounced', 'premium', '3/1'] }),

  d({ type: 'diamond', n: 8, colors: ['grey', 'white'], modifier: 'solid' },
    'Diamond Twill',
    { category: 'base_weaves', fabric_type: 'Suiting', weight: 'Heavy', popularity: 68,
      description: 'Bidirectional twill combining ascending and descending diagonals to create diamond-shaped medallions.',
      applications: ['luxury suiting', 'artistic wear', 'statement pieces'],
      tags: ['sophisticated', 'artistic', 'luxury', 'diamond', 'geometric', 'complex'] }),

  d({ type: 'zigzag', up: 2, down: 2, colors: ['navy', 'ecru'], modifier: 'solid' },
    'Zig-Zag Twill',
    { category: 'base_weaves', fabric_type: 'Suiting', weight: 'Medium', popularity: 65,
      description: 'Stepped twill creating sharp zigzag — dynamic, geometric, contemporary aesthetic.',
      applications: ['contemporary wear', 'artistic pieces', 'casual suiting'],
      tags: ['geometric', 'contemporary', 'artistic', 'zigzag', 'dynamic', 'angular'] }),

  d({ type: 'broken_twill', up: 3, down: 1, colors: ['indigo', 'white'], modifier: 'solid' },
    'Broken Twill',
    { category: 'base_weaves', fabric_type: 'Denim', weight: 'Heavy', popularity: 77,
      description: 'Eliminates prominent diagonal by alternating Z and S direction twills — ideal for stretch denim.',
      applications: ['stretch jeans', 'athletic wear', 'comfort denim'],
      tags: ['stretch-friendly', 'no-diagonal', 'comfort', 'denim', 'athletic', 'broken-twill'] }),

  d({ type: 'twill', up: 4, down: 1, direction: 'Z', colors: ['charcoal', 'cream'], modifier: 'solid' },
    '4/1 Elongated Twill',
    { category: 'base_weaves', fabric_type: 'Suiting', weight: 'Heavy', popularity: 60,
      description: '4/1 elongated twill — longer warp floats produce a silkier, more luxurious surface than standard 3/1.',
      applications: ['premium suiting', 'luxury casual', 'contemporary collections'],
      tags: ['luxury', 'soft', 'long-float', 'premium', 'silk-like', '4/1', 'elongated'] }),
]

// ─── 3. SATIN / SATEEN WEAVES ─────────────────────────────────────────────────
const satinWeaves: GeneratedDesign[] = [

  d({ type: 'satin', n: 5, step: 2, colors: ['ivory', 'white'], modifier: 'solid' },
    '5-End Satin',
    { category: 'base_weaves', fabric_type: 'Dobby Fancy/Fashion', weight: 'Light', popularity: 78,
      description: 'Classic 5-end satin — warp floats over 4 picks and under 1. Smooth lustrous surface ideal for formal wear.',
      applications: ['evening wear', 'formal gowns', 'luxury lingerie'],
      tags: ['luxury', 'elegant', 'flowing', 'formal', 'lustrous', 'satin', '5-end'] }),

  d({ type: 'satin', n: 8, step: 3, colors: ['black', 'white'], modifier: 'solid' },
    '8-End Satin',
    { category: 'base_weaves', fabric_type: 'Dobby Fancy/Fashion', weight: 'Light', popularity: 70,
      description: '8-end satin — longer floats produce even greater luminosity. Superior sheen for luxury formal and bridal.',
      applications: ['evening gowns', 'luxury formal wear', 'bridal fabrics'],
      tags: ['luxury', 'high-sheen', 'formal', 'bridal', 'satin', '8-end', 'luminous'] }),

  d({ type: 'satin', n: 5, step: 2, colors: ['cream', 'ecru'], modifier: 'solid' },
    'Cotton Sateen',
    { category: 'base_weaves', fabric_type: 'Shirting', weight: 'Light', popularity: 65,
      description: 'Satin structure in breathable cotton — everyday luxury with smooth hand and moderate sheen.',
      applications: ['formal shirts', 'luxury casual', 'premium basics'],
      tags: ['sateen', 'cotton', 'breathable', 'everyday-luxury', 'casual', 'smooth'] }),
]

// ─── 4. DOBBY DESIGNS ─────────────────────────────────────────────────────────
const dobbyDesigns: GeneratedDesign[] = [

  d({ type: 'plain', colors: ['navy', 'white'], modifier: 'check', stripeWidth: 4 },
    'Regular Checks (Gingham)',
    { category: 'dobby', fabric_type: 'Shirting', weight: 'Light', popularity: 88,
      description: 'Simple regular check — alternating coloured warp and weft threads producing uniform square checks. Timeless gingham.',
      applications: ['casual shirting', 'gingham wear', "children's wear", 'home textiles'],
      tags: ['classic', 'timeless', 'versatile', 'casual', 'check', 'gingham', 'uniform'] }),

  d({ type: 'birdseye', n: 4, colors: ['navy', 'white'], modifier: 'solid' },
    'Birdseye Pattern',
    { category: 'dobby', fabric_type: 'Suiting', weight: 'Medium', popularity: 75,
      description: 'Fine repeating eye-like micro-texture — strategic color placement in twill base creates subtle sophistication.',
      applications: ['fine suiting', 'dress pants', 'formal wear', 'luxury shirts'],
      tags: ['refined', 'sophisticated', 'formal', 'classic', 'birdseye', 'micro-texture', 'suiting'] }),

  d({ type: 'houndstooth', colors: ['charcoal', 'white'], modifier: 'solid' },
    'Houndstooth',
    { category: 'dobby', fabric_type: 'Suiting', weight: 'Medium', popularity: 82,
      description: 'Classic broken-twill check — four-pointed star-like shapes. Iconic in British tailoring for decades.',
      applications: ['suiting', 'tailoring', 'blazers', 'fashion wear'],
      tags: ['classic', 'iconic', 'british', 'houndstooth', 'tailoring', 'fashion', 'check'] }),

  d({ type: 'honeycomb', n: 8, colors: ['ecru', 'natural'], modifier: 'solid' },
    'Honeycomb Waffle',
    { category: 'dobby', fabric_type: 'Home Textiles', weight: 'Medium', popularity: 70,
      description: 'High-relief hexagonal cells with excellent absorbency and dimensional quality — premium waffle texture.',
      applications: ['towels', 'waffle fabric', 'home textiles', 'bath wear'],
      tags: ['honeycomb', 'absorbent', 'textured', 'home', 'waffle', 'dimensional', 'bath'] }),

  d({ type: 'brighton_honeycomb', n: 12, colors: ['natural', 'cream'], modifier: 'solid' },
    'Brighton Honeycomb',
    { category: 'dobby', fabric_type: 'Home Textiles', weight: 'Medium', popularity: 65,
      description: 'Complex Brighton honeycomb variant with finer cell boundaries and richer three-dimensional texture.',
      applications: ['luxury towels', 'premium home textiles', 'bath terry alternatives'],
      tags: ['brighton', 'honeycomb', 'luxury', 'home', 'complex', 'fine', 'premium'] }),

  d({ type: 'twill', up: 3, down: 1, direction: 'Z', colors: ['burgundy', 'ecru'], modifier: 'stripe', stripeWidth: 6 },
    'Dobby Stripe (Twill)',
    { category: 'dobby', fabric_type: 'Shirting', weight: 'Light', popularity: 72,
      description: 'Textured twill stripes creating vertical interest with structural depth — dobby-style surface sophistication.',
      applications: ['fashion shirts', 'dress shirts', 'contemporary business wear'],
      tags: ['dobby', 'stripe', 'fashion', 'formal', 'contemporary', 'textured', 'vertical'] }),

  d({ type: 'crepe', seed: 42, n: 8, intensity: 0.18, colors: ['grey', 'cream'], modifier: 'solid' },
    'Crepe Weave',
    { category: 'dobby', fabric_type: 'Dobby Fancy/Fashion', weight: 'Light', popularity: 68,
      description: 'Irregular pebbly surface created by random float disruptions — crinkled appearance without physical damage.',
      applications: ['fashion tops', 'blouses', 'dresses', 'evening wear'],
      tags: ['crepe', 'pebbly', 'fashion', 'irregular', 'texture', 'flowing', 'blouse'] }),

  d({ type: 'bedford_cord', n: 4, colors: ['navy', 'white'], modifier: 'solid' },
    'Bedford Cord',
    { category: 'dobby', fabric_type: 'Suiting', weight: 'Medium', popularity: 62,
      description: 'Prominent lengthwise ribs created by padded interlace — durable with structured, professional appearance.',
      applications: ['equestrian wear', 'workwear', 'structured pants', 'uniforms'],
      tags: ['bedford-cord', 'ribbed', 'workwear', 'equestrian', 'structured', 'durable', 'uniform'] }),

  d({ type: 'mock_leno', n: 8, colors: ['white', 'cream'], modifier: 'solid' },
    'Mock Leno',
    { category: 'dobby', fabric_type: 'Shirting', weight: 'Light', popularity: 58,
      description: 'Open gauze-like structure without a specialist leno loom — excellent breathability for summer wear.',
      applications: ['summer tops', 'lightweight dresses', 'voile alternatives'],
      tags: ['mock-leno', 'open-weave', 'breathable', 'summer', 'lightweight', 'gauze'] }),
]

// ─── 5. JACQUARD / SPECIALTY ──────────────────────────────────────────────────
const jacquardDesigns: GeneratedDesign[] = [

  d({ type: 'diamond', n: 12, colors: ['gold', 'burgundy'], modifier: 'solid' },
    'Mughal Floral (Jacquard)',
    { category: 'specialty', fabric_type: 'Dobby Fancy/Fashion', weight: 'Extra Heavy', popularity: 80,
      description: 'Rich diamond medallions inspired by Mughal garden botanical motifs — layered flowers, leaves, intricate details.',
      applications: ['evening wear', 'bridal wear', 'luxury furnishings', 'upholstery'],
      tags: ['heritage', 'mughal', 'luxury', 'cultural', 'ornate', 'floral', 'bridal', 'botanic'] }),

  d({ type: 'diamond', n: 10, colors: ['navy', 'gold'], modifier: 'solid' },
    'Paisley (Jacquard)',
    { category: 'specialty', fabric_type: 'Dobby Fancy/Fashion', weight: 'Heavy', popularity: 74,
      description: 'Classic Persian teardrop motif — symbol of Indian and Persian heritage. Timeless and universally recognisable.',
      applications: ['evening wear', 'formal gowns', 'luxury scarves', 'furnishings'],
      tags: ['heritage', 'traditional', 'ornate', 'timeless', 'paisley', 'persian', 'indian'] }),

  d({ type: 'diamond', n: 8, colors: ['ivory', 'gold'], modifier: 'solid' },
    'Damask Pattern',
    { category: 'specialty', fabric_type: 'Home Textiles', weight: 'Heavy', popularity: 71,
      description: 'Symmetrical floral and geometric damask motifs from the ancient Damascus textile tradition — formal, elegant.',
      applications: ['formal gowns', 'home furnishings', 'upholstery', 'drapery'],
      tags: ['formal', 'elegant', 'classic', 'luxury', 'damask', 'symmetrical', 'syrian'] }),

  d({ type: 'diamond', n: 14, colors: ['emerald', 'gold'], modifier: 'solid' },
    'Brocade',
    { category: 'specialty', fabric_type: 'Dobby Fancy/Fashion', weight: 'Extra Heavy', popularity: 76,
      description: 'Traditional brocade — supplementary weft patterns float above ground weave creating raised, embossed appearance.',
      applications: ['bridal wear', 'evening gowns', 'ceremonial garments', 'luxury upholstery'],
      tags: ['brocade', 'raised', 'luxury', 'bridal', 'ceremonial', 'embossed', 'heritage'] }),

  d({ type: 'diamond', n: 16, colors: ['gold', 'ruby'], modifier: 'solid' },
    'Banarasi Inspired',
    { category: 'specialty', fabric_type: 'Dobby Fancy/Fashion', weight: 'Extra Heavy', popularity: 69,
      description: 'Banarasi silk-inspired zari (metallic thread) motifs — flowers, leaves and geometric forms. UNESCO heritage design.',
      applications: ['bridal sarees', 'wedding wear', 'ceremonial garments', 'luxury occasions'],
      tags: ['banarasi', 'zari', 'gold', 'bridal', 'heritage', 'indian', 'luxury', 'silk'] }),

  d({ type: 'diamond', n: 6, colors: ['teal', 'navy'], modifier: 'solid' },
    'Ikat Inspired',
    { category: 'specialty', fabric_type: 'Dobby Fancy/Fashion', weight: 'Heavy', popularity: 66,
      description: 'Ikat-inspired resist-dye blurred-edge geometric motifs — characteristic of Central Asian and Indian traditions.',
      applications: ['fashion wear', 'contemporary ethnic', 'home textiles', 'scarves'],
      tags: ['ikat', 'resist-dye', 'geometric', 'ethnic', 'blurred', 'central-asian', 'heritage'] }),

  d({ type: 'diamond', n: 18, colors: ['blue', 'ivory'], modifier: 'solid' },
    'Tapestry / Scenic',
    { category: 'specialty', fabric_type: 'Home Textiles', weight: 'Extra Heavy', popularity: 64,
      description: 'Tapestry weave — pictorial or scenic designs woven into fabric. Storytelling through thread.',
      applications: ['wall hangings', 'decorative panels', 'luxury upholstery', 'art pieces'],
      tags: ['tapestry', 'pictorial', 'storytelling', 'art', 'decorative', 'wall-hanging', 'luxury'] }),
]

// ─── 6. STRUCTURAL WEAVES ─────────────────────────────────────────────────────
const structuralWeaves: GeneratedDesign[] = [

  d({ type: 'plain', colors: ['black', 'ecru'], modifier: 'solid' },
    'Velvet (Cut Pile)',
    { category: 'specialty', fabric_type: 'Dobby Fancy/Fashion', weight: 'Heavy', popularity: 72,
      description: 'Warp pile cut to create dense, soft surface — luxurious tactile quality unmatched in woven fabrics.',
      applications: ['evening gowns', 'formal wear', 'luxury upholstery', 'curtains'],
      tags: ['velvet', 'pile', 'luxury', 'elegant', 'soft', 'formal', 'cut-pile', 'tactile'] }),

  d({ type: 'twill', up: 3, down: 1, direction: 'Z', colors: ['burgundy', 'cream'], modifier: 'stripe', stripeWidth: 4 },
    'Corduroy (Weft Pile)',
    { category: 'specialty', fabric_type: 'Dobby Fancy/Fashion', weight: 'Heavy', popularity: 68,
      description: 'Weft pile ridges cut to create characteristic corded texture — durable, warm, tactile.',
      applications: ['casual pants', 'jackets', 'shirts', "children's wear"],
      tags: ['corduroy', 'ribbed', 'pile', 'durable', 'casual', 'warm', 'weft-pile'] }),

  d({ type: 'mock_leno', n: 6, colors: ['white', 'ivory'], modifier: 'solid' },
    'Leno Gauze',
    { category: 'specialty', fabric_type: 'Shirting', weight: 'Light', popularity: 60,
      description: 'Ultra-light leno weave with twisted warp pairs — maximum breathability and ethereal transparency.',
      applications: ['summer wear', 'sheer layers', 'voile dresses', 'lightweight scarves'],
      tags: ['leno', 'gauze', 'sheer', 'breathable', 'lightweight', 'summer', 'airy'] }),

  d({ type: 'plain', colors: ['grey', 'white'], modifier: 'solid' },
    'Double Cloth',
    { category: 'specialty', fabric_type: 'Technical/Performance', weight: 'Extra Heavy', popularity: 56,
      description: 'Two complete layers woven simultaneously then joined at edges — superior insulation and weight.',
      applications: ['heavy outerwear', 'blankets', 'linings', 'technical garments'],
      tags: ['double-cloth', 'heavy-duty', 'two-layer', 'insulating', 'technical', 'outerwear'] }),

  d({ type: 'bedford_cord', n: 6, colors: ['natural', 'cream'], modifier: 'solid' },
    'Extra Warp Pile',
    { category: 'specialty', fabric_type: 'Canvas/Duck', weight: 'Extra Heavy', popularity: 52,
      description: 'Supplementary warp threads add extra texture and visual dimension above the ground weave.',
      applications: ['decorative textiles', 'upholstery', 'artistic garments', 'statement pieces'],
      tags: ['extra-warp', 'pile', 'decorative', 'textured', 'dimensional', 'artistic'] }),
]

// ─── 7. SURFACE / MOTIF LAYER ─────────────────────────────────────────────────
const surfaceMotifDesigns: GeneratedDesign[] = [

  d({ type: 'plain', colors: ['navy', 'white'], modifier: 'stripe', stripeWidth: 4 },
    'Vertical Stripes',
    { category: 'modifiers', fabric_type: 'Shirting', weight: 'Light', popularity: 88,
      description: 'Vertical stripes applied via yarn coloring — visual elongation, universal appeal, any base weave.',
      applications: ['dress shirts', 'casual wear', 'suiting', "children's wear"],
      tags: ['classic', 'versatile', 'timeless', 'universal', 'vertical', 'stripe', 'elongating'] }),

  d({ type: 'twill', up: 2, down: 2, direction: 'Z', colors: ['cream', 'navy'], modifier: 'stripe', stripeWidth: 6 },
    'Horizontal Stripes',
    { category: 'modifiers', fabric_type: 'Shirting', weight: 'Light', popularity: 76,
      description: 'Horizontal stripes applied through weft coloring — maritime, nautical, Breton-inspired aesthetic.',
      applications: ['casual shirts', 'maritime wear', 'nautical fashion'],
      tags: ['horizontal', 'stripe', 'maritime', 'nautical', 'casual', 'breton', 'weft-stripe'] }),

  d({ type: 'plain', colors: ['natural', 'navy'], modifier: 'check', stripeWidth: 8 },
    'Small Floral Motif',
    { category: 'modifiers', fabric_type: 'Shirting', weight: 'Light', popularity: 80,
      description: 'Delicate scattered florals on plain base — romantic, feminine surface pattern for summer wear.',
      applications: ['summer dresses', 'blouses', "children's wear", 'home textiles'],
      tags: ['romantic', 'feminine', 'delicate', 'casual', 'floral', 'small-motif', 'botanical'] }),

  d({ type: 'basket', n: 2, colors: ['teal', 'cream'], modifier: 'check', stripeWidth: 12 },
    'Large Floral Motif',
    { category: 'modifiers', fabric_type: 'Home Textiles', weight: 'Medium', popularity: 70,
      description: 'Bold oversized botanical florals for dramatic contemporary appeal — statement home and fashion.',
      applications: ['fashion tops', 'home soft furnishings', 'curtains', 'statement wear'],
      tags: ['bold', 'botanical', 'large-motif', 'statement', 'contemporary', 'floral', 'dramatic'] }),

  d({ type: 'zigzag', up: 2, down: 2, colors: ['terracotta', 'cream'], modifier: 'solid' },
    'Abstract Brushstroke',
    { category: 'modifiers', fabric_type: 'Shirting', weight: 'Light', popularity: 66,
      description: 'Organic brushstroke-inspired motifs — painterly, expressive repeats for artistic textile statement.',
      applications: ['fashion tops', 'artistic garments', 'statement pieces'],
      tags: ['abstract', 'brushstroke', 'artistic', 'painterly', 'organic', 'fashion', 'expressive'] }),

  d({ type: 'diamond', n: 6, colors: ['navy', 'cream'], modifier: 'solid' },
    'Geometric Lattice',
    { category: 'modifiers', fabric_type: 'Shirting', weight: 'Light', popularity: 74,
      description: 'Interlocking diamonds and lines — clean mathematical precision for design-forward contemporary garments.',
      applications: ['contemporary fashion', 'sportswear', 'design-forward pieces'],
      tags: ['geometric', 'lattice', 'mathematical', 'contemporary', 'clean', 'precision', 'modern'] }),

  d({ type: 'plain', colors: ['burgundy', 'cream'], modifier: 'check', stripeWidth: 3 },
    'Ethnic Motif',
    { category: 'modifiers', fabric_type: 'Shirting', weight: 'Light', popularity: 78,
      description: 'Rich cultural patterns spanning Indian, Aztec, African and Japanese design traditions — global artisan heritage.',
      applications: ['ethnic wear', 'festival fashion', 'cultural garments', 'heritage collections'],
      tags: ['ethnic', 'traditional', 'cultural', 'heritage', 'festival', 'global', 'artisan'] }),

  d({ type: 'plain', colors: ['grey', 'white'], modifier: 'stripe', stripeWidth: 2 },
    'Novelty / Conversational',
    { category: 'modifiers', fabric_type: 'Shirting', weight: 'Light', popularity: 64,
      description: 'Playful conversational patterns — logos, animals, seasonal objects or symbols woven into fabric surface.',
      applications: ["children's wear", 'lifestyle fashion', 'novelty garments', 'seasonal wear'],
      tags: ['novelty', 'conversational', 'playful', 'fun', 'seasonal', "children's", 'expressive'] }),
]

// ─── Combined Export ──────────────────────────────────────────────────────────
export const communityDesigns: GeneratedDesign[] = [
  ...basicWeaves,
  ...twillWeaves,
  ...satinWeaves,
  ...dobbyDesigns,
  ...jacquardDesigns,
  ...structuralWeaves,
  ...surfaceMotifDesigns,
]

export default communityDesigns
