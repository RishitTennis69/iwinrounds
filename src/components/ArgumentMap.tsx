import React, { useState, useEffect, useRef } from 'react';
import { ArgumentNode, ArgumentConnection, ArgumentMap as ArgumentMapType } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface ArgumentMapProps {
  argumentMap: ArgumentMapType;
  className?: string;
}

const ArgumentMap: React.FC<ArgumentMapProps> = ({ argumentMap, className = '' }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<ArgumentNode | null>(null);
  const [showFallacies, setShowFallacies] = useState(true);
  const [showStrength, setShowStrength] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  // Auto-layout nodes in a tree structure
  useEffect(() => {
    if (argumentMap.nodes.length > 0) {
      layoutNodes();
    }
  }, [argumentMap.nodes]);

  const layoutNodes = () => {
    const nodes = [...argumentMap.nodes];
    
    // Find root nodes (nodes without parents)
    const rootNodes = nodes.filter(node => !node.parentId);
    const childNodes = nodes.filter(node => node.parentId);
    
    // Position root nodes horizontally
    const rootSpacing = 300;
    rootNodes.forEach((node, index) => {
      node.position = {
        x: (index - (rootNodes.length - 1) / 2) * rootSpacing + 400,
        y: 100
      };
    });
    
    // Position child nodes below their parents
    childNodes.forEach(node => {
      const parent = nodes.find(n => n.id === node.parentId);
      if (parent) {
        const siblings = childNodes.filter(n => n.parentId === node.parentId);
        const siblingIndex = siblings.findIndex(n => n.id === node.id);
        const siblingSpacing = 200;
        
        node.position = {
          x: parent.position.x + (siblingIndex - (siblings.length - 1) / 2) * siblingSpacing,
          y: parent.position.y + 150
        };
      }
    });
  };

  const getNodeColor = (node: ArgumentNode) => {
    const baseColors = {
      claim: '#3B82F6', // blue
      evidence: '#10B981', // green
      reasoning: '#6366F1', // indigo
      'counter-claim': '#EF4444', // red
      rebuttal: '#F59E0B' // amber
    };
    
    const color = baseColors[node.type] || '#6B7280';
    const strength = node.strength / 10;
    return `${color}${Math.floor(strength * 255).toString(16).padStart(2, '0')}`;
  };

  const getNodeSize = (node: ArgumentNode) => {
    const baseSize = 60;
    const strengthMultiplier = node.strength / 10;
    return baseSize + (strengthMultiplier * 40);
  };

  const getConnectionColor = (connection: ArgumentConnection) => {
    const colors = {
      supports: '#10B981', // green
      counters: '#EF4444', // red
      rebuts: '#F59E0B' // amber
    };
    return colors[connection.type] || '#6B7280';
  };

  const getConnectionWidth = (connection: ArgumentConnection) => {
    return 2 + (connection.strength / 10) * 4;
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.3));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getStrengthIcon = (strength: number) => {
    if (strength >= 8) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (strength >= 6) return <CheckCircle className="w-4 h-4 text-yellow-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <div className={`relative bg-white rounded-lg border ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowStrength(!showStrength)}
          className={`p-2 rounded-lg shadow-md ${showStrength ? 'bg-blue-100' : 'bg-white'} hover:bg-gray-50`}
          title="Toggle Strength Indicators"
        >
          {showStrength ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
        <button
          onClick={() => setShowFallacies(!showFallacies)}
          className={`p-2 rounded-lg shadow-md ${showFallacies ? 'bg-red-100' : 'bg-white'} hover:bg-gray-50`}
          title="Toggle Fallacy Indicators"
        >
          <AlertTriangle className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-md p-3 text-sm">
        <div className="font-semibold mb-2">Argument Types</div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>Claim</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Evidence</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
            <span>Reasoning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Counter-claim</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
            <span>Rebuttal</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Custom Grouped Connections: Claim-Evidence-Reasoning */}
          {argumentMap.nodes.filter(n => n.type === 'claim').map(claimNode => {
            // Find evidence and reasoning children
            const evidenceNodes = argumentMap.nodes.filter(n => n.parentId === claimNode.id && n.type === 'evidence');
            const reasoningNodes = argumentMap.nodes.filter(n => n.parentId === claimNode.id && n.type === 'reasoning');
            // Draw lines: claim → evidence, claim → reasoning
            return (
              <g key={`group-${claimNode.id}`}>
                {evidenceNodes.map(evidenceNode => (
                  <line
                    key={`claim-evidence-${claimNode.id}-${evidenceNode.id}`}
                    x1={claimNode.position.x}
                    y1={claimNode.position.y}
                    x2={evidenceNode.position.x}
                    y2={evidenceNode.position.y}
                    stroke="#3B82F6"
                    strokeWidth={3}
                  />
                ))}
                {reasoningNodes.map(reasoningNode => (
                  <line
                    key={`claim-reasoning-${claimNode.id}-${reasoningNode.id}`}
                    x1={claimNode.position.x}
                    y1={claimNode.position.y}
                    x2={reasoningNode.position.x}
                    y2={reasoningNode.position.y}
                    stroke="#3B82F6"
                    strokeWidth={3}
                  />
                ))}
                {/* Connect evidence to reasoning if both exist */}
                {evidenceNodes.length > 0 && reasoningNodes.length > 0 && evidenceNodes.map(evidenceNode => (
                  reasoningNodes.map(reasoningNode => (
                    <line
                      key={`evidence-reasoning-${evidenceNode.id}-${reasoningNode.id}`}
                      x1={evidenceNode.position.x}
                      y1={evidenceNode.position.y}
                      x2={reasoningNode.position.x}
                      y2={reasoningNode.position.y}
                      stroke="#6366F1"
                      strokeWidth={2}
                      strokeDasharray="4,2"
                    />
                  ))
                ))}
                {/* Arrow from reasoning (or evidence if no reasoning) to rebuttal(s) */}
                {(() => {
                  // Find the last node in the group (prefer reasoning, else evidence, else claim)
                  const lastNode = reasoningNodes[0] || evidenceNodes[0] || claimNode;
                  // Find rebuttal nodes that target this group
                  const rebuttalNodes = argumentMap.nodes.filter(n => n.parentId === lastNode.id && n.type === 'rebuttal');
                  return rebuttalNodes.map(rebuttalNode => (
                    <line
                      key={`to-rebuttal-${lastNode.id}-${rebuttalNode.id}`}
                      x1={lastNode.position.x}
                      y1={lastNode.position.y}
                      x2={rebuttalNode.position.x}
                      y2={rebuttalNode.position.y}
                      stroke="#F59E0B"
                      strokeWidth={3}
                      markerEnd="url(#arrowhead)"
                    />
                  ));
                })()}
              </g>
            );
          })}

          {/* Frontline: Connect rebuttals in a chain */}
          {argumentMap.nodes.filter(n => n.type === 'rebuttal').map(rebuttalNode => {
            // Find rebuttal children (frontline)
            const nextRebuttals = argumentMap.nodes.filter(n => n.parentId === rebuttalNode.id && n.type === 'rebuttal');
            return nextRebuttals.map(nextNode => (
              <line
                key={`frontline-${rebuttalNode.id}-${nextNode.id}`}
                x1={rebuttalNode.position.x}
                y1={rebuttalNode.position.y}
                x2={nextNode.position.x}
                y2={nextNode.position.y}
                stroke="#F59E0B"
                strokeWidth={2}
                markerEnd="url(#arrowhead)"
                strokeDasharray="2,2"
              />
            ));
          })}

          {/* Default Connections (for any other types) */}
          {argumentMap.connections.map(connection => {
            const fromNode = argumentMap.nodes.find(n => n.id === connection.fromNodeId);
            const toNode = argumentMap.nodes.find(n => n.id === connection.toNodeId);
            if (!fromNode || !toNode) return null;
            // Skip if already drawn by custom logic above
            if ((fromNode.type === 'claim' && (toNode.type === 'evidence' || toNode.type === 'reasoning')) ||
                (fromNode.type === 'evidence' && toNode.type === 'reasoning') ||
                (fromNode.type === 'reasoning' && toNode.type === 'rebuttal') ||
                (fromNode.type === 'rebuttal' && toNode.type === 'rebuttal')) {
              return null;
            }
            return (
              <line
                key={connection.id}
                x1={fromNode.position.x}
                y1={fromNode.position.y}
                x2={toNode.position.x}
                y2={toNode.position.y}
                stroke={getConnectionColor(connection)}
                strokeWidth={getConnectionWidth(connection)}
                strokeDasharray={connection.type === 'counters' ? '5,5' : 'none'}
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          
          {/* Nodes */}
          {argumentMap.nodes.map(node => {
            const size = getNodeSize(node);
            const color = getNodeColor(node);
            // Use node.summary if available, else a short truncated content
            const summary = node.summary || (node.content.length > 30 ? node.content.substring(0, 30) + '...' : node.content);
            return (
              <g key={node.id}>
                <circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={size / 2}
                  fill={color}
                  stroke="#374151"
                  strokeWidth="2"
                  className="cursor-pointer hover:stroke-2 hover:stroke-blue-500"
                />
                {/* Node summary content always visible */}
                <foreignObject
                  x={node.position.x - size / 2}
                  y={node.position.y - size / 2}
                  width={size}
                  height={size}
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex flex-col items-center justify-center text-white text-xs font-medium p-1 text-center">
                    <div className="truncate w-full">{summary}</div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
          
          {/* Arrow marker definition */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
            </marker>
          </defs>
        </g>
      </svg>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-white rounded-lg shadow-lg p-4 max-h-64 overflow-y-auto">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-semibold text-lg capitalize">{selectedNode.type}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="font-medium text-sm text-gray-600 mb-1">Content</div>
              <div className="text-sm">{selectedNode.content}</div>
            </div>
            
            <div className="flex gap-4">
              <div>
                <div className="font-medium text-sm text-gray-600 mb-1">Speaker</div>
                <div className="text-sm">{selectedNode.speakerName} ({selectedNode.team})</div>
              </div>
              <div>
                <div className="font-medium text-sm text-gray-600 mb-1">Speech</div>
                <div className="text-sm">#{selectedNode.speechNumber}</div>
              </div>
              <div>
                <div className="font-medium text-sm text-gray-600 mb-1">Strength</div>
                <div className="text-sm flex items-center gap-1">
                  {getStrengthIcon(selectedNode.strength)}
                  {selectedNode.strength}/10
                </div>
              </div>
            </div>
            
            {selectedNode.evidenceQuality && (
              <div>
                <div className="font-medium text-sm text-gray-600 mb-1">Evidence Quality</div>
                <div className="text-sm">{selectedNode.evidenceQuality}/10</div>
              </div>
            )}
            
            {selectedNode.logicalFallacies && selectedNode.logicalFallacies.length > 0 && (
              <div>
                <div className="font-medium text-sm text-gray-600 mb-1">Logical Fallacies</div>
                <div className="text-sm space-y-1">
                  {selectedNode.logicalFallacies.map((fallacy, index) => (
                    <div key={index} className="text-red-600">• {fallacy}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArgumentMap; 