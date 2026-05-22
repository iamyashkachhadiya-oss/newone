// ─── Core Types — FabricAI Studio ─────────────────────────────────────────

export type CountSystem = 'denier' | 'ne' | 'tex' | 'nm'
export type Material =
  // ─── Natural Cellulosic ───────────────────────────────────────
  | 'cotton'            // Upland Cotton (generic)
  | 'cotton_upland'     // Upland Cotton
  | 'cotton_pima'       // Pima Cotton
  | 'cotton_egyptian'   // Egyptian Cotton
  | 'cotton_organic'    // Organic Cotton
  | 'kapok'             // Kapok
  | 'linen'             // Flax / Linen
  | 'hemp'              // Hemp
  | 'jute'              // Jute
  | 'ramie'             // Ramie
  | 'abaca'             // Abaca / Manila
  | 'coir'              // Coir / Coconut
  // ─── Natural Protein ──────────────────────────────────────────
  | 'silk'              // Mulberry Silk (generic)
  | 'silk_mulberry'     // Mulberry Silk
  | 'silk_tussah'       // Tussah / Wild Silk
  | 'wool'              // Merino Wool (generic)
  | 'wool_merino'       // Merino Wool
  | 'cashmere'          // Cashmere
  | 'mohair'            // Mohair
  // ─── Regenerated ─────────────────────────────────────────────
  | 'viscose'           // Viscose Rayon
  | 'modal'             // Modal
  | 'micro_modal'       // Micro-Modal
  | 'tencel'            // Lyocell / Tencel
  | 'acetate'           // Cellulose Acetate
  | 'triacetate'        // Cellulose Triacetate
  // ─── Synthetic Polymer ────────────────────────────────────────
  | 'polyester'         // PET Polyester (generic)
  | 'polyester_pet'     // Polyester PET
  | 'polyester_pbt'     // Polyester PBT
  | 'polyester_ptt'     // Polyester PTT (Sorona)
  | 'nylon'             // Nylon (generic)
  | 'nylon_6'           // Nylon 6
  | 'nylon_66'          // Nylon 6,6
  | 'acrylic'           // Acrylic
  | 'polypropylene'     // Polypropylene
  | 'lycra'             // Spandex / Lycra
  // ─── High-Performance / Industrial ───────────────────────────
  | 'para_aramid'       // Para-Aramid (Kevlar)
  | 'meta_aramid'       // Meta-Aramid (Nomex)
  | 'pps'               // Polyphenylene Sulfide
  | 'ptfe'              // PTFE
  | 'pbi'               // Polybenzimidazole
  | 'pbo'               // PBO / Zylon
  | 'carbon_pan'        // Carbon Fibre (PAN)
  | 'e_glass'           // E-Glass
  // ─── Specialty ────────────────────────────────────────────────
  | 'zari'              // Zari / Metallic
  // ─── Blends ───────────────────────────────────────────────────
  | 'pc_blend'          // Polyester/Cotton Blend
  | 'pv_blend'          // Polyester/Viscose Blend
  | 'wool_acrylic'      // Wool/Acrylic Blend
  | 'cotton_linen'      // Cotton/Linen Blend
  | 'other'             // Other / Custom
export type Luster = 'bright' | 'semi_dull' | 'dope_dyed' | 'matt' | 'trilobal'
export type YarnRole = 'warp' | 'weft_a' | 'weft_b' | 'weft_c'
export type MachineType = 'air_jet' | 'rapier' | 'water_jet' | 'power_loom' | 'projectile'
export type DobbyType = 'mechanical' | 'staubli' | 'grosse' | 'picanol' | 'other'
export type ExportFormat = '.EP' | '.JC5' | '.DES' | '.WEA' | 'text'
export type DraftType = 'straight' | 'pointed' | 'skip' | 'broken'
export type BorderWeaveType = 'plain' | 'hopsack' | 'custom'
export type FactoryType = 'mechanical' | 'electronic' | 'jacquard'
export type WeaveType = 'plain' | 'twill' | 'satin' | 'basket' | 'rib' | 'leno' | 'dobby' | 'jacquard'

// ─── Yarn Physical Properties ──────────────────────────────────────────────
export interface YarnProperties {
  shrinkage_min_pct: number      // e.g. 3.5
  shrinkage_max_pct: number      // e.g. 5.0
  tensile_strength_cn: number    // cN (centi-Newtons), e.g. 400
  elongation_pct: number         // Elongation at break %, e.g. 25
  elasticity_pct: number         // Elastic recovery %, e.g. 90
  moisture_regain_pct: number    // e.g. 0.4 for polyester, 11 for viscose
  dye_affinity: 'excellent' | 'good' | 'moderate' | 'poor'
  twist_per_inch: number         // TPI, e.g. 12
  twist_direction: 'S' | 'Z'    // S or Z twist
  uster_cv_pct: number           // Evenness coefficient of variation %
}

// ─── Nozzle Configuration ──────────────────────────────────────────────────
export interface NozzleConfig {
  nozzle_count: number           // How many physical nozzles this yarn uses
  sequence: number[]             // Repeating sequence of nozzle IDs, e.g. [1,2,3,1,2,3]
  repeat_mode: 'cyclic' | 'patterned' // Cyclic repeats the sequence, Patterned allows per-pick control
  pressure_bar: number           // Air pressure (bar) for air-jet looms
  arrival_timing_deg: number     // Arrival timing in degrees (0-360)
  release_timing_deg: number     // Release timing in degrees
}

// ─── Weft Yarn Entry (N weft yarns, no limit) ─────────────────────────────
export interface WeftYarn {
  id: string                     // Unique identifier (uuid)
  label: string                  // User-facing label, e.g. "Yarn A", "Ground", "Border Zari"
  material: Material
  count_system: CountSystem
  count_value: number            // e.g. 75 (denier), 40 (Ne)
  filament_count: number | null  // For filament yarns
  luster: Luster
  colour_code: string            // Pantone/RAL or descriptive
  colour_hex: string             // Hex colour for UI rendering, e.g. "#1B1F3B"
  ppi: number                    // Picks per inch for this yarn
  cramming: boolean              // Whether cramming is applied
  properties: YarnProperties
  nozzle_config: NozzleConfig
  notes: string                  // Custom notes / supplier info
  is_active: boolean             // Enable/disable without deleting
  sort_order: number             // Display ordering
  price_per_kg: number           // e.g. 180 (INR/USD per kg)
}

// ─── Warp Yarn Entry (N warp yarns for multi-warp) ────────────────────
export interface WarpYarn {
  id: string
  label: string
  material: Material
  count_system: CountSystem
  count_value: number
  filament_count: number | null
  luster: Luster
  colour_code: string
  colour_hex: string
  epi_share: number              // This yarn's share of total EPI (e.g. 60 out of 120)
  properties: YarnProperties
  notes: string
  is_active: boolean
  sort_order: number
  price_per_kg: number
}

// ─── Warp System (top-level container for multi-warp) ──────────────────
export interface WarpSystem {
  mode: 'simple' | 'advanced'    // Simple = 1 yarn, Advanced = N yarns
  yarns: WarpYarn[]
}

// ─── Insertion Sequence (how picks repeat across yarns) ────────────────────
// Defines the master repeating pattern of yarn usage per pick
// e.g. ["yarn_a","yarn_a","yarn_b","yarn_a","yarn_a","yarn_b"] = 2A 1B repeat
export interface InsertionSequence {
  pattern: string[]              // Array of WeftYarn IDs in pick order
  repeat_length: number          // Auto-computed from pattern.length
}

// ─── Weft System (top-level container) ─────────────────────────────────────
export interface WeftSystem {
  mode: 'simple' | 'advanced'    // Simple = 1 yarn, Advanced = N yarns
  yarns: WeftYarn[]              // Dynamic array, no limit
  insertion_sequence: InsertionSequence
  total_nozzles_available: number  // Physical nozzles on the loom (e.g. 4, 6, 8)
}

// ─── Legacy YarnSpec (kept for backward compatibility with warp) ────────────
export interface YarnSpec {
  id?: string
  design_id?: string
  role: YarnRole
  material: Material
  count_system: CountSystem
  count_value: number
  filament_count?: number | null
  luster: Luster
  colour_code: string
  colour_hex?: string
  group_label?: string
  ppi?: number
  cramming?: boolean
  sequence_pattern?: string
  price_per_kg?: number          // Cost info for budget calc
}

export interface LoomSpec {
  id?: string
  design_id?: string
  machine_type: MachineType
  dobby_type: DobbyType
  export_format: ExportFormat
  reed_count_stockport: number
  ends_per_dent: number
  target_ppi: number
  machine_rpm: number
  cloth_width_inches: number
  warp_crimp_pct: number
  weft_crimp_pct: number
  wastage_pct: number
  loom_efficiency_pct: number
  weave_type: WeaveType
  loom_tension_cN: number
  sv1_psi?: number
  sv2_psi?: number
  sv3_psi?: number
  sv4_psi?: number
  sv5_psi?: number
}

export interface Design {
  id: string
  draft_id: string
  user_id: string
  design_number: string
  design_name: string
  quality_name: string
  customer_ref: string
  weave_matrix: number[][]
  peg_plan_text: string
  peg_plan_matrix: number[][]
  lifting_plan_matrix: number[][]
  repeat_w: number
  repeat_h: number
  version: number
  created_at: string
}

export interface Draft {
  id: string
  user_id: string
  name: string
  shaft_count: number
  draft_type: DraftType
  threading_sequence: number[]
  tie_up_matrix: number[][]
  created_at: string
}

export interface SimulationOutputs {
  shrinkage_pct: number
  drape_index: number
  stiffness_index: number
  strength_n_per_cm: number
  cover_factor: number
  dimensional_stability: number
  softness: number
  handle_score: number
  archetype: string
  archetype_description: string
  formulas: {
    shrinkage: string
    drape: string
    stiffness: string
    strength: string
  }
  warp_contribution: {
    material: string
    shrink_base: number
    drape_base: number
    stiff_base: number
    tenacity_base: number
  }
  weft_contributions: Array<{
    yarn_label: string
    material: string
    weight_fraction: number
    shrink_base: number
    drape_base: number
    stiff_base: number
    tenacity_base: number
  }>
  alerts: Array<{
    severity: 'ok' | 'warn' | 'danger' | 'info'
    trigger: string
    message: string
    fix: string
  }>
}

export interface CalcOutputs {
  epi: number
  reed_space_inches: number
  total_warp_ends: number
  gsm: number
  linear_meter_weight_g: number
  oz_per_sq_yard: number
  warp_weight_per_100m_g: number
  weft_weight_per_100m_g: number
  production_m_per_hr: number
  warp_consumed_m_per_hr: number
  // Extended for multi-yarn
  per_yarn_weft_weights?: Record<string, number>  // yarn_id → g/100m
  effective_ppi?: number                           // Weighted PPI across all active yarns
  total_nozzles_in_use?: number
  // Costing
  cost_per_meter: number
  warp_cost_pct: number
  weft_cost_pct: number
  // ─── Fabric Simulation Outputs ────────────────────────────────────
  simulation?: SimulationOutputs
}

export interface UserProfile {
  id: string
  name: string
  factory_name: string
  factory_type: FactoryType
  city: string
  created_at: string
}

export interface BorderDesign {
  id?: string
  design_id?: string
  border_present: boolean
  border_width_cm: number
  border_shaft_numbers: number[]
  border_weave_type: BorderWeaveType
  border_peg_plan_text: string
  border_peg_plan_matrix: number[][]
  border_weft_group: string
  leno_selvedge: boolean
  selvedge_bit_s9: boolean
  selvedge_bit_s10: boolean
}

// ─── Factory Defaults ─────────────────────────────────────────────────────

export const DEFAULT_YARN_PROPERTIES: YarnProperties = {
  shrinkage_min_pct: 3.5,
  shrinkage_max_pct: 5.0,
  tensile_strength_cn: 400,
  elongation_pct: 25,
  elasticity_pct: 90,
  moisture_regain_pct: 0.4,
  dye_affinity: 'good',
  twist_per_inch: 0,
  twist_direction: 'Z',
  uster_cv_pct: 1.5,
}

export const DEFAULT_NOZZLE_CONFIG: NozzleConfig = {
  nozzle_count: 1,
  sequence: [1],
  repeat_mode: 'cyclic',
  pressure_bar: 3.5,
  arrival_timing_deg: 230,
  release_timing_deg: 70,
}

export function createDefaultWeftYarn(index: number): WeftYarn {
  const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const colours = ['#E8A838', '#1B1F3B', '#D44B4B', '#4BA86D', '#7B61FF', '#FF6B9D', '#00B4D8', '#FF8C42']
  return {
    id: `weft_${Date.now()}_${index}`,
    label: `Yarn ${labels[index] || String(index + 1)}`,
    material: index === 0 ? 'polyester' : 'viscose',
    count_system: index === 0 ? 'denier' : 'ne',
    count_value: index === 0 ? 75 : 40,
    filament_count: index === 0 ? 36 : null,
    luster: 'bright',
    colour_code: '',
    colour_hex: colours[index % colours.length],
    ppi: 60,
    cramming: false,
    properties: { ...DEFAULT_YARN_PROPERTIES },
    nozzle_config: {
      ...DEFAULT_NOZZLE_CONFIG,
      sequence: [index + 1],
      nozzle_count: 1,
      repeat_mode: 'cyclic',
    },
    notes: '',
    is_active: true,
    sort_order: index,
    price_per_kg: 200, // Default cost estimate
  }
}

export function createDefaultWarpYarn(index: number): WarpYarn {
  const labels = ['Warp 1', 'Warp 2', 'Warp 3', 'Warp 4']
  const colours = ['#1B1F3B', '#4A5078', '#7B61FF', '#2A6B4E']
  return {
    id: `warp_${Date.now()}_${index}`,
    label: labels[index] || `Warp ${index + 1}`,
    material: 'polyester',
    count_system: 'denier',
    count_value: 75,
    filament_count: 36,
    luster: 'bright',
    colour_code: '',
    colour_hex: colours[index % colours.length],
    epi_share: 60,
    properties: { ...DEFAULT_YARN_PROPERTIES },
    notes: '',
    is_active: true,
    sort_order: index,
    price_per_kg: 200,
  }
}
