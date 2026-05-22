'use client'

import { create } from 'zustand'
import type { YarnSpec, LoomSpec, CalcOutputs, Design, WeftSystem, WeftYarn, WarpSystem, WarpYarn, InsertionSequence } from '@/lib/types'
import { createDefaultWeftYarn, createDefaultWarpYarn } from '@/lib/types'
import { runAllCalculations } from '@/lib/calc/engine'
import { runFabricSimulation, type WeaveType } from '@/lib/calc/simulation'
import { createClient } from '@/lib/supabase/client'
import { denierToNe } from '@/lib/calc/engine'
import { textToMatrix } from '@/lib/pegplan/parser'

interface DesignIdentity {
  design_name: string
  design_number: string
  quality_name: string
  customer_ref: string
}

interface DesignState {
  // Identity
  designId: string | null
  draftId: string | null
  identity: DesignIdentity

  // Yarn specs
  warp: YarnSpec | null
  warpSystem: WarpSystem
  weftSystem: WeftSystem

  // Loom
  loom: LoomSpec | null

  // Peg plan & Draft
  shaftCount: number
  pegPlanText: string
  pegPlanMatrix: number[][]
  draftSequence: number[]
  weaveMatrix: number[][]
  // Peg plan colors (Multiple weft colors)
  rowYarnMap: Record<number, string> // row index → yarn id
  cellYarnMap: Record<string, string> // "row_col" → yarn id

  // Calculations
  calcOutputs: CalcOutputs | null

  // ─── Border state (shared across all tabs) ────────────────────────────────
  // Set by BorderForm after compilation; consumed by CalcPanel + PegPlanEditor
  borderShaftsUsed: number   // shafts consumed by left+right border zones
  borderEnds: number         // total warp ends in border zones (left + right)

  // State management
  isDirty: boolean
  isSaving: boolean
  isLoading: boolean
  _recalcTimer?: any

  // Actions
  updateIdentity: (identity: Partial<DesignIdentity>) => void
  updateWarp: (warp: Partial<YarnSpec>) => void
  
  // Warp System Actions
  setWarpMode: (mode: 'simple' | 'advanced') => void
  addWarpYarn: () => void
  updateWarpYarn: (id: string, updates: Partial<WarpYarn>) => void
  removeWarpYarn: (id: string) => void
  
  // Weft System Actions
  setWeftMode: (mode: 'simple' | 'advanced') => void
  addWeftYarn: () => void
  updateWeftYarn: (id: string, updates: Partial<WeftYarn>) => void
  removeWeftYarn: (id: string) => void
  updateInsertionSequence: (pattern: string[]) => void
  setRowYarnMap: (map: Record<number, string>) => void
  setCellYarnMap: (map: Record<string, string>) => void
  setTotalNozzles: (count: number) => void

  updateLoom: (loom: Partial<LoomSpec>) => void
  setShaftCount: (count: number) => void
  setPegPlan: (text: string, matrix: number[][]) => void
  setDraftSequence: (seq: number[]) => void
  setWeaveMatrix: (matrix: number[][]) => void
  // Called by BorderForm after compilation to push constraints into the store
  setBorderCompiled: (shaftsUsed: number, borderEnds: number) => void
  recalculate: () => void
  loadFromSupabase: (designId: string) => Promise<void>
  saveToSupabase: () => Promise<void>
  resetStore: () => void
}

const defaultWarp: YarnSpec = {
  role: 'warp',
  material: 'polyester',
  count_system: 'denier',
  count_value: 75,
  filament_count: 36,
  luster: 'bright',
  colour_code: '',
}

const defaultLoom: LoomSpec = {
  machine_type: 'air_jet',
  dobby_type: 'staubli',
  export_format: '.EP',
  reed_count_stockport: 60,
  ends_per_dent: 2,
  target_ppi: 60,
  machine_rpm: 500,
  cloth_width_inches: 44,
  warp_crimp_pct: 6,
  weft_crimp_pct: 6,
  wastage_pct: 3,
  loom_efficiency_pct: 85,
  weave_type: 'plain',
  loom_tension_cN: 180,
  sv1_psi: 15,
  sv2_psi: 60,
  sv3_psi: 60,
  sv4_psi: 50,
  sv5_psi: 50,
}

const defaultWarpSystem: WarpSystem = {
  mode: 'simple',
  yarns: [createDefaultWarpYarn(0)],
}

const defaultWeftSystem: WeftSystem = {
  mode: 'simple',
  yarns: [createDefaultWeftYarn(0)],
  insertion_sequence: {
    pattern: [],
    repeat_length: 0
  },
  total_nozzles_available: 8
}

export const useDesignStore = create<DesignState>((set, get) => ({
  designId: null,
  draftId: null,
  identity: {
    design_name: '',
    design_number: '',
    quality_name: '',
    customer_ref: '',
  },
  warp: { ...defaultWarp },
  warpSystem: { ...defaultWarpSystem },
  weftSystem: { ...defaultWeftSystem },
  loom: { ...defaultLoom },
  shaftCount: 16,
  // Border compiled state
  borderShaftsUsed: 0,
  borderEnds: 0,
  pegPlanText: '1-->1,3,5,7,9,11,13,15\n2-->2,4,6,8,10,12,14,16\n3-->1,3,5,7,9,11,13,15\n4-->2,4,6,8,10,12,14,16\n5-->1,2,5,6,9,10,13,14\n6-->3,4,7,8,11,12,15,16\n7-->1,2,5,6,9,10,13,14\n8-->3,4,7,8,11,12,15,16',
  pegPlanMatrix: [
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
    [0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],
    [1,1,0,0,1,1,0,0,1,1,0,0,1,1,0,0],
    [0,0,1,1,0,0,1,1,0,0,1,1,0,0,1,1],
  ],
  draftSequence: Array.from({ length: 16 }, (_, i) => i + 1),
  weaveMatrix: [],
  rowYarnMap: {},
  cellYarnMap: {},
  calcOutputs: null,
  isDirty: false,
  isSaving: false,
  isLoading: false,
  _recalcTimer: undefined,

  updateIdentity: (identity) => {
    set((s) => ({
      identity: { ...s.identity, ...identity },
      isDirty: true,
    }))
  },

  updateWarp: (warp) => {
    set((s) => ({
      warp: s.warp ? { ...s.warp, ...warp } : { ...defaultWarp, ...warp },
      isDirty: true,
    }))
  },

  // ─── Warp System Actions ──────────────────────────────────────────────
  setWarpMode: (mode) => {
    set((s) => ({
      warpSystem: { ...s.warpSystem, mode },
      isDirty: true
    }))
    get().recalculate()
  },

  addWarpYarn: () => {
    set((s) => {
      const newYarn = createDefaultWarpYarn(s.warpSystem.yarns.length)
      return {
        warpSystem: {
          ...s.warpSystem,
          yarns: [...s.warpSystem.yarns, newYarn]
        },
        isDirty: true
      }
    })
    get().recalculate()
  },

  updateWarpYarn: (id, updates) => {
    set((s) => ({
      warpSystem: {
        ...s.warpSystem,
        yarns: s.warpSystem.yarns.map(y => y.id === id ? { ...y, ...updates } : y)
      },
      isDirty: true
    }))
    get().recalculate()
  },

  removeWarpYarn: (id) => {
    set((s) => {
      if (s.warpSystem.yarns.length <= 1) return s
      return {
        warpSystem: {
          ...s.warpSystem,
          yarns: s.warpSystem.yarns.filter(y => y.id !== id),
        },
        isDirty: true
      }
    })
    get().recalculate()
  },

  // ─── Weft System Actions ──────────────────────────────────────────────
  setWeftMode: (mode) => {
    set((s) => ({
      weftSystem: { ...s.weftSystem, mode },
      isDirty: true
    }))
    get().recalculate()
  },

  addWeftYarn: () => {
    set((s) => {
      const newYarn = createDefaultWeftYarn(s.weftSystem.yarns.length)
      return {
        weftSystem: {
          ...s.weftSystem,
          yarns: [...s.weftSystem.yarns, newYarn]
        },
        isDirty: true
      }
    })
    get().recalculate()
  },

  updateWeftYarn: (id, updates) => {
    set((s) => ({
      weftSystem: {
        ...s.weftSystem,
        yarns: s.weftSystem.yarns.map(y => y.id === id ? { ...y, ...updates } : y)
      },
      isDirty: true
    }))
    get().recalculate()
  },

  removeWeftYarn: (id) => {
    set((s) => {
      if (s.weftSystem.yarns.length <= 1) return s // Keep at least one
      return {
        weftSystem: {
          ...s.weftSystem,
          yarns: s.weftSystem.yarns.filter(y => y.id !== id),
          insertion_sequence: {
            ...s.weftSystem.insertion_sequence,
            pattern: s.weftSystem.insertion_sequence.pattern.filter(pid => pid !== id)
          }
        },
        isDirty: true
      }
    })
    get().recalculate()
  },

  updateInsertionSequence: (pattern) => {
    set((s) => ({
      weftSystem: {
        ...s.weftSystem,
        insertion_sequence: {
          pattern,
          repeat_length: pattern.length
        }
      },
      isDirty: true
    }))
    get().recalculate()
  },

  setRowYarnMap: (map) => {
    set({ rowYarnMap: map, isDirty: true })
  },

  setCellYarnMap: (map) => {
    set({ cellYarnMap: map, isDirty: true })
  },

  setTotalNozzles: (count) => {
    set((s) => ({
      weftSystem: { ...s.weftSystem, total_nozzles_available: count },
      isDirty: true
    }))
  },

  setBorderCompiled: (shaftsUsed, borderEnds) => {
    set({ borderShaftsUsed: shaftsUsed, borderEnds })
    // Trigger recalculate so CalcPanel updates with border-aware totals
    get().recalculate()
  },

  updateLoom: (loom) => {
    set((s) => ({
      loom: s.loom ? { ...s.loom, ...loom } : { ...defaultLoom, ...loom },
      isDirty: true,
    }))
  },

  setShaftCount: (count) => {
    const { pegPlanText, draftSequence } = get()
    // Re-parse peg plan with new shaft count
    const newMatrix = textToMatrix(pegPlanText, count)
    // Resize draft sequence: keep as many as we have, extend or trim to new count
    const newDraft = Array.from({ length: count }, (_, i) => draftSequence[i] ?? (i + 1))
    set({ shaftCount: count, pegPlanMatrix: newMatrix, draftSequence: newDraft, isDirty: true })
    get().recalculate()
  },

  setPegPlan: (text, matrix) => {
    set({ pegPlanText: text, pegPlanMatrix: matrix })
    get().recalculate()
  },

  setDraftSequence: (seq) => {
    set({ draftSequence: seq })
    get().recalculate()
  },

  setWeaveMatrix: (matrix) => {
    set({ weaveMatrix: matrix, isDirty: true })
  },

  recalculate: () => {
    if ((get() as any)._recalcTimer) {
      clearTimeout((get() as any)._recalcTimer)
    }
    const timer = setTimeout(() => {
      const s = get()
      const { loom, warp, weftSystem, warpSystem, pegPlanMatrix, draftSequence, rowYarnMap, cellYarnMap, borderEnds } = s
      if (!loom || !warp || !weftSystem) return
      const calcOutputs = runAllCalculations(loom, warp, weftSystem, pegPlanMatrix, rowYarnMap, cellYarnMap, draftSequence)

      // ── Apply border constraint to body calculations ──────────────────────
      // Border ends eat into the total cloth width; body only has the remainder.
      if (borderEnds > 0) {
        const bodyEnds = Math.max(0, calcOutputs.total_warp_ends - borderEnds)
        calcOutputs.total_warp_ends = bodyEnds

        // Recalculate warp weight for the reduced body end count
        const warpDenier = warp.count_system === 'denier'
          ? warp.count_value
          : 5315 / warp.count_value
        const crimpFactor  = (100 + loom.warp_crimp_pct) / 100
        const wastageFactor = (100 + loom.wastage_pct) / 100
        calcOutputs.warp_weight_per_100m_g = Math.round(
          (bodyEnds * warpDenier * 100) / 9000 * crimpFactor * wastageFactor * 100
        ) / 100

        // Recalculate warp cost contribution
        const warpPrice = warp.price_per_kg || 0
        const warpCostPerMeter = (calcOutputs.warp_weight_per_100m_g * warpPrice) / 100000
        const weftCostPerMeter = calcOutputs.cost_per_meter - (calcOutputs.cost_per_meter * calcOutputs.warp_cost_pct / 100)
        calcOutputs.cost_per_meter = Math.round((warpCostPerMeter + weftCostPerMeter) * 100) / 100
        const total = warpCostPerMeter + weftCostPerMeter
        calcOutputs.warp_cost_pct = total > 0 ? Math.round((warpCostPerMeter / total) * 100) : 0
        calcOutputs.weft_cost_pct = total > 0 ? Math.round((weftCostPerMeter  / total) * 100) : 0
      }
      
      // Automatically calculate Weave Matrix from Peg Plan and Draft Sequence
      let weaveMatrix: number[][] = pegPlanMatrix
      if (pegPlanMatrix && pegPlanMatrix.length > 0 && draftSequence && draftSequence.length > 0) {
        weaveMatrix = pegPlanMatrix.map(pick => 
          draftSequence.map(shaft => pick[shaft - 1] || 0)
        )
      }
      
      // Run fabric simulation engine
      const activeWarpYarns = warpSystem.yarns.filter(y => y.is_active)
      const warpMaterials = activeWarpYarns.length > 0 
        ? activeWarpYarns.map(y => y.material)
        : [warp.material]
      
      const warpNe = activeWarpYarns.length > 0
        ? activeWarpYarns.reduce((sum, y) => {
            const ne = y.count_system === 'ne' ? y.count_value : denierToNe(y.count_value)
            return sum + ne
          }, 0) / activeWarpYarns.length
        : (warp.count_system === 'ne' ? warp.count_value : denierToNe(warp.count_value))
      
      const densityPicksPerCm = Math.round(loom.target_ppi / 2.54)
      
      try {
        const simOutputs = runFabricSimulation({
          warpMaterials,
          warpNe,
          weftSystem,
          weaveType: loom.weave_type || 'plain',
          densityPicksPerCm,
          loomTensionCN: loom.loom_tension_cN || 180,
          loom,
        })
        calcOutputs.simulation = simOutputs
      } catch (e) {
        console.error('Simulation engine error:', e)
      }
      set({ calcOutputs, weaveMatrix, isDirty: true, _recalcTimer: undefined })
    }, 150)
    set({ _recalcTimer: timer as unknown as NodeJS.Timeout })
  },


  loadFromSupabase: async (designId: string) => {
    set({ isLoading: true })
    try {
      const supabase = createClient()

      const { data: design } = await supabase
        .from('designs')
        .select('*')
        .eq('id', designId)
        .single()

      if (!design) return

      const { data: yarnSpecs } = await supabase
        .from('yarn_specs')
        .select('*')
        .eq('design_id', designId)

      const { data: loomSpec } = await supabase
        .from('loom_specs')
        .select('*')
        .eq('design_id', designId)
        .single()

      const warp = yarnSpecs?.find((y: YarnSpec) => y.role === 'warp') || null
      // Note: Full migration of yarn_specs to WeftSystem from Supabase will require schema updates.
      // For now, we populate a default weftSystem with A/B if they exist to prevent crashes.
      const weftA = yarnSpecs?.find((y: YarnSpec) => y.role === 'weft_a')
      const weftB = yarnSpecs?.find((y: YarnSpec) => y.role === 'weft_b')

      const migrateYarn = (yarn: any, index: number, label: string): WeftYarn => {
        const base = createDefaultWeftYarn(index)
        // Migration: If nozzle_config is a string or malformed, convert to array
        let nozzleConfig = yarn.nozzle_config
        if (typeof nozzleConfig === 'string') {
          const parsed = nozzleConfig.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n))
          nozzleConfig = { ...base.nozzle_config, sequence: parsed.length > 0 ? parsed : [1], nozzle_count: parsed.length || 1 }
        } else if (nozzleConfig && !Array.isArray(nozzleConfig.sequence)) {
          nozzleConfig = { ...base.nozzle_config, ...nozzleConfig, sequence: [1], nozzle_count: 1 }
        }
        
        return {
          ...base,
          ...yarn,
          label: yarn.label || label,
          nozzle_config: { ...base.nozzle_config, ...(nozzleConfig || {}) }
        }
      }

      const initialYarns = []
      if (weftA) initialYarns.push(migrateYarn(weftA, 0, 'Ground Weft'))
      if (weftB) initialYarns.push(migrateYarn(weftB, 1, 'Pattern Weft'))
      if (initialYarns.length === 0) initialYarns.push(createDefaultWeftYarn(0))

      set({
        designId: design.id,
        draftId: design.draft_id,
        identity: {
          design_name: design.design_name || '',
          design_number: design.design_number || '',
          quality_name: design.quality_name || '',
          customer_ref: design.customer_ref || '',
        },
        warp: warp || { ...defaultWarp },
        weftSystem: {
          ...defaultWeftSystem,
          yarns: initialYarns,
          mode: initialYarns.length > 1 ? 'advanced' : 'simple'
        },
        loom: loomSpec || { ...defaultLoom },
        pegPlanText: design.peg_plan_text || '',
        pegPlanMatrix: design.peg_plan_matrix || [],
        weaveMatrix: design.weave_matrix || [],
        isDirty: false,
        isLoading: false,
      })

      get().recalculate()
    } catch (err) {
      console.error('Failed to load design:', err)
      set({ isLoading: false })
    }
  },

  saveToSupabase: async () => {
    const state = get()
    if (!state.designId) return
    set({ isSaving: true })

    try {
      const supabase = createClient()

      await supabase
        .from('designs')
        .update({
          design_name: state.identity.design_name,
          design_number: state.identity.design_number,
          quality_name: state.identity.quality_name,
          customer_ref: state.identity.customer_ref,
          peg_plan_text: state.pegPlanText,
          peg_plan_matrix: state.pegPlanMatrix,
          weave_matrix: state.weaveMatrix,
        })
        .eq('id', state.designId)

      // Save calc outputs
      if (state.calcOutputs) {
        await supabase
          .from('calculated_outputs')
          .upsert({
            design_id: state.designId,
            ...state.calcOutputs,
            calculated_at: new Date().toISOString(),
          }, { onConflict: 'design_id' })
      }

      set({ isDirty: false, isSaving: false })
    } catch (err) {
      console.error('Failed to save:', err)
      set({ isSaving: false })
    }
  },

  resetStore: () => {
    set({
      designId: null,
      draftId: null,
      identity: { design_name: '', design_number: '', quality_name: '', customer_ref: '' },
      warp: { ...defaultWarp },
      warpSystem: { ...defaultWarpSystem },
      weftSystem: { ...defaultWeftSystem },
      loom: { ...defaultLoom },
      shaftCount: 16,
      borderShaftsUsed: 0,
      borderEnds: 0,
      pegPlanText: '',
      pegPlanMatrix: [],
      weaveMatrix: [],
      calcOutputs: null,
      isDirty: false,
      _recalcTimer: undefined,
    })
  },
}))
