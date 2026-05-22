// ─── Material Physics Database ──────────────────────────────────────────────
// All fiber types from Fai1.pdf (FabricAI Research Document)
// Properties: shrinkage, drape, stiffness, tenacity, moisture regain, elongation

import type { Material } from '@/lib/types'

export interface MaterialPhysics {
  name: string
  category: 'Natural Cellulosic' | 'Natural Protein' | 'Regenerated' | 'Synthetic' | 'High-Performance' | 'Blend' | 'Specialty'
  shrink_base: number        // Base shrinkage %
  drape_base: number         // Base drape index 0–100
  stiff_base: number         // Base stiffness index 0–100
  tenacity_base: number      // Tenacity N/cm (normalized for simulation)
  moisture_regain_pct: number
  elongation_pct: number
  felting: boolean
  note?: string
}

// ─── Complete Material Physics Record ─────────────────────────────────────────
export const MATERIAL_PHYSICS: Record<Material, MaterialPhysics> = {

  // ═══════════════════════════════════════════════════════════════
  // NATURAL CELLULOSIC FIBERS
  // ═══════════════════════════════════════════════════════════════

  cotton: {
    name: 'Cotton (Upland)',
    category: 'Natural Cellulosic',
    shrink_base: 4.0, drape_base: 55, stiff_base: 45,
    tenacity_base: 24, moisture_regain_pct: 8.5, elongation_pct: 7.5,
    felting: false, note: 'Generic upland cotton — 22–26 cN/tex tenacity',
  },
  cotton_upland: {
    name: 'Upland Cotton',
    category: 'Natural Cellulosic',
    shrink_base: 4.0, drape_base: 55, stiff_base: 45,
    tenacity_base: 24, moisture_regain_pct: 8.5, elongation_pct: 7.5,
    felting: false, note: '22–26 cN/tex · 5–10% elong · 3–5% shrink',
  },
  cotton_pima: {
    name: 'Pima Cotton',
    category: 'Natural Cellulosic',
    shrink_base: 2.5, drape_base: 62, stiff_base: 38,
    tenacity_base: 30, moisture_regain_pct: 8.5, elongation_pct: 7.5,
    felting: false, note: '28–32 cN/tex · 2–3% shrink · Longer staple',
  },
  cotton_egyptian: {
    name: 'Egyptian Cotton',
    category: 'Natural Cellulosic',
    shrink_base: 3.0, drape_base: 60, stiff_base: 40,
    tenacity_base: 28, moisture_regain_pct: 8.5, elongation_pct: 7.0,
    felting: false, note: '26–30 cN/tex · Extra-long staple · 2–4% shrink',
  },
  cotton_organic: {
    name: 'Organic Cotton',
    category: 'Natural Cellulosic',
    shrink_base: 4.5, drape_base: 54, stiff_base: 46,
    tenacity_base: 25, moisture_regain_pct: 8.5, elongation_pct: 7.5,
    felting: false, note: '22–28 cN/tex · 3–6% shrink · BCI/GOTS certified',
  },
  kapok: {
    name: 'Kapok',
    category: 'Natural Cellulosic',
    shrink_base: 1.5, drape_base: 35, stiff_base: 30,
    tenacity_base: 13, moisture_regain_pct: 10.0, elongation_pct: 3.0,
    felting: false, note: '12–15 cN/tex · Very brittle · Mostly blended',
  },
  linen: {
    name: 'Flax / Linen',
    category: 'Natural Cellulosic',
    shrink_base: 5.0, drape_base: 40, stiff_base: 70,
    tenacity_base: 57, moisture_regain_pct: 11.0, elongation_pct: 3.1,
    felting: false, note: '50–65 cN/tex · Very stiff · Moderate shrink',
  },
  hemp: {
    name: 'Hemp',
    category: 'Natural Cellulosic',
    shrink_base: 4.0, drape_base: 38, stiff_base: 75,
    tenacity_base: 72, moisture_regain_pct: 12.0, elongation_pct: 1.6,
    felting: false, note: '55–90 cN/tex · Highest tenacity cellulosic',
  },
  jute: {
    name: 'Jute',
    category: 'Natural Cellulosic',
    shrink_base: 5.0, drape_base: 30, stiff_base: 80,
    tenacity_base: 32, moisture_regain_pct: 13.8, elongation_pct: 5.1,
    felting: false, note: '30–34 cN/tex · Coarse industrial fiber',
  },
  ramie: {
    name: 'Ramie',
    category: 'Natural Cellulosic',
    shrink_base: 3.5, drape_base: 42, stiff_base: 72,
    tenacity_base: 67, moisture_regain_pct: 11.0, elongation_pct: 3.5,
    felting: false, note: '60–75 cN/tex · Even stiffer than linen',
  },
  abaca: {
    name: 'Abaca / Manila',
    category: 'Natural Cellulosic',
    shrink_base: 2.0, drape_base: 28, stiff_base: 85,
    tenacity_base: 105, moisture_regain_pct: 10.5, elongation_pct: 1.1,
    felting: false, note: '90–120 cN/tex · Highest natural fiber tenacity',
  },
  coir: {
    name: 'Coir / Coconut',
    category: 'Natural Cellulosic',
    shrink_base: 2.0, drape_base: 20, stiff_base: 85,
    tenacity_base: 12, moisture_regain_pct: 10.5, elongation_pct: 30.0,
    felting: false, note: '10–15 cN/tex · Very elastic · Industrial use',
  },

  // ═══════════════════════════════════════════════════════════════
  // NATURAL PROTEIN FIBERS
  // ═══════════════════════════════════════════════════════════════

  silk: {
    name: 'Mulberry Silk',
    category: 'Natural Protein',
    shrink_base: 3.0, drape_base: 92, stiff_base: 18,
    tenacity_base: 42, moisture_regain_pct: 11.0, elongation_pct: 20.0,
    felting: false, note: 'Generic silk · 3.5–5.0 g/d · 15–25% elong',
  },
  silk_mulberry: {
    name: 'Mulberry Silk',
    category: 'Natural Protein',
    shrink_base: 3.0, drape_base: 92, stiff_base: 18,
    tenacity_base: 42, moisture_regain_pct: 11.0, elongation_pct: 20.0,
    felting: false, note: '3.5–5.0 g/d · Finest quality silk · 15–25% elong',
  },
  silk_tussah: {
    name: 'Tussah (Wild) Silk',
    category: 'Natural Protein',
    shrink_base: 3.5, drape_base: 87, stiff_base: 22,
    tenacity_base: 35, moisture_regain_pct: 11.0, elongation_pct: 25.0,
    felting: false, note: '3.0–4.0 g/d · Coarser texture · 20–30% elong',
  },
  wool: {
    name: 'Merino Wool',
    category: 'Natural Protein',
    shrink_base: 12.0, drape_base: 78, stiff_base: 28,
    tenacity_base: 14, moisture_regain_pct: 16.0, elongation_pct: 35.0,
    felting: true, note: 'Generic wool · High felting risk · 13–17% regain',
  },
  wool_merino: {
    name: 'Merino Wool',
    category: 'Natural Protein',
    shrink_base: 12.0, drape_base: 78, stiff_base: 28,
    tenacity_base: 14, moisture_regain_pct: 16.0, elongation_pct: 35.0,
    felting: true, note: '1.0–1.7 g/d · Scorch at 130–140°C · Felting risk',
  },
  cashmere: {
    name: 'Cashmere',
    category: 'Natural Protein',
    shrink_base: 10.0, drape_base: 82, stiff_base: 20,
    tenacity_base: 12, moisture_regain_pct: 14.0, elongation_pct: 30.0,
    felting: true, note: '1.0–1.5 g/d · Very heat sensitive · Luxury fiber',
  },
  mohair: {
    name: 'Mohair',
    category: 'Natural Protein',
    shrink_base: 8.0, drape_base: 76, stiff_base: 25,
    tenacity_base: 17, moisture_regain_pct: 13.0, elongation_pct: 32.0,
    felting: true, note: '1.5–2.0 g/d · Resilient · Lustrous',
  },

  // ═══════════════════════════════════════════════════════════════
  // REGENERATED FIBERS
  // ═══════════════════════════════════════════════════════════════

  viscose: {
    name: 'Viscose Rayon',
    category: 'Regenerated',
    shrink_base: 7.5, drape_base: 82, stiff_base: 22,
    tenacity_base: 24, moisture_regain_pct: 13.5, elongation_pct: 22.0,
    felting: false, note: '22–26 cN/tex · High shrink · Superior drape',
  },
  modal: {
    name: 'Modal',
    category: 'Regenerated',
    shrink_base: 2.0, drape_base: 80, stiff_base: 24,
    tenacity_base: 32, moisture_regain_pct: 13.0, elongation_pct: 17.5,
    felting: false, note: '30–35 cN/tex · Low shrink · HWM process',
  },
  micro_modal: {
    name: 'Micro-Modal',
    category: 'Regenerated',
    shrink_base: 1.5, drape_base: 84, stiff_base: 20,
    tenacity_base: 32, moisture_regain_pct: 13.0, elongation_pct: 17.5,
    felting: false, note: 'Very fine modal · Ultra-soft hand · Very low shrink',
  },
  tencel: {
    name: 'Lyocell (Tencel)',
    category: 'Regenerated',
    shrink_base: 0.5, drape_base: 76, stiff_base: 26,
    tenacity_base: 41, moisture_regain_pct: 11.5, elongation_pct: 16.0,
    felting: false, note: '38–44 cN/tex · Minimal shrink · Closed-loop process',
  },
  acetate: {
    name: 'Cellulose Acetate',
    category: 'Regenerated',
    shrink_base: 4.0, drape_base: 88, stiff_base: 16,
    tenacity_base: 12, moisture_regain_pct: 6.0, elongation_pct: 35.0,
    felting: false, note: '11–13 cN/tex · Silk-like drape · Low abrasion',
  },
  triacetate: {
    name: 'Cellulose Triacetate',
    category: 'Regenerated',
    shrink_base: 2.5, drape_base: 84, stiff_base: 22,
    tenacity_base: 12, moisture_regain_pct: 3.5, elongation_pct: 30.0,
    felting: false, note: '11–13 cN/tex · Heat-settable pleats · Low regain',
  },

  // ═══════════════════════════════════════════════════════════════
  // SYNTHETIC POLYMER FIBERS
  // ═══════════════════════════════════════════════════════════════

  polyester: {
    name: 'Polyester PET',
    category: 'Synthetic',
    shrink_base: 0.75, drape_base: 52, stiff_base: 58,
    tenacity_base: 50, moisture_regain_pct: 0.4, elongation_pct: 22.0,
    felting: false, note: 'Generic PET · 4.0–5.5 g/d · Melts 256°C',
  },
  polyester_pet: {
    name: 'Polyester PET',
    category: 'Synthetic',
    shrink_base: 0.75, drape_base: 52, stiff_base: 58,
    tenacity_base: 50, moisture_regain_pct: 0.4, elongation_pct: 22.0,
    felting: false, note: '4.0–5.5 g/d · 15–30% elong · Melts 256°C · 0.5–1% shrink',
  },
  polyester_pbt: {
    name: 'Polyester PBT',
    category: 'Synthetic',
    shrink_base: 1.5, drape_base: 60, stiff_base: 48,
    tenacity_base: 37, moisture_regain_pct: 0.4, elongation_pct: 35.0,
    felting: false, note: '3.0–4.0 g/d · Helical chain · Superior softness · 220°C melt',
  },
  polyester_ptt: {
    name: 'Polyester PTT (Sorona)',
    category: 'Synthetic',
    shrink_base: 10.0, drape_base: 64, stiff_base: 40,
    tenacity_base: 36, moisture_regain_pct: 0.4, elongation_pct: 38.0,
    felting: false, note: '3.4–3.8 g/d · Z-shaped chain · High elastic recovery · 228°C melt',
  },
  nylon: {
    name: 'Nylon 6',
    category: 'Synthetic',
    shrink_base: 2.5, drape_base: 64, stiff_base: 40,
    tenacity_base: 55, moisture_regain_pct: 4.0, elongation_pct: 50.0,
    felting: false, note: 'Generic nylon · 4.5–6.5 g/d · 30–70% elong',
  },
  nylon_6: {
    name: 'Nylon 6',
    category: 'Synthetic',
    shrink_base: 2.5, drape_base: 64, stiff_base: 40,
    tenacity_base: 55, moisture_regain_pct: 4.0, elongation_pct: 50.0,
    felting: false, note: '4.5–6.5 g/d · 30–70% elong · Melts 214°C · 2–3% shrink',
  },
  nylon_66: {
    name: 'Nylon 6,6',
    category: 'Synthetic',
    shrink_base: 4.0, drape_base: 60, stiff_base: 46,
    tenacity_base: 65, moisture_regain_pct: 3.5, elongation_pct: 31.0,
    felting: false, note: '5.0–8.0 g/d · 24–38% elong · Melts 253°C · Higher abrasion resist',
  },
  acrylic: {
    name: 'Acrylic',
    category: 'Synthetic',
    shrink_base: 1.5, drape_base: 50, stiff_base: 50,
    tenacity_base: 27, moisture_regain_pct: 1.5, elongation_pct: 31.0,
    felting: false, note: '2.0–3.5 g/d · 24–38% elong · Softens 190°C · Wool substitute',
  },
  polypropylene: {
    name: 'Polypropylene',
    category: 'Synthetic',
    shrink_base: 0.3, drape_base: 46, stiff_base: 55,
    tenacity_base: 45, moisture_regain_pct: 0.05, elongation_pct: 30.0,
    felting: false, note: '3.5–5.5 g/d · Minimal shrink · Melts 165°C · Lightest fiber',
  },
  lycra: {
    name: 'Spandex / Lycra',
    category: 'Synthetic',
    shrink_base: 0.2, drape_base: 88, stiff_base: 10,
    tenacity_base: 8, moisture_regain_pct: 1.0, elongation_pct: 600,
    felting: false, note: '0.6–1.0 g/d · 500–700% elong · Melts 260°C · Always blended',
  },

  // ═══════════════════════════════════════════════════════════════
  // HIGH-PERFORMANCE / INDUSTRIAL FIBERS
  // ═══════════════════════════════════════════════════════════════

  para_aramid: {
    name: 'Para-Aramid (Kevlar)',
    category: 'High-Performance',
    shrink_base: 0.0, drape_base: 20, stiff_base: 95,
    tenacity_base: 240, moisture_regain_pct: 4.5, elongation_pct: 3.5,
    felting: false, note: '24 g/d · LOI 29% · Ballistics, tyres · No melt to 375°C',
  },
  meta_aramid: {
    name: 'Meta-Aramid (Nomex)',
    category: 'High-Performance',
    shrink_base: 0.0, drape_base: 25, stiff_base: 90,
    tenacity_base: 55, moisture_regain_pct: 4.5, elongation_pct: 22.0,
    felting: false, note: '5.5 g/d · LOI 29% · Flame resistance · Fire-fighting gear',
  },
  pps: {
    name: 'Polyphenylene Sulfide',
    category: 'High-Performance',
    shrink_base: 0.0, drape_base: 22, stiff_base: 88,
    tenacity_base: 40, moisture_regain_pct: 0.6, elongation_pct: 20.0,
    felting: false, note: '4.0 g/d · LOI 35% · Chemical resistance · Industrial filters',
  },
  ptfe: {
    name: 'PTFE',
    category: 'High-Performance',
    shrink_base: 0.0, drape_base: 18, stiff_base: 90,
    tenacity_base: 20, moisture_regain_pct: 0.0, elongation_pct: 13.0,
    felting: false, note: '2.0 g/d · LOI 95% · Chemical gaskets · Zero moisture',
  },
  pbi: {
    name: 'PBI (Polybenzimidazole)',
    category: 'High-Performance',
    shrink_base: 0.0, drape_base: 28, stiff_base: 85,
    tenacity_base: 26, moisture_regain_pct: 13.0, elongation_pct: 25.0,
    felting: false, note: '2.6 g/d · LOI 40% · Highest thermal stability · Aerospace',
  },
  pbo: {
    name: 'PBO / Zylon',
    category: 'High-Performance',
    shrink_base: 0.0, drape_base: 15, stiff_base: 98,
    tenacity_base: 420, moisture_regain_pct: 1.0, elongation_pct: 3.5,
    felting: false, note: '42 g/d · LOI 68% · Highest textile tenacity known',
  },
  carbon_pan: {
    name: 'Carbon Fibre (PAN)',
    category: 'High-Performance',
    shrink_base: 0.0, drape_base: 10, stiff_base: 99,
    tenacity_base: 200, moisture_regain_pct: 0.0, elongation_pct: 1.5,
    felting: false, note: '15–25 g/d · Zero shrink/moisture · Aerospace composites',
  },
  e_glass: {
    name: 'E-Glass Fibre',
    category: 'High-Performance',
    shrink_base: 0.0, drape_base: 12, stiff_base: 97,
    tenacity_base: 75, moisture_regain_pct: 0.0, elongation_pct: 3.0,
    felting: false, note: '6.0–9.0 g/d · Brittle · Reinforcement mats',
  },

  // ═══════════════════════════════════════════════════════════════
  // SPECIALTY
  // ═══════════════════════════════════════════════════════════════

  zari: {
    name: 'Zari / Metallic',
    category: 'Specialty',
    shrink_base: 0.0, drape_base: 30, stiff_base: 85,
    tenacity_base: 180, moisture_regain_pct: 0.0, elongation_pct: 2.0,
    felting: false, note: 'Metal-wrapped yarn · Saree border / pallu · No shrink',
  },

  // ═══════════════════════════════════════════════════════════════
  // BLENDS
  // ═══════════════════════════════════════════════════════════════

  pc_blend: {
    name: 'Polyester/Cotton (PC 65/35)',
    category: 'Blend',
    shrink_base: 1.0, drape_base: 54, stiff_base: 50,
    tenacity_base: 35, moisture_regain_pct: 3.0, elongation_pct: 15.0,
    felting: false, note: '65/35 PC · High tenacity · <1% shrink · Shirts, Uniforms',
  },
  pv_blend: {
    name: 'Polyester/Viscose (PV 65/35)',
    category: 'Blend',
    shrink_base: 3.2, drape_base: 65, stiff_base: 38,
    tenacity_base: 36, moisture_regain_pct: 5.5, elongation_pct: 18.0,
    felting: false, note: '65/35 PV · Cost-effective · School uniforms · <1% shrink',
  },
  wool_acrylic: {
    name: 'Wool/Acrylic (50/50)',
    category: 'Blend',
    shrink_base: 5.0, drape_base: 68, stiff_base: 36,
    tenacity_base: 20, moisture_regain_pct: 8.0, elongation_pct: 32.0,
    felting: true, note: '50/50 Wool-Acrylic · Moderate shrink · Blankets, Sweaters',
  },
  cotton_linen: {
    name: 'Cotton/Linen (55/45)',
    category: 'Blend',
    shrink_base: 4.5, drape_base: 46, stiff_base: 60,
    tenacity_base: 40, moisture_regain_pct: 9.5, elongation_pct: 5.0,
    felting: false, note: '55/45 · High tenacity · Moderate shrink · Summer apparel',
  },

  other: {
    name: 'Other / Custom',
    category: 'Blend',
    shrink_base: 3.0, drape_base: 55, stiff_base: 40,
    tenacity_base: 30, moisture_regain_pct: 5.0, elongation_pct: 15.0,
    felting: false,
  },
}

// ─── Grouped list for UI dropdowns ────────────────────────────────────────────
export interface MaterialGroup {
  group: string
  items: Array<{ value: Material; label: string }>
}

export const MATERIAL_GROUPS: MaterialGroup[] = [
  {
    group: 'Natural Cellulosic',
    items: [
      { value: 'cotton',          label: 'Cotton (Generic)' },
      { value: 'cotton_upland',   label: 'Upland Cotton' },
      { value: 'cotton_pima',     label: 'Pima Cotton' },
      { value: 'cotton_egyptian', label: 'Egyptian Cotton' },
      { value: 'cotton_organic',  label: 'Organic Cotton' },
      { value: 'kapok',           label: 'Kapok' },
      { value: 'linen',           label: 'Flax / Linen' },
      { value: 'hemp',            label: 'Hemp' },
      { value: 'jute',            label: 'Jute' },
      { value: 'ramie',           label: 'Ramie' },
      { value: 'abaca',           label: 'Abaca / Manila' },
      { value: 'coir',            label: 'Coir / Coconut' },
    ],
  },
  {
    group: 'Natural Protein',
    items: [
      { value: 'silk',            label: 'Silk (Mulberry)' },
      { value: 'silk_mulberry',   label: 'Mulberry Silk' },
      { value: 'silk_tussah',     label: 'Tussah / Wild Silk' },
      { value: 'wool',            label: 'Wool (Merino)' },
      { value: 'wool_merino',     label: 'Merino Wool' },
      { value: 'cashmere',        label: 'Cashmere' },
      { value: 'mohair',          label: 'Mohair' },
    ],
  },
  {
    group: 'Regenerated',
    items: [
      { value: 'viscose',         label: 'Viscose Rayon' },
      { value: 'modal',           label: 'Modal' },
      { value: 'micro_modal',     label: 'Micro-Modal' },
      { value: 'tencel',          label: 'Lyocell (Tencel)' },
      { value: 'acetate',         label: 'Cellulose Acetate' },
      { value: 'triacetate',      label: 'Cellulose Triacetate' },
    ],
  },
  {
    group: 'Synthetic Polymer',
    items: [
      { value: 'polyester',       label: 'Polyester (Generic)' },
      { value: 'polyester_pet',   label: 'Polyester PET' },
      { value: 'polyester_pbt',   label: 'Polyester PBT' },
      { value: 'polyester_ptt',   label: 'Polyester PTT (Sorona)' },
      { value: 'nylon',           label: 'Nylon (Generic)' },
      { value: 'nylon_6',         label: 'Nylon 6' },
      { value: 'nylon_66',        label: 'Nylon 6,6' },
      { value: 'acrylic',         label: 'Acrylic' },
      { value: 'polypropylene',   label: 'Polypropylene' },
      { value: 'lycra',           label: 'Spandex / Lycra' },
    ],
  },
  {
    group: 'High-Performance / Industrial',
    items: [
      { value: 'para_aramid',     label: 'Para-Aramid (Kevlar)' },
      { value: 'meta_aramid',     label: 'Meta-Aramid (Nomex)' },
      { value: 'pps',             label: 'Polyphenylene Sulfide' },
      { value: 'ptfe',            label: 'PTFE' },
      { value: 'pbi',             label: 'PBI (Polybenzimidazole)' },
      { value: 'pbo',             label: 'PBO / Zylon' },
      { value: 'carbon_pan',      label: 'Carbon Fibre (PAN)' },
      { value: 'e_glass',         label: 'E-Glass' },
    ],
  },
  {
    group: 'Specialty & Blends',
    items: [
      { value: 'zari',            label: 'Zari / Metallic' },
      { value: 'pc_blend',        label: 'Polyester/Cotton Blend (PC)' },
      { value: 'pv_blend',        label: 'Polyester/Viscose Blend (PV)' },
      { value: 'wool_acrylic',    label: 'Wool/Acrylic Blend' },
      { value: 'cotton_linen',    label: 'Cotton/Linen Blend' },
      { value: 'other',           label: 'Other / Custom' },
    ],
  },
]

// ─── Weave Modifiers ────────────────────────────────────────────────────────
export interface WeaveModifier {
  name: string
  interlace: number
  crimp: number
  drape_mod: number
  stiff_mod: number
  strength_mod: number
  cover_pct: number
  hint: string
}

export const WEAVE_MODIFIERS: Record<string, WeaveModifier> = {
  plain:    { name: 'Plain Weave',      interlace: 1.00, crimp: 1.00, drape_mod: 0.72, stiff_mod: 1.30, strength_mod: 1.00, cover_pct: 0.92, hint: 'Maximum interlacing — highest crimp, firm hand' },
  twill:    { name: 'Twill (2/2)',       interlace: 0.75, crimp: 0.80, drape_mod: 0.88, stiff_mod: 1.05, strength_mod: 1.08, cover_pct: 0.88, hint: 'Diagonal float — balanced drape & strength' },
  satin:    { name: 'Satin (5-shaft)',   interlace: 0.40, crimp: 0.50, drape_mod: 1.18, stiff_mod: 0.65, strength_mod: 0.95, cover_pct: 0.85, hint: 'Long floats — maximum drape, low crimp' },
  basket:   { name: 'Basket (2×2)',      interlace: 0.85, crimp: 0.95, drape_mod: 0.80, stiff_mod: 1.15, strength_mod: 0.98, cover_pct: 0.90, hint: 'Modified plain — open handle' },
  rib:      { name: 'Rib (2×1)',         interlace: 0.90, crimp: 1.10, drape_mod: 0.68, stiff_mod: 1.35, strength_mod: 1.02, cover_pct: 0.95, hint: 'High crimp — textured, stiff in one direction' },
  leno:     { name: 'Leno (open)',       interlace: 0.30, crimp: 0.30, drape_mod: 1.30, stiff_mod: 0.40, strength_mod: 0.75, cover_pct: 0.55, hint: 'Twisted warp — very open, sheer fabrics' },
  dobby:    { name: 'Dobby Pattern',     interlace: 0.70, crimp: 0.75, drape_mod: 0.92, stiff_mod: 1.00, strength_mod: 1.02, cover_pct: 0.88, hint: 'Patterned weave — moderate interlacing' },
  jacquard: { name: 'Jacquard',          interlace: 0.55, crimp: 0.60, drape_mod: 1.10, stiff_mod: 0.80, strength_mod: 0.92, cover_pct: 0.82, hint: 'Complex pattern — variable interlacing' },
}

// ─── Category color mapping ─────────────────────────────────────────────────
export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  'Natural Cellulosic': { bg: '#eaf3de', text: '#3b6d11' },
  'Natural Protein':    { bg: '#faeeda', text: '#854f0b' },
  'Regenerated':        { bg: '#eeedfe', text: '#534ab7' },
  'Synthetic':          { bg: '#e6f1fb', text: '#185fa5' },
  'High-Performance':   { bg: '#fcebeb', text: '#a32d2d' },
  'Blend':              { bg: '#f0f0f0', text: '#555555' },
  'Specialty':          { bg: '#fff3e0', text: '#b35c00' },
}
