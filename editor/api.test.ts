import { describe, expect, test } from "bun:test";
import { type ContentStore, handleApi } from "./api.ts";

function memoryStore() {
	const files = new Map<string, { sha: string; base64: string }>();
	let n = 0;
	const store: ContentStore = {
		listPosts: async () => [],
		async putFile(path, base64, sha) {
			const existing = files.get(path);
			if (existing ? existing.sha !== sha : sha !== undefined) return { conflict: true };
			const next = `sha${++n}`;
			files.set(path, { sha: next, base64 });
			return { sha: next };
		},
	};
	return { store, files };
}

const put = (path: string, body: unknown) =>
	new Request(`https://w.lukehedger.dev${path}`, { method: "PUT", body: JSON.stringify(body) });

describe("handleApi", () => {
	test("publishes a post to content/posts/<slug>.md as UTF-8", async () => {
		const { store, files } = memoryStore();
		const res = await handleApi(put("/api/posts/cafe-notes", { content: "---\ntitle: Café\n---\n\nNaïve ☕\n" }), store, "lh4@pm.me");
		expect(res.status).toBe(200);
		const saved = files.get("content/posts/cafe-notes.md")!;
		expect(Buffer.from(saved.base64, "base64").toString("utf8")).toBe("---\ntitle: Café\n---\n\nNaïve ☕\n");
	});

	test("returns 409 when the post changed since it was loaded", async () => {
		const { store } = memoryStore();
		await handleApi(put("/api/posts/a", { content: "v1" }), store, "x");
		const stale = await handleApi(put("/api/posts/a", { content: "v2", sha: "not-the-current-sha" }), store, "x");
		expect(stale.status).toBe(409);
		const recreate = await handleApi(put("/api/posts/a", { content: "v2" }), store, "x");
		expect(recreate.status).toBe(409);
	});

	test.each([
		["/api/posts/..%2F..%2Fsrc%2Fconfig"],
		["/api/posts/Upper-Case"],
		["/api/images/uploads/payload.html"],
		["/api/images/..%2Fsrc/x.png"],
	])("refuses to write outside posts and images: %s", async (path) => {
		const { store, files } = memoryStore();
		const res = await handleApi(put(path, { content: "aGk=" }), store, "x");
		expect(res.status).toBe(400);
		expect(files.size).toBe(0);
	});
});
