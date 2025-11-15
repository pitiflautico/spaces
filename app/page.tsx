'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import Canvas from '@/components/canvas/Canvas';
import AddModuleButton from '@/components/canvas/AddModuleButton';
import { useSpaceStore } from '@/lib/store';

export default function Home() {
  const { spaces, createSpace, setCurrentSpace } = useSpaceStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Create a default space on first load if none exists
  useEffect(() => {
    if (!isHydrated) return;

    if (spaces.length === 0) {
      createSpace('My First Space');
    } else if (!useSpaceStore.getState().currentSpaceId) {
      setCurrentSpace(spaces[0].id);
    }
  }, [isHydrated]);

  // Show loading state while hydrating to avoid hydration mismatch
  if (!isHydrated) {
    return (
      <main className="flex h-screen bg-[#0A0A0A] overflow-hidden items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    );
  }

  return (
    <main className="flex h-screen bg-[#0A0A0A] overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 ml-[260px] relative">
        {/* Canvas */}
        <Canvas />

        {/* Add Module Button */}
        <AddModuleButton />
      </div>
    </main>
  );
}
