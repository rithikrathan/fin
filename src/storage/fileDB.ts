import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'finmanager_files';
const DB_VERSION = 1;
const FILE_STORE = 'files';

let dbInstance: IDBPDatabase | null = null;

export async function getFileDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE, { keyPath: 'id' });
      }
    },
  });
  return dbInstance;
}

export async function storeFile(id: string, blob: Blob): Promise<void> {
  const db = await getFileDB();
  await db.put(FILE_STORE, { id, blob });
}

export async function getFile(id: string): Promise<Blob | null> {
  const db = await getFileDB();
  const result = await db.get(FILE_STORE, id);
  return result?.blob ?? null;
}

export async function removeFile(id: string): Promise<void> {
  const db = await getFileDB();
  await db.delete(FILE_STORE, id);
}

export async function listFiles(): Promise<string[]> {
  const db = await getFileDB();
  const keys = await db.getAllKeys(FILE_STORE);
  return keys.map(String);
}
