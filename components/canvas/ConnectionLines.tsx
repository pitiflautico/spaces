'use client';

import React, { useEffect } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, ModuleConnection } from '@/types';
import { getDataTypeColor } from '@/lib/data-type-icons';

interface ConnectionLinesProps {
  connections: ModuleConnection[];
  modules: Module[];
  zoom: number;
}

export default function ConnectionLines({ connections, modules, zoom }: ConnectionLinesProps) {
  const { connectionDragState, canvasState, deleteConnection } = useSpaceStore();

  const getPortPosition = (moduleId: string, portId: string, side: 'left' | 'right') => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return { x: 0, y: 0 };

    const ports = side === 'left' ? module.ports.input : module.ports.output;
    const portIndex = ports.findIndex((p) => p.id === portId);
    if (portIndex === -1) return { x: 0, y: 0 };

    // Calculate portTop percentage (same logic as ModuleWrapper.tsx lines 383-386 and 428-431)
    const portTopPercentage = ports.length === 1
      ? 0.5
      : (portIndex + 1) / (ports.length + 1);

    // The port container has: top: portTop%, transform: translateY(-50%)
    // IMPORTANT: Use module.size.height which is the base height
    // The ports are positioned relative to this height percentage
    const portContainerTop = module.position.y + (module.size.height * portTopPercentage);

    // The ball is w-14 h-14 (56px x 56px) and centered in the port container
    // Port container position with transform: translateY(-50%) means we're already at the vertical center
    const ballCenterY = portContainerTop; // Already centered due to translateY(-50%)

    // Calculate X position
    // The ball is w-14 h-14 (56px x 56px)
    const BALL_SIZE = 56; // 14 * 4px = 56px (Tailwind w-14 h-14)
    const BALL_RADIUS = BALL_SIZE / 2; // 28px

    // Input ports: left: -40px → left edge at (module.x - 40), center at (module.x - 40 + radius)
    // Output ports: right: -40px → right edge at (module.x + width + 40), center at (module.x + width + 40 - radius)
    const ballCenterX = side === 'left'
      ? module.position.x - 40 + BALL_RADIUS  // = module.x - 12
      : module.position.x + module.size.width + 40 - BALL_RADIUS; // = module.x + width + 12

    return { x: ballCenterX, y: ballCenterY };
  };

  const createBezierPath = (
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): string => {
    const distance = Math.abs(x2 - x1);
    const curvature = Math.min(distance / 2, 100);

    return `M ${x1},${y1} C ${x1 + curvature},${y1} ${x2 - curvature},${y2} ${x2},${y2}`;
  };

  const handleConnectionDoubleClick = (connectionId: string) => {
    deleteConnection(connectionId);
  };

  return (
    <svg
      className="absolute inset-0"
      style={{ width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
    >
      {connections.map((connection) => {
        const start = getPortPosition(connection.sourceModuleId, connection.sourcePortId, 'right');
        const end = getPortPosition(connection.targetModuleId, connection.targetPortId, 'left');

        const path = createBezierPath(start.x, start.y, end.x, end.y);

        // Color based on data type
        const colorClass = connection.dataType ? getDataTypeColor(connection.dataType) : '';
        const strokeColor = colorClass.includes('pink') ? 'rgb(236, 72, 153)' :
                          colorClass.includes('blue') ? 'rgb(59, 130, 246)' :
                          colorClass.includes('purple') ? 'rgb(139, 92, 246)' :
                          colorClass.includes('orange') ? 'rgb(249, 115, 22)' :
                          colorClass.includes('red') ? 'rgb(239, 68, 68)' :
                          'rgb(139, 92, 246)'; // default purple

        return (
          <g key={connection.id}>
            {/* Shadow/glow effect */}
            <path
              d={path}
              fill="none"
              stroke={`${strokeColor.replace('rgb', 'rgba').replace(')', ', 0.3)')}`}
              strokeWidth="8"
              filter="blur(4px)"
              style={{ pointerEvents: 'none' }}
            />
            {/* Invisible thick line for easier clicking */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth="20"
              style={{
                pointerEvents: 'stroke',
                cursor: 'pointer'
              }}
              onDoubleClick={() => handleConnectionDoubleClick(connection.id)}
            >
              <title>Double-click to disconnect</title>
            </path>
            {/* Main line */}
            <path
              d={path}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              style={{ pointerEvents: 'none' }}
              className="transition-opacity group-hover:opacity-80"
            />
            {/* Animated dashes */}
            <path
              d={path}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.5"
              style={{ pointerEvents: 'none' }}
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="10"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </g>
        );
      })}

      {/* Provisional connection line during drag (A2.2) */}
      {connectionDragState.isDragging && connectionDragState.cursorPosition && (
        (() => {
          const sourceModule = modules.find((m) => m.id === connectionDragState.sourceModuleId);
          if (!sourceModule) return null;

          const start = getPortPosition(
            connectionDragState.sourceModuleId!,
            connectionDragState.sourcePortId!,
            'right'
          );

          // Convert cursor position from screen space to canvas space
          // The cursor is in screen coordinates, we need to convert to canvas coordinates
          // taking into account the pan and zoom transforms
          const end = {
            x: (connectionDragState.cursorPosition.x - canvasState.pan.x) / canvasState.zoom,
            y: (connectionDragState.cursorPosition.y - canvasState.pan.y) / canvasState.zoom,
          };

          const path = createBezierPath(start.x, start.y, end.x, end.y);

          // Color based on source data type
          const colorClass = connectionDragState.sourceDataType ? getDataTypeColor(connectionDragState.sourceDataType) : '';
          const strokeColor = colorClass.includes('pink') ? 'rgb(236, 72, 153)' :
                            colorClass.includes('blue') ? 'rgb(59, 130, 246)' :
                            colorClass.includes('purple') ? 'rgb(139, 92, 246)' :
                            colorClass.includes('orange') ? 'rgb(249, 115, 22)' :
                            colorClass.includes('red') ? 'rgb(239, 68, 68)' :
                            'rgb(139, 92, 246)'; // default

          return (
            <g key="provisional">
              {/* Provisional line - dashed */}
              <path
                d={path}
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeDasharray="10 5"
                opacity="0.7"
              />
              {/* End circle */}
              <circle
                cx={end.x}
                cy={end.y}
                r="4"
                fill={strokeColor}
                opacity="0.7"
              />
            </g>
          );
        })()
      )}
    </svg>
  );
}
