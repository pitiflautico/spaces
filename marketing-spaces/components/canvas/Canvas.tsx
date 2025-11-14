'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSpaceStore } from '@/lib/store';
import type { Position } from '@/types';
import ModuleBlock from './ModuleBlock';
import ConnectionLines from './ConnectionLines';
import DotGrid from './DotGrid';
import CanvasControls from './CanvasControls';

export default function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  const { canvasState, setPan, setZoom, getCurrentSpace } = useSpaceStore();
  const currentSpace = getCurrentSpace();

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY * -0.001;
      const newZoom = canvasState.zoom + delta;

      // Calculate zoom center point
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Adjust pan to zoom towards mouse position
      const zoomRatio = newZoom / canvasState.zoom;
      const newPanX = mouseX - (mouseX - canvasState.pan.x) * zoomRatio;
      const newPanY = mouseY - (mouseY - canvasState.pan.y) * zoomRatio;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    },
    [canvasState, setZoom, setPan]
  );

  // Handle mouse down for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow panning with:
    // - Middle mouse button (button 1)
    // - Left mouse button (button 0) + Spacebar
    // - Left mouse button on canvas background (not on modules)
    const isMiddleButton = e.button === 1;
    const isLeftWithSpace = e.button === 0 && spacePressed;
    const isLeftOnBackground = e.button === 0 && (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-background'));

    if (isMiddleButton || isLeftWithSpace || isLeftOnBackground) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - canvasState.pan.x, y: e.clientY - canvasState.pan.y });
    }
  };

  // Handle mouse move for panning
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const newPan: Position = {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        };
        setPan(newPan);
      }
    },
    [isDragging, dragStart, setPan]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-screen bg-[#0A0A0A] overflow-hidden canvas-background"
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        // Prevent context menu on middle button
        if (isDragging) e.preventDefault();
      }}
      style={{
        cursor: isDragging ? 'grabbing' : spacePressed ? 'grab' : 'default'
      }}
    >
      {/* Dot Grid Background */}
      <DotGrid zoom={canvasState.zoom} pan={canvasState.pan} />

      {/* Canvas Content */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${canvasState.pan.x}px, ${canvasState.pan.y}px) scale(${canvasState.zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Connection Lines */}
        {currentSpace && (
          <ConnectionLines
            connections={currentSpace.connections}
            modules={currentSpace.modules}
          />
        )}

        {/* Module Blocks */}
        {currentSpace?.modules.map((module) => (
          <ModuleBlock key={module.id} module={module} />
        ))}
      </div>

      {/* Canvas Controls */}
      <CanvasControls />

      {/* Instructions Overlay */}
      {(!currentSpace || currentSpace.modules.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-gray-500 text-lg mb-2">
              {currentSpace ? 'Your space is empty' : 'No space selected'}
            </p>
            <p className="text-gray-600 text-sm">
              {currentSpace
                ? 'Click the + button to add your first module'
                : 'Create or select a space from the sidebar'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
