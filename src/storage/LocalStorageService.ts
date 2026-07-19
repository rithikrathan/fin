import type { AppState } from '../types/index.ts';
import { initialState } from '../context/initialState.ts';
import { storeFile, getFile, listFiles } from './fileDB.ts';
import JSZip from 'jszip';

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

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...initialState, ...parsed, loading: false } as AppState;
    }
  } catch {}
  return initialState;
}

export function saveState(state: Omit<AppState, 'loading'>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export { storeFile, getFile, listFiles };

export async function getFileUrl(id: string): Promise<string | null> {
  const blob = await getFile(id);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export async function exportZip(state: Omit<AppState, 'loading'>): Promise<Blob> {
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
  const fileIds = await listFiles();
  for (const id of fileIds) {
    const blob = await getFile(id);
    if (blob) {
      const ext = id.includes('.') ? id.split('.').pop() : 'bin';
      filesFolder?.file(`${id}.${ext}`, blob);
    }
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function importZip(file: File): Promise<Omit<AppState, 'loading'>> {
  const zip = await JSZip.loadAsync(file);

  const dataFile = zip.file('data.json');
  if (!dataFile) throw new Error('Invalid archive: missing data.json');

  const dataText = await dataFile.async('string');
  const data = JSON.parse(dataText) as Omit<AppState, 'loading'>;

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
      await storeFile(id, blob);
    }
  }

  return data;
}

export function migrate(): boolean {
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
  } catch {
    // corrupt data
  }

  localStorage.setItem(MIGRATION_KEY, 'true');
  return false;
}
