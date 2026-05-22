'use client'

import { useState, useEffect } from 'react'
import { HexColorPicker, HexColorInput } from 'react-colorful'

interface ColorPickerPopupProps {
  initialColor: string
  isOpen: boolean
  onClose: () => void
  onSave: (color: string) => void
  title?: string
}

const PRESETS = [
  // Row 1
  '#E5E7EB', '#94A3B8', '#475569', '#334155', '#000000', '#FBBF24', '#F59E0B', '#1E3A8A', '#2563EB', '#C00E52',
  // Row 2
  '#10B981', '#059669', '#065F46', '#E0115F', '#172554', '#E0115F', '#0ea5e9', '#EF4444', '#B91C1C', '#C00E52'
]

export default function ColorPickerPopup({ 
  initialColor, 
  isOpen, 
  onClose, 
  onSave,
  title = "Value color"
}: ColorPickerPopupProps) {
  const [color, setColor] = useState(initialColor)
  const [format, setFormat] = useState<'HEX' | 'RGB' | 'HSL'>('HEX')
  const [opacity, setOpacity] = useState(100)

  useEffect(() => {
    if (isOpen) {
      setColor(initialColor)
    }
  }, [isOpen, initialColor])

  if (!isOpen) return null

  return (
    <div className="color-picker-overlay" onClick={onClose}>
      <div className="color-picker-container" onClick={e => e.stopPropagation()}>
        <div className="color-picker-header">
          <h3>{title}</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>

        <div className="color-picker-body">
          <div className="input-group">
            <label>Custom color</label>
            <div className="picker-wrapper">
              <HexColorPicker color={color} onChange={setColor} />
            </div>
          </div>

          <div className="selectors-row">
            <div className="format-select">
              <select value={format} onChange={(e) => setFormat(e.target.value as any)}>
                <option value="HEX">HEX</option>
                <option value="RGB">RGB</option>
                <option value="HSL">HSL</option>
              </select>
            </div>
            
            <div className="hex-input-wrapper">
              <HexColorInput 
                color={color} 
                onChange={setColor} 
                prefixed 
                style={{ width: '100%' }}
              />
            </div>

            <div className="opacity-select">
              <select value={opacity} onChange={(e) => setOpacity(parseInt(e.target.value))}>
                {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map(v => (
                  <option key={v} value={v}>{v}%</option>
                ))}
              </select>
            </div>
          </div>

          <div className="presets-section">
            <label>Presets</label>
            <div className="presets-grid">
              {PRESETS.map((p, i) => (
                <button 
                  key={i} 
                  className={`preset-btn ${color.toLowerCase() === p.toLowerCase() ? 'active' : ''}`}
                  style={{ background: p }}
                  onClick={() => setColor(p)}
                >
                  {color.toLowerCase() === p.toLowerCase() && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="color-picker-footer">
          <button className="btn-cancel" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Cancel
          </button>
          <button className="btn-save" onClick={() => onSave(color)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Save
          </button>
        </div>
      </div>

      <style jsx>{`
        .color-picker-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }

        .color-picker-container {
          background: white;
          width: 380px;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: scaleIn 0.2s ease-out;
        }

        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        .color-picker-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .color-picker-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1a237e;
        }

        .close-btn {
          background: #f5f5f5;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #666;
          transition: background 0.2s;
        }
        .close-btn:hover { background: #eee; }

        .color-picker-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .color-picker-body label {
          font-size: 12px;
          color: #888;
          margin-bottom: 8px;
          display: block;
        }

        .picker-wrapper :global(.react-colorful) {
          width: 100% !important;
          height: 180px !important;
          border-radius: 8px;
        }
        
        .picker-wrapper :global(.react-colorful__saturation) {
          border-radius: 8px 8px 0 0;
          border-bottom: none;
        }
        
        .picker-wrapper :global(.react-colorful__hue) {
          height: 12px !important;
          border-radius: 10px !important;
          margin-top: 12px;
        }

        .picker-wrapper :global(.react-colorful__pointer) {
          width: 20px;
          height: 20px;
        }

        .selectors-row {
          display: grid;
          grid-template-columns: 80px 1fr 80px;
          gap: 10px;
          margin-top: 8px;
        }

        .selectors-row select, .selectors-row input {
          height: 40px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 0 10px;
          font-size: 13px;
          color: #333;
          background: white;
          outline: none;
        }

        .presets-grid {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 8px;
        }

        .preset-btn {
          aspect-ratio: 1;
          border-radius: 6px;
          border: 1px solid rgba(0,0,0,0.05);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.1s;
        }
        .preset-btn:hover { transform: scale(1.1); }
        .preset-btn.active { 
          box-shadow: 0 0 0 2px #C00E52;
        }
        .preset-btn svg { width: 14px; height: 14px; }

        .color-picker-footer {
          padding: 16px 20px;
          background: #fafafa;
          border-top: 1px solid #f0f0f0;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-cancel, .btn-save {
          height: 40px;
          padding: 0 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-cancel {
          background: white;
          border: 1px solid #e0e0e0;
          color: #666;
        }
        .btn-cancel:hover { background: #f5f5f5; }

        .btn-save {
          background: #6366f1;
          border: none;
          color: white;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.3);
        }
        .btn-save:hover { background: #4f46e5; transform: translateY(-1px); }
      `}</style>
    </div>
  )
}
