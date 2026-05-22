'use client'

import { useDesignStore } from '@/lib/store/designStore'

// ── Shared Config ──
const INK    = '#000000'
const PEN    = '#1d277a' // Blue ink color for handwritten text
const SURF   = '#FFFFFF'

export async function downloadTraditionalPDF() {
  const state = useDesignStore.getState()
  const { identity, warp, weftSystem, loom, calcOutputs } = state
  const draftSeq = state.draftSequence
  const pegMatrix = state.pegPlanMatrix
  
  const designName = identity.design_name || 'Untitled'
  
  // 1. Weave Draft Grid (Printed in black)
  const cellPx = 9
  const gridRows = pegMatrix.length > 0 
    ? pegMatrix.map((row, ri) => row.map((cell, ci) => 
        `<rect x="${ci*cellPx}" y="${ri*cellPx}" width="${cellPx}" height="${cellPx}" 
          fill="${cell ? INK : 'none'}" stroke="${INK}" stroke-width="0.5"/>`
      ).join('')).join('')
    : ''
  const gridW = (pegMatrix[0]?.length || 0) * cellPx
  const gridH = pegMatrix.length * cellPx

  // 2. Threading Draft (પેઢો-૧)
  let threadingStr = ''
  if (draftSeq.length > 0) {
    let currentShaft = draftSeq[0]
    let count = 1
    const parts = []
    for (let i = 1; i < draftSeq.length; i++) {
        if (draftSeq[i] === currentShaft) count++
        else {
            parts.push(`${currentShaft}-${count > 1 ? count : 'x'}`)
            currentShaft = draftSeq[i]
            count = 1
        }
    }
    parts.push(`${currentShaft}-${count > 1 ? count : 'x'}`)
    threadingStr = parts.map(p => `૧-${p}`).join('<br/>') // simplified vertical stacking like the image
  } else {
    threadingStr = '૧-૧૦-૩-૧૦<br/>૩-૧૦-x-૧૦'
  }

  // 3. Main Weave Program (બીમ ચલાવતા)
  const totalEnds = calcOutputs?.total_warp_ends || 2640
  const weftRows = weftSystem.yarns.map((y, i) => {
      const ppi = loom?.target_ppi || 60
      return `ર૪- ૧૪૪- બોડર ૧.૨.૩.૪ <br/>
      ૧૧- 3૪- પેઢોચ-૧ + ૨૯-જા <br/>
      ૨ - ૪ - ૧.૨.૩.૪કોમ<br/>
      ૩૦-૬૦- ટેમ્પલ + ૬૦-જા`
  }).join('<br/><br/>')

  // 4. Color / Warping (વાર્પિંગ)
  const colorPlan = weftSystem.yarns.map((y, idx) => {
      return `૧૪૪- બોડર કોમ<br/>
      ૧૨-{ ૧-કોમ<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;૧-જા<br/>
      A-> ૬૦ { ૪-કોમ<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;૨૯-૧૧-કોમ`
  }).join('<br/><br/>')

  // 5. Peg In Text Format (Printed typewriter)
  const pegText = state.pegPlanText || ''
  let formattedPegText = ''
  if(pegText) {
      formattedPegText = pegText.split(/\n*-{3,}\n*/).flatMap((block, i) => {
          const lines = block.split('\n').map(l=>l.trim()).filter(Boolean)
          if(lines.length===0) return []
          return lines.join('<br/>&nbsp;&nbsp;&nbsp;&nbsp;') + '<br/>------------------------------------'
      }).join('<br/>')
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Traditional Report - ${designName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Hind+Vadodara:wght@400;500;600&display=swap');
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Courier Prime', monospace; 
      color: ${INK}; 
      background: ${SURF}; 
      font-size: 10px; 
      line-height: 1.3; 
    }
    .page { 
      width: 210mm; min-height: 297mm; 
      padding: 10mm 15mm; 
      page-break-after: always; margin: 0 auto; 
    }
    .header { 
      border-bottom: 2px solid ${INK}; 
      padding-bottom: 6px; margin-bottom: 15px; 
      display: flex; justify-content: space-between; 
      font-weight: 700; font-size: 10.5px;
    }
    
    /* Handwritten styling classes */
    .handwritten {
      font-family: 'Hind Vadodara', sans-serif;
      color: ${PEN};
      font-size: 13.5px;
      font-weight: 500;
      line-height: 1.6;
      letter-spacing: 0.02em;
    }
    h2.hw-title {
      font-size: 16px;
      font-weight: 600;
      text-decoration: underline;
      text-decoration-thickness: 1.5px;
      text-underline-offset: 4px;
      margin-bottom: 8px;
      display: inline-block;
    }
    
    .grid-container { display: flex; align-items: flex-start; justify-content: space-between; overflow: hidden; width: 100%; }
    .col-left { flex: 0 0 25%; max-width: 25%; overflow: hidden; }
    .col-center { flex: 0 0 45%; max-width: 45%; padding: 0 10px; overflow: hidden; }
    .col-right { flex: 0 0 30%; max-width: 30%; padding-left: 10px; overflow: hidden; }
    
    .section { margin-bottom: 22px; word-wrap: break-word; }
    .typewriter { font-family: 'Courier Prime', monospace; font-size: 10px; color: ${INK}; font-weight: 700; white-space: pre-wrap; word-break: break-all; }

    @media print { body { background: none; } .page { padding: 10mm; } }
  </style>
</head>
<body>

<!-- PAGE 1 -->
<div class="page">
  <div class="header">
    <div>
      KISHOR KHICHDAWALA -- 9825666098 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; NEEL KHICHDAWALA -- 8866090599<br/>
      <span style="font-weight: 400;">L-8 , NEW CROWN PLAZA COMPLEX , N/R KOHINOOR MARKET , PIPERDI SHERI , SALABATPURA , SURAT.</span><br/>
      <span style="font-weight: 400;">DOBBY DESIGNER. &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; khichdawalagopal@gmail.com &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; neel.khichdawala@gmail.com</span><br/>
      Design Name : ${designName} &nbsp;&nbsp; Page No : 1
    </div>
  </div>

  <div class="grid-container">
    <!-- LEFT COLUMN -->
    <div class="col-left">
      <div class="section">
        ${gridRows ? `<svg width="${gridW}" height="${gridH}" style="display: block; max-width: 100%; border: 1px solid ${INK};">${gridRows}</svg>` : '<p>No grid</p>'}
        <div style="font-size: 8px; font-weight: 700; margin-top: 4px;">L H, Ph: 660650, 660666</div>
      </div>
      
      <div class="section handwritten">
        <h2 class="hw-title">પેઢો-૧</h2><br/>
        ${threadingStr}<br/>
        <br/><br/>
        <h2 class="hw-title">ટેમ્પલ</h2><br/>
        ઘર. તાર- પાવડા<br/>
        ૬ - ૧૨ - {૧-૧૧-૨-૧૧} ૧૨-જા<br/>
        ૬ - ૧૨ - {૧-૧૨-૨-૧૨} ૧૨-જા<br/>
        ૬ - ૧૨ - {૧-૧૩-૨-૧૩} ૧૨-જા<br/>
        <br/>
        ઘર. ૩૦- ૬૦- કોરા + ૬૦-જા
      </div>
    </div>

    <!-- CENTER COLUMN -->
    <div class="col-center handwritten">
      <div class="section">
        <div style="text-align: center;"><h2 class="hw-title">બીમ ચલાવતા</h2></div>
        ઘર - તાર - પાવડા<br/>
        ${weftRows}<br/><br/>
        ૧૬૩૨ - ૩૨૬૪ - { ૧.૨<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ ૩.૪<br/><br/>
        ૩૦- ૬૦- ટેમ્પલ + ૬૦-જા<br/>
        ૨- ૪ - ૧.૨.૩.૪<br/>
        ૧૧- 3૪- પેઢોચ-૧ + ૨૯-જા<br/>
        ૬૦- ૧૨૦-{ ૧.૫.૨.૬ } ૧૨૦-જા<br/>
        <br/>
        ઘર. ૨૦૨૪ - ૪૨૪૦- {૧.કોમ}<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{૧.કોમ} + ૬૩૨-જા
      </div>
    </div>

    <!-- RIGHT COLUMN -->
    <div class="col-right handwritten">
      <div class="section">
        <div style="text-align: center;"><h2 class="hw-title">વાર્પિંગ</h2></div>
        ${colorPlan}<br/><br/>
        ૧૨-કોમ<br/>
        ૫૬૬-{૧-કોરમ<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;{૧-જા<br/>
        ૬૦-ઉપર A<br/>
        ૪-કોમ<br/>
        ૧૪૪- બોડર કોમ
      </div>
    </div>
  </div>
</div>

<!-- PAGE 2 -->
<div class="page">
  <div class="header" style="border: none;"></div>

  <div class="grid-container">
    <div class="col-left" style="flex: 0 0 50%; max-width: 50%;">
      <div class="section">
        <div style="text-decoration: underline; font-weight: 700; font-size: 14px; margin-bottom: 8px;">Peg In Text Format of ${designName}</div>
        <div class="typewriter">${formattedPegText || '1-->1,3,5,6,7,10,11,14,<br/>&nbsp;&nbsp;&nbsp;&nbsp;2,4,5,6,8,9,10,13,<br/>------------------------------------'}</div>
      </div>
    </div>
    
    <div class="col-center handwritten" style="flex: 0 0 50%; max-width: 50%; padding-left: 20px;">
      <div class="section">
        <div style="text-align: center;"><h2 class="hw-title">ચાલપ</h2></div>
        ૧૫૬ - {૧-પીક<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{૧-જા<br/><br/>
        A { ૨-ઉપરીબાજુ<br/>
        &nbsp;&nbsp;&nbsp;{ ૧- સિક્વન્સ<br/>
        &nbsp;&nbsp;&nbsp;{ ૨-ઉપરી જા<br/><br/>
        B -> ૬૯ { ૧૨-પીક<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ ૫-ઉપર.A
      </div>
      <div class="section" style="margin-top: 60px;">
        <h2 class="hw-title">નોંધ</h2><br/>
        ૧૧૫૨૦ {૬૧-જરી<br/>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{૧-પીક
      </div>
    </div>
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
