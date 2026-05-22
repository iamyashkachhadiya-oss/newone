'use client'

import { useEffect, useState } from 'react'
import { useDesignStore } from '@/lib/store/designStore'

/**
 * Returns a plain-text + structured snapshot of the entire site state
 * that can be sent to the AI as context on every message.
 */
export interface SiteSnapshot {
  activeSection: string
  design: {
    name: string
    number: string
    quality: string
    customerRef: string
  }
  loom: {
    machineType: string
    reeCount: number
    endsPerDent: number
    targetPPI: number
    rpm: number
    clothWidthInches: number
    weaveType: string
    efficiency: number
  } | null
  warp: {
    material: string
    countSystem: string
    countValue: number
    filamentCount: number
  } | null
  weftYarns: { id: string; material: string; count: number; colour: string }[]
  shaftCount: number
  borderEnds: number
  borderShaftsUsed: number
  calcOutputs: {
    epi?: number
    ppi?: number
    gsmFabric?: number
    warpWeight?: number
    weftWeight?: number
    fabricWeight?: number
    productionPerShift?: number
    costPerMeter?: number
  } | null
}

export function useSiteContext() {
  const store = useDesignStore()
  const [activeSection, setActiveSection] = useState('AI Fabric Studio')

  useEffect(() => {
    const handler = (e: Event) => {
      const ctx = (e as CustomEvent).detail?.context
      if (ctx) setActiveSection(ctx)
    }
    window.addEventListener('ai-context-change', handler)
    return () => window.removeEventListener('ai-context-change', handler)
  }, [])

  const calc = store.calcOutputs as any
  const snapshot: SiteSnapshot = {
    activeSection,
    design: {
      name: store.identity?.design_name ?? 'Untitled',
      number: store.identity?.design_number ?? '-',
      quality: store.identity?.quality_name ?? '-',
      customerRef: store.identity?.customer_ref ?? '-',
    },
    loom: store.loom ? {
      machineType: store.loom.machine_type,
      reeCount: store.loom.reed_count_stockport,
      endsPerDent: store.loom.ends_per_dent,
      targetPPI: store.loom.target_ppi,
      rpm: store.loom.machine_rpm,
      clothWidthInches: store.loom.cloth_width_inches,
      weaveType: store.loom.weave_type,
      efficiency: store.loom.loom_efficiency_pct,
    } : null,
    warp: store.warp ? {
      material: store.warp.material,
      countSystem: store.warp.count_system,
      countValue: store.warp.count_value,
      filamentCount: store.warp.filament_count ?? 0,
    } : null,
    weftYarns: (store.weftSystem?.yarns ?? []).map(y => ({
      id: y.id,
      material: y.material,
      count: y.count_value,
      colour: y.colour_code,
    })),
    shaftCount: store.shaftCount,
    borderEnds: store.borderEnds,
    borderShaftsUsed: store.borderShaftsUsed,
    calcOutputs: calc ? {
      epi: calc.epi,
      ppi: calc.ppi,
      gsmFabric: calc.gsm_fabric,
      warpWeight: calc.warp_wt_per_meter,
      weftWeight: calc.weft_wt_per_meter,
      fabricWeight: calc.fabric_wt_per_meter,
      productionPerShift: calc.production_per_shift,
      costPerMeter: calc.cost_per_meter,
    } : null,
  }

  /** Serialise for AI context injection */
  const toPromptString = (): string => {
    const s = snapshot
    const lines: string[] = [
      `=== CURRENT SITE STATE ===`,
      `Active Section: ${s.activeSection}`,
      `Design: "${s.design.name}" | No: ${s.design.number} | Quality: ${s.design.quality} | Customer: ${s.design.customerRef}`,
      `Shafts: ${s.shaftCount} | Border Ends: ${s.borderEnds} | Border Shafts Used: ${s.borderShaftsUsed}`,
    ]
    if (s.loom) {
      lines.push(`Loom: ${s.loom.machineType.toUpperCase()} | Reed: ${s.loom.reeCount} | EPI basis: ${s.loom.reeCount * s.loom.endsPerDent} | PPI target: ${s.loom.targetPPI} | RPM: ${s.loom.rpm} | Width: ${s.loom.clothWidthInches}" | Weave: ${s.loom.weaveType} | Efficiency: ${s.loom.efficiency}%`)
    }
    if (s.warp) {
      lines.push(`Warp Yarn: ${s.warp.material} | ${s.warp.countSystem} ${s.warp.countValue} | Filaments: ${s.warp.filamentCount}`)
    }
    if (s.weftYarns.length > 0) {
      lines.push(`Weft Yarns: ${s.weftYarns.map(y => `${y.material} (${y.count}) ${y.colour}`).join(', ')}`)
    }
    if (s.calcOutputs) {
      const c = s.calcOutputs
      lines.push(`Calculations: EPI=${c.epi ?? '?'} | PPI=${c.ppi ?? '?'} | GSM=${c.gsmFabric ?? '?'} | Fabric wt=${c.fabricWeight ?? '?'} g/m | Production=${c.productionPerShift ?? '?'} m/shift | Cost=${c.costPerMeter ? `₹${c.costPerMeter}/m` : '?'}`)
    }
    lines.push(`=========================`)
    return lines.join('\n')
  }

  return { snapshot, toPromptString }
}
