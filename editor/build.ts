import { cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const APP = join(import.meta.dir, "app");
export const EDITOR_DIST = join(import.meta.dir, "dist");

const MANIFEST = {
	name: "lukehedger.dev editor",
	short_name: "Editor",
	description: "Write and edit posts for lukehedger.dev",
	start_url: "/",
	scope: "/",
	display: "standalone",
	background_color: "#0a0a0a",
	theme_color: "#0a0a0a",
	icons: [
		{ src: "/icon-192.png", sizes: "192x192", type: "image/png" },
		{ src: "/icon-512.png", sizes: "512x512", type: "image/png" },
	],
};

async function bundle(entry: string, naming: string, define: Record<string, string> = {}): Promise<string> {
	const result = await Bun.build({
		entrypoints: [join(APP, entry)],
		outdir: EDITOR_DIST,
		target: "browser",
		format: "esm",
		minify: true,
		naming,
		define,
	});
	if (!result.success) {
		for (const log of result.logs) console.error(log);
		throw new Error(`editor: bundling ${entry} failed`);
	}
	return result.outputs[0]!.path;
}

export async function buildEditor(): Promise<void> {
	await rm(EDITOR_DIST, { recursive: true, force: true });
	await mkdir(EDITOR_DIST, { recursive: true });

	const appJs = await bundle("main.ts", "app.js");
	// The preview uses the site's own styles so posts look as they will when published.
	const css = (
		await Promise.all(
			[join(ROOT, "src/styles/main.css"), join(ROOT, "src/styles/shiki.css"), join(APP, "editor.css")].map((f) => Bun.file(f).text()),
		)
	).join("\n");
	await Bun.write(join(EDITOR_DIST, "app.css"), css);

	// Bump the service worker cache whenever the shell changes.
	const hasher = new Bun.CryptoHasher("sha256");
	hasher.update(await Bun.file(appJs).text());
	hasher.update(css);
	hasher.update(await Bun.file(join(APP, "index.html")).text());
	const version = hasher.digest("hex").slice(0, 12);
	await bundle("sw.ts", "sw.js", { VERSION: JSON.stringify(version) });

	await cp(join(APP, "index.html"), join(EDITOR_DIST, "index.html"));
	await Bun.write(join(EDITOR_DIST, "manifest.webmanifest"), JSON.stringify(MANIFEST, null, "\t"));
	await cp(join(ROOT, "public/fonts/PPMondwest-Regular.woff2"), join(EDITOR_DIST, "fonts/PPMondwest-Regular.woff2"));
	await cp(join(ROOT, "public/favicon.ico"), join(EDITOR_DIST, "favicon.ico"));
	await cp(join(ROOT, "public/192x192.png"), join(EDITOR_DIST, "icon-192.png"));
	await cp(join(ROOT, "public/512x512.png"), join(EDITOR_DIST, "icon-512.png"));
	// Never let the editor be indexed, even if it were somehow reachable.
	await Bun.write(join(EDITOR_DIST, "robots.txt"), "User-agent: *\nDisallow: /\n");
	await Bun.write(join(EDITOR_DIST, "_headers"), "/*\n  X-Robots-Tag: noindex\n  X-Frame-Options: DENY\n  Referrer-Policy: same-origin\n/sw.js\n  Cache-Control: no-cache\n");
	console.log(`editor: built ${EDITOR_DIST} (shell ${version})`);
}

if (import.meta.main) await buildEditor();
