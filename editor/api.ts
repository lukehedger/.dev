/**
 * The editor's HTTP API, shared by the Cloudflare Worker (GitHub-backed) and the
 * local dev server (filesystem-backed). Auth happens before this is called.
 *
 *   GET  /api/session                 → { email }
 *   GET  /api/posts                   → PostFile[]
 *   PUT  /api/posts/:slug             { content, sha? } → { sha } | 409
 *   PUT  /api/images/:slug/:file      { content (base64) } → { path } | 409
 */

export type PostFile = { slug: string; path: string; sha: string; text: string };

export type PutResult = { sha: string } | { conflict: true };

export interface ContentStore {
	listPosts(): Promise<PostFile[]>;
	/** Create (no sha) or update (sha of the version being replaced) a file. */
	putFile(path: string, base64: string, sha: string | undefined, message: string): Promise<PutResult>;
}

export const POSTS_DIR = "content/posts";
export const IMAGES_DIR = "public/images";

const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
const IMAGE = /^[a-z0-9][a-z0-9._-]{0,99}\.(png|jpe?g|gif|webp|svg)$/;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
	});

export function toBase64(text: string): string {
	const bytes = new TextEncoder().encode(text);
	let bin = "";
	for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin);
}

export async function handleApi(req: Request, store: ContentStore, email: string): Promise<Response> {
	const url = new URL(req.url);
	const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]

	if (req.method === "GET" && parts[1] === "session" && parts.length === 2) return json({ email });

	if (req.method === "GET" && parts[1] === "posts" && parts.length === 2) return json(await store.listPosts());

	if (req.method === "PUT" && parts[1] === "posts" && parts.length === 3) {
		const slug = parts[2]!;
		if (!SLUG.test(slug)) return json({ error: "invalid slug" }, 400);
		const body = (await req.json().catch(() => null)) as { content?: unknown; sha?: unknown } | null;
		if (!body || typeof body.content !== "string" || !body.content.trim()) return json({ error: "content required" }, 400);
		const sha = typeof body.sha === "string" && body.sha ? body.sha : undefined;
		const result = await store.putFile(
			`${POSTS_DIR}/${slug}.md`,
			toBase64(body.content),
			sha,
			`${sha ? "Update" : "Publish"} ${slug} via w.lukehedger.dev`,
		);
		return "conflict" in result ? json({ error: "conflict" }, 409) : json(result);
	}

	if (req.method === "PUT" && parts[1] === "images" && parts.length === 4) {
		const [, , slug, file] = parts as [string, string, string, string];
		if (!SLUG.test(slug) || !IMAGE.test(file)) return json({ error: "invalid image path" }, 400);
		const body = (await req.json().catch(() => null)) as { content?: unknown } | null;
		if (!body || typeof body.content !== "string" || !body.content) return json({ error: "content required" }, 400);
		if ((body.content.length * 3) / 4 > MAX_IMAGE_BYTES) return json({ error: "image too large" }, 413);
		const path = `${IMAGES_DIR}/${slug}/${file}`;
		const result = await store.putFile(path, body.content, undefined, `Add image ${slug}/${file} via w.lukehedger.dev`);
		return "conflict" in result ? json({ error: "conflict" }, 409) : json({ path: `/images/${slug}/${file}` });
	}

	return json({ error: "not found" }, 404);
}
