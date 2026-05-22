import type { WeftYarn, WeftSystem, YarnSpec, LoomSpec, CalcOutputs } from '@/lib/types'

export interface AnalysisInput {
  material: {
    id: string
    name: string
    category: string
    tenacity_cntex: { min: number; max: number }
    elongation_pct: { min: number; max: number }
    moisture_regain_pct: number
    shrinkage_base_pct: number
    drape_base: number
    stiffness_base: number
  }
  weave_type: string
  density_picks_per_cm: number
  loom_tension_cN: number
  yarn_count_Ne: number
  current_outputs: {
    shrinkage_pct: number
    drape_index: number
    stiffness_index: number
    strength_Ncm: number
  }
}

export interface SimulationAnalysis {
  yarn_count_analysis: { assessment: string; optimal_Ne_range: [number, number]; flags: string[] }
  fabric_profile: { archetype: string; scores: { dimensional_stability: number; drape: number; softness: number; strength: number; handle_score: number }; description: string }
  alerts: Array<{ severity: string; trigger: string; message: string; fix: string }>
  finishing_recommendations: Array<{ treatment: string; delta_shrinkage: string; delta_drape: string; delta_stiffness: string; delta_strength: string }>
  material_substitution: { suggested_material_id: string; reason: string } | null
}

export function runEngineeringAnalysis(input: AnalysisInput): SimulationAnalysis {
  const { current_outputs: raw, material, yarn_count_Ne, loom_tension_cN, density_picks_per_cm } = input

  // 1. Output Profile Radar
  const dimensional_stability = (1 - raw.shrinkage_pct / 35) * 100
  const drape = raw.drape_index
  const softness = (1 - raw.stiffness_index / 100) * 100
  const strength = Math.min(raw.strength_Ncm / 4, 100)
  const handle_score = (drape + softness) / 2

  let archetype = "summer shirting"
  if (drape > 80 && softness > 70) archetype = "luxury lining"
  else if (strength > 80) archetype = "technical outerwear"
  else if (softness > 80 && raw.stiffness_index < 20) archetype = "summer shirting"
  else if (raw.stiffness_index > 60) archetype = "home furnishing"

  // 2. Alerts
  const alerts: any[] = []
  if (raw.shrinkage_pct > 8) alerts.push({ severity: 'warning', trigger: 'shrinkage > 8%', message: 'High shrinkage risk: pre-shrink or resin finish recommended', fix: 'Apply sanforization treatment.' })
  if (material.category === 'Protein' && raw.shrinkage_pct > 6) alerts.push({ severity: 'warning', trigger: 'wool shrinkage > 6%', message: 'Felting risk: Superwash treatment required', fix: 'Add Hercosett-125 resin finish.' })
  if (loom_tension_cN > 300 && material.elongation_pct.max < 5) alerts.push({ severity: 'critical', trigger: 'tension/elongation mismatch', message: 'CRITICAL: Weft breakage likely — reduce tension below 250 cN', fix: 'De-rate loom accumulator tension.' })
  if (loom_tension_cN < 80 && density_picks_per_cm > 45) alerts.push({ severity: 'warning', trigger: 'slack tension', message: 'Slack tension + high density: beat-up irregularity, increase tension ≥ 120 cN', fix: 'Increase mechanical brake load.' })
  if (raw.stiffness_index > 80) alerts.push({ severity: 'warning', trigger: 'stiffness > 80', message: 'High stiffness: enzymatic softening or density reduction advised', fix: 'Use cellulase enzyme bath.' })
  if (raw.strength_Ncm < 30) alerts.push({ severity: 'warning', trigger: 'strength < 30', message: 'Below apparel minimum strength (30 N/cm): increase density or use higher tenacity yarn', fix: 'Increase picks per cm (PPI).' })
  if (yarn_count_Ne > 80 && density_picks_per_cm > 45) alerts.push({ severity: 'info', trigger: 'luxury spec', message: 'Luxury configuration detected: suitable for fine shirting or filtration', fix: 'Maintain high-precision reed alignment.' })
  
  if (alerts.length === 0) {
    alerts.push({ severity: 'info', trigger: 'normal', message: 'All parameters within normal range', fix: 'Confirm production settings.' })
  }

  // 3. Yarn Count Analysis
  let assessment = `${yarn_count_Ne} Ne is a standard count for ${material.name}.`
  if (yarn_count_Ne > 80 && material.category === 'Bast') {
    assessment = `High breakage risk: Ne ${yarn_count_Ne} is too fine for coarse bast fibers.`
  }

  // 4. Finishing
  const finishing = [
    { treatment: "Sanforization", delta_shrinkage: "-1.5%", delta_drape: "no change", delta_stiffness: "+2 index points", delta_strength: "no change" },
    { treatment: "Bio-polishing (Cellulase)", delta_shrinkage: "-0.2%", delta_drape: "+4", delta_stiffness: "-6", delta_strength: "-5%" }
  ]

  return {
    yarn_count_analysis: {
      assessment,
      optimal_Ne_range: [40, 100],
      flags: []
    },
    fabric_profile: {
      archetype,
      scores: {
        dimensional_stability: Math.round(dimensional_stability * 10) / 10,
        drape,
        softness: Math.round(softness * 10) / 10,
        strength: Math.round(strength * 10) / 10,
        handle_score: Math.round(handle_score * 10) / 10
      },
      description: `A ${archetype} profile balanced for ${softness > 70 ? 'softness' : 'durability'}.`
    },
    alerts,
    finishing_recommendations: finishing,
    material_substitution: raw.strength_Ncm < 30 ? { suggested_material_id: 'polyester-pet', reason: 'To achieve industrial grade strength > 30 N/cm.' } : null
  }
}
