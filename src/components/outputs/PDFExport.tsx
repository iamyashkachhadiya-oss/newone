'use client'

import { useDesignStore } from '@/lib/store/designStore'

// ── Design tokens ──────────────────────────────────────────────────────────────
const INK    = '#1A1A2E'     // primary text
const RUBY   = '#E0115F'     // accent
const MUTED  = '#6B6880'     // secondary text
const BORDER = '#D8D4E0'     // grid / card borders
const SURF   = '#F8F7FA'     // alternate row / card bg
const WHITE  = '#FFFFFF'

// ── SVG Logo (small, used in every header) ────────────────────────────────────
const LOGO_SVG = `<svg width="26" height="26" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle;">
  <rect x="2" y="2" width="28" height="28" rx="8" fill="${RUBY}" />
  <path d="M16 4 Q16 16 28 16 Q16 16 16 28 Q16 16 4 16 Q16 16 16 4" fill="white" />
</svg>`

// ── Color helpers ─────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string,string> = {
  ivory:'#FFFFF0',cream:'#FFFDD0',white:'#F5F5F7',black:'#1D1D1F',navy:'#1B3A6B',
  red:'#C41E3A',maroon:'#800020',gold:'#E8A838',amber:'#E8A838',yellow:'#F4D03F',
  orange:'#E67E22',green:'#27AE60',blue:'#2980B9',pink:'#E8909C',grey:'#888888',
  gray:'#888888',silver:'#C0C0C0',brown:'#6D4C41',beige:'#F5F5DC',teal:'#008080',purple:'#7B1FA2',
}
const resolveHex = (c:string,fb:string) => !c?fb:c.startsWith('#')?c:(COLOR_MAP[c.toLowerCase().trim()]??fb)

// ── Section heading ───────────────────────────────────────────────────────────
// Returns HTML string for a corporate-style section label
function H(label:string, mt=14):string {
  return `<div style="margin-top:${mt}px;margin-bottom:6px;display:flex;align-items:center;gap:8px;">
    <div style="width:3px;height:13px;background:${RUBY};border-radius:2px;flex-shrink:0;"></div>
    <span style="font-size:8px;font-weight:800;color:${INK};text-transform:uppercase;letter-spacing:.12em;">${label}</span>
    <div style="flex:1;height:1px;background:${BORDER};"></div>
  </div>`
}

// ── Info cell (key/value pair) ────────────────────────────────────────────────
function cell(key:string, val:string, rb=false):string {
  return `<div style="padding:7px 10px;border:1px solid ${BORDER};border-radius:5px;background:${WHITE};">
    <div style="font-size:7.5px;font-weight:600;color:${MUTED};text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">${key}</div>
    <div style="font-size:11.5px;font-weight:700;color:${rb?RUBY:INK};">${val}</div>
  </div>`
}

// ── Shared page header (lightweight corporate style) ──────────────────────────
function header(designName:string, designNum:string, pageNum:string, subtitle:string):string {
  const now = new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})
  return `
  <div style="margin-bottom:0;">
    <!-- Top accent bar -->
    <div style="height:3.5px;background:linear-gradient(90deg,${RUBY} 0%,rgba(224,17,95,0.25) 60%, transparent 100%);margin-bottom:10px;"></div>
    <!-- Header row -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:9px;border-bottom:1.5px solid ${BORDER};">
      <!-- Brand -->
      <div style="display:flex;align-items:center;gap:9px;">
        ${LOGO_SVG}
        <div>
          <div style="font-size:15px;font-weight:800;letter-spacing:-0.04em;color:${INK};">Fabric<span style="color:${RUBY};">AI</span> Studio</div>
          <div style="font-size:7.5px;color:${MUTED};letter-spacing:.12em;text-transform:uppercase;margin-top:0px;">Solerix Technologies · Textile Engineering</div>
        </div>
      </div>
      <!-- Doc meta -->
      <div style="text-align:right;">
        <div style="font-size:13px;font-weight:800;color:${INK};letter-spacing:-0.01em;">${designName||'Untitled Design'}</div>
        <div style="font-size:8.5px;color:${MUTED};margin-top:2px;">${designNum||'—'} &nbsp;|&nbsp; ${subtitle} &nbsp;|&nbsp; ${now}</div>
      </div>
    </div>
    <!-- Sub-bar: report type + page -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0 8px;">
      <div style="font-size:8px;color:${MUTED};font-weight:500;letter-spacing:.04em;">INDUSTRIAL TEXTILE ENGINEERING REPORT</div>
      <div style="font-size:8px;color:${MUTED};">${pageNum}</div>
    </div>
  </div>`
}

// ── Page border wrapper ───────────────────────────────────────────────────────
function pageWrap(content:string):string {
  return `<div style="border:1.5px solid ${BORDER};border-radius:6px;padding:14px 16px;min-height:250mm;position:relative;">${content}</div>`
}

// ── Page footer ───────────────────────────────────────────────────────────────
function footer(designNum:string, page:string):string {
  return `<div style="position:absolute;bottom:10px;left:16px;right:16px;border-top:1px solid ${BORDER};padding-top:5px;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:7.5px;color:${MUTED};">FabricaAI Studio — Solerix Technologies · Confidential</span>
    <span style="font-size:7.5px;color:${MUTED};">${designNum} · ${page}</span>
  </div>`
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function downloadPDF() {
  const state             = useDesignStore.getState()
  const { identity, warp, weftSystem, loom, calcOutputs } = state
  const draftSeq          = state.draftSequence
  const borderShaftsUsed  = state.borderShaftsUsed
  const borderEnds        = state.borderEnds
  const shaftCount        = state.shaftCount
  const rowYarnMap        = state.rowYarnMap
  const cellYarnMap       = state.cellYarnMap

  const warpHex = resolveHex(warp?.colour_hex||warp?.colour_code||'','#1B3A6B')
  const weftHex = resolveHex(weftSystem.yarns[0]?.colour_hex||weftSystem.yarns[0]?.colour_code||'','#E8A838')
  const designNum  = identity.design_number || 'Draft'
  const designName = identity.design_name || '—'

  // ── Peg plan SVG ────────────────────────────────────────────────────────────
  const pegMatrix  = state.pegPlanMatrix
  const cellPx     = 8
  const pegSVGRows = pegMatrix.length>0
    ? pegMatrix.map((row,ri)=>row.map((cell,ci)=>
        `<rect x="${ci*cellPx}" y="${ri*cellPx}" width="${cellPx-1}" height="${cellPx-1}" rx="1"
          fill="${cell?warpHex:'none'}" stroke="${BORDER}" stroke-width="0.5"/>`
      ).join('')).join('')
    : ''
  const pegCols = pegMatrix[0]?.length||0
  const pegSVGW = pegCols*cellPx
  const pegSVGH = pegMatrix.length*cellPx

  // ── Draft threading SVG ──────────────────────────────────────────────────────
  const numShafts    = shaftCount||8
  const numEnds      = draftSeq.length||numShafts
  const draftSVGRows = Array.from({length:numShafts},(_,si)=>{
    const shaft = si+1
    return Array.from({length:numEnds},(_,ei)=>{
      const filled = draftSeq[ei]===shaft
      return `<rect x="${ei*cellPx}" y="${si*cellPx}" width="${cellPx-1}" height="${cellPx-1}" rx="1"
        fill="${filled?RUBY:'none'}" stroke="#C8C8CC" stroke-width="0.5"/>`
    }).join('')
  }).join('')
  const draftSVGW = numEnds*cellPx
  const draftSVGH = numShafts*cellPx

  // Draft text lines
  const draftTextLines = Array.from({length:numShafts},(_,si)=>{
    const shaft = si+1
    const ends  = draftSeq.map((s,i)=>({s,e:i+1})).filter(x=>x.s===shaft).map(x=>x.e)
    return ends.length
      ? `<tr><td style="font-family:monospace;font-size:8.5px;padding:2px 6px;border-bottom:1px solid ${SURF};color:${RUBY};"><strong>S${shaft}</strong> → ${ends.join(', ')}</td></tr>`
      : `<tr><td style="font-family:monospace;font-size:8.5px;padding:2px 6px;color:#C7C7CC;">S${shaft} → —</td></tr>`
  }).join('')

  // Peg plan text lines
  const pegTextLines = state.pegPlanText
    ? state.pegPlanText.split('\n').filter(Boolean).map(l=>
        `<tr><td style="font-family:monospace;font-size:8.5px;padding:2px 6px;border-bottom:1px solid ${SURF};color:${INK};">${l}</td></tr>`
      ).join('')
    : `<tr><td style="color:${MUTED};font-size:9px;padding:4px;">No peg plan defined</td></tr>`

  // ── Fabric sim SVG (tiled weave) ──────────────────────────────────────────────
  const wMatrix = state.weaveMatrix.length>0?state.weaveMatrix:state.pegPlanMatrix
  const fabCols = wMatrix[0]?.length||0
  const fabRows = wMatrix.length
  const fp=2, maxFab=200
  const tilesX = fabCols>0?Math.ceil(maxFab/(fabCols*fp))+1:0
  const tilesY = fabRows>0?Math.ceil(maxFab/(fabRows*fp))+1:0
  const fabW   = Math.min(tilesX*fabCols*fp,maxFab)
  const fabH   = Math.min(tilesY*fabRows*fp,maxFab)
  let fabRects = ''
  if(fabCols>0&&fabRows>0){
    for(let ty=0;ty<tilesY;ty++)
      for(let tx=0;tx<tilesX;tx++)
        for(let r=0;r<fabRows;r++)
          for(let c=0;c<fabCols;c++){
            const x=(tx*fabCols+c)*fp, y=(ty*fabRows+r)*fp
            if(x>=fabW||y>=fabH)continue
            fabRects+=`<rect x="${x}" y="${y}" width="${fp}" height="${fp}" fill="${wMatrix[r]?.[c]===1?warpHex:weftHex}"/>`
          }
  }

  // ── Weft rows ────────────────────────────────────────────────────────────────
  const weftTableRows = weftSystem.yarns.map((y,i)=>
    `<tr style="${i%2===0?`background:${SURF};`:''}">
      <td>
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:12px;height:12px;border-radius:3px;background:${y.colour_hex||'#888'};border:1px solid rgba(0,0,0,0.12);display:inline-block;flex-shrink:0;"></span>
          <span style="font-weight:600;color:${INK};">${y.label}</span>
        </div>
      </td>
      <td>${y.count_value}${y.count_system==='denier'?'D':'Ne'}</td>
      <td>${y.material}</td>
      <td>${y.nozzle_config.sequence.join(', ')}</td>
      <td>${y.nozzle_config.pressure_bar} bar</td>
      <td>${y.properties.shrinkage_min_pct}–${y.properties.shrinkage_max_pct}%</td>
    </tr>`
  ).join('')

  // ── Weft Sequence Plan ────────────────────────────────────────────────────────
  const yarns    = weftSystem.yarns
  const picklist = pegMatrix.length>0
    ? Array.from({length:pegMatrix.length},(_,r)=>{
        const yarnId = rowYarnMap[r]??yarns[0]?.id??''
        const yarn   = yarns.find(y=>y.id===yarnId)
        const unique = new Set<string>()
        if(yarnId) unique.add(yarnId)
        const cols = pegMatrix[0]?.length??0
        for(let c=0;c<cols;c++){const k=`${r}_${c}`;if(cellYarnMap[k])unique.add(cellYarnMap[k])}
        const isCramming = unique.size>1
        const extraYarns = Array.from(unique).filter(id=>id!==yarnId)
          .map(id=>yarns.find(y=>y.id===id)).filter(Boolean) as typeof yarns
        return {pick:r+1,yarn,yarnId,nozzle:yarn?.nozzle_config?.sequence?.[0]??1,isCramming,extraYarns}
      })
    : []

  const yarnCounts:Record<string,number>={}
  picklist.forEach(p=>{yarnCounts[p.yarnId]=(yarnCounts[p.yarnId]||0)+1})
  const totalPicks    = picklist.length
  const crammingCount = picklist.filter(p=>p.isCramming).length
  const totalRepeats  = totalPicks>0?Math.round(((loom?.target_ppi??60)*39.37*5.5)/totalPicks):0

  // Visible picks (max 30 rows to fit page)
  const visiblePicks = picklist.slice(0,30)

  const pickRows = visiblePicks.map((p,idx)=>{
    const colorHex   = p.yarn?.colour_hex??'#888888'
    const countLabel = p.yarn?`${p.yarn.count_value}${p.yarn.count_system==='denier'?'D':'Ne'}`:'—'
    return `<tr style="${idx%2===0?`background:${SURF};`:''}">
      <td style="font-weight:700;color:${INK};padding:4px 7px;text-align:center;">${p.pick}</td>
      <td style="padding:4px 7px;color:${INK};font-weight:500;">${p.yarn?.label??'—'}${p.isCramming&&p.extraYarns.length>0?`<span style="font-size:8px;color:${MUTED};margin-left:4px;">+${p.extraYarns.map(y=>y.label).join(', ')}</span>`:''}</td>
      <td style="padding:4px 7px;text-align:center;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;border-radius:50%;background:#FAE8EF;color:${RUBY};font-size:8.5px;font-weight:800;">N${p.nozzle}</span>
      </td>
      <td style="padding:4px 7px;">
        <div style="display:flex;align-items:center;gap:5px;">
          <span style="width:20px;height:12px;border-radius:2px;background:${colorHex};border:1px solid rgba(0,0,0,0.1);display:inline-block;"></span>
          <span style="font-size:8px;color:${MUTED};font-family:monospace;">${colorHex.toUpperCase()}</span>
        </div>
      </td>
      <td style="padding:4px 7px;color:${INK};font-weight:500;">${countLabel}</td>
      <td style="padding:4px 7px;">
        ${p.isCramming
          ?`<span style="background:#FFF0E6;color:#EA580C;font-weight:700;font-size:8px;padding:2px 6px;border-radius:3px;border:1px solid rgba(234,88,12,0.2);">WC · Cramming</span>`
          :`<span style="color:${MUTED};font-size:9px;">Normal</span>`}
      </td>
    </tr>`
  }).join('')

  const ratioBar = yarns.map(y=>{
    const cnt=yarnCounts[y.id]??0
    const pct=totalPicks>0?(cnt/totalPicks)*100:0
    return pct===0?'':`<div style="width:${pct}%;background:${y.colour_hex||'#888'};height:100%;" title="${y.label}: ${pct.toFixed(1)}%"></div>`
  }).join('')

  const ratioLegend = yarns.map(y=>{
    const cnt=yarnCounts[y.id]??0
    const pct=totalPicks>0?((cnt/totalPicks)*100).toFixed(1):'0'
    return `<div style="display:flex;align-items:center;gap:5px;font-size:9px;">
      <span style="width:9px;height:9px;border-radius:2px;background:${y.colour_hex||'#888'};border:1px solid rgba(0,0,0,0.1);display:inline-block;flex-shrink:0;"></span>
      <span style="color:${INK};font-weight:600;">N${y.nozzle_config?.sequence?.[0]??1}</span>
      <span style="color:${MUTED};">${y.label}</span>
      <span style="color:${RUBY};font-weight:700;">${pct}%</span>
    </div>`
  }).join('')

  // ── Simulation data ──────────────────────────────────────────────────────────
  const sim = calcOutputs?.simulation

  const simCards = sim ? [
    {label:'Shrinkage',       value:sim.shrinkage_pct.toFixed(1),           unit:'%',    color:'#a32d2d', pct:Math.min(sim.shrinkage_pct/35,1)},
    {label:'Drape',           value:String(sim.drape_index),                unit:'/ 100',color:RUBY,       pct:sim.drape_index/100},
    {label:'Stiffness',       value:String(sim.stiffness_index),            unit:'/ 100',color:'#854f0b', pct:sim.stiffness_index/100},
    {label:'Fabric Strength', value:sim.strength_n_per_cm.toFixed(1),      unit:'N/cm', color:'#3b6d11', pct:Math.min(sim.strength_n_per_cm/400,1)},
  ] : []

  const simCardsHTML = simCards.map(s=>`
    <div style="padding:8px 10px;border:1px solid ${BORDER};border-radius:5px;background:${WHITE};border-top:2.5px solid ${s.color};">
      <div style="font-size:7.5px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:.06em;">${s.label}</div>
      <div style="font-size:18px;font-weight:800;color:${s.color};letter-spacing:-0.03em;margin-top:1px;">${s.value} <span style="font-size:9px;color:${MUTED};font-weight:500;">${s.unit}</span></div>
      <div style="height:3px;background:#EEE;border-radius:2px;overflow:hidden;margin-top:5px;">
        <div style="height:100%;width:${Math.round(s.pct*100)}%;background:${s.color};border-radius:2px;"></div>
      </div>
    </div>`).join('')

  // Radar SVG
  const radarEntries = sim ? Object.entries({
    stability: sim.dimensional_stability,
    drape:     sim.drape_index,
    softness:  sim.softness,
    strength:  Math.round(Math.min(sim.strength_n_per_cm/4,100)),
    handle:    sim.handle_score,
  }) : []
  const rN=radarEntries.length, rSize=130, rCx=rSize/2, rCy=rSize/2, rMaxR=rSize/2-22
  const rPts=(r:number)=>radarEntries.map((_,i)=>{
    const a=(2*Math.PI*i)/rN-Math.PI/2
    return `${rCx+r*Math.cos(a)},${rCy+r*Math.sin(a)}`
  }).join(' ')
  const rData=radarEntries.map(([,v],i)=>{
    const r=(v/100)*rMaxR,a=(2*Math.PI*i)/rN-Math.PI/2
    return `${rCx+r*Math.cos(a)},${rCy+r*Math.sin(a)}`
  }).join(' ')
  const rAxisLines=radarEntries.map((_,i)=>{
    const a=(2*Math.PI*i)/rN-Math.PI/2
    return `<line x1="${rCx}" y1="${rCy}" x2="${rCx+rMaxR*Math.cos(a)}" y2="${rCy+rMaxR*Math.sin(a)}" stroke="#D0CDD8" stroke-width="0.5"/>`
  }).join('')
  const rLabels=radarEntries.map(([key,val],i)=>{
    const a=(2*Math.PI*i)/rN-Math.PI/2
    const lx=rCx+(rMaxR+16)*Math.cos(a), ly=rCy+(rMaxR+16)*Math.sin(a)
    return `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" style="font-size:6.5px;fill:${MUTED};font-weight:600;">${key} ${val}</text>`
  }).join('')
  const rRings=[0.25,0.5,0.75,1.0].map(p=>
    `<polygon points="${rPts(rMaxR*p)}" fill="none" stroke="#D8D4E0" stroke-width="0.5" opacity="0.7"/>`).join('')
  const radarSVG = rN>0?`
    <svg width="${rSize}" height="${rSize}" viewBox="0 0 ${rSize} ${rSize}" xmlns="http://www.w3.org/2000/svg">
      ${rRings}${rAxisLines}
      <polygon points="${rData}" fill="rgba(224,17,95,0.08)" stroke="${RUBY}" stroke-width="1.8"/>
      ${radarEntries.map(([,v],i)=>{
        const r=(v/100)*rMaxR,a=(2*Math.PI*i)/rN-Math.PI/2
        return `<circle cx="${rCx+r*Math.cos(a)}" cy="${rCy+r*Math.sin(a)}" r="2.5" fill="${RUBY}"/>`
      }).join('')}
      ${rLabels}
    </svg>`:''

  // Alerts
  const alertColors:Record<string,[string,string,string]> = {
    ok:    ['#eaf3de','#3b6d11','#3b6d11'],
    info:  ['#fae8ef',RUBY,RUBY],
    warn:  ['#faeeda','#ba7517','#854f0b'],
    danger:['#fcebeb','#a32d2d','#a32d2d'],
  }
  const alertsHTML = sim?.alerts?.map((a:{severity:string;message:string;fix:string})=>{
    const [bg,bdr,txt]=alertColors[a.severity]??['#F2F2F7','#888','#888']
    return `<div style="font-size:8.5px;padding:6px 9px;border-radius:4px;background:${bg};border-left:2.5px solid ${bdr};margin-bottom:4px;">
      <span style="font-weight:700;color:${txt};">${a.message}</span>
      <span style="color:${txt};opacity:0.75;font-style:italic;margin-left:6px;">— Fix: ${a.fix}</span>
    </div>`
  }).join('')??''

  // ════════════════════════════════════════════════════════════════════════════
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${designNum} — ${designName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    *{margin:0;padding:0;box-sizing:border-box;}
    body{font-family:'Inter',sans-serif;color:${INK};background:#fff;font-size:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .page{width:210mm;min-height:297mm;padding:10mm 10mm 12mm;page-break-after:always;}
    .page:last-child{page-break-after:avoid;}
    .frame{border:1.5px solid ${BORDER};border-radius:7px;padding:14px 16px 48px;min-height:268mm;position:relative;}
    table{width:100%;border-collapse:collapse;}
    th{font-size:8px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:.06em;padding:5px 8px;border-bottom:1.5px solid ${BORDER};text-align:left;background:${SURF};}
    td{padding:4px 8px;border-bottom:1px solid #F0EEF5;vertical-align:middle;font-size:9.5px;color:${INK};}
    .grid2{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
    .grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
    .grid5{display:grid;grid-template-columns:repeat(5,1fr);gap:7px;}
    .matrix-box{overflow:hidden;border:1px solid ${BORDER};border-radius:5px;padding:5px;background:${SURF};display:inline-block;}
    @media print{.page{page-break-after:always;}}
  </style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════
     PAGE 1 — Specifications + Weft Sequence Plan
════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="frame">
    ${header(designName, designNum, 'Page 1 of 2', identity.quality_name||'Technical Report')}

    <!-- ── Identity strip ── -->
    <div class="grid4" style="margin-bottom:2px;">
      ${cell('Design Name',  identity.design_name||'—')}
      ${cell('Design No.',   identity.design_number||'—', true)}
      ${cell('Quality Name', identity.quality_name||'—')}
      ${cell('Customer Ref', identity.customer_ref||'—')}
    </div>

    <!-- ── Warp + Machine (2 col) ── -->
    ${H('Warp Specification')}
    <div class="grid2" style="gap:6px;">
      <div class="grid2">
        ${cell('Count', `${warp?.count_value||'—'}${warp?.count_system==='denier'?'D':'Ne'}${warp?.filament_count?`/${warp.filament_count}f`:''}`, true)}
        ${cell('Material',   warp?.material||'—')}
        ${cell('Luster',     warp?.luster||'—')}
        ${cell('Colour',     warp?.colour_code||'—')}
        ${cell('EPI',        String(calcOutputs?.epi||'—'), true)}
        ${cell('Reed',       `${loom?.reed_count_stockport||'—'}s / ${loom?.ends_per_dent||'—'}EPD`)}
      </div>
      <div>
        ${H('Machine Parameters', 0)}
        <div class="grid2">
          ${cell('Type',       loom?.machine_type?.replace(/_/g,' ')||'—')}
          ${cell('Dobby',      loom?.dobby_type||'—')}
          ${cell('RPM',        String(loom?.machine_rpm||'—'), true)}
          ${cell('Width',      `${loom?.cloth_width_inches||'—'}"`)}
          ${cell('Efficiency', `${loom?.loom_efficiency_pct||'—'}%`)}
          ${cell('Nozzles',    String(weftSystem.total_nozzles_available))}
          ${loom?.sv1_psi?cell('SV1–SV3',`${loom.sv1_psi}/${loom.sv2_psi}/${loom.sv3_psi} PSI`):''}
          ${loom?.sv4_psi?cell('SV4–SV5',`${loom.sv4_psi}/${loom.sv5_psi} PSI`):''}
        </div>
      </div>
    </div>

    <!-- ── Weft System ── -->
    ${H('Weft System — ${weftSystem.yarns.length} Yarn${weftSystem.yarns.length!==1?"s":""}'
      .replace('${weftSystem.yarns.length}', String(weftSystem.yarns.length))
      .replace('${weftSystem.yarns.length!==1?"s":""}', weftSystem.yarns.length!==1?'s':'')
    )}
    <table>
      <thead><tr><th>Yarn</th><th>Count</th><th>Material</th><th>Nozzles</th><th>Pressure</th><th>Shrinkage</th></tr></thead>
      <tbody>${weftTableRows}</tbody>
    </table>

    <!-- ── Key Output Metrics (no pricing) ── -->
    ${calcOutputs ? `
    ${H('Key Output Metrics')}
    <div class="grid5">
      ${[
        ['GSM',          calcOutputs.gsm.toFixed(1),                                                      '#E0115F'],
        ['Linear Wt',    `${calcOutputs.linear_meter_weight_g.toFixed(1)} g/m`,                           '#854f0b'],
        ['Total Ends',   (calcOutputs.total_warp_ends+borderEnds).toLocaleString(),                       '#3b6d11'],
        ['Production',   `${calcOutputs.production_m_per_hr.toFixed(2)} m/hr`,                            '#185fa5'],
        ['Warp / Weft',  `${calcOutputs.warp_cost_pct}% / ${calcOutputs.weft_cost_pct}%`,                 INK],
      ].map(([lbl,val,col])=>`
        <div style="padding:8px 10px;border:1px solid ${BORDER};border-radius:5px;border-top:2.5px solid ${col};background:${WHITE};text-align:center;">
          <div style="font-size:7.5px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:.06em;">${lbl}</div>
          <div style="font-size:14px;font-weight:800;color:${col};margin-top:2px;">${val}</div>
        </div>`).join('')}
    </div>
    <div style="font-size:7.5px;color:${MUTED};margin-top:5px;">
      Production = (${loom?.machine_rpm??'?'} RPM × 60) / (${loom?.target_ppi??'?'} PPI × 39.37) × ${loom?.loom_efficiency_pct??'?'}% efficiency
    </div>` : ''}

    <!-- ── Weft Sequence Plan ── -->
    ${H('Weft Sequence Plan')}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:4px;">
      <div style="font-size:8.5px;color:${MUTED};">
        Repeat: <strong style="color:${INK};">${totalPicks} picks</strong>
        &nbsp;·&nbsp; Est. <strong style="color:${INK};">${totalRepeats}</strong> repeats / 5.5 m cloth
        ${crammingCount>0?`<span style="margin-left:8px;color:#EA580C;font-weight:700;">· ${crammingCount} Weft Cramming row${crammingCount>1?'s':''}</span>`:''}
      </div>
      <span style="font-size:8px;font-weight:700;color:${RUBY};background:#FAE8EF;padding:2px 8px;border-radius:3px;letter-spacing:.04em;text-transform:uppercase;">↺ Auto-Synced · Peg Plan</span>
    </div>

    ${picklist.length>0?`
    <div style="border:1px solid ${BORDER};border-radius:5px;overflow:hidden;">
      <table>
        <thead><tr>
          <th style="text-align:center;">#</th>
          <th>Yarn</th>
          <th style="text-align:center;">Nozzle</th>
          <th>Colour</th>
          <th>Count</th>
          <th>Shed Type</th>
        </tr></thead>
        <tbody>${pickRows}</tbody>
      </table>
      ${picklist.length>30?`<div style="padding:4px 8px;font-size:8px;color:${MUTED};background:${SURF};border-top:1px solid ${BORDER};">Showing first 30 of ${picklist.length} picks · full sequence in app.</div>`:''}
    </div>
    <!-- Ratio bar -->
    <div style="margin-top:7px;padding:8px 10px;border:1px solid ${BORDER};border-radius:5px;background:${SURF};">
      <div style="font-size:7.5px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">Yarn Contribution Ratio</div>
      <div style="display:flex;height:6px;border-radius:99px;overflow:hidden;margin-bottom:6px;">${ratioBar}</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px 14px;">${ratioLegend}</div>
    </div>` : `<div style="color:${MUTED};font-size:9px;padding:8px 0;">No peg plan rows found.</div>`}

    ${footer(designNum, 'Page 1 of 2')}
  </div>
</div>


<!-- ═══════════════════════════════════════════════════════
     PAGE 2 — Peg Plan · Draft Plan · Border · Simulation
════════════════════════════════════════════════════════ -->
<div class="page">
  <div class="frame">
    ${header(designName, designNum, 'Page 2 of 2', 'Pattern Engineering & Simulation')}

    <!-- ── Peg Plan + Draft Plan ── -->
    <div class="grid2">
      <!-- LEFT: Peg Plan -->
      <div>
        ${H('Peg Plan — Sequence', 0)}
        ${state.pegPlanText?`
        <div style="background:${SURF};border:1px solid ${BORDER};border-radius:5px;padding:5px 7px;max-height:50mm;overflow:hidden;margin-bottom:7px;">
          <table style="width:auto;"><tbody>${pegTextLines}</tbody></table>
        </div>`:`<div style="color:${MUTED};font-size:9px;">No peg plan defined</div>`}
        ${H('Peg Plan — Matrix')}
        ${pegMatrix.length>0?`
        <div class="matrix-box">
          <svg width="${pegSVGW}" height="${pegSVGH}" xmlns="http://www.w3.org/2000/svg">${pegSVGRows}</svg>
        </div>
        <div style="margin-top:3px;font-size:7.5px;color:${MUTED};">${pegMatrix.length} picks × ${pegCols} shaft${pegCols!==1?'s':''} · ■ Peg engaged</div>`:
        `<div style="color:${MUTED};font-size:9px;">No matrix</div>`}
      </div>
      <!-- RIGHT: Draft Plan -->
      <div>
        ${H('Draft Plan — Shaft per End', 0)}
        <div style="background:${SURF};border:1px solid ${BORDER};border-radius:5px;padding:5px 7px;max-height:50mm;overflow:hidden;margin-bottom:7px;">
          <table style="width:auto;"><tbody>${draftTextLines}</tbody></table>
        </div>
        ${H('Draft Plan — Threading Matrix')}
        <div class="matrix-box">
          <svg width="${draftSVGW}" height="${draftSVGH}" xmlns="http://www.w3.org/2000/svg">${draftSVGRows}</svg>
        </div>
        <div style="margin-top:3px;font-size:7.5px;color:${MUTED};">${numShafts} shafts × ${numEnds} ends · <span style="color:${RUBY};">■</span> End threaded on shaft</div>
      </div>
    </div>

    <!-- ── Border Design (compact, only if present) ── -->
    ${borderShaftsUsed>0?`
    ${H('Border Design')}
    <div class="grid3" style="margin-bottom:6px;">
      <div style="padding:8px 10px;border:1px solid ${BORDER};border-radius:5px;border-top:2.5px solid ${INK};background:${WHITE};">
        <div style="font-size:7.5px;font-weight:700;color:${MUTED};text-transform:uppercase;">Total Loom Shafts</div>
        <div style="font-size:18px;font-weight:800;color:${INK};">${shaftCount}</div>
      </div>
      <div style="padding:8px 10px;border:1px solid ${BORDER};border-radius:5px;border-top:2.5px solid #EA580C;background:#FFF7ED;">
        <div style="font-size:7.5px;font-weight:700;color:#EA580C;text-transform:uppercase;">Border Shafts</div>
        <div style="font-size:18px;font-weight:800;color:#C2410C;">${borderShaftsUsed}</div>
      </div>
      <div style="padding:8px 10px;border:1px solid ${BORDER};border-radius:5px;border-top:2.5px solid ${RUBY};background:#FAE8EF;">
        <div style="font-size:7.5px;font-weight:700;color:${RUBY};text-transform:uppercase;">Body Budget</div>
        <div style="font-size:18px;font-weight:800;color:${RUBY};">${Math.max(0,shaftCount-borderShaftsUsed)}</div>
      </div>
    </div>
    <div style="height:8px;border-radius:4px;overflow:hidden;background:#EEE;display:flex;margin-bottom:4px;">
      <div style="width:${Math.min((borderShaftsUsed/shaftCount)*100,100)}%;background:#EA580C;border-radius:4px 0 0 4px;"></div>
      <div style="flex:1;background:${RUBY};opacity:0.22;"></div>
    </div>
    <div style="font-size:7.5px;color:${MUTED};margin-bottom:4px;">
      Border: ${borderShaftsUsed} shafts (${Math.round((borderShaftsUsed/shaftCount)*100)}%) · Body: ${Math.max(0,shaftCount-borderShaftsUsed)} shafts
      ${calcOutputs?` · Border ends: ${borderEnds.toLocaleString()} · Body ends: ${calcOutputs.total_warp_ends.toLocaleString()}`:''}
    </div>`:  ''}

    <!-- ── Fabric Simulation ── -->
    ${H('Fabric Simulation')}
    ${sim?`
    <!-- Archetype + material row -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;border:1px solid rgba(224,17,95,0.25);border-radius:5px;background:rgba(224,17,95,0.03);margin-bottom:8px;">
      <div>
        <div style="font-size:7.5px;font-weight:800;color:${RUBY};text-transform:uppercase;letter-spacing:.14em;margin-bottom:2px;">Fabric Profile</div>
        <div style="font-size:14px;font-weight:800;color:${INK};">${sim.archetype.split(' ').map((s:string)=>s[0].toUpperCase()+s.slice(1)).join(' ')}</div>
      </div>
      <div style="font-size:8.5px;color:${MUTED};max-width:230px;text-align:right;line-height:1.5;">${sim.archetype_description}</div>
      <div style="display:flex;gap:6px;">
        <div style="padding:5px 8px;border:1px solid ${BORDER};border-radius:4px;background:${WHITE};text-align:center;">
          <div style="font-size:7px;color:${MUTED};font-weight:700;text-transform:uppercase;">Warp</div>
          <div style="font-size:9.5px;font-weight:700;color:${INK};">${warp?.material||'—'}</div>
        </div>
        <div style="padding:5px 8px;border:1px solid ${BORDER};border-radius:4px;background:${WHITE};text-align:center;">
          <div style="font-size:7px;color:${MUTED};font-weight:700;text-transform:uppercase;">Weave</div>
          <div style="font-size:9.5px;font-weight:700;color:${INK};">${loom?.weave_type?.replace(/_/g,' ')||'—'}</div>
        </div>
      </div>
    </div>
    <!-- Scores + weave preview + radar -->
    <div style="display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:start;margin-bottom:8px;">
      <!-- 2×2 score cards -->
      <div class="grid2">${simCardsHTML}</div>
      <!-- Weave preview -->
      <div>
        <div style="font-size:7.5px;font-weight:700;color:${MUTED};text-transform:uppercase;margin-bottom:4px;">Weave Preview</div>
        <div style="border:1px solid ${BORDER};border-radius:5px;overflow:hidden;display:inline-block;">
          <svg width="${fabW}" height="${fabH}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${fabW}" height="${fabH}" fill="${weftHex}"/>
            ${fabRects}
          </svg>
        </div>
        <div style="font-size:7px;color:#C7C7CC;margin-top:2px;">${fabRows}×${fabCols} · ${warpHex}/${weftHex}</div>
      </div>
      <!-- Radar -->
      <div>
        <div style="font-size:7.5px;font-weight:700;color:${MUTED};text-transform:uppercase;margin-bottom:4px;">Output Profile</div>
        <div style="border:1px solid ${BORDER};border-radius:5px;padding:5px;background:${SURF};display:inline-block;">
          ${radarSVG}
        </div>
      </div>
    </div>
    <!-- Alerts -->
    ${alertsHTML?`<div style="margin-bottom:6px;">${alertsHTML}</div>`:''}
    <!-- Formulas (2-col compact) -->
    <div style="border:1px solid ${BORDER};border-radius:5px;padding:8px 10px;background:${SURF};">
      <div style="font-size:7.5px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">Simulation Formulas</div>
      <div class="grid2">
        ${[
          {n:'Shrinkage',  f:'S% = S_base × (1+regain/100×1.8) × crimp × (1+density×0.25)'},
          {n:'Drape',      f:'D = D_base × weave_mod × (1−density×0.55)^0.4 × ln(Ne/10)/ln(12)'},
          {n:'Stiffness',  f:'ST = ST_base × weave_mod × density^0.6 × (30/Ne)'},
          {n:'Strength',   f:'FS [N/cm] = (T_fiber × density/10 × weave_mod × cover) / (Ne/30)^0.45'},
        ].map(f=>`
          <div style="font-size:8px;margin-bottom:4px;">
            <span style="font-weight:700;color:${INK};">${f.n}:</span>
            <span style="font-family:monospace;color:${MUTED};font-size:7.5px;"> ${f.f}</span>
          </div>`).join('')}
      </div>
    </div>`:`
    <div style="text-align:center;padding:24px 16px;color:${MUTED};font-size:10px;border:1px dashed ${BORDER};border-radius:5px;">
      Fill in yarn + loom specifications to generate fabric simulation output.
    </div>`}

    ${footer(designNum, 'Page 2 of 2')}
  </div>
</div>

<script>window.onload=function(){window.print();}</script>
</body>
</html>`

  const win = window.open('','_blank')
  if(!win){alert('Please allow popups to download the PDF');return}
  win.document.write(html)
  win.document.close()
}

export default function PDFExportButton() {
  return (
    <button
      onClick={downloadPDF}
      className="btn-accent"
      style={{ fontSize: 12, height: 36, padding: '0 16px' }}
    >
      Download PDF
    </button>
  )
}
