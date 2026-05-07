import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "deadline-dodger";
const DB_VERSION = 1;

export const STORE_KV = "kv";
export const STORE_BLOBS = "blobs";

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_KV)) {
          db.createObjectStore(STORE_KV);
        }
        if (!db.objectStoreNames.contains(STORE_BLOBS)) {
          db.createObjectStore(STORE_BLOBS);
        }
      },
    });
  }
  return dbPromise;
}

export async function kvGet<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return db.get(STORE_KV, key) as Promise<T | undefined>;
}

export async function kvSet<T>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put(STORE_KV, value, key);
}

export async function kvDelete(key: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_KV, key);
}

export async function blobPut(id: string, blob: Blob): Promise<void> {
  const db = await getDB();
  await db.put(STORE_BLOBS, blob, id);
}

export async function blobGet(id: string): Promise<Blob | undefined> {
  const db = await getDB();
  return db.get(STORE_BLOBS, id) as Promise<Blob | undefined>;
}

export async function blobDelete(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_BLOBS, id);
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_KV);
  await db.clear(STORE_BLOBS);
}
