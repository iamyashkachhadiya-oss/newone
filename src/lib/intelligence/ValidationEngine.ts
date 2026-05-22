export interface FloatIssue {
  row: number
  col: number
  length: number
  direction: 'warp' | 'weft'
}

export interface ValidationReport {
  isValid: boolean
  maxWarpFloat: number
  maxWeftFloat: number
  issues: FloatIssue[]
}

/**
 * Validates a binary weave matrix for physical structural integrity.
 * Ensure floats do not exceed practical loom limitations un-bound.
 */
export function analyzeMatrixIntegrity(matrix: number[][], maxAcceptableFloat: number = 8): ValidationReport {
  if (!matrix || matrix.length === 0) {
    return { isValid: true, maxWarpFloat: 0, maxWeftFloat: 0, issues: [] }
  }

  const rows = matrix.length
  const cols = matrix[0].length
  const issues: FloatIssue[] = []
  
  let globalMaxWarp = 0
  let globalMaxWeft = 0

  // 1. Analyze Warp Floats (Vertical sequences of 1s)
  for (let c = 0; c < cols; c++) {
    let currentWarpFloat = 0
    for (let r = 0; r < rows; r++) {
      if (matrix[r][c] === 1) {
        currentWarpFloat++
        if (currentWarpFloat > globalMaxWarp) globalMaxWarp = currentWarpFloat
      } else {
        if (currentWarpFloat > maxAcceptableFloat) {
          issues.push({ row: r - currentWarpFloat, col: c, length: currentWarpFloat, direction: 'warp' })
        }
        currentWarpFloat = 0
      }
    }
    if (currentWarpFloat > maxAcceptableFloat) {
      issues.push({ row: rows - currentWarpFloat, col: c, length: currentWarpFloat, direction: 'warp' })
    }
  }

  // 2. Analyze Weft Floats (Horizontal sequences of 0s)
  for (let r = 0; r < rows; r++) {
    let currentWeftFloat = 0
    for (let c = 0; c < cols; c++) {
      if (matrix[r][c] === 0) {
        currentWeftFloat++
        if (currentWeftFloat > globalMaxWeft) globalMaxWeft = currentWeftFloat
      } else {
        if (currentWeftFloat > maxAcceptableFloat) {
          issues.push({ row: r, col: c - currentWeftFloat, length: currentWeftFloat, direction: 'weft' })
        }
        currentWeftFloat = 0
      }
    }
    if (currentWeftFloat > maxAcceptableFloat) {
      issues.push({ row: r, col: cols - currentWeftFloat, length: currentWeftFloat, direction: 'weft' })
    }
  }

  return {
    isValid: issues.length === 0,
    maxWarpFloat: globalMaxWarp,
    maxWeftFloat: globalMaxWeft,
    issues
  }
}
