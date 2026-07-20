import type { AppState } from '../types/index.ts';

export type StorageState = Omit<AppState, 'loading'>;

export interface StorageService {
  loadState(): Promise<StorageState>;
  saveState(state: StorageState): Promise<void>;

  storeFile(id: string, blob: Blob): Promise<void>;
  getFile(id: string): Promise<Blob | null>;
  removeFile(id: string): Promise<void>;
  listFiles(): Promise<string[]>;

  exportZip(state: StorageState): Promise<Blob>;
  importZip(file: File): Promise<StorageState>;

  migrate(): Promise<boolean>;
}

let _instance: StorageService | null = null;

export async function getStorageService(): Promise<StorageService> {
  if (_instance) return _instance;

  if (window.__TAURI_INTERNALS__) {
    const { TauriStorageService } = await import('./TauriStorageService.ts');
    _instance = new TauriStorageService();
  } else {
    const { WebStorageService } = await import('./WebStorageService.ts');
    _instance = new WebStorageService();
  }

  return _instance;
}

export function getStorageServiceSync(): StorageService {
  if (!_instance) throw new Error('StorageService not initialized — call getStorageService() first');
  return _instance;
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: Record<string, unknown>;
  }
}
