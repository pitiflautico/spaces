'use client';

import React from 'react';
import type { Module, ModuleConnection } from '@/types';

interface ConnectionLinesProps {
  connections: ModuleConnection[];
  modules: Module[];
}

export default function ConnectionLines({ connections, modules }: ConnectionLinesProps) {
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

        return (
          <g key={connection.id}>
            {/* Shadow/glow effect */}
            <path
              d={path}
              fill="none"
              stroke="rgba(139, 92, 246, 0.3)"
              strokeWidth="8"
              filter="blur(4px)"
            />
            {/* Main line */}
            <path
              d={path}
              fill="none"
              stroke="rgb(139, 92, 246)"
              strokeWidth="2"
            />
            {/* Animated dashes */}
            <path
              d={path}
              fill="none"
              stroke="rgb(199, 162, 255)"
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
    </svg>
  );
}
