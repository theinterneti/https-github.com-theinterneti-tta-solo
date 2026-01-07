import React, { useState, useRef, useEffect } from 'react';
import { EntityNode, EntityLink } from '../types';

interface GraphViewProps {
  nodes: EntityNode[];
  links: EntityLink[];
  onNodeSelect: (node: EntityNode) => void;
  onNodeMove: (id: string, x: number, y: number) => void;
  selectedNodeId: string | null;
}

export const GraphView: React.FC<GraphViewProps> = ({ nodes, links, onNodeSelect, onNodeMove, selectedNodeId }) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 400;
  const height = 300;

  // Convert mouse event to SVG coordinates
  const getMousePosition = (evt: React.MouseEvent | MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return { x: 0, y: 0 };
    return {
      x: (evt.clientX - CTM.e) / CTM.a,
      y: (evt.clientY - CTM.f) / CTM.d
    };
  };

  const handleMouseDown = (e: React.MouseEvent, node: EntityNode) => {
    e.stopPropagation();
    onNodeSelect(node);
    setDraggingId(node.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingId) {
      const { x, y } = getMousePosition(e);
      // Boundary checks
      const clampedX = Math.max(10, Math.min(width - 10, x));
      const clampedY = Math.max(10, Math.min(height - 10, y));
      onNodeMove(draggingId, clampedX, clampedY);
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
  };

  // Global mouse up to catch dragging outside SVG
  useEffect(() => {
    const globalMouseUp = () => setDraggingId(null);
    window.addEventListener('mouseup', globalMouseUp);
    return () => window.removeEventListener('mouseup', globalMouseUp);
  }, []);

  return (
    <div className="h-full w-full bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden relative select-none">
       <div className="absolute top-2 left-2 z-10 bg-black/60 px-2 py-1 rounded border border-neutral-800 pointer-events-none">
        <span className="text-xs text-purple-400 font-bold tracking-wider flex items-center gap-2">
           NEO4J :: KNOWLEDGE GRAPH
           <span className="text-[10px] text-neutral-500 font-normal">(INTERACTIVE)</span>
        </span>
      </div>
      
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        className="cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="14" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#4b5563" />
          </marker>
        </defs>

        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Links */}
        {links.map((link, i) => {
          const source = nodes.find(n => n.id === link.source);
          const target = nodes.find(n => n.id === link.target);
          if (!source || !target) return null;

          return (
            <g key={i}>
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#4b5563"
                strokeWidth="1"
                markerEnd="url(#arrowhead)"
                opacity="0.6"
              />
              <text 
                x={(source.x + target.x) / 2} 
                y={(source.y + target.y) / 2 - 5} 
                fill="#6b7280" 
                fontSize="8" 
                textAnchor="middle"
                className="select-none pointer-events-none"
              >
                {link.label}
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isDragging = draggingId === node.id;
          
          return (
            <g 
              key={node.id} 
              className="cursor-pointer"
              onMouseDown={(e) => handleMouseDown(e, node)}
            >
              {/* Selection Ring */}
              {isSelected && (
                <circle cx={node.x} cy={node.y} r={16} fill="none" stroke="#a855f7" strokeWidth="2" opacity="0.8" className={isDragging ? '' : "animate-pulse"} />
              )}
              
              {/* Node Body */}
              <circle
                cx={node.x}
                cy={node.y}
                r={12}
                fill={node.type === 'Character' ? '#ef4444' : node.type === 'Location' ? '#3b82f6' : '#10b981'}
                stroke={isSelected ? '#fff' : '#000'}
                strokeWidth={isSelected ? 2 : 2}
                className="transition-transform duration-75"
              />
              
              {/* Label */}
              <text
                x={node.x}
                y={node.y + 24}
                fill={isSelected ? '#fff' : '#e5e5e5'}
                fontSize="10"
                textAnchor="middle"
                className="font-mono select-none pointer-events-none"
                style={{ textShadow: '0px 1px 2px black' }}
                fontWeight={isSelected ? 'bold' : 'normal'}
              >
                {node.label}
              </text>
              
              {/* Icon / Initial */}
              <text
                x={node.x}
                y={node.y}
                dy=".3em"
                fill="#fff"
                fontSize="10"
                textAnchor="middle"
                pointerEvents="none"
                fontWeight="bold"
              >
                {node.label[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};