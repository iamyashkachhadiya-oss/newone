/**
 * Stäubli .EP File Export
 *
 * Format specification (from FabricAI Master Research):
 *   - Text-based format, one line per weft pick
 *   - Each line: comma-separated shaft numbers (1-indexed) that are raised
 *   - File extension: .EP
 *   - Used by Stäubli electronic dobby heads
 *
 * Also supports:
 *   - .WEA (Grosse) — same format with header
 *   - text — raw peg plan text
 */

import type { ExportFormat, WeftSystem, WeftYarn } from '@/lib/types'

/**
 * Generate machine file content from peg plan matrix and weft system
 */
export function generateMachineFile(
  matrix: number[][],
  format: ExportFormat,
  designNumber: string,
  shaftCount: number,
  weftSystem: WeftSystem
): string {
  if (!matrix.length) return ''

  switch (format) {
    case '.EP':
      return generateEP(matrix, designNumber, shaftCount, weftSystem)
    case '.WEA':
      return generateWEA(matrix, designNumber, shaftCount, weftSystem)
    case '.JC5':
      return generateJC5(matrix, designNumber, shaftCount, weftSystem)
    case '.DES':
      return generateDES(matrix, designNumber, shaftCount, weftSystem)
    case 'text':
    default:
      return generateText(matrix, weftSystem)
  }
}

/**
 * Stäubli .EP format
 * Header: VERSION, DESIGN_NAME, SHAFTS, PICKS
 * Body: one line per pick with raised shaft numbers
 */
function generateEP(matrix: number[][], designNumber: string, shaftCount: number, weftSystem: WeftSystem): string {
  const lines: string[] = []

  // EP Header
  lines.push(`$VERSION=1.0`)
  lines.push(`$DESIGN=${designNumber}`)
  lines.push(`$SHAFTS=${shaftCount}`)
  lines.push(`$PICKS=${matrix.length}`)
  lines.push(`$NOZZLES=${weftSystem.total_nozzles_available}`)
  lines.push(`$FORMAT=EP`)
  lines.push(`$DATE=${new Date().toISOString().split('T')[0]}`)
  lines.push(`$GENERATOR=FabricAI Studio v1.0`)
  lines.push(`---`)

  // Body: one line per pick
  for (let i = 0; i < matrix.length; i++) {
    const raisedShafts: number[] = []
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] === 1) {
        raisedShafts.push(j + 1)
      }
    }
    
    // Determine nozzle for this pick
    let nozzleId = 1
    if (weftSystem.mode === 'advanced') {
      const pattern = weftSystem.insertion_sequence.pattern
      const yarnId = pattern[i % pattern.length]
      const yarn = weftSystem.yarns.find(y => y.id === yarnId)
      if (yarn) {
        const nozzleIndex = Math.floor(i / pattern.length) % yarn.nozzle_config.sequence.length
        nozzleId = yarn.nozzle_config.sequence[nozzleIndex] || 1
      }
    }

    lines.push(`[C${nozzleId}] ${raisedShafts.join(',')}`)
  }

  lines.push(`$END`)
  return lines.join('\n')
}

/**
 * Grosse .WEA format
 */
function generateWEA(matrix: number[][], designNumber: string, shaftCount: number, weftSystem: WeftSystem): string {
  const lines: string[] = []
  lines.push(`[WEA FILE]`)
  lines.push(`Design=${designNumber}`)
  lines.push(`Shafts=${shaftCount}`)
  lines.push(`Nozzles=${weftSystem.total_nozzles_available}`)
  lines.push(`Picks=${matrix.length}`)
  lines.push(`Generator=FabricAI Studio`)
  lines.push(``)

  for (let i = 0; i < matrix.length; i++) {
    const binary = matrix[i].map((v) => v ? '1' : '0').join('')
    
    let nozzleId = 1
    if (weftSystem.mode === 'advanced') {
      const pattern = weftSystem.insertion_sequence.pattern
      const yarnId = pattern[i % pattern.length]
      const yarn = weftSystem.yarns.find(y => y.id === yarnId)
      if (yarn) {
        const nozzleIndex = Math.floor(i / pattern.length) % yarn.nozzle_config.sequence.length
        nozzleId = yarn.nozzle_config.sequence[nozzleIndex] || 1
      }
    }

    lines.push(`Pick=${i + 1} Nozzle=${nozzleId} Pattern=${binary}`)
  }

  return lines.join('\n')
}

/**
 * .JC5 format (simplified)
 */
function generateJC5(matrix: number[][], designNumber: string, shaftCount: number, weftSystem: WeftSystem): string {
  const lines: string[] = []
  lines.push(`JC5 ${designNumber}`)
  lines.push(`S${shaftCount} P${matrix.length} N${weftSystem.total_nozzles_available}`)

  for (let i = 0; i < matrix.length; i++) {
    const raisedShafts: number[] = []
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] === 1) raisedShafts.push(j + 1)
    }

    let nozzleId = 1
    if (weftSystem.mode === 'advanced') {
      const pattern = weftSystem.insertion_sequence.pattern
      const yarnId = pattern[i % pattern.length]
      const yarn = weftSystem.yarns.find(y => y.id === yarnId)
      if (yarn) {
        const nozzleIndex = Math.floor(i / pattern.length) % yarn.nozzle_config.sequence.length
        nozzleId = yarn.nozzle_config.sequence[nozzleIndex] || 1
      }
    }

    lines.push(`P${i + 1} C${nozzleId}:${raisedShafts.join(',')}`)
  }

  return lines.join('\n')
}

/**
 * Picanol .DES format
 */
function generateDES(matrix: number[][], designNumber: string, shaftCount: number, weftSystem: WeftSystem): string {
  const lines: string[] = []
  lines.push(`DESIGN:${designNumber}`)
  lines.push(`SHAFTS:${shaftCount}`)
  lines.push(`PICKS:${matrix.length}`)
  lines.push(`NOZZLES:${weftSystem.total_nozzles_available}`)
  lines.push(`---`)

  for (let i = 0; i < matrix.length; i++) {
    // Binary string representation
    const binary = matrix[i].map((v) => v ? 'X' : '.').join('')
    
    let nozzleId = 1
    if (weftSystem.mode === 'advanced') {
      const pattern = weftSystem.insertion_sequence.pattern
      const yarnId = pattern[i % pattern.length]
      const yarn = weftSystem.yarns.find(y => y.id === yarnId)
      if (yarn) {
        const nozzleIndex = Math.floor(i / pattern.length) % yarn.nozzle_config.sequence.length
        nozzleId = yarn.nozzle_config.sequence[nozzleIndex] || 1
      }
    }

    lines.push(`${String(i + 1).padStart(3, ' ')}: [C${nozzleId}] ${binary}`)
  }

  return lines.join('\n')
}

/**
 * Plain text format (Surat factory standard)
 */
function generateText(matrix: number[][], weftSystem: WeftSystem): string {
  const lines: string[] = []
  for (let i = 0; i < matrix.length; i++) {
    const raisedShafts: number[] = []
    for (let j = 0; j < matrix[i].length; j++) {
      if (matrix[i][j] === 1) raisedShafts.push(j + 1)
    }

    let nozzleId = 1
    let yarnLabel = ''
    if (weftSystem.mode === 'advanced') {
      const pattern = weftSystem.insertion_sequence.pattern
      const yarnId = pattern[i % pattern.length]
      const yarn = weftSystem.yarns.find(y => y.id === yarnId)
      if (yarn) {
        const nozzleIndex = Math.floor(i / pattern.length) % yarn.nozzle_config.sequence.length
        nozzleId = yarn.nozzle_config.sequence[nozzleIndex] || 1
        yarnLabel = ` [Yarn ${yarn.label}] [Nozzle ${nozzleId}]`
      }
    }

    lines.push(`${i + 1}-->${raisedShafts.join(',')}${yarnLabel}`)
    if (i < matrix.length - 1) lines.push('---')
  }
  return lines.join('\n')
}

/**
 * Download machine file
 */
export function downloadMachineFile(
  matrix: number[][],
  format: ExportFormat,
  designNumber: string,
  shaftCount: number,
  weftSystem: WeftSystem
) {
  const content = generateMachineFile(matrix, format, designNumber, shaftCount, weftSystem)

  const ext = format === 'text' ? '.txt' : format.toLowerCase()
  const filename = `${designNumber || 'design'}${ext}`

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  a.remove() // Good practice
  URL.revokeObjectURL(url)
}
