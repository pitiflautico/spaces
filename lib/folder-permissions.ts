/**
 * Folder Permissions Manager
 *
 * Manages persistent folder access permissions using File System Access API
 * and IndexedDB for storage.
 */

const DB_NAME = 'marketing-spaces-folders';
const DB_VERSION = 1;
const STORE_NAME = 'folder-handles';

interface SavedFolder {
  id: string;
  name: string;
  path: string;
  addedAt: number;
}

/**
 * Initialize IndexedDB for folder handles
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * Save a folder handle to IndexedDB
 */
export async function saveFolderHandle(id: string, name: string, path: string, handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const folderData: SavedFolder = {
    id,
    name,
    path,
    addedAt: Date.now(),
  };

  // Store folder metadata and handle separately
  await store.put({ ...folderData, handle });

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Get all saved folder handles
 */
export async function getSavedFolders(): Promise<Array<SavedFolder & { handle: FileSystemDirectoryHandle }>> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a specific folder handle by ID
 */
export async function getFolderHandle(id: string): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readonly');
  const store = tx.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => {
      const result = request.result;
      resolve(result?.handle || null);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Remove a saved folder
 */
export async function removeFolderHandle(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await store.delete(id);

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Request permission for a folder handle
 */
export async function requestPermission(handle: FileSystemDirectoryHandle): Promise<boolean> {
  try {
    // Check if we already have permission
    const permission = await handle.queryPermission({ mode: 'read' });
    if (permission === 'granted') {
      return true;
    }

    // Request permission
    const newPermission = await handle.requestPermission({ mode: 'read' });
    return newPermission === 'granted';
  } catch (error) {
    console.error('Error requesting folder permission:', error);
    return false;
  }
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Open directory picker and save the handle
 */
export async function pickAndSaveFolder(): Promise<SavedFolder | null> {
  if (!isFileSystemAccessSupported()) {
    throw new Error('File System Access API not supported in this browser');
  }

  try {
    // @ts-ignore - File System Access API
    const handle: FileSystemDirectoryHandle = await window.showDirectoryPicker({
      mode: 'read',
    });

    const hasPermission = await requestPermission(handle);
    if (!hasPermission) {
      throw new Error('Permission denied');
    }

    // Generate ID and path
    const id = `folder-${Date.now()}`;
    const name = handle.name;

    // Try to get a reasonable path
    // Note: File System Access API doesn't give us the full path for security reasons
    // We'll construct a best-guess path based on OS
    const userAgent = navigator.userAgent.toLowerCase();
    const isMac = userAgent.includes('mac');
    const isWindows = userAgent.includes('win');

    let path = '';
    if (isMac) {
      path = `/Users/${process.env.USER || 'user'}/${name}`;
    } else if (isWindows) {
      path = `C:\\Users\\${process.env.USERNAME || 'user'}\\${name}`;
    } else {
      path = `/home/${process.env.USER || 'user'}/${name}`;
    }

    // Save to IndexedDB
    await saveFolderHandle(id, name, path, handle);

    return { id, name, path, addedAt: Date.now() };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return null; // User cancelled
    }
    throw error;
  }
}

/**
 * List all subdirectories in a folder
 */
export async function listSubdirectories(handle: FileSystemDirectoryHandle): Promise<string[]> {
  const subdirs: string[] = [];

  try {
    for await (const entry of handle.values()) {
      if (entry.kind === 'directory') {
        subdirs.push(entry.name);
      }
    }
  } catch (error) {
    console.error('Error listing subdirectories:', error);
  }

  return subdirs.sort();
}
