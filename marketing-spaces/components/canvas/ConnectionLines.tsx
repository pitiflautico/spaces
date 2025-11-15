'use client';

import React from 'react';
import type { Module, ModuleConnection, DataType } from '@/types';

interface ConnectionLinesProps {
  connections: ModuleConnection[];
  modules: Module[];
}

const getDataTypeColor = (type: DataType): string => {
  switch (type) {
    case 'image':
      return 'rgb(168, 85, 247)'; // purple-500
    case 'text':
      return 'rgb(59, 130, 246)'; // blue-500
    case 'json':
      return 'rgb(34, 197, 94)'; // green-500
    case 'audio':
      return 'rgb(234, 179, 8)'; // yellow-500
    case 'video':
      return 'rgb(239, 68, 68)'; // red-500
    case 'mixed':
      return 'rgb(139, 92, 246)'; // violet-500
    default:
      return 'rgb(107, 114, 128)'; // gray-500
  }
};

const getDataTypeIcon = (type: DataType): string => {
  switch (type) {
    case 'image':
      return '🖼️';
    case 'text':
      return '📄';
    case 'json':
      return '{ }';
    case 'audio':
      return '🔊';
    case 'video':
      return '🎬';
    case 'mixed':
      return '🔗';
    default:
      return '📦';
  }
};

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
        const color = getDataTypeColor(connection.dataType);
        const icon = getDataTypeIcon(connection.dataType);

        // Calculate midpoint for icon
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        return (
          <g key={connection.id}>
            {/* Shadow/glow effect */}
            <path
              d={path}
              fill="none"
              stroke={color.replace('rgb', 'rgba').replace(')', ', 0.3)')}
              strokeWidth="8"
              filter="blur(4px)"
            />
            {/* Main line */}
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth="2"
              className={connection.isValid === false ? 'animate-pulse' : ''}
            />
            {/* Animated dashes */}
            <path
              d={path}
              fill="none"
              stroke={color}
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
            {/* Type icon in the middle */}
            <circle
              cx={midX}
              cy={midY}
              r="12"
              fill="#1A1A1A"
              stroke={color}
              strokeWidth="2"
            />
            <text
              x={midX}
              y={midY}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="10"
              fill="white"
            >
              {icon}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
