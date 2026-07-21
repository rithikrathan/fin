import type { AppState } from '../types/index.ts';
import { initialState } from '../context/initialState.ts';
import { openDB, type IDBPDatabase } from 'idb';
import JSZip from 'jszip';
import type { StorageService, StorageState } from './StorageService.ts';

const STORAGE_KEY = 'finmanager_data';
const MIGRATION_KEY = 'finmanager_migrated';
const CURRENT_VERSION = 1;
const APP_VERSION = '0.1.0';

interface ExportMeta {
  version: number;
  exported_at: string;
  platform: string;
  app_version: string;
}

const FILE_DB_NAME = 'finmanager_files';
const FILE_DB_VERSION = 1;
const FILE_STORE = 'files';

let fileDbInstance: IDBPDatabase | null = null;

async function getFileDB(): Promise<IDBPDatabase> {
  if (fileDbInstance) return fileDbInstance;
  fileDbInstance = await openDB(FILE_DB_NAME, FILE_DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE, { keyPath: 'id' });
      }
    },
  });
  return fileDbInstance;
}

function normalizeState(parsed: Record<string, unknown>): AppState {
  const state = { ...initialState, ...parsed, loading: false } as AppState;

  state.transactions = state.transactions.map((tx) => ({
    ...tx,
    file_id: (tx as { file_id?: string | null }).file_id ?? null,
    file_name: (tx as { file_name?: string | null }).file_name ?? null,
    ...(tx.type === 'expense' && !('notes' in tx) ? { notes: '' } : {}),
  }));

  if (state.wants) {
    state.wants = state.wants.map((w) => ({
      ...w,
      added_at: w.added_at ?? new Date().toISOString(),
      no_lock: w.no_lock ?? false,
    }));
  }

  if (state.needs) {
    state.needs = state.needs.map((n) => ({
      ...n,
      reapproval_required: n.reapproval_required ?? false,
    }));
  }

  if (!state.balance_accounts) state.balance_accounts = [];
  if (!state.balance_transactions) state.balance_transactions = [];
  if (!state.balance_line_items) state.balance_line_items = [];

  if (!state.settings) state.settings = initialState.settings;
  state.settings.cooling_off_hours = state.settings.cooling_off_hours ?? 48;
  state.settings.waterfall_priority = state.settings.waterfall_priority ?? [];

  return state;
}

export class WebStorageService implements StorageService {
  async loadState(): Promise<StorageState> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return normalizeState(parsed);
      }
    } catch {}
    return initialState;
  }

  async saveState(state: StorageState): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  async storeFile(id: string, blob: Blob): Promise<void> {
    const db = await getFileDB();
    await db.put(FILE_STORE, { id, blob });
  }

  async getFile(id: string): Promise<Blob | null> {
    const db = await getFileDB();
    const result = await db.get(FILE_STORE, id);
    return result?.blob ?? null;
  }

  async removeFile(id: string): Promise<void> {
    const db = await getFileDB();
    await db.delete(FILE_STORE, id);
  }

  async listFiles(): Promise<string[]> {
    const db = await getFileDB();
    const keys = await db.getAllKeys(FILE_STORE);
    return keys.map(String);
  }

  async exportZip(state: StorageState): Promise<Blob> {
    const zip = new JSZip();

    const meta: ExportMeta = {
      version: CURRENT_VERSION,
      exported_at: new Date().toISOString(),
      platform: 'web',
      app_version: APP_VERSION,
    };

    zip.file('data.json', JSON.stringify(state, null, 2));
    zip.file('meta.json', JSON.stringify(meta, null, 2));

    const filesFolder = zip.folder('files');
    const fileIds = await this.listFiles();
    for (const id of fileIds) {
      const blob = await this.getFile(id);
      if (blob) {
        const ext = id.includes('.') ? id.split('.').pop() : 'bin';
        filesFolder?.file(`${id}.${ext}`, blob);
      }
    }

    return zip.generateAsync({ type: 'blob' });
  }

  async importZip(file: File): Promise<StorageState> {
    const zip = await JSZip.loadAsync(file);

    const dataFile = zip.file('data.json');
    if (!dataFile) throw new Error('Invalid archive: missing data.json');

    const dataText = await dataFile.async('string');
    const data = JSON.parse(dataText) as StorageState;

    const filesFolder = zip.folder('files');
    if (filesFolder) {
      const entries: JSZip.JSZipObject[] = [];
      filesFolder.forEach((_path, entry) => {
        if (!entry.dir) entries.push(entry);
      });

      for (const entry of entries) {
        const name = entry.name.replace('files/', '');
        const blob = await entry.async('blob');
        const id = name.includes('.') ? name.split('.').slice(0, -1).join('.') : name;
        await this.storeFile(id, blob);
      }
    }

    return data;
  }

  async migrate(): Promise<boolean> {
    if (localStorage.getItem(MIGRATION_KEY)) return false;

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATION_KEY, 'true');
      return false;
    }

    try {
      const parsed = JSON.parse(raw);
      if (parsed.version === CURRENT_VERSION) {
        localStorage.setItem(MIGRATION_KEY, 'true');
        return false;
      }
    } catch {}

    localStorage.setItem(MIGRATION_KEY, 'true');
    return false;
  }
}
