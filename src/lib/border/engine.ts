/**
 * Border Design Engine — Textile CAD
 * Implements: Zone expansion, LCM sync, shaft optimization,
 * lifting plan generation, cross-border switching, and validation.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type WeaveMatrix = number[][] // [picks × ends], 1=raised, 0=lowered

export interface Zone {
  id: string
  weaveMatrix: WeaveMatrix   // Small repeating tile
  widthEnds: number          // How many warp ends this zone occupies
}

export interface CrossBorder {
  id: string
  weaveMatrix: WeaveMatrix
  startPickIndex: number     // When (in global picks) this cross border starts
  lengthPicks: number        // How many picks it lasts
}

export interface BorderDesignInput {
  leftBorder:   Zone | null
  body:         Zone
  rightBorder:  Zone | null
  crossBorders: CrossBorder[]
  maxShafts:    number           // Loom hardware limit (e.g. 16, 24)
  loopBodyPicks: number          // How many body picks to weave before a cross border
}

export interface CompiledBorderOutput {
  totalShaftsUsed: number
  draftArray: number[]           // [totalEnds], each value = shaft index (0-based)
  bodyLiftingPlan: number[][]    // Compact body repeat [bodyRepeatPicks × shafts]
  borderLiftingPlan: number[][]  // Full cross-border sequence if present
  pilotSequence: PilotEntry[]    // When to switch cylinder A ↔ B
  totalEnds: number
  totalPicks: number
  lcmRepeat: number
  warnings: ValidationError[]
}

export interface PilotEntry {
  pick: number
  cylinder: 'A' | 'B'   // A = body, B = cross border
  loops: number          // how many picks in this segment
}

export interface ValidationError {
  code: string
  severity: 'error' | 'warning'
  message: string
}

// ── Utility ────────────────────────────────────────────────────────────────────

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

function lcm(a: number, b: number): number {
  return (a * b) / gcd(a, b)
}

export function computeLCM(values: number[]): number {
  return values.reduce((acc, v) => lcm(acc, v), 1)
}

function transposeMatrix(m: number[][]): number[][] {
  if (!m.length || !m[0].length) return []
  return m[0].map((_, ci) => m.map(row => row[ci]))
}

/** Stable hash of a boolean array → string key */
function hashColumn(col: number[]): string {
  return col.join('')
}

// ── Phase 1: Matrix Expansion (LCM sync) ─────────────────────────────────────

/**
 * Tile a small weave matrix across a target height (picks) and width (ends).
 * Uses modulo arithmetic so the tile repeats seamlessly.
 */
function tileZone(zone: Zone, totalPicks: number): number[][] {
  const tileH = zone.weaveMatrix.length
  const tileW = zone.weaveMatrix[0]?.length || 1
  const result: number[][] = []

  for (let row = 0; row < totalPicks; row++) {
    const srcRow = row % tileH
    const outRow: number[] = []
    for (let col = 0; col < zone.widthEnds; col++) {
      const srcCol = col % tileW
      outRow.push(zone.weaveMatrix[srcRow][srcCol])
    }
    result.push(outRow)
  }
  return result
}

/**
 * Build the full global fabric matrix combining all side zones.
 * Returns [lcmPicks × totalEnds] matrix.
 */
export function expandFabricMatrix(
  leftBorder: Zone | null,
  body: Zone,
  rightBorder: Zone | null,
  lcmRepeat: number
): { globalMatrix: number[][]; zoneOffsets: { left: number; body: number; right: number } } {
  const leftTile  = leftBorder  ? tileZone(leftBorder,  lcmRepeat) : null
  const bodyTile  = tileZone(body, lcmRepeat)
  const rightTile = rightBorder ? tileZone(rightBorder, lcmRepeat) : null

  const globalMatrix: number[][] = []
  for (let row = 0; row < lcmRepeat; row++) {
    const currentRow: number[] = [
      ...(leftTile  ? leftTile[row]  : []),
      ...bodyTile[row],
      ...(rightTile ? rightTile[row] : []),
    ]
    globalMatrix.push(currentRow)
  }

  const zoneOffsets = {
    left: 0,
    body: leftBorder?.widthEnds ?? 0,
    right: (leftBorder?.widthEnds ?? 0) + body.widthEnds,
  }

  return { globalMatrix, zoneOffsets }
}

// ── Phase 2: Shaft Optimization + Draft Generation ────────────────────────────

/**
 * Scan all warp-end columns, hash them, and assign unique shaft indices.
 * Identical columns share a shaft (amalgamated drafting).
 * Throws ValidationError if shaft count exceeds hardware limit.
 */
export function generateOptimizedDraft(
  globalMatrix: number[][],
  maxShafts: number
): { draftArray: number[]; totalShafts: number; shaftColumns: Map<string, number[]> } {
  const transposed = transposeMatrix(globalMatrix)
  const draftArray: number[] = []
  const uniqueShaftMap = new Map<string, number>()
  const shaftColumns = new Map<string, number[]>()
  let shaftCounter = 0

  for (let endIdx = 0; endIdx < transposed.length; endIdx++) {
    const col = transposed[endIdx]
    const key = hashColumn(col)

    if (!uniqueShaftMap.has(key)) {
      if (shaftCounter >= maxShafts) {
        throw {
          code: 'SHAFT_LIMIT_EXCEEDED',
          severity: 'error',
          message: `Hardware limit exceeded: design requires ${shaftCounter + 1}+ shafts but loom only supports ${maxShafts}.`,
        } as ValidationError
      }
      uniqueShaftMap.set(key, shaftCounter)
      shaftColumns.set(key, col)
      shaftCounter++
    }

    draftArray.push(uniqueShaftMap.get(key)!)
  }

  return { draftArray, totalShafts: shaftCounter, shaftColumns }
}

// ── Phase 3: Lifting Plan Generation ─────────────────────────────────────────

/**
 * Convert global matrix + draft array → peg/lifting plan.
 * Each row = one pick, each column = one shaft (1=lift, 0=lower).
 */
export function generateLiftingPlan(
  globalMatrix: number[][],
  draftArray: number[],
  totalShafts: number
): number[][] {
  return globalMatrix.map(pick => {
    const liftRow = new Array(totalShafts).fill(0)
    pick.forEach((cellValue, endIdx) => {
      if (cellValue === 1) {
        const shaftIdx = draftArray[endIdx]
        liftRow[shaftIdx] = 1
      }
    })
    return liftRow
  })
}

// ── Phase 4: Cross-Border Pilot Sequence ─────────────────────────────────────

/**
 * Build the pilot sequence that tells the dobby when to switch
 * from Cylinder A (body) to Cylinder B (cross border) and back.
 */
export function buildPilotSequence(
  crossBorders: CrossBorder[],
  totalPicks: number,
  loopBodyPicks: number
): PilotEntry[] {
  if (!crossBorders.length) return [{ pick: 0, cylinder: 'A', loops: totalPicks }]

  const pilot: PilotEntry[] = []
  let cursor = 0

  // Sort by start pick
  const sorted = [...crossBorders].sort((a, b) => a.startPickIndex - b.startPickIndex)

  for (const cb of sorted) {
    if (cursor < cb.startPickIndex) {
      pilot.push({
        pick: cursor,
        cylinder: 'A',
        loops: cb.startPickIndex - cursor,
      })
    }
    pilot.push({
      pick: cb.startPickIndex,
      cylinder: 'B',
      loops: cb.lengthPicks,
    })
    cursor = cb.startPickIndex + cb.lengthPicks
  }

  if (cursor < totalPicks) {
    pilot.push({ pick: cursor, cylinder: 'A', loops: totalPicks - cursor })
  }

  return pilot
}

// ── Validation Engine ─────────────────────────────────────────────────────────

export interface ValidationInput {
  leftBorder:   Zone | null
  body:         Zone
  rightBorder:  Zone | null
  crossBorders: CrossBorder[]
  maxShafts:    number
  loopBodyPicks: number
  loopType:     'dobby' | 'cam'
}

export function validateDesign(input: ValidationInput): ValidationError[] {
  const errors: ValidationError[] = []
  const { leftBorder, body, rightBorder, crossBorders, maxShafts, loopType } = input

  // 1. CAM loom: max 6-8 shafts, no cross borders
  if (loopType === 'cam') {
    const picks = [
      ...(leftBorder ? [leftBorder.weaveMatrix.length] : []),
      body.weaveMatrix.length,
      ...(rightBorder ? [rightBorder.weaveMatrix.length] : []),
    ]
    const maxPick = Math.max(...picks)
    if (maxPick > 8) {
      errors.push({
        code: 'CAM_REPEAT_TOO_LONG',
        severity: 'error',
        message: `CAM looms support ≤ 8 pick repeat. This design has ${maxPick}-pick repeat.`,
      })
    }
    if (crossBorders.length > 0) {
      errors.push({
        code: 'CAM_NO_CROSS_BORDER',
        severity: 'error',
        message: 'CAM looms cannot execute cross borders (pallu). Use a dobby loom.',
      })
    }
    if (maxShafts > 8) {
      errors.push({
        code: 'CAM_SHAFT_MISMATCH',
        severity: 'warning',
        message: 'CAM looms typically have 4–8 shafts. Check hardware.',
      })
    }
  }

  // 2. LCM explosion check
  const repeatValues = [
    ...(leftBorder ? [leftBorder.weaveMatrix.length] : []),
    body.weaveMatrix.length,
    ...(rightBorder ? [rightBorder.weaveMatrix.length] : []),
  ]
  const lcmVal = computeLCM(repeatValues)
  if (lcmVal > 512) {
    errors.push({
      code: 'LCM_EXPLOSION',
      severity: 'warning',
      message: `LCM of zone repeats = ${lcmVal}. This may be very slow to compute. Consider simplifying zone patterns.`,
    })
  }
  if (lcmVal > 2048) {
    errors.push({
      code: 'LCM_FATAL',
      severity: 'error',
      message: `LCM = ${lcmVal} exceeds maximum (2048). Simplify weave repeats.`,
    })
  }

  // 3. Empty body zone
  if (!body.weaveMatrix.length || !body.weaveMatrix[0]?.length) {
    errors.push({
      code: 'EMPTY_BODY',
      severity: 'error',
      message: 'Body weave matrix cannot be empty.',
    })
  }

  // 4. Zero widthEnds
  if (body.widthEnds <= 0) {
    errors.push({ code: 'ZERO_BODY_WIDTH', severity: 'error', message: 'Body width must be > 0 ends.' })
  }

  // 5. Cross border overlap
  const sorted = [...crossBorders].sort((a, b) => a.startPickIndex - b.startPickIndex)
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]
    if (prev.startPickIndex + prev.lengthPicks > sorted[i].startPickIndex) {
      errors.push({
        code: 'CROSS_BORDER_OVERLAP',
        severity: 'error',
        message: `Cross borders ${i} and ${i + 1} overlap in pick range.`,
      })
    }
  }

  return errors
}

// ── Main Compile Function ─────────────────────────────────────────────────────

export function compileBorderDesign(input: BorderDesignInput): CompiledBorderOutput {
  const { leftBorder, body, rightBorder, crossBorders, maxShafts, loopBodyPicks } = input

  // Calculate LCM of all zone pick repeats
  const repeatValues = [
    ...(leftBorder ? [leftBorder.weaveMatrix.length] : []),
    body.weaveMatrix.length,
    ...(rightBorder ? [rightBorder.weaveMatrix.length] : []),
  ].filter(v => v > 0)

  const lcmRepeat = computeLCM(repeatValues.length ? repeatValues : [1])

  // Total ends
  const totalEnds =
    (leftBorder?.widthEnds ?? 0) +
    body.widthEnds +
    (rightBorder?.widthEnds ?? 0)

  // Expand fabric matrix (side borders only)
  const { globalMatrix } = expandFabricMatrix(leftBorder, body, rightBorder, lcmRepeat)

  // Shaft optimization
  let draftResult: ReturnType<typeof generateOptimizedDraft>
  const warnings: ValidationError[] = []

  try {
    draftResult = generateOptimizedDraft(globalMatrix, maxShafts)
  } catch (e) {
    const err = e as ValidationError
    return {
      totalShaftsUsed: 0,
      draftArray: [],
      bodyLiftingPlan: [],
      borderLiftingPlan: [],
      pilotSequence: [],
      totalEnds,
      totalPicks: lcmRepeat,
      lcmRepeat,
      warnings: [err],
    }
  }

  // Lifting plan for body repeat
  const bodyLiftingPlan = generateLiftingPlan(globalMatrix, draftResult.draftArray, draftResult.totalShafts)

  // Cross border lifting plan (if any)
  let borderLiftingPlan: number[][] = []
  let totalPicks = lcmRepeat

  if (crossBorders.length > 0) {
    const allCBPicks = crossBorders.reduce((sum, cb) => sum + cb.lengthPicks, 0)
    totalPicks = loopBodyPicks + allCBPicks

    borderLiftingPlan = crossBorders.flatMap(cb => {
      // Cross border uses full-width draft (body + borders share shafts)
      const cbExpanded = tileZone(
        { id: cb.id, weaveMatrix: cb.weaveMatrix, widthEnds: totalEnds },
        cb.lengthPicks
      )
      return generateLiftingPlan(cbExpanded, draftResult.draftArray, draftResult.totalShafts)
    })
  }

  // Pilot sequence
  const pilotSequence = buildPilotSequence(crossBorders, totalPicks, loopBodyPicks)

  return {
    totalShaftsUsed: draftResult.totalShafts,
    draftArray: draftResult.draftArray,
    bodyLiftingPlan,
    borderLiftingPlan,
    pilotSequence,
    totalEnds,
    totalPicks,
    lcmRepeat,
    warnings,
  }
}

// ── Built-in Weave Presets ────────────────────────────────────────────────────

export const WEAVE_PRESETS: Record<string, { name: string; matrix: WeaveMatrix }> = {
  plain: {
    name: 'Plain Weave (1/1)',
    matrix: [[1, 0], [0, 1]],
  },
  twill_2_2: {
    name: '2/2 Twill',
    matrix: [[1, 1, 0, 0], [0, 1, 1, 0], [0, 0, 1, 1], [1, 0, 0, 1]],
  },
  twill_3_1: {
    name: '3/1 Twill (Denim)',
    matrix: [[1, 1, 1, 0], [0, 1, 1, 1], [1, 0, 1, 1], [1, 1, 0, 1]],
  },
  satin_5: {
    name: '5-End Satin',
    matrix: [
      [1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 0, 1],
      [0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0],
    ],
  },
  hopsack: {
    name: 'Hopsack / 2/2 Matt',
    matrix: [[1, 1, 0, 0], [1, 1, 0, 0], [0, 0, 1, 1], [0, 0, 1, 1]],
  },
  honeycomb: {
    name: 'Honeycomb',
    matrix: [
      [1, 1, 1, 1, 0, 0, 0, 0],
      [1, 0, 0, 1, 0, 1, 1, 0],
      [1, 0, 0, 1, 0, 1, 1, 0],
      [1, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 1],
      [0, 1, 1, 0, 1, 0, 0, 1],
      [0, 1, 1, 0, 1, 0, 0, 1],
      [0, 0, 0, 0, 1, 1, 1, 1],
    ],
  },
  diamond: {
    name: 'Diamond Dobby',
    matrix: [
      [0, 0, 0, 1, 0, 0, 0, 1],
      [0, 0, 1, 1, 1, 0, 0, 0],
      [0, 1, 1, 0, 1, 1, 0, 0],
      [1, 1, 0, 0, 0, 1, 1, 0],
      [1, 0, 0, 0, 0, 0, 1, 0],
      [1, 1, 0, 0, 0, 1, 1, 0],
      [0, 1, 1, 0, 1, 1, 0, 0],
      [0, 0, 1, 1, 1, 0, 0, 0],
    ],
  },
  herringbone: {
    name: 'Herringbone',
    matrix: [
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 0, 0, 1, 1, 0, 0, 1],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 0, 0, 1, 1, 0],
      [1, 1, 0, 0, 0, 0, 1, 1],
      [1, 0, 0, 1, 1, 0, 0, 1],
    ],
  },
}
