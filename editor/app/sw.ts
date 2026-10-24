/// <reference lib="webworker" />
// Service worker: keeps the editor shell available offline. The API is never cached;
// post data lives in IndexedDB.

declare const VERSION: string;
const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `editor-${VERSION}`;
const SHELL = ["/", "/app.js", "/app.css", "/manifest.webmanifest", "/favicon.ico", "/icon-192.png", "/icon-512.png", "/fonts/PPMondwest-Regular.woff2"];

sw.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((c) => c.addAll(SHELL.map((u) => new Request(u, { credentials: "same-origin", cache: "reload" }))))
			.then(() => sw.skipWaiting()),
	);
});

sw.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim()),
	);
});

sw.addEventListener("fetch", (event) => {
	const req = event.request;
	const url = new URL(req.url);
	if (req.method !== "GET" || url.origin !== sw.location.origin || url.pathname.startsWith("/api/")) return;

	if (req.mode === "navigate") {
		// Network first so an expired Access session can redirect to its login page;
		// fall back to the cached shell when offline.
		event.respondWith(
			fetch(req).catch(async () => (await caches.match("/", { cacheName: CACHE })) ?? Response.error()),
		);
		return;
	}

	event.respondWith(caches.match(req, { cacheName: CACHE, ignoreSearch: true }).then((hit) => hit ?? fetch(req)));
});
