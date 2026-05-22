/**
 * Peg Plan Parser — Bidirectional Text ↔ Matrix Sync
 *
 * Text format (Surat factory standard):
 *   1-->1,3,5,6,7,10,11,14
 *   ---
 *   2-->2,4,6,7,8,10,11,14
 *   ---
 *   3-->1,3,5,6,7,10,11,13
 *
 * ALSO supports simplified format (no separators needed):
 *   1-->1,3,5,6
 *   2-->2,4,6,8
 *   3-->1,3,5,7
 *
 * Parsing rule:
 *   - If "---" separators are present, split on them → array of pick blocks
 *   - If NO "---" separators, each "N-->..." line becomes its own row
 *   - For each block/line: extract shaft numbers after the arrow
 *   - Set grid[pick][shaft] = 1 for raised, 0 for lowered
 */

/**
 * Convert peg plan text to a binary matrix
 * @param text - Peg plan in "N-->shaft,shaft,..." format
 * @param shaftCount - Number of shafts (columns in matrix)
 * @returns 2D binary matrix [picks × shafts]
 */
export function textToMatrix(text: string, shaftCount: number): number[][] {
  if (!text.trim()) return []

  const trimmed = text.trim()

  // Check if text contains "---" separators
  const hasSeparators = /^-{3,}$/m.test(trimmed)

  if (hasSeparators) {
    // Original format: split by "---" separator lines
    return parseSeparatedFormat(trimmed, shaftCount)
  } else {
    // Simplified format: each line with "-->" is a separate pick
    return parseLineByLineFormat(trimmed, shaftCount)
  }
}

/**
 * Parse the "---" separated format (original Surat factory format)
 */
function parseSeparatedFormat(text: string, shaftCount: number): number[][] {
  const blocks = text.split(/\n*-{3,}\n*/).filter(b => b.trim())
  const matrix: number[][] = []

  for (const block of blocks) {
    const lines = block.split('\n').filter(l => l.trim())
    const allShafts: number[] = []

    for (const line of lines) {
      const shafts = extractShafts(line, shaftCount)
      allShafts.push(...shafts)
    }

    const row = new Array(shaftCount).fill(0)
    for (const shaft of allShafts) {
      row[shaft - 1] = 1
    }
    matrix.push(row)
  }

  return matrix
}

/**
 * Parse the simplified line-by-line format (each "-->" line = one pick)
 */
function parseLineByLineFormat(text: string, shaftCount: number): number[][] {
  const lines = text.split('\n').filter(l => l.trim())
  const matrix: number[][] = []

  for (const line of lines) {
    const trimLine = line.trim()
    if (!trimLine) continue

    // Skip pure comment lines or empty lines
    if (trimLine.startsWith('//') || trimLine.startsWith('#')) continue

    const shafts = extractShafts(trimLine, shaftCount)

    // Only add a row if we found valid shaft numbers
    if (shafts.length > 0) {
      const row = new Array(shaftCount).fill(0)
      for (const shaft of shafts) {
        row[shaft - 1] = 1
      }
      matrix.push(row)
    }
  }

  return matrix
}

/**
 * Extract shaft numbers from a single line of text
 * Supports: "1-->1,3,5,6" and plain "1,3,5,6"
 */
function extractShafts(line: string, shaftCount: number): number[] {
  const trimLine = line.trim()
  if (!trimLine) return []

  // Check for "N-->" arrow format
  const arrowMatch = trimLine.match(/\d+\s*-->\s*(.+)/)
  let shaftStr = arrowMatch ? arrowMatch[1] : trimLine

  // Strip anything in parentheses (e.g. color labels) so numbers inside them aren't parsed as shafts
  shaftStr = shaftStr.replace(/\s*\(.*?\)/g, '')

  return shaftStr
    .split(/[,\s]+/)
    .map(s => parseInt(s.trim(), 10))
    .filter(n => !isNaN(n) && n >= 1 && n <= shaftCount)
}

interface Yarn {
  id: string
  label: string
  colour_hex: string
}

/**
 * Convert binary matrix back to peg plan text
 * @param matrix - 2D binary matrix [picks × shafts]
 * @param rowYarnMap - Optional. Map of row index to yarn ID.
 * @param cellYarnMap - Optional. Map of `${row}_${col}` to yarn ID.
 * @param weftYarns - Optional. Array of all available weft yarns.
 * @returns Peg plan text in "N-->shaft,shaft,..." format, with separate rows for multiple colors per pick
 */
export function matrixToText(
  matrix: number[][],
  rowYarnMap?: Record<number, string>,
  cellYarnMap?: Record<string, string>,
  weftYarns?: Yarn[]
): string {
  if (!matrix.length) return ''

  const lines: string[] = []

  for (let i = 0; i < matrix.length; i++) {
    const row = matrix[i]
    const yarnGroups: Record<string, number[]> = {}
    const defaultYarn = (rowYarnMap && rowYarnMap[i]) || (weftYarns && weftYarns.length > 0 ? weftYarns[0].id : 'default')
    let hasRaised = false

    for (let j = 0; j < row.length; j++) {
      if (row[j] === 1) {
        hasRaised = true
        const cellYarn = (cellYarnMap && cellYarnMap[`${i}_${j}`]) || defaultYarn
        if (!yarnGroups[cellYarn]) {
          yarnGroups[cellYarn] = []
        }
        yarnGroups[cellYarn].push(j + 1) // Convert 0-indexed back to 1-indexed
      }
    }

    if (!hasRaised) {
      lines.push(`${i + 1}-->`)
    } else {
      for (const [yarnId, raisedShafts] of Object.entries(yarnGroups)) {
        const yarn = weftYarns?.find(y => y.id === yarnId)
        // Set label only if multiple colors are possible/provided.
        const labelStr = yarn && weftYarns && weftYarns.length > 1 ? ` (${yarn.label || 'Yarn'})` : ''
        lines.push(`${i + 1}-->${raisedShafts.join(',')}${labelStr}`)
      }
    }
  }

  return lines.join('\n')
}
