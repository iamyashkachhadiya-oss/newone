/**
 * Design Variation Engine
 * ========================
 * Applies modifiers and transformations to base weave matrices:
 * - Color-vector interference (stripe, check, houndstooth)
 * - Border logic
 * - Matrix symmetry operations (mirror, rotate)
 * - Tensor expansion (rib, basket)
 */

import type { WeaveMatrix } from './generators'

// ─── Color Definitions ────────────────────────────────────────────────────────

export interface ColorSwatch {
  name: string
  warp: string   // CSS hex color
  weft: string
  accent: string
}

export const COLOR_SWATCHES: Record<string, ColorSwatch> = {
  indigo:   { name: 'Indigo',    warp: '#3730A3', weft: '#EEF2FF', accent: '#C00E52' },
  navy:     { name: 'Navy',      warp: '#1E3A5F', weft: '#DBEAFE', accent: '#1D4ED8' },
  white:    { name: 'White',     warp: '#FFFFFF', weft: '#F3F4F6', accent: '#9CA3AF' },
  black:    { name: 'Black',     warp: '#111827', weft: '#F9FAFB', accent: '#374151' },
  ecru:     { name: 'Ecru',      warp: '#C5B99A', weft: '#FBF7F0', accent: '#A8906B' },
  khaki:    { name: 'Khaki',     warp: '#8B7355', weft: '#F5F0E8', accent: '#6B5744' },
  red:      { name: 'Red',       warp: '#E0115F', weft: '#FEF2F2', accent: '#B91C1C' },
  blue:     { name: 'Blue',      warp: '#2563EB', weft: '#EFF6FF', accent: '#1D4ED8' },
  green:    { name: 'Green',     warp: '#15803D', weft: '#F0FDF4', accent: '#166534' },
  grey:     { name: 'Grey',      warp: '#6B7280', weft: '#F9FAFB', accent: '#374151' },
  cream:    { name: 'Cream',     warp: '#FFFBEB', weft: '#FEF3C7', accent: '#E0115F' },
  tan:      { name: 'Tan',       warp: '#D2B48C', weft: '#FBF7F0', accent: '#B8860B' },
  burgundy: { name: 'Burgundy',  warp: '#7F1D1D', weft: '#FEF2F2', accent: '#C00E52' },
  teal:     { name: 'Teal',      warp: '#0F766E', weft: '#F0FDFA', accent: '#0D9488' },
  natural:  { name: 'Natural',   warp: '#B5A585', weft: '#FAF8F4', accent: '#8B7355' },
  multicolor: { name: 'Multi',   warp: '#E0115F', weft: '#FFF1F0', accent: '#6D28D9' },
}

export const DEFAULT_COLORS = ['indigo', 'navy', 'white', 'black', 'ecru']

// ─── 1. Color Vector Application ─────────────────────────────────────────────

/**
 * Apply color-and-weave effect by multiplying structural matrix against color vectors.
 * Returns a "visual matrix" where each cell carries a color string.
 *
 * pixel(i,j) = warpColors[j % warpColors.length]  if matrix[i][j] === 1
 *            = weftColors[i % weftColors.length]  if matrix[i][j] === 0
 */
export function applyColorVector(
  matrix: WeaveMatrix,
  warpColors: string[],
  weftColors: string[]
): string[][] {
  return matrix.map((row, i) =>
    row.map((cell, j) =>
      cell ? warpColors[j % warpColors.length] : weftColors[i % weftColors.length]
    )
  )
}

// ─── 2. Stripe Application ────────────────────────────────────────────────────

/**
 * Generate a color vector for warp stripes.
 * Alternates colorA and colorB every `stripeWidth` threads.
 */
export function makeStripeVector(
  length: number,
  stripeWidth: number,
  colorA: string,
  colorB: string
): string[] {
  return Array.from({ length }, (_, i) =>
    Math.floor(i / stripeWidth) % 2 === 0 ? colorA : colorB
  )
}

/**
 * Generate a color vector for checks (symmetrical stripe on both axes).
 * Use same stripe vector for both warp and weft.
 */
export function makeCheckVector(
  length: number,
  stripeWidth: number,
  colorA: string,
  colorB: string
): string[] {
  return makeStripeVector(length, stripeWidth, colorA, colorB)
}

// ─── 3. Border Logic ──────────────────────────────────────────────────────────

/**
 * Apply border logic: use borderPattern for x < borderWidth, bodyPattern elsewhere.
 * Returns a combined matrix of size [body.rows][body.cols + 2*borderWidth].
 * The border pattern tiles independently.
 */
export function applyBorder(
  bodyMatrix: WeaveMatrix,
  borderMatrix: WeaveMatrix,
  borderWidth: number
): WeaveMatrix {
  const rows = Math.max(bodyMatrix.length, borderMatrix.length)
  const bodyCols = bodyMatrix[0]?.length ?? 0
  const borCols = borderMatrix[0]?.length ?? 0
  const totalCols = borderWidth * 2 + bodyCols

  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: totalCols }, (_, j) => {
      if (j < borderWidth) {
        // Left border (tiled)
        const bi = i % borderMatrix.length
        const bj = j % borCols
        return borderMatrix[bi]?.[bj] ?? 0
      } else if (j >= totalCols - borderWidth) {
        // Right border (tiled)
        const bi = i % borderMatrix.length
        const bj = j % borCols
        return borderMatrix[bi]?.[bj] ?? 0
      } else {
        // Body (tiled)
        const bi = i % bodyMatrix.length
        const bj = (j - borderWidth) % bodyCols
        return bodyMatrix[bi]?.[bj] ?? 0
      }
    })
  )
}

// ─── 4. Matrix Symmetry Operations ───────────────────────────────────────────

/**
 * Mirror matrix horizontally (flip columns = pointed draft).
 * Used to generate herringbone, diamond from plain twill.
 */
export function mirrorX(matrix: WeaveMatrix): WeaveMatrix {
  return matrix.map(row => [...row].reverse())
}

/**
 * Mirror matrix vertically (flip rows = pointed treadling).
 */
export function mirrorY(matrix: WeaveMatrix): WeaveMatrix {
  return [...matrix].reverse()
}

/**
 * Create full pointed-draft version: [M | mirrorX(M)] horizontally.
 */
export function pointedDraft(matrix: WeaveMatrix): WeaveMatrix {
  return matrix.map(row => [...row, ...[...row].reverse()])
}

/**
 * Rotate 90° clockwise: S to Z direction conversion.
 */
export function rotateMatrix(matrix: WeaveMatrix): WeaveMatrix {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  return Array.from({ length: cols }, (_, i) =>
    Array.from({ length: rows }, (_, j) => matrix[rows - 1 - j][i])
  )
}

/**
 * Flip S/Z direction: reverses each row.
 */
export function flipDirection(matrix: WeaveMatrix): WeaveMatrix {
  return matrix.map(row => [...row].reverse())
}

// ─── 5. Tensor Expansion ──────────────────────────────────────────────────────

/**
 * Kronecker tensor product of matrix with ones(n×n).
 * Expands each cell into an n×n block of the same value.
 * Used to generate warp ribs, basket weaves of any size from plain weave.
 */
export function tensorExpand(matrix: WeaveMatrix, n: number): WeaveMatrix {
  n = Math.max(1, Math.min(n, 8))
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const result: WeaveMatrix = []
  for (let i = 0; i < rows; i++) {
    for (let bi = 0; bi < n; bi++) {
      const row: number[] = []
      for (let j = 0; j < cols; j++) {
        for (let bj = 0; bj < n; bj++) {
          row.push(matrix[i][j])
        }
      }
      result.push(row)
    }
  }
  return result
}

// ─── 6. Matrix Concatenation (Structural Stripes) ─────────────────────────────

/**
 * Concatenate two matrices horizontally to create structural stripes.
 * Heights are equalized by tiling the shorter matrix.
 */
export function concatMatricesH(a: WeaveMatrix, b: WeaveMatrix): WeaveMatrix {
  const rows = Math.max(a.length, b.length)
  return Array.from({ length: rows }, (_, i) => [
    ...(a[i % a.length] ?? []),
    ...(b[i % b.length] ?? []),
  ])
}

// ─── 7. Tile Rendering ────────────────────────────────────────────────────────

/**
 * Get a pixel value at (row, col) from a matrix using modulo tiling.
 * pixel(i,j) = matrix[i % repeat_rows][j % repeat_cols]
 * This is the core of tile-based rendering — never pre-renders the full fabric.
 */
export function getTilePixel(matrix: WeaveMatrix, i: number, j: number): number {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 1
  return matrix[((i % rows) + rows) % rows][((j % cols) + cols) % cols]
}

/**
 * Render matrix to a flat Uint8ClampedArray (RGBA) for Canvas ImageData.
 * Uses tile-based modulo repetition.
 * @param matrix  base weave repeat matrix
 * @param cellPx  pixels per cell
 * @param warpColor  hex color string for warp-up cells
 * @param weftColor  hex color string for weft-up cells
 * @param tilesX  number of horizontal tile repetitions
 * @param tilesY  number of vertical tile repetitions
 */
export function renderToImageData(
  matrix: WeaveMatrix,
  cellPx: number,
  warpColor: string,
  weftColor: string,
  tilesX: number = 4,
  tilesY: number = 4
): { data: Uint8ClampedArray; width: number; height: number } {
  const rows = matrix.length
  const cols = matrix[0]?.length ?? 0
  const width = cols * cellPx * tilesX
  const height = rows * cellPx * tilesY
  const data = new Uint8ClampedArray(width * height * 4)

  const warp = hexToRGB(warpColor)
  const weft = hexToRGB(weftColor)

  for (let py = 0; py < height; py++) {
    const matRow = Math.floor(py / cellPx) % rows
    for (let px = 0; px < width; px++) {
      const matCol = Math.floor(px / cellPx) % cols
      const val = matrix[matRow][matCol]
      const [r, g, b] = val ? warp : weft
      const idx = (py * width + px) * 4
      data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255
    }
  }

  return { data, width, height }
}

function hexToRGB(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ]
  }
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}
