'use client';

import React from 'react';
import { useSpaceStore } from '@/lib/store';
import {
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/outline';

export default function CanvasControls() {
  const { canvasState, setZoom, resetCanvas } = useSpaceStore();

  const handleZoomIn = () => {
    setZoom(canvasState.zoom + 0.1);
  };

  const handleZoomOut = () => {
    setZoom(canvasState.zoom - 0.1);
  };

  const handleReset = () => {
    resetCanvas();
  };

  const zoomPercentage = Math.round(canvasState.zoom * 100);

  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2">
      {/* Zoom Controls */}
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg shadow-xl overflow-hidden">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 flex items-center justify-center hover:bg-[#2A2A2A] transition-colors border-b border-[#2A2A2A]"
          title="Zoom in"
        >
          <PlusIcon className="w-5 h-5 text-gray-400" />
        </button>

        <div className="w-10 h-10 flex items-center justify-center border-b border-[#2A2A2A]">
          <span className="text-xs text-gray-400 font-medium">{zoomPercentage}%</span>
        </div>

        <button
          onClick={handleZoomOut}
          className="w-10 h-10 flex items-center justify-center hover:bg-[#2A2A2A] transition-colors border-b border-[#2A2A2A]"
          title="Zoom out"
        >
          <MinusIcon className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={handleReset}
          className="w-10 h-10 flex items-center justify-center hover:bg-[#2A2A2A] transition-colors"
          title="Reset view"
        >
          <ArrowsPointingOutIcon className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
