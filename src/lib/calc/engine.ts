import type { LoomSpec, YarnSpec, CalcOutputs, WeftSystem, WeftYarn } from '@/lib/types'

// ─── Individual Formulas ─────────────────────────────────────────────────

/**
 * EPI = (Reed Count [Stockport] × Ends per Dent) / 2
 * Example: Reed 60s Stockport, 2 ends per dent → EPI = (60 × 2) / 2 = 60
 */
export function calcEPI(reedCountStockport: number, endsPerDent: number): number {
  return (reedCountStockport * endsPerDent) / 2
}

/**
 * Reed Space (inches) = Cloth Width × (100 + Weft Crimp%) / 100
 */
export function calcReedSpace(clothWidthInches: number, weftCrimpPct: number): number {
  return clothWidthInches * (100 + weftCrimpPct) / 100
}

/**
 * Total Warp Ends = EPI × Cloth Width (inches)
 */
export function calcTotalEnds(epi: number, clothWidthInches: number): number {
  return Math.round(epi * clothWidthInches)
}

/**
 * Convert Denier to Ne equivalent: Ne = 5315 / Denier
 */
export function denierToNe(denier: number): number {
  if (denier <= 0) return 0
  return 5315 / denier
}

/**
 * Get Ne value from a yarn spec — auto-converts if denier
 */
export function getNeFromYarn(yarn: YarnSpec): number {
  if (yarn.count_system === 'ne') return yarn.count_value
  return denierToNe(yarn.count_value)
}

/**
 * GSM [Ne] = (EPI/Warp Ne + PPI/Weft Ne) × (100 + Crimp%) × 0.2327
 */
export function calcGSM(
  epi: number,
  ppi: number,
  warpNe: number,
  weftNe: number,
  crimpPct: number
): number {
  if (warpNe <= 0 || weftNe <= 0) return 0
  return (epi / warpNe + ppi / weftNe) * (100 + crimpPct) * 0.2327
}

/**
 * Linear Meter Weight (g) = GSM × Fabric Width (meters)
 * Width (meters) = Width (inches) / 39.37
 */
export function calcLinearWeight(gsm: number, widthInches: number): number {
  return gsm * (widthInches / 39.37)
}

/**
 * oz/yd² = GSM × 0.0295
 */
export function calcOzPerSqYard(gsm: number): number {
  return gsm * 0.0295
}

/**
 * Warp Weight (g/100m) [Denier] = (Total Ends × Denier × 100) / 9000 × Crimp Factor × Wastage Factor
 * Crimp Factor = (100 + Crimp%) / 100
 * Wastage Factor = (100 + Wastage%) / 100
 */
export function calcWarpWeightDenier(
  totalEnds: number,
  denier: number,
  crimpPct: number,
  wastagePct: number
): number {
  const crimpFactor = (100 + crimpPct) / 100
  const wastageFactor = (100 + wastagePct) / 100
  return (totalEnds * denier * 100) / 9000 * crimpFactor * wastageFactor
}

/**
 * Weft Weight (g/100m) [Denier] = (Reed Space [in] × Denier × PPI × 100) / 9000 × Crimp × Wastage
 */
export function calcWeftWeightDenier(
  reedSpaceInches: number,
  denier: number,
  ppi: number,
  crimpPct: number,
  wastagePct: number
): number {
  const crimpFactor = (100 + crimpPct) / 100
  const wastageFactor = (100 + wastagePct) / 100
  return (reedSpaceInches * denier * ppi * 100) / 9000 * crimpFactor * wastageFactor
}

/**
 * Production (m/hr) = (RPM × 60) / (PPI × 39.37)
 * Actual Production = Theoretical × Efficiency%
 */
export function calcProduction(rpm: number, ppi: number, efficiencyPct: number): number {
  if (ppi <= 0) return 0
  const theoretical = (rpm * 60) / (ppi * 39.37)
  return theoretical * (efficiencyPct / 100)
}

/**
 * Warp Consumed (m/hr) = Cloth Production × (100 + Crimp%) / 100
 */
export function calcWarpConsumed(productionMPerHr: number, crimpPct: number): number {
  return productionMPerHr * (100 + crimpPct) / 100
}

// ─── Run All Calculations ────────────────────────────────────────────────

export function runAllCalculations(
  loom: LoomSpec,
  warp: YarnSpec,
  weftSystem: WeftSystem,
  pegPlanMatrix?: number[][],
  rowYarnMap?: Record<number, string>,
  cellYarnMap?: Record<string, string>,
  draftSequence?: number[]
): CalcOutputs {
  const epi = calcEPI(loom.reed_count_stockport, loom.ends_per_dent)
  const reedSpace = calcReedSpace(loom.cloth_width_inches, loom.weft_crimp_pct)
  const totalEnds = calcTotalEnds(epi, loom.cloth_width_inches)

  const warpNe = getNeFromYarn(warp)
  const masterPPI = loom.target_ppi

  // For multi-yarn weft, we need to calculate weighted averages or sum individual weights
  let totalWeftGSM = 0
  let totalWeftWeight100m = 0
  const perYarnWeftWeights: Record<string, number> = {}

  const activeYarns = weftSystem.yarns.filter(y => y.is_active)
  
  if (weftSystem.mode === 'simple' && activeYarns.length > 0) {
    // Simple mode: use the first active yarn for all nozzles
    const yarn = activeYarns[0]
    const weftNe = yarn.count_system === 'ne' ? yarn.count_value : denierToNe(yarn.count_value)
    totalWeftGSM = (masterPPI / weftNe) * (100 + loom.weft_crimp_pct) * 0.2327
    
    const denier = yarn.count_system === 'denier' ? yarn.count_value : 5315 / yarn.count_value
    totalWeftWeight100m = calcWeftWeightDenier(reedSpace, denier, masterPPI, loom.weft_crimp_pct, loom.wastage_pct)
    perYarnWeftWeights[yarn.id] = totalWeftWeight100m
  } else if (weftSystem.mode === 'advanced') {
    // Advanced mode: Use the visual peg plan if available to calculate accurate yarn usage per-pick
    let totalPicksInRepeat = 0
    const yarnOccurrences: Record<string, number> = {}

    // Prefer peg plan exact painting (supports cramming where single row = multiple picks)
    if (pegPlanMatrix && pegPlanMatrix.length > 0 && rowYarnMap) {
      pegPlanMatrix.forEach((_, r) => {
        const uniqueYarnsInRow = new Set<string>()
        
        if (rowYarnMap[r]) {
          uniqueYarnsInRow.add(rowYarnMap[r])
        }
        
        // Scan for explicitly painted cells which insert additional threads into the same shed
        const cols = pegPlanMatrix[0].length
        for (let c = 0; c < cols; c++) {
          const shaftIndex = draftSequence ? (draftSequence[c] ?? 1) - 1 : c
          const mappedKey = `${r}_${draftSequence ? shaftIndex : c}`
          if (cellYarnMap && cellYarnMap[`${r}_${c}`]) uniqueYarnsInRow.add(cellYarnMap[`${r}_${c}`])
          if (cellYarnMap && cellYarnMap[mappedKey]) uniqueYarnsInRow.add(cellYarnMap[mappedKey])
        }
        
        // If row is entirely blank in map, it defaults to the first yarn
        if (uniqueYarnsInRow.size === 0 && activeYarns.length > 0) {
          uniqueYarnsInRow.add(activeYarns[0].id)
        }
        
        // Count each unique thread inserted on this line as a physical pick
        uniqueYarnsInRow.forEach(y => {
          yarnOccurrences[y] = (yarnOccurrences[y] || 0) + 1
          totalPicksInRepeat++
        })
      })
    } 
    
    // Fallback to insertion sequence if unpainted
    if (totalPicksInRepeat === 0 && weftSystem.insertion_sequence.pattern.length > 0) {
      const pattern = weftSystem.insertion_sequence.pattern
      totalPicksInRepeat = pattern.length
      activeYarns.forEach(y => {
        yarnOccurrences[y.id] = pattern.filter(id => id === y.id).length
      })
    }

    if (totalPicksInRepeat > 0) {
      activeYarns.forEach(yarn => {
        const occurrences = yarnOccurrences[yarn.id] || 0
        if (occurrences > 0) {
          // Weighted PPI for this specific yarn
          const yarnPPI = (occurrences / totalPicksInRepeat) * masterPPI
          const yarnNe = yarn.count_system === 'ne' ? yarn.count_value : denierToNe(yarn.count_value)
          
          const yarnGSM = (yarnPPI / yarnNe) * (100 + loom.weft_crimp_pct) * 0.2327
          totalWeftGSM += yarnGSM
          
          const yarnDenier = yarn.count_system === 'denier' ? yarn.count_value : 5315 / yarn.count_value
          const yarnWeight = calcWeftWeightDenier(reedSpace, yarnDenier, yarnPPI, loom.weft_crimp_pct, loom.wastage_pct)
          
          totalWeftWeight100m += yarnWeight
          perYarnWeftWeights[yarn.id] = Math.round(yarnWeight * 100) / 100
        }
      })
    }
  }

  const warpGSM = (epi / warpNe) * (100 + loom.warp_crimp_pct) * 0.2327
  const gsm = warpGSM + totalWeftGSM
  
  const linearWeight = calcLinearWeight(gsm, loom.cloth_width_inches)
  const ozPerSqYard = calcOzPerSqYard(gsm)

  const warpDenier = warp.count_system === 'denier' ? warp.count_value : 5315 / warp.count_value
  const warpWeight = calcWarpWeightDenier(totalEnds, warpDenier, loom.warp_crimp_pct, loom.wastage_pct)

  const production = calcProduction(loom.machine_rpm, masterPPI, loom.loom_efficiency_pct)
  const warpConsumed = calcWarpConsumed(production, loom.warp_crimp_pct)

  // Calculate total nozzles in use with safety checks
  const totalNozzlesInUse = new Set(
    activeYarns.flatMap(y => Array.isArray(y.nozzle_config?.sequence) ? y.nozzle_config.sequence : [1])
  ).size

  // --- COSTING ---
  const warpPrice = warp.price_per_kg || 0
  const warpCostPerMeter = (warpWeight * warpPrice) / 100000
  
  let weftCostPerMeter = 0
  activeYarns.forEach(yarn => {
    const yarnWeight100m = perYarnWeftWeights[yarn.id] || 0
    weftCostPerMeter += (yarnWeight100m * yarn.price_per_kg) / 100000
  })

  // Add 15% estimated processing cost base or allow as global?
  const totalCostPerMeter = warpCostPerMeter + weftCostPerMeter
  const warpCostPct = totalCostPerMeter > 0 ? (warpCostPerMeter / totalCostPerMeter) * 100 : 0
  const weftCostPct = totalCostPerMeter > 0 ? (weftCostPerMeter / totalCostPerMeter) * 100 : 0

  return {
    epi: Math.round(epi * 100) / 100,
    reed_space_inches: Math.round(reedSpace * 100) / 100,
    total_warp_ends: totalEnds,
    gsm: Math.round(gsm * 100) / 100,
    linear_meter_weight_g: Math.round(linearWeight * 100) / 100,
    oz_per_sq_yard: Math.round(ozPerSqYard * 1000) / 1000,
    warp_weight_per_100m_g: Math.round(warpWeight * 100) / 100,
    weft_weight_per_100m_g: Math.round(totalWeftWeight100m * 100) / 100,
    production_m_per_hr: Math.round(production * 1000) / 1000,
    warp_consumed_m_per_hr: Math.round(warpConsumed * 1000) / 1000,
    per_yarn_weft_weights: perYarnWeftWeights,
    effective_ppi: masterPPI,
    total_nozzles_in_use: totalNozzlesInUse,
    cost_per_meter: Math.round(totalCostPerMeter * 100) / 100,
    warp_cost_pct: Math.round(warpCostPct),
    weft_cost_pct: Math.round(weftCostPct)
  }
}
