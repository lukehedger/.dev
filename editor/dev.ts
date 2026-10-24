/**
 * Local editor: serves the built PWA and the same API as the Worker, backed by
 * this checkout's files instead of GitHub. No auth — it only listens on localhost.
 *
 *   bun run editor   →  http://localhost:3001
 */
import { mkdir, readdir } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { type ContentStore, handleApi, POSTS_DIR, type PostFile } from "./api.ts";
import { buildEditor, EDITOR_DIST } from "./build.ts";

const ROOT = join(import.meta.dir, "..");
const PORT = Number.parseInt(process.env.PORT ?? "3001", 10);

/** Same sha GitHub reports for a file: git's blob hash. */
function blobSha(bytes: Uint8Array): string {
	const hasher = new Bun.CryptoHasher("sha1");
	hasher.update(`blob ${bytes.byteLength}\0`);
	hasher.update(bytes);
	return hasher.digest("hex");
}

const fsStore: ContentStore = {
	async listPosts(): Promise<PostFile[]> {
		const names = (await readdir(join(ROOT, POSTS_DIR))).filter((n) => n.endsWith(".md"));
		return Promise.all(
			names.map(async (name) => {
				const bytes = new Uint8Array(await Bun.file(join(ROOT, POSTS_DIR, name)).arrayBuffer());
				return { slug: name.slice(0, -3), path: `${POSTS_DIR}/${name}`, sha: blobSha(bytes), text: new TextDecoder().decode(bytes) };
			}),
		);
	},
	async putFile(path, base64, sha) {
		const file = Bun.file(join(ROOT, path));
		if (await file.exists()) {
			if (!sha || blobSha(new Uint8Array(await file.arrayBuffer())) !== sha) return { conflict: true };
		} else if (sha) {
			return { conflict: true };
		}
		const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
		await mkdir(dirname(join(ROOT, path)), { recursive: true });
		await Bun.write(join(ROOT, path), bytes);
		return { sha: blobSha(bytes) };
	},
};

const MIME: Record<string, string> = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".webmanifest": "application/manifest+json",
	".png": "image/png",
	".ico": "image/x-icon",
	".woff2": "font/woff2",
	".map": "application/json",
};

async function serveStatic(pathname: string): Promise<Response> {
	const path = pathname === "/" ? "/index.html" : pathname;
	const file = Bun.file(join(EDITOR_DIST, path));
	if (await file.exists()) return new Response(file, { headers: { "content-type": MIME[extname(path)] ?? "application/octet-stream" } });
	// Images referenced by posts resolve against the site's public/ folder.
	const pub = Bun.file(join(ROOT, "public", path));
	if (await pub.exists()) return new Response(pub);
	return new Response("Not found", { status: 404 });
}

if (import.meta.main) {
	await buildEditor();
	const server = Bun.serve({
		port: PORT,
		fetch(req) {
			const url = new URL(req.url);
			return url.pathname.startsWith("/api/") ? handleApi(req, fsStore, "local") : serveStatic(url.pathname);
		},
	});
	console.log(`editor: http://localhost:${server.port} (editing ${join(ROOT, POSTS_DIR)})`);
}
