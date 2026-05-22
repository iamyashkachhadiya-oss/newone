/**
 * Algorithmic Weave Matrix Generators
 * ====================================
 * Each generator returns a 2D binary matrix:
 *   1 = warp over weft  (raiser)
 *   0 = weft over warp  (sinker)
 *
 * Based on: "Algorithmic Textile Pattern Generation: A Computational Framework
 * for Dobby Weaving Systems" research document.
 */

export type WeaveMatrix = number[][]

// ─── Utility ──────────────────────────────────────────────────────────────────

/** Greatest common divisor (Euclidean algorithm) */
export function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b] }
  return a
}

/** Check if two numbers are coprime */
export function areCoprime(a: number, b: number): boolean {
  return gcd(a, b) === 1
}

/** Clamp a value between min and max */
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

/** Create an n×n zero matrix */
function zeros(rows: number, cols: number): WeaveMatrix {
  return Array.from({ length: rows }, () => Array(cols).fill(0))
}

// ─── 1. Plain Weave ───────────────────────────────────────────────────────────

/**
 * Plain weave: highest interlacement index (1).
 * pattern[i][j] = (i + j) % 2
 * Repeat size: 2×2
 */
export function generatePlain(): WeaveMatrix {
  return [
    [1, 0],
    [0, 1],
  ]
}

// ─── 2. Rib Weaves ────────────────────────────────────────────────────────────

/**
 * Warp rib: extends interlacement vertically.
 * Warp threads travel over n weft threads and under n weft threads.
 * @param n  float length (default 2 → 2/2 warp rib)
 */
export function generateWarpRib(n: number = 2): WeaveMatrix {
  n = clamp(n, 2, 8)
  const size = n * 2
  const m = zeros(size, 2)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < 2; j++) {
      m[i][j] = Math.floor(i / n) % 2 === j % 2 ? 1 : 0
    }
  }
  return m
}

/**
 * Weft rib: extends interlacement horizontally.
 * @param n  float length (default 2)
 */
export function generateWeftRib(n: number = 2): WeaveMatrix {
  n = clamp(n, 2, 8)
  const size = n * 2
  const m = zeros(2, size)
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < size; j++) {
      m[i][j] = Math.floor(j / n) % 2 === i % 2 ? 1 : 0
    }
  }
  return m
}

// ─── 3. Basket / Matt Weave ───────────────────────────────────────────────────

/**
 * Basket (Matt) weave: symmetric extension of plain weave on both axes.
 * Kronecker product of plain [[1,0],[0,1]] ⊗ ones(n×n)
 * @param n  basket unit size (default 2 → 2/2 basket)
 */
export function generateBasket(n: number = 2): WeaveMatrix {
  n = clamp(n, 2, 6)
  const size = n * 2
  const m = zeros(size, size)
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const bi = Math.floor(i / n)
      const bj = Math.floor(j / n)
      m[i][j] = (bi + bj) % 2 === 0 ? 1 : 0
    }
  }
  return m
}

// ─── 4. Twill Weaves ─────────────────────────────────────────────────────────

/**
 * Standard twill: pattern[i][j] = ((i + j * dir) % repeat) < floatSize
 * dir: 1 = Z (right), -1 = S (left)
 * @param up    warp-up count (e.g. 3 for 3/1 twill)
 * @param down  warp-down count (e.g. 1 for 3/1 twill)
 * @param direction 'Z' | 'S'
 */
export function generateTwill(
  up: number = 3,
  down: number = 1,
  direction: 'Z' | 'S' = 'Z'
): WeaveMatrix {
  up = clamp(up, 1, 8)
  down = clamp(down, 1, 8)
  const repeat = up + down
  const dir = direction === 'Z' ? 1 : -1
  const m = zeros(repeat, repeat)
  for (let i = 0; i < repeat; i++) {
    for (let j = 0; j < repeat; j++) {
      m[i][j] = ((i + j * dir + repeat * 10) % repeat) < up ? 1 : 0
    }
  }
  return m
}

/**
 * Broken twill: disrupts the continuous diagonal by a non-linear phase shift.
 * The reversal prevents fabric from twisting off the loom.
 * @param up      warp-up count
 * @param down    warp-down count
 * @param jump    phase-shift amount (default: repeat/2)
 */
export function generateBrokenTwill(
  up: number = 3,
  down: number = 1,
  jump?: number
): WeaveMatrix {
  up = clamp(up, 1, 8)
  down = clamp(down, 1, 8)
  const repeat = up + down
  const j = jump ?? Math.floor(repeat / 2)
  const m = zeros(repeat * 2, repeat * 2)
  for (let i = 0; i < repeat * 2; i++) {
    for (let col = 0; col < repeat * 2; col++) {
      // Alternating Z then S direction blocks
      const half = col < repeat
      const dir = half ? 1 : -1
      const offset = half ? 0 : j
      m[i][col] = ((i + col * dir + offset + repeat * 20) % repeat) < up ? 1 : 0
    }
  }
  return m
}

/**
 * Herringbone: pointed twill where direction reversal is accompanied by phase shift.
 * Creates sharp "V" columns. Uses a pointed draft (column mirror).
 */
export function generateHerringbone(
  up: number = 2,
  down: number = 2
): WeaveMatrix {
  up = clamp(up, 1, 6)
  down = clamp(down, 1, 6)
  const half = up + down
  const full = half * 2
  const m = zeros(full, full)
  for (let i = 0; i < full; i++) {
    for (let j = 0; j < full; j++) {
      // Z direction for first half, S direction (mirrored) for second half
      const jLocal = j < half ? j : full - 1 - j
      m[i][j] = ((i + jLocal + half * 10) % half) < up ? 1 : 0
    }
  }
  return m
}

/**
 * Zig-Zag twill: reverses direction at every `period` picks.
 */
export function generateZigZag(
  up: number = 2,
  down: number = 2,
  period?: number
): WeaveMatrix {
  up = clamp(up, 1, 6)
  down = clamp(down, 1, 6)
  const repeat = up + down
  const p = period ?? repeat
  const height = p * 2
  const m = zeros(height, repeat)
  for (let i = 0; i < height; i++) {
    const dir = Math.floor(i / p) % 2 === 0 ? 1 : -1
    for (let j = 0; j < repeat; j++) {
      m[i][j] = ((i * dir + j + repeat * 20) % repeat) < up ? 1 : 0
    }
  }
  return m
}

// ─── 5. Satin / Sateen ────────────────────────────────────────────────────────

/**
 * Satin: maximizes float length, scatters interlacement points to eliminate twill line.
 * Uses coprime jump logic: interlacement at row i placed at column (i * step) % n.
 * Constraints from research:
 *   - gcd(n, step) === 1
 *   - step !== 1 and step !== n-1 (else it's just a twill)
 *   - n cannot be 6 (true satin mathematically impossible on 6 shafts)
 *
 * @param n     repeat size (minimum 5; 6 is invalid)
 * @param step  move number (must be coprime with n)
 */
export function generateSatin(n: number = 5, step: number = 2): WeaveMatrix {
  // Validate constraints
  if (n === 6) {
    console.warn('Satin: 6-shaft true satin is mathematically impossible. Using n=5.')
    n = 5
  }
  n = clamp(n, 5, 16)
  // Find a valid step if the provided one is invalid
  if (!areCoprime(n, step) || step === 1 || step === n - 1) {
    step = VALID_SATIN_STEPS[n]?.[0] ?? 2
  }

  const m = zeros(n, n)
  for (let i = 0; i < n; i++) {
    const j = (i * step) % n
    m[i][j] = 1
  }
  return m
}

/** Hardcoded valid satin move numbers per research table */
export const VALID_SATIN_STEPS: Record<number, number[]> = {
  5:  [2, 3],
  6:  [],             // impossible
  7:  [2, 3, 4, 5],
  8:  [3, 5],
  10: [3, 7],
  12: [5, 7],
  16: [3, 5, 7, 9, 11, 13],
  24: [5, 7, 11, 13, 17, 19],
}

/** Get all valid satin step values for a given repeat size */
export function getValidSatinSteps(n: number): number[] {
  if (VALID_SATIN_STEPS[n]) return VALID_SATIN_STEPS[n]
  // For prime n, any 2..n-2 is valid
  const isPrime = (x: number) => {
    for (let i = 2; i <= Math.sqrt(x); i++) if (x % i === 0) return false
    return x > 1
  }
  if (isPrime(n)) return Array.from({ length: n - 3 }, (_, i) => i + 2)
  // Otherwise enumerate coprimes
  return Array.from({ length: n - 3 }, (_, i) => i + 2).filter(s => areCoprime(n, s) && s !== 1 && s !== n - 1)
}

// ─── 6. Dobby Structures ─────────────────────────────────────────────────────

/**
 * Honeycomb: diamond base crossed by double diagonal. Creates cellular 3D texture.
 * Maximum float length ≤ n/2 per research constraint.
 * Minimum repeat: 6. Requires even repeat size.
 * @param n  repeat size (minimum 6, even)
 */
export function generateHoneycomb(n: number = 8): WeaveMatrix {
  n = Math.max(6, n % 2 === 0 ? n : n + 1)
  n = Math.min(n, 16)
  const m = zeros(n, n)
  const half = n / 2
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // Diamond distance from center
      const di = Math.abs(i - half)
      const dj = Math.abs(j - half)
      const dist = di + dj
      // Ridges: near diamond edge → warp up (1)
      // Centers: float zone → warp down (0)
      m[i][j] = dist >= half - 1 ? 1 : (i + j) % 2
    }
  }
  return m
}

/**
 * Brighton Honeycomb: complex derivative requiring repeat divisible by 4, minimum 12.
 */
export function generateBrightonHoneycomb(n: number = 12): WeaveMatrix {
  // n must be multiple of 4, min 12
  n = Math.max(12, Math.round(n / 4) * 4)
  n = Math.min(n, 24)
  return generateHoneycomb(n) // Derived from base honeycomb with tighter constraints
}

/**
 * Birdseye: small symmetrical pattern from pointed twill with pointed treadling.
 * Requires minimum 4 shafts.
 */
export function generateBirdseye(n: number = 4): WeaveMatrix {
  n = Math.max(4, Math.min(n, 8))
  const m = generateHerringbone(Math.floor(n / 2), Math.floor(n / 2))
  return m
}

/**
 * Diamond Weave: hollow diamond outline pattern.
 * Uses the correct textile algorithm:
 *   - Each row: width expands toward center then contracts
 *   - Small rows (tip): solid fill
 *   - Wider rows (body): hollow — only the outer `thickness` pegs on each side
 * Supports any even NxN size (8, 12, 16, 24...).
 */
export function generateDiamond(n: number = 8): WeaveMatrix {
  // Force even N for symmetric diamond
  n = clamp(n % 2 === 0 ? n : n + 1, 4, 32)
  const m = zeros(n, n)
  const center = Math.floor(n / 2)
  const thickness = Math.max(1, Math.floor(n / 4)) // edge line thickness
  const solidThreshold = thickness * 2             // solid fill when width ≤ this

  for (let i = 0; i < n; i++) {
    // Width at each row (expands from top, mirrors at center)
    const width = i < center
      ? 2 + i * 2
      : 2 + (n - 1 - i) * 2
    if (width <= 0) continue

    const start = Math.floor((n - width) / 2)
    const end   = start + width - 1

    for (let j = 0; j < n; j++) {
      if (j < start || j > end) {
        m[i][j] = 0
      } else if (width <= solidThreshold) {
        // Tip rows: solid fill
        m[i][j] = 1
      } else {
        // Body rows: hollow — only outer `thickness` pegs per side
        m[i][j] = (j < start + thickness || j > end - thickness) ? 1 : 0
      }
    }
  }
  return m
}

/**
 * Mock Leno: simulates leno (gauze) weave with alternating open and dense rows.
 */
export function generateMockLeno(n: number = 8): WeaveMatrix {
  n = Math.max(4, n % 2 === 0 ? n : n + 1)
  const m = zeros(n, n)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i % 2 === 0) {
        // Alternating warp/weft (open)
        m[i][j] = j % 2
      } else {
        // Dense interlacement row
        m[i][j] = 1
      }
    }
  }
  return m
}

/**
 * Crepe (Moss Crepe): pseudo-random distribution eliminating visible repeat.
 * Algorithm: start with plain weave base, randomly flip bits at target intensity.
 * Constraints per research: weft floats ≤ 3, warp floats ≤ 2.
 *
 * @param seed       deterministic seed for reproducibility
 * @param n          repeat size (default 8)
 * @param intensity  fraction of bits to flip (0.0–0.5, default 0.2)
 */
export function generateCrepe(seed: number = 42, n: number = 8, intensity: number = 0.2): WeaveMatrix {
  n = clamp(n, 6, 16)
  intensity = clamp(intensity, 0.05, 0.45)

  // Simple seeded PRNG (LCG)
  let rng = seed
  const rand = () => {
    rng = (rng * 1664525 + 1013904223) & 0xffffffff
    return (rng >>> 0) / 0xffffffff
  }

  // Start with plain weave
  const m: WeaveMatrix = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i + j) % 2)
  )

  // Randomly flip bits
  const totalCells = n * n
  const flips = Math.floor(totalCells * intensity)
  for (let f = 0; f < flips; f++) {
    const i = Math.floor(rand() * n)
    const j = Math.floor(rand() * n)
    m[i][j] = m[i][j] ? 0 : 1
  }

  // Auto-correct: enforce weft floats ≤ 3, warp floats ≤ 2
  for (let i = 0; i < n; i++) {
    // Check consecutive 0s in row (weft floats)
    let runLen = 0
    for (let j = 0; j < n; j++) {
      if (m[i][j] === 0) {
        runLen++
        if (runLen > 3) { m[i][j] = 1; runLen = 0 } // auto-correct center bit
      } else { runLen = 0 }
    }
  }
  for (let j = 0; j < n; j++) {
    // Check consecutive 1s in column (warp floats)
    let runLen = 0
    for (let i = 0; i < n; i++) {
      if (m[i][j] === 1) {
        runLen++
        if (runLen > 2) { m[i][j] = 0; runLen = 0 }
      } else { runLen = 0 }
    }
  }

  return m
}

/**
 * Bedford Cord: prominent longitudinal warp lines.
 * Algorithmic repeat = cordEnds × 2.
 */
export function generateBedfordCord(cordEnds: number = 4): WeaveMatrix {
  cordEnds = clamp(cordEnds, 2, 8)
  const repeat = cordEnds * 2
  const m = zeros(repeat, repeat)
  for (let i = 0; i < repeat; i++) {
    for (let j = 0; j < repeat; j++) {
      if (j < cordEnds) {
        // Warp-dominant cord area
        m[i][j] = j % 2 === 0 ? 1 : (i % cordEnds === 0 ? 1 : 0)
      } else {
        // Sunken line area
        m[i][j] = (i + j) % 2
      }
    }
  }
  return m
}

/**
 * Houndstooth: color-and-weave effect on 2/2 balanced twill.
 * Structure is a simple 4/4 twill; visual houndstooth emerges from
 * alternating 4+4 color bands on both warp and weft.
 */
export function generateHoundstooth(): WeaveMatrix {
  // Base: 2/2 balanced twill on 8×8 repeat
  return generateTwill(2, 2, 'Z')
}

/** Color vectors for houndstooth effect: [1,1,1,1,0,0,0,0] repeat */
export const HOUNDSTOOTH_COLOR_VECTOR = [1, 1, 1, 1, 0, 0, 0, 0]

// ─── 7. Validation ────────────────────────────────────────────────────────────

/**
 * Validate a weave matrix:
 * - No row or column that is entirely 0 or entirely 1
 * - Warp float ≤ maxWarpFloat, weft float ≤ maxWeftFloat
 * - Max unique columns ≤ maxShafts
 * Returns array of validation messages (empty = valid).
 */
export function validateMatrix(
  m: WeaveMatrix,
  options: { maxWarpFloat?: number; maxWeftFloat?: number; maxShafts?: number; epi?: number } = {}
): string[] {
  const { maxWarpFloat = 8, maxWeftFloat = 8, maxShafts = 24 } = options
  // EPI-based float limit: max float = floor(EPI * 0.25) per research
  const floatLimit = options.epi ? Math.floor(options.epi * 0.25) : undefined

  const errors: string[] = []
  const rows = m.length
  if (!rows) return ['Empty matrix']
  const cols = m[0].length

  // Row/column all-zero or all-one check
  for (let i = 0; i < rows; i++) {
    const s = m[i].reduce((a, b) => a + b, 0)
    if (s === 0) errors.push(`Row ${i + 1} is entirely weft (never interlaces)`)
    if (s === cols) errors.push(`Row ${i + 1} is entirely warp (never interlaces)`)
  }
  for (let j = 0; j < cols; j++) {
    const s = m.reduce((a, r) => a + r[j], 0)
    if (s === 0) errors.push(`Column ${j + 1} is entirely weft`)
    if (s === rows) errors.push(`Column ${j + 1} is entirely warp`)
  }

  // Float length check: rows (weft floats = consecutive 0s)
  const weftMax = floatLimit ?? maxWeftFloat
  const warpMax = floatLimit ?? maxWarpFloat
  for (let i = 0; i < rows; i++) {
    let run = 0
    for (let j = 0; j < cols; j++) {
      run = m[i][j] === 0 ? run + 1 : 0
      if (run > weftMax) { errors.push(`Weft float > ${weftMax} at row ${i + 1}`); break }
    }
  }
  for (let j = 0; j < cols; j++) {
    let run = 0
    for (let i = 0; i < rows; i++) {
      run = m[i][j] === 1 ? run + 1 : 0
      if (run > warpMax) { errors.push(`Warp float > ${warpMax} at col ${j + 1}`); break }
    }
  }

  // Shaft limit: count unique column patterns
  const colSigs = new Set(m[0].map((_, j) => m.map(r => r[j]).join('')))
  if (colSigs.size > maxShafts) {
    errors.push(`Requires ${colSigs.size} shafts (limit: ${maxShafts}). Jacquard-only.`)
  }

  return errors
}

/** Count required shafts for a matrix */
export function countRequiredShafts(m: WeaveMatrix): number {
  if (!m.length) return 0
  const sigs = new Set(m[0].map((_, j) => m.map(r => r[j]).join('')))
  return sigs.size
}

// ─── 8. Artistic / Creative Pattern Generators ────────────────────────────────

/**
 * Resolution validation: checks if a pattern type can be meaningfully
 * rendered at the requested grid size. Returns suggestions if too small.
 */
export interface ResolutionCheck {
  feasible: boolean
  minSize: number
  recommended: number
  reason?: string
  suggestion?: string
}

const PATTERN_MIN_SIZES: Record<string, { min: number; rec: number; label: string }> = {
  circle:    { min: 8,  rec: 12, label: 'circular shape' },
  ring:      { min: 8,  rec: 12, label: 'ring/donut shape' },
  floral:    { min: 8,  rec: 12, label: 'floral petal pattern' },
  tiger:     { min: 6,  rec: 8,  label: 'tiger stripe pattern' },
  leopard:   { min: 8,  rec: 12, label: 'leopard spot pattern' },
  peacock:   { min: 10, rec: 16, label: 'peacock feather pattern' },
  hexagonal: { min: 6,  rec: 8,  label: 'hexagonal mesh' },
  wave:      { min: 6,  rec: 8,  label: 'wave/ripple pattern' },
  star:      { min: 8,  rec: 12, label: 'star burst pattern' },
  chevron:   { min: 4,  rec: 8,  label: 'chevron pattern' },
  spiral:    { min: 8,  rec: 12, label: 'spiral pattern' },
  cross:     { min: 6,  rec: 8,  label: 'cross/lattice pattern' },
  scale:     { min: 6,  rec: 8,  label: 'fish scale pattern' },
  heart:     { min: 8,  rec: 12, label: 'heart shape' },
  arrow:     { min: 6,  rec: 8,  label: 'arrow pattern' },
}

export function checkResolution(patternType: string, requestedSize: number): ResolutionCheck {
  const info = PATTERN_MIN_SIZES[patternType]
  if (!info) return { feasible: true, minSize: 4, recommended: 8 }
  
  if (requestedSize < info.min) {
    return {
      feasible: false,
      minSize: info.min,
      recommended: info.rec,
      reason: `A smooth ${info.label} is not realistically achievable in ${requestedSize}×${requestedSize} resolution.`,
      suggestion: `Recommended minimum: ${info.min}×${info.min}. For best results use ${info.rec}×${info.rec} or larger.`,
    }
  }
  if (requestedSize < info.rec) {
    return {
      feasible: true,
      minSize: info.min,
      recommended: info.rec,
      reason: `${requestedSize}×${requestedSize} will produce a pixelated ${info.label}. It works but won't be smooth.`,
      suggestion: `For a cleaner result, consider using ${info.rec}×${info.rec}.`,
    }
  }
  return { feasible: true, minSize: info.min, recommended: info.rec }
}

/**
 * Tiger stripe: diagonal bands of varying width to simulate organic tiger markings.
 * Uses alternating thick/thin diagonal bands with slight irregularity.
 */
export function generateTigerStripe(n: number = 8): WeaveMatrix {
  n = clamp(n, 6, 32)
  const m = zeros(n, n)
  const bandWidth = Math.max(2, Math.floor(n / 4))
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const diag = (i + j) % n
      const band = Math.floor(diag / bandWidth) % 2
      // Add slight irregularity with secondary diagonal
      const wobble = ((i * 3 + j * 7) % 5) < 1 ? 1 : 0
      m[i][j] = (band === 0) ? 1 : wobble
    }
  }
  return ensureInterlacement(m)
}

/**
 * Leopard spot: scattered oval clusters against a background.
 * Each spot is a small diamond shape placed at pseudo-random positions.
 */
export function generateLeopardSpot(n: number = 12): WeaveMatrix {
  n = clamp(n, 8, 32)
  const m = zeros(n, n)
  // Fill background with plain weave base
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      m[i][j] = (i + j) % 2
  
  // Place spots using deterministic pseudo-random positions
  const spotSize = Math.max(2, Math.floor(n / 5))
  const spots = [
    [Math.floor(n * 0.2), Math.floor(n * 0.3)],
    [Math.floor(n * 0.6), Math.floor(n * 0.15)],
    [Math.floor(n * 0.4), Math.floor(n * 0.7)],
    [Math.floor(n * 0.8), Math.floor(n * 0.5)],
    [Math.floor(n * 0.1), Math.floor(n * 0.8)],
  ]
  for (const [cy, cx] of spots) {
    for (let di = -spotSize; di <= spotSize; di++) {
      for (let dj = -spotSize; dj <= spotSize; dj++) {
        if (Math.abs(di) + Math.abs(dj) <= spotSize) {
          const ri = (cy + di + n) % n
          const rj = (cx + dj + n) % n
          m[ri][rj] = 1
        }
      }
    }
  }
  return ensureInterlacement(m)
}

/**
 * Floral petal: radial petal shapes emanating from center.
 * Creates a flower-like motif using distance + angle calculations.
 */
export function generateFloral(n: number = 12): WeaveMatrix {
  n = clamp(n, 8, 32)
  const m = zeros(n, n)
  const cx = (n - 1) / 2
  const cy = (n - 1) / 2
  const maxR = n / 2 - 1
  const petals = n >= 12 ? 6 : 4
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dx = j - cx
      const dy = i - cy
      const r = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)
      
      // Petal shape: modulate radius by angle
      const petalR = maxR * (0.5 + 0.5 * Math.cos(petals * angle))
      
      if (r <= 1.5) {
        m[i][j] = 1 // center dot
      } else if (r <= petalR && r > 1.5) {
        m[i][j] = 1 // petal
      } else {
        m[i][j] = (i + j) % 2 // background plain weave
      }
    }
  }
  return ensureInterlacement(m)
}

/**
 * Circular / ring pattern: concentric rings with alternating fill.
 */
export function generateCircle(n: number = 12): WeaveMatrix {
  n = clamp(n, 8, 32)
  const m = zeros(n, n)
  const cx = (n - 1) / 2
  const cy = (n - 1) / 2
  const maxR = n / 2 - 0.5
  const ringWidth = Math.max(1.5, n / 6)
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const r = Math.sqrt((j - cx) ** 2 + (i - cy) ** 2)
      if (r > maxR) {
        m[i][j] = (i + j) % 2 // background
      } else {
        const ring = Math.floor(r / ringWidth)
        m[i][j] = ring % 2 === 0 ? 1 : 0
      }
    }
  }
  return ensureInterlacement(m)
}

/**
 * Peacock feather: elongated eye shape with concentric rings inside.
 */
export function generatePeacock(n: number = 16): WeaveMatrix {
  n = clamp(n, 10, 32)
  const m = zeros(n, n)
  const cx = (n - 1) / 2
  const cy = (n - 1) / 2
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dx = (j - cx) / (n / 3)
      const dy = (i - cy) / (n / 2) // elongate vertically
      const r = Math.sqrt(dx * dx + dy * dy)
      
      if (r < 0.25) {
        m[i][j] = 1 // inner eye
      } else if (r < 0.5) {
        m[i][j] = 0 // first ring
      } else if (r < 0.75) {
        m[i][j] = 1 // second ring
      } else if (r < 1.0) {
        m[i][j] = (i + j) % 2 // feathered edge
      } else {
        m[i][j] = (i + j) % 2 // background
      }
    }
  }
  return ensureInterlacement(m)
}

/**
 * Hexagonal mesh: tessellated hexagons creating a honeycomb-like mesh.
 */
export function generateHexMesh(n: number = 8): WeaveMatrix {
  n = clamp(n, 6, 32)
  const m = zeros(n, n)
  const cellH = Math.max(3, Math.floor(n / 2))
  const cellW = Math.max(3, Math.floor(n / 2))
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const row = i % cellH
      const col = j % cellW
      const offset = (Math.floor(i / cellH) % 2) * Math.floor(cellW / 2)
      const adjCol = (j + offset) % cellW
      
      // Hex edge detection
      const isEdge = row === 0 || adjCol === 0 || adjCol === cellW - 1
      m[i][j] = isEdge ? 1 : (i + j) % 2
    }
  }
  return ensureInterlacement(m)
}

/**
 * Wave / ripple: sinusoidal wave pattern for flowing fabric texture.
 */
export function generateWave(n: number = 8): WeaveMatrix {
  n = clamp(n, 6, 32)
  const m = zeros(n, n)
  const freq = 2 * Math.PI / n
  const amp = n / 4
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const wave = Math.sin(freq * j * 2) * amp
      const dist = Math.abs(i - (n / 2 + wave))
      m[i][j] = dist < amp / 2 ? 1 : (i + j) % 2
    }
  }
  return ensureInterlacement(m)
}

/**
 * Star burst: radial star with pointed tips.
 */
export function generateStar(n: number = 12): WeaveMatrix {
  n = clamp(n, 8, 32)
  const m = zeros(n, n)
  const cx = (n - 1) / 2
  const cy = (n - 1) / 2
  const points = n >= 12 ? 8 : 6
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dx = j - cx
      const dy = i - cy
      const r = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)
      const maxR = (n / 2 - 1) * (0.4 + 0.6 * Math.abs(Math.cos(points / 2 * angle)))
      
      m[i][j] = r <= maxR ? 1 : (i + j) % 2
    }
  }
  return ensureInterlacement(m)
}

/**
 * Chevron: V-shaped repeating pattern (similar to herringbone but with solid fill).
 */
export function generateChevron(n: number = 8): WeaveMatrix {
  n = clamp(n, 4, 32)
  const m = zeros(n, n)
  const half = Math.floor(n / 2)
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const vShape = Math.abs(j - half)
      m[i][j] = ((i + vShape) % n) < half ? 1 : 0
    }
  }
  return ensureInterlacement(m)
}

/**
 * Spiral: outward-growing spiral from center.
 */
export function generateSpiral(n: number = 12): WeaveMatrix {
  n = clamp(n, 8, 32)
  const m = zeros(n, n)
  const cx = (n - 1) / 2
  const cy = (n - 1) / 2
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const dx = j - cx
      const dy = i - cy
      const r = Math.sqrt(dx * dx + dy * dy)
      const angle = Math.atan2(dy, dx)
      // Spiral equation: r = a + b*theta
      const spiralR = (angle + Math.PI) / (2 * Math.PI) * (n / 2)
      const dist = Math.abs(r - spiralR) % (n / 4)
      m[i][j] = dist < n / 8 ? 1 : (i + j) % 2
    }
  }
  return ensureInterlacement(m)
}

/**
 * Cross / Lattice: intersecting vertical and horizontal bands.
 */
export function generateCross(n: number = 8): WeaveMatrix {
  n = clamp(n, 6, 32)
  const m = zeros(n, n)
  const cx = Math.floor(n / 2)
  const thickness = Math.max(1, Math.floor(n / 4))
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const inVertical = Math.abs(j - cx) < thickness
      const inHorizontal = Math.abs(i - cx) < thickness
      m[i][j] = (inVertical || inHorizontal) ? 1 : (i + j) % 2
    }
  }
  return ensureInterlacement(m)
}

/**
 * Fish scale: overlapping semicircular scales.
 */
export function generateScale(n: number = 8): WeaveMatrix {
  n = clamp(n, 6, 32)
  const m = zeros(n, n)
  const scaleH = Math.max(3, Math.floor(n / 2))
  const scaleW = Math.max(3, Math.floor(n / 2))
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const row = i % scaleH
      const offset = (Math.floor(i / scaleH) % 2) * Math.floor(scaleW / 2)
      const col = (j + offset) % scaleW
      
      const cx = (scaleW - 1) / 2
      const cy = scaleH - 1
      const r = Math.sqrt((col - cx) ** 2 + (row - cy) ** 2)
      m[i][j] = r <= scaleH * 0.8 ? 1 : (i + j) % 2
    }
  }
  return ensureInterlacement(m)
}

/**
 * Heart shape: renders a heart in the matrix.
 */
export function generateHeart(n: number = 12): WeaveMatrix {
  n = clamp(n, 8, 32)
  const m = zeros(n, n)
  const cx = (n - 1) / 2
  const cy = (n - 1) / 2
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      // Normalize coordinates to [-1, 1]
      const x = (j - cx) / (n / 2.5)
      const y = -(i - cy) / (n / 2.5) // flip Y for math coords
      // Heart implicit equation: (x²+y²-1)³ - x²y³ < 0
      const val = (x * x + y * y - 1) ** 3 - x * x * y * y * y
      m[i][j] = val <= 0 ? 1 : (i + j) % 2
    }
  }
  return ensureInterlacement(m)
}

/**
 * Arrow pattern: repeating arrow/chevron pointing upward.
 */
export function generateArrow(n: number = 8): WeaveMatrix {
  n = clamp(n, 6, 32)
  const m = zeros(n, n)
  const half = Math.floor(n / 2)
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const distFromCenter = Math.abs(j - half)
      // Arrow shape: top narrows, bottom is stem
      if (i < half) {
        m[i][j] = distFromCenter <= (half - i) ? 1 : 0
      } else {
        m[i][j] = distFromCenter <= 1 ? 1 : 0 // stem
      }
    }
  }
  return ensureInterlacement(m)
}

/**
 * Ensure every row and column has at least one interlacement point.
 * This prevents structurally impossible all-0 or all-1 rows/columns.
 */
function ensureInterlacement(m: WeaveMatrix): WeaveMatrix {
  const rows = m.length
  const cols = m[0]?.length ?? 0
  for (let i = 0; i < rows; i++) {
    const sum = m[i].reduce((a, b) => a + b, 0)
    if (sum === 0) m[i][i % cols] = 1          // all weft → add a warp point
    if (sum === cols) m[i][(i + 1) % cols] = 0  // all warp → add a weft point
  }
  for (let j = 0; j < cols; j++) {
    const sum = m.reduce((a, r) => a + r[j], 0)
    if (sum === 0) m[j % rows][j] = 1
    if (sum === rows) m[(j + 1) % rows][j] = 0
  }
  return m
}

