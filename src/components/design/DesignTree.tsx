import React, { useState, useCallback } from "react"
import { Folder, FolderOpen, File, ChevronRight } from "lucide-react"

// ─── Design Data ────────────────────────────────────────────────────────────

export const designData = {
  label: "Textile Design",
  id: "root",
  children: [
    {
      label: "Basic Weaves", id: "bw",
      children: [
        {
          label: "Plain Weave", id: "pw",
          children: [
            { label: "Regular Plain", id: "regular-plain", leaf: true },
            {
              label: "Rib Weave", id: "rib-weave",
              children: [
                { label: "Warp Rib", id: "warp-rib", leaf: true },
                { label: "Weft Rib", id: "weft-rib", leaf: true },
              ],
            },
            {
              label: "Basket Weave", id: "basket-weave",
              children: [
                { label: "Regular Basket", id: "regular-basket", leaf: true },
                { label: "Unequal Basket", id: "unequal-basket", leaf: true },
              ],
            },
            { label: "Matt Weave", id: "matt-weave", leaf: true },
          ],
        },
        {
          label: "Twill Weave", id: "tw",
          children: [
            {
              label: "Regular Twill", id: "regular-twill",
              children: [
                { label: "2/1 Twill", id: "twill-21", leaf: true },
                { label: "3/1 Twill", id: "twill-31", leaf: true },
                { label: "2/2 Twill", id: "twill-22", leaf: true },
              ],
            },
            {
              label: "Directional Twill", id: "directional-twill",
              children: [
                { label: "S Twill", id: "s-twill", leaf: true },
                { label: "Z Twill", id: "z-twill", leaf: true },
              ],
            },
            { label: "Broken Twill", id: "broken-twill", leaf: true },
            { label: "Herringbone Twill", id: "herringbone-twill", leaf: true },
            { label: "Diamond Twill", id: "diamond-twill", leaf: true },
            { label: "Elongated Twill", id: "elongated-twill", leaf: true },
          ],
        },
        {
          label: "Satin / Sateen", id: "satin-sateen",
          children: [
            { label: "Warp Satin", id: "warp-satin", leaf: true },
            { label: "Weft Sateen", id: "weft-sateen", leaf: true },
            { label: "Regular Satin", id: "regular-satin", leaf: true },
            { label: "Irregular Satin", id: "irregular-satin", leaf: true },
          ],
        },
      ],
    },
    {
      label: "Derivative Weaves", id: "dw",
      children: [
        { label: "Crepe Weave", id: "crepe-weave", leaf: true },
        {
          label: "Leno Weave", id: "leno-weave",
          children: [
            { label: "Standard Leno", id: "standard-leno", leaf: true },
            { label: "Mock Leno", id: "mock-leno", leaf: true },
          ],
        },
        { label: "Ornamented Weaves", id: "ornamented-weaves", leaf: true },
      ],
    },
    {
      label: "Compound Weaves", id: "cmpw",
      children: [
        {
          label: "Double Cloth", id: "double-cloth",
          children: [
            { label: "Self Stitched", id: "self-stitched", leaf: true },
            { label: "Centre Stitched", id: "centre-stitched", leaf: true },
            { label: "Interchanging", id: "interchanging", leaf: true },
          ],
        },
        {
          label: "Pile Weaves", id: "pile-weaves",
          children: [
            {
              label: "Warp Pile", id: "warp-pile",
              children: [
                { label: "Velvet", id: "velvet", leaf: true },
                { label: "Terry", id: "terry", leaf: true },
              ],
            },
            { label: "Weft Pile", id: "weft-pile", leaf: true },
            { label: "Cut / Uncut", id: "cut-uncut", leaf: true },
          ],
        },
        { label: "Quilted Fabrics", id: "quilted-fabrics", leaf: true },
      ],
    },
    {
      label: "Figured Designs", id: "fd",
      children: [
        {
          label: "Dobby", id: "dobby",
          children: [
            { label: "Geometric", id: "dobby-geometric", leaf: true },
            { label: "Small Motifs", id: "dobby-motifs", leaf: true },
          ],
        },
        {
          label: "Jacquard", id: "jacquard",
          children: [
            { label: "Floral", id: "jacquard-floral", leaf: true },
            { label: "Paisley", id: "jacquard-paisley", leaf: true },
            { label: "Brocade", id: "jacquard-brocade", leaf: true },
            { label: "Damask", id: "jacquard-damask", leaf: true },
          ],
        },
        {
          label: "Extra Yarn Designs", id: "extra-yarn",
          children: [
            { label: "Extra Warp", id: "extra-warp", leaf: true },
            { label: "Extra Weft", id: "extra-weft", leaf: true },
          ],
        },
      ],
    },
    {
      label: "Software Design Layer", id: "sdl", software: true,
      children: [
        { label: "Visual Grid", id: "visual-grid", leaf: true, software: true },
        {
          label: "Pick Sequence", id: "pick-sequence", software: true,
          children: [
            { label: "Pick Object", id: "pick-object", leaf: true, software: true },
            { label: "Color Logic", id: "color-logic", leaf: true, software: true },
            { label: "Auto Split Engine", id: "auto-split-engine", leaf: true, software: true },
          ],
        },
        {
          label: "Peg Plan", id: "peg-plan", software: true,
          children: [
            { label: "Numeric Peg Plan", id: "numeric-peg-plan", leaf: true, software: true },
            { label: "Shaft Mapping", id: "shaft-mapping", leaf: true, software: true },
          ],
        },
        {
          label: "Drafting", id: "drafting", software: true,
          children: [
            { label: "Straight Draft", id: "straight-draft", leaf: true, software: true },
            { label: "Pointed Draft", id: "pointed-draft", leaf: true, software: true },
            { label: "Broken Draft", id: "broken-draft", leaf: true, software: true },
          ],
        },
      ],
    },
  ],
}

// ─── TreeNode (Recursive) ───────────────────────────────────────────────────

function TreeNode({ node, depth = 0, onSelectDesign, selectedId, openIds, onToggle, isLast = false, path = [] }: any) {
  const hasChildren = !!(node.children && node.children.length)
  const isOpen = openIds.has(node.id)
  const isSelected = selectedId === node.id

  const rowBase = "flex items-center gap-1 cursor-pointer rounded select-none transition-colors duration-100 py-[3px] pr-2 relative group"
  const rowHover = "hover:bg-white/[0.04]"
  const rowSelected = isSelected ? "bg-violet-500/20 text-violet-300" : ""

  const labelColor = node.software
    ? "text-emerald-400"
    : isSelected
    ? "text-violet-200"
    : depth === 0
    ? "text-slate-100 font-semibold"
    : depth === 1
    ? "text-slate-200 font-medium"
    : node.leaf
    ? "text-slate-400"
    : "text-slate-300"

  const handleClick = () => {
    if (hasChildren) onToggle(node.id)
    if (node.leaf) onSelectDesign(node.label, node)
  }

  return (
    <div className="relative">
      <div
        className={`${rowBase} ${rowHover} ${rowSelected}`}
        onClick={handleClick}
        title={node.label}
      >
        {/* Absolute vertical branch connectors rendering standard tree structure */}
        {path.map((isParentLast: boolean, i: number) => (
          <div key={i} className="self-stretch w-4 shrink-0 relative flex justify-center">
            {/* Draw a vertical pass-through line unless the parent was the last child */}
            {!isParentLast && (
              <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/[0.12]"></div>
            )}
            {/* If we are at the immediate parent level spacing, draw the elbow */}
            {i === depth - 1 && (
              <>
                {/* Vertical segment: full height if not last, haly-way if last */}
                <div className={`absolute left-1/2 w-px bg-white/[0.12] ${isLast ? 'top-0 h-1/2' : 'top-0 bottom-0'}`}></div>
                {/* Horizontal elbow connecting to the node */}
                <div className="absolute top-1/2 left-1/2 w-1/2 h-px bg-white/[0.12]"></div>
              </>
            )}
          </div>
        ))}

        {/* Chevron */}
        <span className="shrink-0 w-4 h-5 flex items-center justify-center z-10 relative">
          {hasChildren ? (
            <ChevronRight
              size={12}
              className={`text-slate-400 transition-transform duration-150 group-hover:text-slate-300 ${isOpen ? "rotate-90" : ""}`}
            />
          ) : (
             // Bullet for leaf
             <div className="w-1 h-1 rounded-full bg-slate-600"></div>
          )}
        </span>

        {/* Icon */}
        <span className="shrink-0 w-4 h-5 flex items-center justify-center z-10 relative">
          {hasChildren ? (
            isOpen ? (
              <FolderOpen size={14} className={node.software ? "text-emerald-400" : "text-violet-400"} />
            ) : (
              <Folder size={14} className={node.software ? "text-emerald-500" : "text-violet-500"} />
            )
          ) : (
            <File size={13} className={node.software ? "text-emerald-600" : "text-slate-500"} />
          )}
        </span>

        {/* Label */}
        <span className={`text-[12.5px] leading-5 truncate ml-1 z-10 relative ${labelColor}`}>
          {node.label}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isOpen && (
        <div className="flex flex-col">
          {node.children.map((child: any, index: number) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelectDesign={onSelectDesign}
              selectedId={selectedId}
              openIds={openIds}
              onToggle={onToggle}
              isLast={index === node.children.length - 1}
              path={[...path, isLast]} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── DesignTree (Main Export) ───────────────────────────────────────────────

export default function DesignTree({ onSelectDesign, onClose }: { onSelectDesign?: any, onClose?: () => void }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(["root"]))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedInfo, setSelectedInfo] = useState<any>(null)

  const handleToggle = useCallback((id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleSelect = useCallback(
    (name: string, node: any) => {
      setSelectedId(node.id)
      setSelectedInfo(node)
      if (onSelectDesign) onSelectDesign(name, node)
      
      // Optionally toggle a node even if we click it
      if (node.children) {
        handleToggle(node.id)
      }
    },
    [onSelectDesign, handleToggle]
  )

  return (
    <aside className="flex flex-col h-full w-[280px] bg-[#0E121A] border-r border-white/[0.07] text-sm overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-white/[0.07] shrink-0 bg-[#121620]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"/>
          <rect x="14" y="3" width="7" height="7" rx="1"/>
          <rect x="3" y="14" width="7" height="7" rx="1"/>
          <rect x="14" y="14" width="7" height="7" rx="1"/>
        </svg>
        <span className="text-slate-100 font-semibold text-[13px] tracking-wide">Design Tree</span>
        {onClose && (
            <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white transition-colors">
                ✕
            </button>
        )}
      </div>

      {/* Tree scroll area */}
      <div className="flex-1 overflow-y-auto px-1 py-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <TreeNode
          node={designData}
          depth={0}
          onSelectDesign={handleSelect}
          selectedId={selectedId}
          openIds={openIds}
          onToggle={handleToggle}
          isLast={true}
          path={[]}
        />
      </div>

      {/* Selection preview */}
      {selectedInfo && (
        <div className="shrink-0 border-t border-white/[0.07] px-4 py-3.5 bg-[#0A0D14]">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">Selected Node</p>
          <p className={`text-[13px] font-semibold truncate ${selectedInfo.software ? "text-emerald-400" : "text-violet-300"}`}>
            {selectedInfo.label}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {selectedInfo.software ? "Software Architecture Layer" : "Fabric Weave Pattern Structure"}
          </p>
        </div>
      )}
    </aside>
  )
}
