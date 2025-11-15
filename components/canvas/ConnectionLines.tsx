'use client';

import React from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Module, ModuleConnection } from '@/types';
import { getDataTypeColor } from '@/lib/data-type-icons';

interface ConnectionLinesProps {
  connections: ModuleConnection[];
  modules: Module[];
  zoom: number;
}

export default function ConnectionLines({ connections, modules, zoom }: ConnectionLinesProps) {
  const { connectionDragState } = useSpaceStore();
  const getModuleCenter = (moduleId: string, side: 'left' | 'right') => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return { x: 0, y: 0 };

    const x = side === 'left'
      ? module.position.x
      : module.position.x + module.size.width;
    const y = module.position.y + module.size.height / 2;

    return { x, y };
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

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      {connections.map((connection) => {
        const start = getModuleCenter(connection.sourceModuleId, 'right');
        const end = getModuleCenter(connection.targetModuleId, 'left');

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
            />
            {/* Main line */}
            <path
              d={path}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
            />
            {/* Animated dashes */}
            <path
              d={path}
              fill="none"
              stroke={strokeColor}
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.5"
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

          const start = getModuleCenter(connectionDragState.sourceModuleId!, 'right');
          const end = {
            x: (connectionDragState.cursorPosition.x - window.scrollX) / zoom,
            y: (connectionDragState.cursorPosition.y - window.scrollY) / zoom,
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
