'use client'

import { useDesignStore } from '@/lib/store/designStore'
import { downloadMachineFile } from '@/lib/exports/machineFile'
import type { ExportFormat } from '@/lib/types'

export default function MachineExportPanel() {
  const store = useDesignStore()
  const loom = store.loom
  const matrix = store.pegPlanMatrix
  const designNumber = store.identity.design_number

  const handleExport = (format: ExportFormat) => {
    if (!matrix.length) {
      alert('Please create a peg plan first')
      return
    }
    const weftSystem = store.weftSystem
    downloadMachineFile(matrix, format, designNumber, 16, weftSystem)
  }

  const previewFormat = loom?.export_format || '.EP'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="section-header">Machine File Export</div>

      <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5 }}>
        Export your peg plan in dobby machine formats. The file can be loaded
        directly into the electronic dobby controller.
      </p>

      {/* Primary export (matches loom setting) */}
      <button
        onClick={() => handleExport(previewFormat)}
        className="btn-primary"
        style={{ width: '100%', gap: 10 }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Download {previewFormat} File
      </button>

      {/* Other formats */}
      <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.1em', marginTop: 8 }}>
        Other Formats
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(['.EP', '.WEA', '.JC5', '.DES', 'text'] as ExportFormat[])
          .filter(f => f !== previewFormat)
          .map((format) => (
            <button
              key={format}
              onClick={() => handleExport(format)}
              className="btn-secondary"
              style={{ fontSize: 12, justifyContent: 'center' }}
            >
              {format === 'text' ? 'Text (.txt)' : format}
            </button>
          ))
        }
      </div>

      {/* Format info */}
      <div style={{
        fontSize: 11, color: 'var(--text-3)', lineHeight: 1.6,
        padding: '12px 14px', borderRadius: 8, background: 'var(--bg)',
      }}>
        <strong>.EP</strong> — Stäubli electronic dobby<br/>
        <strong>.WEA</strong> — Grosse dobby controller<br/>
        <strong>.JC5</strong> — Standard Jacquard<br/>
        <strong>.DES</strong> — Picanol system<br/>
        <strong>Text</strong> — Surat factory standard (paper peg cards)
      </div>
    </div>
  )
}
