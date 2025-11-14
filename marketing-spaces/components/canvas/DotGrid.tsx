'use client';

import React, { useMemo } from 'react';
import type { Position } from '@/types';

interface DotGridProps {
  zoom: number;
  pan: Position;
}

export default function DotGrid({ zoom, pan }: DotGridProps) {
  const gridSize = 20; // Base grid size in pixels
  const dotSize = 1.5; // Dot size in pixels

  const gridPattern = useMemo(() => {
    // Calculate the effective grid size with zoom
    const effectiveGridSize = gridSize * zoom;

    // Calculate offset based on pan to make grid appear stable
    const offsetX = pan.x % effectiveGridSize;
    const offsetY = pan.y % effectiveGridSize;

    return {
      size: effectiveGridSize,
      offset: { x: offsetX, y: offsetY },
    };
  }, [zoom, pan]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern
            id="dot-grid"
            width={gridPattern.size}
            height={gridPattern.size}
            patternUnits="userSpaceOnUse"
            x={gridPattern.offset.x}
            y={gridPattern.offset.y}
          >
            <circle
              cx={gridPattern.size / 2}
              cy={gridPattern.size / 2}
              r={dotSize}
              fill="#3E3E3E"
              fillOpacity="0.25"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dot-grid)" />
      </svg>
    </div>
  );
}
