// Minimal IndexedDB wrapper for offline manifest + pending-scan queue.
// No external library needed — the native IndexedDB API is enough for
// this simple key-value use case.

const DB_NAME = "apsts-conductor";
const DB_VERSION = 1;
const MANIFEST_STORE = "manifest";
const QUEUE_STORE = "pendingScans";

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(MANIFEST_STORE)) {
        db.createObjectStore(MANIFEST_STORE, { keyPath: "qrCodeHash" });
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: "qrCodeHash" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(storeName, mode, fn) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    const result = fn(store);
    t.oncomplete = () => resolve(result);
    t.onerror = () => reject(t.error);
  });
}

export async function saveManifest(entries) {
  await tx(MANIFEST_STORE, "readwrite", (store) => {
    store.clear();
    entries.forEach((e) => store.put(e));
  });
}

export async function findInManifest(qrCodeHash) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(MANIFEST_STORE, "readonly")
      .objectStore(MANIFEST_STORE).get(qrCodeHash);
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function markLocallyBoarded(qrCodeHash) {
  const entry = await findInManifest(qrCodeHash);
  if (!entry) return;
  entry.reservationStatus = "BOARDED";
  await tx(MANIFEST_STORE, "readwrite", (store) => store.put(entry));
  await tx(QUEUE_STORE, "readwrite", (store) =>
    store.put({ qrCodeHash, scannedAt: new Date().toISOString() })
  );
}

export async function getPendingQueue() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(QUEUE_STORE, "readonly").objectStore(QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function clearSyncedFromQueue(syncedHashes) {
  await tx(QUEUE_STORE, "readwrite", (store) => {
    syncedHashes.forEach((h) => store.delete(h));
  });
}