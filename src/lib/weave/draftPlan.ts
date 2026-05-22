/**
 * Draft Plan Derivation — Boolean Algebra Implementation
 * =======================================================
 * Direct TypeScript port of the algorithm documented in info.txt.
 *
 * The four weaving plans and their algebraic relationship:
 *   P = L × U × D  (over Boolean algebra)
 *
 * Where:
 *   P = Peg plan     [picks × ends]          master binary matrix
 *   D = Threading    [shafts × ends]          which shaft each end is on
 *   U = Tie-up       [treadles × shafts]      which shafts each treadle lifts
 *   L = Lift plan    [picks]                  treadle sequence per pick
 *
 * Derivation direction: P → threading → tie_up → lift_plan
 * Method: column equivalence class partitioning (O(H×W))
 */

import type { WeaveMatrix } from './generators'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DraftPlan {
  /** threading[end] = shaft index (0-based) */
  threading: number[]
  /** tieUp[treadle][shaft] = 0|1 */
  tieUp: number[][]
  /** liftPlan[pick] = treadle index (0-based) */
  liftPlan: number[]
  shaftCount: number
  treadleCount: number
  /** Verification result: P === reconstruct(D,U,L) */
  verified: boolean
  /** Jacquard or Dobby? */
  loomType: 'dobby' | 'jacquard'
  /** Formatted peg-plan text in Surat factory standard */
  pegPlanSummary: string
}

export interface SelectkiResult {
  /** WIF-compatible export string */
  wifSections: {
    threading: string
    tieUp: string
    treadling: string
    shaftCount: number
    treadleCount: number
  }
  /** Human-readable summary */
  summary: string
}

// ─── Core Algorithm ───────────────────────────────────────────────────────────

/**
 * Derive threading, tie-up and lift plan from a peg plan matrix.
 *
 * Algorithm:
 *  1. Column scan → unique column patterns → shaft assignments
 *  2. Row scan → unique row patterns → treadle assignments
 *  3. Tie-up: U[t][s] = 1 if shaft s is raised on treadle t
 *  4. Verification: reconstruct P from D, U, L and compare
 */
export function deriveDraftPlan(pegPlan: WeaveMatrix): DraftPlan {
  const H = pegPlan.length
  const W = pegPlan[0]?.length ?? 0

  if (H === 0 || W === 0) {
    return {
      threading: [], tieUp: [], liftPlan: [],
      shaftCount: 0, treadleCount: 0,
      verified: true, loomType: 'dobby', pegPlanSummary: '',
    }
  }

  // ── Step 1: Column scan → shaft assignments ──────────────────────────────
  const colPatternMap = new Map<string, number>()
  const threading: number[] = new Array(W)
  let shaftId = 0

  for (let c = 0; c < W; c++) {
    const key = pegPlan.map(row => row[c]).join('')
    if (!colPatternMap.has(key)) colPatternMap.set(key, shaftId++)
    threading[c] = colPatternMap.get(key)!
  }

  const shaftCount = shaftId
  // Map: shaft id → column pattern (as number[])
  const shaftPatterns = new Map<number, number[]>()
  colPatternMap.forEach((id, key) => {
    shaftPatterns.set(id, key.split('').map(Number))
  })

  // ── Step 2: Row scan → treadle assignments ───────────────────────────────
  const rowPatternMap = new Map<string, number>()
  const liftPlan: number[] = new Array(H)
  let treadleId = 0

  for (let r = 0; r < H; r++) {
    const key = pegPlan[r].join('')
    if (!rowPatternMap.has(key)) rowPatternMap.set(key, treadleId++)
    liftPlan[r] = rowPatternMap.get(key)!
  }

  const treadleCount = treadleId
  // Map: treadle id → row pattern
  const treadlePatterns = new Map<number, number[]>()
  rowPatternMap.forEach((id, key) => {
    treadlePatterns.set(id, key.split('').map(Number))
  })

  // ── Step 3: Build tie-up matrix U[treadle][shaft] ────────────────────────
  const tieUp: number[][] = Array.from(
    { length: treadleCount },
    () => new Array(shaftCount).fill(0)
  )

  treadlePatterns.forEach((rowPattern, t) => {
    rowPattern.forEach((val, c) => {
      if (val === 1) tieUp[t][threading[c]] = 1
    })
  })

  // ── Step 4: Verification — reconstruct P from D, U, L ───────────────────
  const verified = verifyDraftPlan(pegPlan, threading, tieUp, liftPlan)

  // ── Step 5: Loom type determination ─────────────────────────────────────
  const loomType: 'dobby' | 'jacquard' = shaftCount > 32 ? 'jacquard' : 'dobby'

  // ── Step 6: Human-readable peg plan summary ──────────────────────────────
  const pegPlanSummary = buildPegPlanSummary(threading, tieUp, liftPlan, shaftCount, treadleCount)

  return {
    threading,
    tieUp,
    liftPlan,
    shaftCount,
    treadleCount,
    verified,
    loomType,
    pegPlanSummary,
  }
}

// ─── Verification ─────────────────────────────────────────────────────────────

/**
 * Verify: P[r][c] === tieUp[ liftPlan[r] ][ threading[c] ]
 * This is the Boolean algebra check: P = L × U × D
 */
export function verifyDraftPlan(
  pegPlan: WeaveMatrix,
  threading: number[],
  tieUp: number[][],
  liftPlan: number[]
): boolean {
  const H = pegPlan.length
  const W = pegPlan[0]?.length ?? 0
  for (let r = 0; r < H; r++) {
    const t = liftPlan[r]
    for (let c = 0; c < W; c++) {
      const s = threading[c]
      if (tieUp[t]?.[s] !== pegPlan[r][c]) return false
    }
  }
  return true
}

// ─── Peg Plan Summary ─────────────────────────────────────────────────────────

function buildPegPlanSummary(
  threading: number[],
  tieUp: number[][],
  liftPlan: number[],
  shaftCount: number,
  treadleCount: number
): string {
  const lines: string[] = [
    `Shafts: ${shaftCount} | Treadles: ${treadleCount}`,
    '',
    'Threading (end → shaft):',
    threading.map((s, i) => `  End ${i + 1} → Shaft ${s + 1}`).slice(0, 8).join('\n') +
      (threading.length > 8 ? `\n  ... (+${threading.length - 8} more)` : ''),
    '',
    'Tie-up (treadle: raised shafts):',
    tieUp.map((row, t) => {
      const raised = row.map((v, s) => v ? s + 1 : null).filter(Boolean)
      return `  T${t + 1}: shafts ${raised.join(', ')}`
    }).join('\n'),
    '',
    'Lift sequence (picks):',
    liftPlan.slice(0, 16).map((t, r) => `  Pick ${r + 1}: T${t + 1}`).join('\n') +
      (liftPlan.length > 16 ? `\n  ... (${liftPlan.length} total picks)` : ''),
  ]
  return lines.join('\n')
}

// ─── WIF Export ───────────────────────────────────────────────────────────────

/**
 * Generate WIF-compatible section strings from a derived draft plan.
 * Returns the full SelectkiResult with wifSections + summary.
 */
export function draftToWIFSections(draft: DraftPlan): SelectkiResult {
  const threadingLines = draft.threading
    .map((shaft, i) => `${i + 1}=${shaft + 1}`)
    .join('\n')

  const tieUpLines = draft.tieUp
    .map((row, t) => {
      const raised = row.map((v, s) => v ? s + 1 : null).filter(Boolean).join(',')
      return `${t + 1}=${raised || '0'}`
    })
    .join('\n')

  const treadlingLines = draft.liftPlan
    .map((t, r) => `${r + 1}=${t + 1}`)
    .join('\n')

  const summary =
    `Draft Plan Summary\n` +
    `─────────────────\n` +
    `Shafts:   ${draft.shaftCount}\n` +
    `Treadles: ${draft.treadleCount}\n` +
    `Loom:     ${draft.loomType.toUpperCase()}\n` +
    `Verified: ${draft.verified ? '✓ Pass' : '✗ Fail'}\n`

  return {
    wifSections: {
      threading: threadingLines,
      tieUp: tieUpLines,
      treadling: treadlingLines,
      shaftCount: draft.shaftCount,
      treadleCount: draft.treadleCount,
    },
    summary,
  }
}


// ─── Selvedge Check ───────────────────────────────────────────────────────────

/**
 * Selvedge integrity: first and last column should alternate 0/1 each pick.
 * A non-alternating selvedge causes the fabric edge to be weak.
 */
export function checkSelvedge(pegPlan: WeaveMatrix): { ok: boolean; message: string } {
  const H = pegPlan.length
  const W = pegPlan[0]?.length ?? 0
  if (H < 2 || W < 2) return { ok: true, message: 'Matrix too small to check' }

  const leftOk  = pegPlan.every((row, i) => row[0] === i % 2)
  const rightOk = pegPlan.every((row, i) => row[W - 1] === i % 2)

  if (leftOk && rightOk) return { ok: true, message: 'Selvedge alternating correctly on both edges' }
  const issues = []
  if (!leftOk)  issues.push('left selvedge not alternating')
  if (!rightOk) issues.push('right selvedge not alternating')
  return { ok: false, message: `Selvedge issue: ${issues.join(', ')}` }
}

// ─── Convenience: full analysis from peg plan text ───────────────────────────

/**
 * Run the full draft derivation + selvedge check.
 * Returns everything needed to display the DraftAnalysis panel.
 */
export function analysePegPlan(matrix: WeaveMatrix): {
  draft: DraftPlan
  selvedge: { ok: boolean; message: string }
  wifSections: SelectkiResult
} {
  const draft = deriveDraftPlan(matrix)
  const selvedge = checkSelvedge(matrix)
  const wifSections = draftToWIFSections(draft)
  return { draft, selvedge, wifSections }
}
