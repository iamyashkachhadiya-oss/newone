// ─── Fabric Output Simulation Engine ────────────────────────────────────
// Computes shrinkage, drape, stiffness, and strength from material + process inputs
// Based on textile engineering formulas with multi-yarn weighted blending

import type { Material, WeftSystem, YarnSpec, LoomSpec, WeftYarn } from '@/lib/types'
import { MATERIAL_PHYSICS, WEAVE_MODIFIERS, type MaterialPhysics, type WeaveModifier } from './materials'
import { denierToNe } from './engine'

// ─── Types ──────────────────────────────────────────────────────────────

export type WeaveType = 'plain' | 'twill' | 'satin' | 'basket' | 'rib' | 'leno' | 'dobby' | 'jacquard'

export interface SimulationInputs {
  warpMaterials: Material[]         // All warp yarn materials (for multi-warp blend)
  warpNe: number                    // Effective warp Ne (weighted average if multi-warp)
  weftSystem: WeftSystem
  weaveType: WeaveType
  densityPicksPerCm: number         // Picks per cm (PPI / 2.54)
  loomTensionCN: number             // Loom tension in centi-Newtons
  loom: LoomSpec
}

export interface SimulationOutputs {
  shrinkage_pct: number              // Fabric shrinkage %
  drape_index: number                // 0–100 drape index
  stiffness_index: number            // 0–100 stiffness index
  strength_n_per_cm: number          // Fabric strength N/cm
  cover_factor: number               // 0–1 cover factor
  
  // Radar scores (normalized 0–100)
  dimensional_stability: number
  softness: number
  handle_score: number
  
  // Fabric archetype
  archetype: string
  archetype_description: string
  
  // Breakdown formulas (human-readable)
  formulas: {
    shrinkage: string
    drape: string
    stiffness: string
    strength: string
  }
  
  // Per-component contributions
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
  
  // Engineering alerts
  alerts: SimulationAlert[]
}

export interface SimulationAlert {
  severity: 'ok' | 'warn' | 'danger' | 'info'
  trigger: string
  message: string
  fix: string
}

// ─── Utility Functions ──────────────────────────────────────────────────

function clamp(v: number, mn: number, mx: number): number {
  return Math.min(mx, Math.max(mn, v))
}

function norm(v: number, mn: number, mx: number): number {
  return clamp((v - mn) / (mx - mn), 0, 1)
}

/** Get the Ne value from a weft yarn */
function getNeFromWeftYarn(yarn: WeftYarn): number {
  if (yarn.count_system === 'ne') return yarn.count_value
  return denierToNe(yarn.count_value)
}

/** Compute weighted material properties across multiple weft yarns */
function blendWeftMaterials(
  weftSystem: WeftSystem
): MaterialPhysics {
  const activeYarns = weftSystem.yarns.filter(y => y.is_active)
  if (activeYarns.length === 0) return MATERIAL_PHYSICS.polyester

  // In simple mode or no insertion sequence, equal weight to all active yarns
  let weights: Map<string, number> = new Map()
  
  if (weftSystem.mode === 'advanced' && weftSystem.insertion_sequence.pattern.length > 0) {
    const pattern = weftSystem.insertion_sequence.pattern
    const total = pattern.length
    activeYarns.forEach(y => {
      const count = pattern.filter(id => id === y.id).length
      weights.set(y.id, count / total)
    })
  } else {
    const equalWeight = 1 / activeYarns.length
    activeYarns.forEach(y => weights.set(y.id, equalWeight))
  }

  // Blend properties
  let shrink = 0, drape = 0, stiff = 0, tenacity = 0, moisture = 0, elongation = 0
  let hasFelting = false

  activeYarns.forEach(y => {
    const mat = MATERIAL_PHYSICS[y.material] || MATERIAL_PHYSICS.other
    const w = weights.get(y.id) || 0
    shrink += mat.shrink_base * w
    drape += mat.drape_base * w
    stiff += mat.stiff_base * w
    tenacity += mat.tenacity_base * w
    moisture += mat.moisture_regain_pct * w
    elongation += mat.elongation_pct * w
    if (mat.felting) hasFelting = true
  })

  return {
    name: activeYarns.length === 1 
      ? (MATERIAL_PHYSICS[activeYarns[0].material] || MATERIAL_PHYSICS.other).name
      : `Blended (${activeYarns.length} yarns)`,
    category: 'Blend',
    shrink_base: shrink,
    drape_base: drape,
    stiff_base: stiff,
    tenacity_base: tenacity,
    moisture_regain_pct: moisture,
    elongation_pct: elongation,
    felting: hasFelting,
  }
}

// ─── Main Simulation Engine ─────────────────────────────────────────────

export function runFabricSimulation(inputs: SimulationInputs): SimulationOutputs {
  const { warpMaterials, warpNe, weftSystem, weaveType, densityPicksPerCm, loomTensionCN, loom } = inputs
  
  // Get weave modifier
  const weave: WeaveModifier = WEAVE_MODIFIERS[weaveType] || WEAVE_MODIFIERS.plain
  
  // --- WARP material blend ---
  const warpPhysics = blendWarpMaterials(warpMaterials)
  
  // --- WEFT material blend (weighted by insertion sequence) ---
  const weftPhysics = blendWeftMaterials(weftSystem)
  
  // --- COMBINED fabric physics (50/50 warp/weft blend for overall fabric) ---
  const fabricShrinkBase = (warpPhysics.shrink_base + weftPhysics.shrink_base) / 2
  const fabricDrapeBase = (warpPhysics.drape_base + weftPhysics.drape_base) / 2
  const fabricStiffBase = (warpPhysics.stiff_base + weftPhysics.stiff_base) / 2
  const fabricTenacityBase = (warpPhysics.tenacity_base + weftPhysics.tenacity_base) / 2
  const fabricMoisture = (warpPhysics.moisture_regain_pct + weftPhysics.moisture_regain_pct) / 2
  const fabricElongation = (warpPhysics.elongation_pct + weftPhysics.elongation_pct) / 2
  const hasFelting = warpPhysics.felting || weftPhysics.felting
  
  // --- EFFECTIVE Ne (use warp Ne as primary, weft Ne as secondary contribution) ---
  const activeWeftYarns = weftSystem.yarns.filter(y => y.is_active)
  const avgWeftNe = activeWeftYarns.length > 0
    ? activeWeftYarns.reduce((sum, y) => sum + getNeFromWeftYarn(y), 0) / activeWeftYarns.length
    : 40
  const effectiveNe = (warpNe + avgWeftNe) / 2
  
  // --- NORMALIZE process parameters ---
  const densityNorm = norm(densityPicksPerCm, 3, 24)  // 3–24 picks/cm ≈ 8–60 picks/inch
  const tensionNorm = norm(loomTensionCN, 40, 400)
  const yarnDiamFactor = 1 / Math.sqrt(effectiveNe / 30)
  
  // ═══════════════════════════════════════════════════════════════════════
  // SHRINKAGE CALCULATION
  // S% = S_base × (1 + regain/100 × 1.8) × crimp_factor × (1 + density_norm × 0.25) × (1 + tension_norm × 0.6)
  // ═══════════════════════════════════════════════════════════════════════
  const crimpFactor = weave.crimp * (1 - tensionNorm * 0.35)
  const moistureFactor = 1 + (fabricMoisture / 100) * 1.8
  const tensionRelief = 1 + tensionNorm * 0.6
  const densityShrink = 1 + densityNorm * 0.25
  
  let shrinkage = fabricShrinkBase * moistureFactor * crimpFactor * densityShrink * tensionRelief
  if (hasFelting) shrinkage *= 1 + (fabricMoisture / 100) * 2.0
  shrinkage = clamp(parseFloat(shrinkage.toFixed(1)), 0, 35)
  
  // ═══════════════════════════════════════════════════════════════════════
  // DRAPE CALCULATION
  // D = D_base × weave_drape_mod × (1 − density_norm×0.55)^0.4 × ln(Ne/10)/ln(12) × (1 − tension_norm×0.22)
  // ═══════════════════════════════════════════════════════════════════════
  const finenessBoost = clamp(Math.log(effectiveNe / 10) / Math.log(12), 0.6, 1.4)
  const densityDrape = Math.pow(1 - densityNorm * 0.55, 0.4)
  const tensionPenalty = tensionNorm * 0.22
  
  let drape = fabricDrapeBase * weave.drape_mod * densityDrape * finenessBoost * (1 - tensionPenalty)
  drape = clamp(Math.round(drape), 0, 100)
  
  // ═══════════════════════════════════════════════════════════════════════
  // STIFFNESS CALCULATION
  // ST = ST_base × weave_stiff_mod × density_norm^0.6 × (30/Ne) × (1 + tension_norm×0.35)
  // ═══════════════════════════════════════════════════════════════════════
  const coarsenessFactor = clamp(30 / effectiveNe, 0.4, 2.5)
  const densityStiff = Math.pow(densityNorm, 0.6) * 0.8 + 0.2
  const tensionBoost = 1 + tensionNorm * 0.35
  
  let stiffness = fabricStiffBase * weave.stiff_mod * densityStiff * coarsenessFactor * tensionBoost
  stiffness = clamp(Math.round(stiffness), 0, 100)
  
  // ═══════════════════════════════════════════════════════════════════════
  // STRENGTH CALCULATION
  // FS [N/cm] = (T_fiber × density/24 × weave_str_mod × cover_factor × (1+elong/200)) / (Ne/30)^0.45
  // ═══════════════════════════════════════════════════════════════════════
  const coverFactor = clamp(densityNorm * weave.cover_pct * yarnDiamFactor, 0, 1)
  const yarnCountPenalty = Math.pow(effectiveNe / 30, 0.45)
  const elongComp = 1 + clamp(fabricElongation / 200, 0, 0.25)
  const densityContrib = densityPicksPerCm / 10  // normalized to 10 picks/cm baseline
  
  let strength = (fabricTenacityBase * densityContrib * weave.strength_mod * coverFactor * elongComp) / yarnCountPenalty
  strength = clamp(parseFloat(strength.toFixed(1)), 0, 400)
  
  // ═══════════════════════════════════════════════════════════════════════
  // DERIVED SCORES
  // ═══════════════════════════════════════════════════════════════════════
  const dimensional_stability = Math.round((1 - shrinkage / 35) * 100)
  const softness = Math.round((1 - stiffness / 100) * 100)
  const handle_score = Math.round((drape + softness) / 2)
  
  // ─── Archetype Classification ─────────────────────────────────────────
  let archetype = 'standard weave'
  let archetype_description = 'A balanced general-purpose fabric.'
  
  if (drape > 80 && softness > 70) {
    archetype = 'luxury lining'
    archetype_description = 'Exceptionally soft and fluid — ideal for linings, luxury shirting, and evening wear.'
  } else if (strength > 80) {
    archetype = 'technical outerwear'
    archetype_description = 'High-performance strength — suitable for outdoor, workwear, and industrial textiles.'
  } else if (softness > 80 && stiffness < 20) {
    archetype = 'summer shirting'
    archetype_description = 'Ultra-soft hand feel with breathable structure — perfect for summer shirting.'
  } else if (stiffness > 60) {
    archetype = 'home furnishing'
    archetype_description = 'Structured and rigid — well-suited for upholstery, curtains, and furnishing applications.'
  } else if (drape > 60 && strength > 50) {
    archetype = 'premium suiting'
    archetype_description = 'Balanced drape and durability — ideal for tailored suiting and formal wear.'
  } else if (effectiveNe > 80 && densityPicksPerCm > 18) {
    archetype = 'fine filtration'
    archetype_description = 'High-density fine yarn — suitable for medical, filtration, or luxury percale.'
  }
  
  // ─── Formula Strings ──────────────────────────────────────────────────
  const formulas = {
    shrinkage: `${fabricShrinkBase.toFixed(1)} × ${moistureFactor.toFixed(2)} (moisture) × ${crimpFactor.toFixed(2)} (crimp) × ${densityShrink.toFixed(2)} (density) × ${tensionRelief.toFixed(2)} (tension)`,
    drape: `${fabricDrapeBase.toFixed(0)} × ${weave.drape_mod} (${weaveType}) × ${densityDrape.toFixed(2)} (density) × ${finenessBoost.toFixed(2)} (Ne) × ${(1 - tensionPenalty).toFixed(2)} (tension)`,
    stiffness: `${fabricStiffBase.toFixed(0)} × ${weave.stiff_mod} (${weaveType}) × ${densityStiff.toFixed(2)} (density) × ${coarsenessFactor.toFixed(2)} (coarseness) × ${tensionBoost.toFixed(2)} (tension)`,
    strength: `(${fabricTenacityBase.toFixed(0)} × ${densityContrib.toFixed(2)} × ${weave.strength_mod} × ${coverFactor.toFixed(2)}) / ${yarnCountPenalty.toFixed(2)} × ${elongComp.toFixed(2)}`,
  }
  
  // ─── Per-Component Contributions ──────────────────────────────────────
  const warp_contribution = {
    material: warpPhysics.name,
    shrink_base: warpPhysics.shrink_base,
    drape_base: warpPhysics.drape_base,
    stiff_base: warpPhysics.stiff_base,
    tenacity_base: warpPhysics.tenacity_base,
  }
  
  const weft_contributions = activeWeftYarns.map(y => {
    const mat = MATERIAL_PHYSICS[y.material] || MATERIAL_PHYSICS.other
    return {
      yarn_label: y.label,
      material: mat.name,
      weight_fraction: 1 / activeWeftYarns.length,
      shrink_base: mat.shrink_base,
      drape_base: mat.drape_base,
      stiff_base: mat.stiff_base,
      tenacity_base: mat.tenacity_base,
    }
  })
  
  // ─── Engineering Alerts ───────────────────────────────────────────────
  const alerts: SimulationAlert[] = []
  
  if (shrinkage > 8) {
    alerts.push({
      severity: 'warn',
      trigger: `shrinkage ${shrinkage.toFixed(1)}%`,
      message: `High shrinkage ${shrinkage.toFixed(1)}% — pre-shrink or resin finish recommended.`,
      fix: 'Apply sanforization treatment or reduce moisture-sensitive fiber content.',
    })
  }
  
  if (hasFelting && shrinkage > 6) {
    alerts.push({
      severity: 'danger',
      trigger: 'felting risk',
      message: 'Wool felting risk detected. Superwash treatment required.',
      fix: 'Apply Hercosett-125 resin finish or use chlorine-Hercosett process.',
    })
  }
  
  if (loomTensionCN > 300 && fabricElongation < 5) {
    alerts.push({
      severity: 'danger',
      trigger: 'tension/elongation mismatch',
      message: 'CRITICAL: Weft breakage likely — reduce tension below 250 cN.',
      fix: 'De-rate loom accumulator tension or switch to higher-elongation yarn.',
    })
  }
  
  if (loomTensionCN < 80 && densityPicksPerCm > 18) {
    alerts.push({
      severity: 'warn',
      trigger: 'slack tension + high density',
      message: 'Slack tension + high density: beat-up irregularity. Increase tension ≥ 120 cN.',
      fix: 'Increase mechanical brake load on let-off mechanism.',
    })
  }
  
  if (stiffness > 80) {
    alerts.push({
      severity: 'warn',
      trigger: `stiffness ${stiffness}`,
      message: `Stiffness index ${stiffness} — enzymatic softening or density reduction advised.`,
      fix: 'Use cellulase enzyme bath or reduce picks per cm.',
    })
  }
  
  if (strength < 25) {
    alerts.push({
      severity: 'danger',
      trigger: `strength ${strength.toFixed(1)} N/cm`,
      message: `Strength ${strength.toFixed(1)} N/cm below apparel minimum. Increase density or use higher tenacity fiber.`,
      fix: 'Increase picks per cm or blend with polyester for tenacity.',
    })
  }
  
  if (strength > 120) {
    alerts.push({
      severity: 'ok',
      trigger: `strength ${strength.toFixed(1)} N/cm`,
      message: `High-performance strength ${strength.toFixed(1)} N/cm — suitable for technical applications.`,
      fix: 'Maintain current settings. Consider industrial-grade finishing.',
    })
  }
  
  if (effectiveNe > 80 && densityPicksPerCm > 18) {
    alerts.push({
      severity: 'info',
      trigger: 'luxury spec',
      message: 'Luxury configuration — fine shirting or filtration fabric profile.',
      fix: 'Maintain high-precision reed alignment and warp tension uniformity.',
    })
  }
  
  if (alerts.length === 0) {
    alerts.push({
      severity: 'ok',
      trigger: 'normal',
      message: 'All parameters within normal processing range.',
      fix: 'Confirm production settings and proceed.',
    })
  }
  
  return {
    shrinkage_pct: shrinkage,
    drape_index: drape,
    stiffness_index: stiffness,
    strength_n_per_cm: strength,
    cover_factor: coverFactor,
    dimensional_stability,
    softness,
    handle_score,
    archetype,
    archetype_description,
    formulas,
    warp_contribution,
    weft_contributions,
    alerts,
  }
}

// ─── Helper: Blend warp materials ───────────────────────────────────────

function blendWarpMaterials(materials: Material[]): MaterialPhysics {
  if (materials.length === 0) return MATERIAL_PHYSICS.polyester
  if (materials.length === 1) return MATERIAL_PHYSICS[materials[0]] || MATERIAL_PHYSICS.other
  
  const equalWeight = 1 / materials.length
  let shrink = 0, drape = 0, stiff = 0, tenacity = 0, moisture = 0, elongation = 0
  let hasFelting = false
  
  materials.forEach(m => {
    const mat = MATERIAL_PHYSICS[m] || MATERIAL_PHYSICS.other
    shrink += mat.shrink_base * equalWeight
    drape += mat.drape_base * equalWeight
    stiff += mat.stiff_base * equalWeight
    tenacity += mat.tenacity_base * equalWeight
    moisture += mat.moisture_regain_pct * equalWeight
    elongation += mat.elongation_pct * equalWeight
    if (mat.felting) hasFelting = true
  })
  
  return {
    name: materials.length === 1
      ? (MATERIAL_PHYSICS[materials[0]] || MATERIAL_PHYSICS.other).name
      : `Blended Warp (${materials.length} types)`,
    category: 'Blend',
    shrink_base: shrink,
    drape_base: drape,
    stiff_base: stiff,
    tenacity_base: tenacity,
    moisture_regain_pct: moisture,
    elongation_pct: elongation,
    felting: hasFelting,
  }
}
