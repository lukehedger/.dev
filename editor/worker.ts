import { getAccessKeys, verifyAccessJwt } from "./access.ts";
import { type ContentStore, handleApi, POSTS_DIR, type PostFile, type PutResult } from "./api.ts";

type Env = {
	ASSETS: { fetch(req: Request): Promise<Response> };
	/** Fine-grained PAT: lukehedger/.dev only, Contents read & write. Set as a Worker secret. */
	GITHUB_TOKEN?: string;
	GITHUB_REPO: string;
	GITHUB_BRANCH: string;
	ACCESS_TEAM_DOMAIN: string;
	ACCESS_AUD: string;
	ALLOWED_EMAIL: string;
};

const deny = (status: number, error: string) =>
	new Response(JSON.stringify({ error }), { status, headers: { "content-type": "application/json", "cache-control": "no-store" } });

function githubStore(env: Env, token: string): ContentStore {
	const [owner, name] = env.GITHUB_REPO.split("/") as [string, string];
	const headers = {
		authorization: `Bearer ${token}`,
		accept: "application/vnd.github+json",
		"user-agent": "lukehedger-editor",
		"x-github-api-version": "2022-11-28",
	};
	return {
		async listPosts(): Promise<PostFile[]> {
			// One GraphQL round trip returns every post's blob sha and text.
			const query = `query($owner:String!,$name:String!,$expr:String!){repository(owner:$owner,name:$name){object(expression:$expr){... on Tree{entries{name oid object{... on Blob{text}}}}}}}`;
			const res = await fetch("https://api.github.com/graphql", {
				method: "POST",
				headers,
				body: JSON.stringify({ query, variables: { owner, name, expr: `${env.GITHUB_BRANCH}:${POSTS_DIR}` } }),
			});
			if (!res.ok) throw new Error(`github graphql ${res.status}`);
			const data = (await res.json()) as {
				data?: { repository?: { object?: { entries: Array<{ name: string; oid: string; object: { text: string | null } }> } } };
				errors?: unknown;
			};
			if (data.errors || !data.data?.repository?.object) throw new Error(`github graphql: ${JSON.stringify(data.errors)}`);
			return data.data.repository.object.entries
				.filter((e) => e.name.endsWith(".md") && e.object.text !== null)
				.map((e) => ({ slug: e.name.slice(0, -3), path: `${POSTS_DIR}/${e.name}`, sha: e.oid, text: e.object.text! }));
		},
		async putFile(path, base64, sha, message): Promise<PutResult> {
			const res = await fetch(`https://api.github.com/repos/${owner}/${name}/contents/${path}`, {
				method: "PUT",
				headers,
				body: JSON.stringify({ message, content: base64, branch: env.GITHUB_BRANCH, ...(sha ? { sha } : {}) }),
			});
			// 409: sha is stale; 422: file exists but no sha was sent.
			if (res.status === 409 || res.status === 422) return { conflict: true };
			if (!res.ok) throw new Error(`github put ${res.status}: ${await res.text()}`);
			const data = (await res.json()) as { content: { sha: string } };
			return { sha: data.content.sha };
		},
	};
}

export default {
	async fetch(req: Request, env: Env): Promise<Response> {
		const url = new URL(req.url);
		if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(req);

		// Access sits in front of the whole hostname; verify its token anyway so the
		// API fails closed if Access is ever misconfigured or bypassed.
		const token = req.headers.get("cf-access-jwt-assertion");
		if (!token) return deny(401, "missing access token");
		const config = { teamDomain: env.ACCESS_TEAM_DOMAIN, aud: env.ACCESS_AUD, email: env.ALLOWED_EMAIL };
		let email: string;
		try {
			email = await verifyAccessJwt(token, config, await getAccessKeys(env.ACCESS_TEAM_DOMAIN)).catch(async (err: Error) => {
				if (err.message !== "unknown signing key") throw err;
				return verifyAccessJwt(token, config, await getAccessKeys(env.ACCESS_TEAM_DOMAIN, true));
			});
		} catch (err) {
			return deny(403, (err as Error).message);
		}

		if (!env.GITHUB_TOKEN) return deny(503, "GITHUB_TOKEN secret is not configured");
		try {
			return await handleApi(req, githubStore(env, env.GITHUB_TOKEN), email);
		} catch (err) {
			return deny(502, (err as Error).message);
		}
	},
};
