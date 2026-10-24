/** IndexedDB persistence: everything the editor knows lives here, so it works offline. */

export type Entry = {
	slug: string;
	/** Last version seen in the repo. Absent for a local-only draft. */
	remote?: { sha: string; text: string };
	/** Unpublished local text: a new draft, or edits to a published post. */
	local?: string;
	/** Repo sha the local edits started from (the version publishing will replace). */
	baseSha?: string;
	/** Waiting to be published when the editor is next online. */
	queued?: boolean;
	/** The repo changed underneath the local edits. */
	conflict?: boolean;
	updatedAt: number;
};

/** An image added while editing, uploaded with the first post that references it. Keyed by file name. */
export type Asset = { key: string; blob: Blob };

const DB_NAME = "lukehedger-editor";

function open(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, 1);
		req.onupgradeneeded = () => {
			req.result.createObjectStore("entries", { keyPath: "slug" });
			req.result.createObjectStore("assets", { keyPath: "key" });
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

const dbPromise = open();

async function tx<T>(store: "entries" | "assets", mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
	const db = await dbPromise;
	return new Promise((resolve, reject) => {
		const req = fn(db.transaction(store, mode).objectStore(store));
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}

export const entries = {
	all: () => tx<Entry[]>("entries", "readonly", (s) => s.getAll() as IDBRequest<Entry[]>),
	get: (slug: string) => tx<Entry | undefined>("entries", "readonly", (s) => s.get(slug) as IDBRequest<Entry | undefined>),
	put: (e: Entry) => tx("entries", "readwrite", (s) => s.put(e)),
	delete: (slug: string) => tx("entries", "readwrite", (s) => s.delete(slug)),
};

export const assets = {
	all: () => tx<Asset[]>("assets", "readonly", (s) => s.getAll() as IDBRequest<Asset[]>),
	put: (a: Asset) => tx("assets", "readwrite", (s) => s.put(a)),
	delete: (key: string) => tx("assets", "readwrite", (s) => s.delete(key)),
};
