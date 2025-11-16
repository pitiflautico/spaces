/**
 * Auto-Save Hook
 * Automatically saves the current space to database at regular intervals
 */

import { useEffect, useRef } from 'react';
import { useSpaceStore } from './store';

const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export function useAutoSave(enabled: boolean = true) {
  const { getCurrentSpace, spaces } = useSpaceStore();
  const lastSaveRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      return;
    }

    const autoSave = async () => {
      const currentSpace = getCurrentSpace();

      if (!currentSpace) {
        return;
      }

      try {
        const response = await fetch('/api/spaces/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentSpace),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[AutoSave] Failed:', error);
          return;
        }

        lastSaveRef.current = Date.now();
        console.log(`[AutoSave] Space "${currentSpace.name}" saved at ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        console.error('[AutoSave] Error:', error);
      }
    };

    // Initial save after 5 seconds
    const initialTimeout = setTimeout(autoSave, 5000);

    // Recurring auto-save
    const interval = setInterval(autoSave, AUTO_SAVE_INTERVAL);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, getCurrentSpace, spaces]);

  // Manual save function
  const manualSave = async () => {
    const currentSpace = getCurrentSpace();

    if (!currentSpace) {
      return { success: false, error: 'No active space' };
    }

    try {
      const response = await fetch('/api/spaces/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(currentSpace),
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error };
      }

      lastSaveRef.current = Date.now();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return {
    lastSaveTime: lastSaveRef.current,
    manualSave,
  };
}

/**
 * Load space from database
 */
export async function loadSpaceFromDB(spaceId: string) {
  try {
    const response = await fetch(`/api/spaces/load/${spaceId}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to load space');
    }

    const data = await response.json();
    return data.space;
  } catch (error: any) {
    console.error('[Load] Error:', error);
    throw error;
  }
}

/**
 * Get list of all saved spaces
 */
export async function listSavedSpaces() {
  try {
    const response = await fetch('/api/spaces/list');

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list spaces');
    }

    const data = await response.json();
    return data.spaces;
  } catch (error: any) {
    console.error('[List] Error:', error);
    return [];
  }
}

/**
 * Delete a space from database
 */
export async function deleteSpaceFromDB(spaceId: string) {
  try {
    const response = await fetch(`/api/spaces/delete/${spaceId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete space');
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Delete] Error:', error);
    throw error;
  }
}
