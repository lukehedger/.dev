import { renderMarkdown } from "~/lib/markdown.ts";
import { type Doc, newDoc, parseDoc, serializeDoc, slugify } from "./doc.ts";
import { assets, type Entry, entries } from "./store.ts";

// ---------------------------------------------------------------- api ----

class AuthError extends Error {}
class OfflineError extends Error {}

const UPLOADS = "uploads";

async function api(path: string, init?: RequestInit): Promise<Response> {
	let res: Response;
	try {
		// Access redirects expired sessions to its login page; "manual" surfaces that as an opaque redirect.
		res = await fetch(path, { ...init, redirect: "manual", headers: { "content-type": "application/json" } });
	} catch {
		throw new OfflineError("offline");
	}
	if (res.type === "opaqueredirect" || res.status === 401 || res.status === 403) throw new AuthError("sign in");
	return res;
}

// -------------------------------------------------------------- state ----

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const ui = {
	main: $("main"),
	status: $("status"),
	signin: $<HTMLButtonElement>("signin"),
	sync: $<HTMLButtonElement>("sync"),
	newPost: $<HTMLButtonElement>("new"),
	filter: $<HTMLInputElement>("filter"),
	posts: $<HTMLUListElement>("posts"),
	doc: $("doc"),
	empty: $("empty"),
	notice: $("notice"),
	title: $<HTMLInputElement>("f-title"),
	slug: $<HTMLInputElement>("f-slug"),
	date: $<HTMLInputElement>("f-date"),
	desc: $<HTMLInputElement>("f-desc"),
	tags: $<HTMLInputElement>("f-tags"),
	body: $<HTMLTextAreaElement>("f-body"),
	preview: $("preview"),
	panes: $("panes"),
	togglePreview: $<HTMLButtonElement>("toggle-preview"),
	image: $<HTMLInputElement>("image"),
	discard: $<HTMLButtonElement>("discard"),
	publish: $<HTMLButtonElement>("publish"),
	back: $<HTMLButtonElement>("back"),
};

let all: Entry[] = [];
let current: { entry: Entry; doc: Doc; slugEdited: boolean } | null = null;
let session: "unknown" | "ok" | "signin" | "offline" = "unknown";
let flushing = false;
const blobUrls = new Map<string, string>();

const textOf = (e: Entry) => e.local ?? e.remote?.text ?? "";
const isDraft = (e: Entry) => !e.remote;
const isDirty = (e: Entry) => e.local !== undefined;

// ------------------------------------------------------------- render ----

function renderStatus(): void {
	const queued = all.filter((e) => e.queued).length;
	const parts = [
		session === "offline" ? "Offline" : session === "signin" ? "Signed out" : session === "ok" ? "Online" : "Connecting…",
	];
	if (queued) parts.push(`${queued} waiting to publish`);
	ui.status.textContent = parts.join(" · ");
	ui.status.dataset.state = session;
	ui.signin.hidden = session !== "signin";
}

function dateOf(e: Entry): string {
	return parseDoc(textOf(e)).fields.publishDate;
}

function renderList(): void {
	const q = ui.filter.value.trim().toLowerCase();
	const sorted = [...all].sort((a, b) => Number(isDirty(b)) - Number(isDirty(a)) || dateOf(b).localeCompare(dateOf(a)));
	ui.posts.replaceChildren(
		...sorted
			.map((e) => ({ e, title: parseDoc(textOf(e)).fields.title || "Untitled" }))
			.filter(({ e, title }) => !q || title.toLowerCase().includes(q) || e.slug.includes(q))
			.map(({ e, title }) => {
				const li = document.createElement("li");
				const btn = document.createElement("button");
				btn.type = "button";
				btn.className = "ed-item";
				if (current?.entry.slug === e.slug) btn.setAttribute("aria-current", "true");
				const badge = e.conflict ? "Conflict" : e.queued ? "Queued" : isDraft(e) ? "Draft" : isDirty(e) ? "Edited" : "";
				btn.innerHTML = `<span class="ed-item-title"></span><span class="ed-item-meta"></span>`;
				btn.querySelector(".ed-item-title")!.textContent = title;
				btn.querySelector(".ed-item-meta")!.textContent = [badge, dateOf(e)].filter(Boolean).join(" · ");
				if (badge) btn.dataset.badge = badge.toLowerCase();
				btn.addEventListener("click", () => openEntry(e.slug));
				li.append(btn);
				return li;
			}),
	);
}

function renderNotice(): void {
	const e = current?.entry;
	let msg = "";
	if (e?.conflict) msg = "This post changed in the repo since you started editing. Publish to overwrite it, or discard your changes to load the latest version.";
	else if (e?.queued) msg = "Waiting to publish. It will go out automatically when you're back online and signed in.";
	else if (e && isDraft(e)) msg = "Local draft: only on this device until you publish.";
	ui.notice.textContent = msg;
	ui.notice.hidden = !msg;
}

let previewTimer: ReturnType<typeof setTimeout> | undefined;
function renderPreview(): void {
	clearTimeout(previewTimer);
	previewTimer = setTimeout(() => {
		if (!current || ui.panes.dataset.preview !== "true") return;
		let html = renderMarkdown(current.doc.body).html;
		for (const [path, url] of blobUrls) html = html.split(`src="${path}"`).join(`src="${url}"`);
		// Images already on the site resolve against it.
		if (location.hostname !== "localhost") html = html.replace(/src="\/(?!\/)/g, 'src="https://lukehedger.dev/');
		ui.preview.innerHTML = `<h1 class="title">${escapeHtml(current.doc.fields.title)}</h1>${html}`;
	}, 150);
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function renderDoc(): void {
	ui.doc.hidden = !current;
	ui.empty.hidden = !!current;
	ui.main.dataset.view = current ? "doc" : "list";
	if (!current) return;
	const { entry, doc } = current;
	// Only touch fields whose value changed, so a re-render never moves the caret.
	const set = (el: HTMLInputElement | HTMLTextAreaElement, v: string) => {
		if (el.value !== v) el.value = v;
	};
	set(ui.title, doc.fields.title);
	if (!isDraft(entry) || current.slugEdited || !ui.slug.value) set(ui.slug, entry.slug);
	ui.slug.readOnly = !isDraft(entry);
	set(ui.date, doc.fields.publishDate);
	set(ui.desc, doc.fields.description);
	if (ui.tags.value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean).join(",") !== doc.fields.tags.join(","))
		ui.tags.value = doc.fields.tags.join(", ");
	set(ui.body, doc.body);
	ui.discard.textContent = isDraft(entry) ? "Delete draft" : "Discard changes";
	ui.discard.disabled = !isDraft(entry) && !isDirty(entry);
	ui.publish.disabled = !isDirty(entry);
	renderNotice();
	renderPreview();
}

function render(): void {
	renderStatus();
	renderList();
	renderDoc();
}

// ------------------------------------------------------------ editing ----

async function openEntry(slug: string): Promise<void> {
	const entry = await entries.get(slug);
	if (!entry) return;
	current = { entry, doc: parseDoc(textOf(entry)), slugEdited: !isDraft(entry) };
	ui.slug.value = entry.slug;
	render();
}

let saveTimer: ReturnType<typeof setTimeout> | undefined;

/** Fold form changes into the current entry and persist them. */
function onEdit(): void {
	if (!current) return;
	const { doc, entry } = current;
	doc.fields.title = ui.title.value;
	doc.fields.description = ui.desc.value;
	doc.fields.publishDate = ui.date.value;
	doc.fields.tags = ui.tags.value.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
	doc.body = ui.body.value;
	if (isDraft(entry) && !current.slugEdited) ui.slug.value = slugify(doc.fields.title);

	const text = serializeDoc(doc);
	if (entry.remote && text === entry.remote.text) {
		entry.local = undefined;
		entry.baseSha = undefined;
	} else {
		if (entry.local === undefined) entry.baseSha = entry.remote?.sha;
		entry.local = text;
	}
	entry.updatedAt = Date.now();
	ui.publish.disabled = !isDirty(entry);
	ui.discard.disabled = !isDraft(entry) && !isDirty(entry);
	renderPreview();
	clearTimeout(saveTimer);
	saveTimer = setTimeout(() => void save(), 300);
}

async function save(): Promise<void> {
	if (!current) return;
	const { entry } = current;
	const slug = ui.slug.value;
	// Drafts are keyed by slug, which follows the title until first publish.
	if (isDraft(entry) && slug && slug !== entry.slug) {
		if (all.some((e) => e.slug === slug)) {
			ui.slug.setCustomValidity("Another post already uses this slug");
			ui.slug.reportValidity();
		} else {
			ui.slug.setCustomValidity("");
			await entries.delete(entry.slug);
			entry.slug = slug;
		}
	}
	await entries.put(entry);
	all = await entries.all();
	renderList();
	renderStatus();
}

async function newPost(): Promise<void> {
	const entry: Entry = { slug: `untitled-${Date.now().toString(36)}`, local: serializeDoc(newDoc()), updatedAt: Date.now() };
	// Show the form before any await so nothing typed straight away is overwritten.
	current = { entry, doc: parseDoc(entry.local!), slugEdited: false };
	ui.slug.value = entry.slug;
	all = [...all, entry];
	render();
	ui.title.focus();
	await entries.put(entry);
}

async function discard(): Promise<void> {
	if (!current) return;
	const { entry } = current;
	const draft = isDraft(entry);
	if (!confirm(draft ? "Delete this draft? It only exists on this device." : "Discard your local changes?")) return;
	if (draft) {
		await entries.delete(entry.slug);
		current = null;
	} else {
		Object.assign(entry, { local: undefined, baseSha: undefined, queued: false, conflict: false });
		await entries.put(entry);
		current = { entry, doc: parseDoc(textOf(entry)), slugEdited: true };
	}
	all = await entries.all();
	render();
}

async function addImage(file: File): Promise<void> {
	if (!current) return;
	const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace("jpeg", "jpg");
	const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
	const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
	const key = `${stamp}-${base}.${ext}`;
	await assets.put({ key, blob: file });
	blobUrls.set(`/images/${UPLOADS}/${key}`, URL.createObjectURL(file));
	const snippet = `![${base.replace(/-/g, " ")}](/images/${UPLOADS}/${key})`;
	const { selectionStart: s, selectionEnd: e, value } = ui.body;
	ui.body.value = `${value.slice(0, s)}${snippet}${value.slice(e)}`;
	ui.body.selectionStart = ui.body.selectionEnd = s + snippet.length;
	onEdit();
}

// ------------------------------------------------------------ syncing ----

async function blobToBase64(blob: Blob): Promise<string> {
	const bytes = new Uint8Array(await blob.arrayBuffer());
	let bin = "";
	for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin);
}

/** Pull the repo's posts into IndexedDB, then publish anything queued. */
async function sync(): Promise<void> {
	try {
		const res = await api("/api/posts");
		if (!res.ok) throw new Error(`posts ${res.status}: ${(await res.json().catch(() => ({}))).error ?? ""}`);
		const remote = (await res.json()) as Array<{ slug: string; sha: string; text: string }>;
		session = "ok";
		const known = new Map((await entries.all()).map((e) => [e.slug, e]));
		for (const p of remote) {
			const e = known.get(p.slug) ?? { slug: p.slug, updatedAt: Date.now() };
			known.delete(p.slug);
			if (e.remote?.sha === p.sha) continue;
			if (e.local !== undefined && e.baseSha !== p.sha) e.conflict = true;
			e.remote = { sha: p.sha, text: p.text };
			await entries.put(e);
		}
		// Gone from the repo: keep local work as a draft, forget the rest.
		for (const e of known.values()) {
			if (!e.remote) continue;
			if (e.local === undefined) await entries.delete(e.slug);
			else await entries.put({ ...e, remote: undefined, baseSha: undefined });
		}
		await flush();
	} catch (err) {
		session = err instanceof AuthError ? "signin" : err instanceof OfflineError ? "offline" : session;
		if (!(err instanceof AuthError || err instanceof OfflineError)) alert(`Sync failed: ${(err as Error).message}`);
	}
	all = await entries.all();
	if (current) {
		const fresh = all.find((e) => e.slug === current!.entry.slug);
		// Only reload the form if the user has no local edits that would be clobbered.
		if (fresh) current = { entry: fresh, doc: fresh.local !== undefined ? current.doc : parseDoc(textOf(fresh)), slugEdited: current.slugEdited };
	}
	render();
}

async function flush(): Promise<void> {
	if (flushing) return;
	flushing = true;
	try {
		for (const e of (await entries.all()).filter((x) => x.queued && x.local !== undefined)) {
			for (const a of await assets.all()) {
				if (!e.local!.includes(`/images/${UPLOADS}/${a.key}`)) continue;
				const res = await api(`/api/images/${UPLOADS}/${a.key}`, {
					method: "PUT",
					body: JSON.stringify({ content: await blobToBase64(a.blob) }),
				});
				// 409: already uploaded by an earlier, interrupted publish.
				if (!res.ok && res.status !== 409) throw new Error(`image upload ${res.status}`);
				await assets.delete(a.key);
			}
			const res = await api(`/api/posts/${e.slug}`, {
				method: "PUT",
				body: JSON.stringify({ content: e.local, sha: e.conflict ? e.remote?.sha : e.baseSha }),
			});
			if (res.status === 409) {
				await entries.put({ ...e, queued: false, conflict: true });
				continue;
			}
			if (!res.ok) throw new Error(`publish ${res.status}: ${(await res.json().catch(() => ({}))).error ?? ""}`);
			const { sha } = (await res.json()) as { sha: string };
			await entries.put({ slug: e.slug, remote: { sha, text: e.local! }, updatedAt: Date.now() });
		}
	} finally {
		flushing = false;
	}
}

async function publish(): Promise<void> {
	if (!current) return;
	clearTimeout(saveTimer);
	await save();
	const { entry, doc } = current;
	if (!doc.fields.title.trim() || !doc.body.trim()) return alert("A post needs a title and some words.");
	if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.slug) || entry.slug.startsWith("untitled-")) return alert("Give the post a slug first.");
	// Publishing over a conflict overwrites the repo version (sync already stored its sha).
	entry.queued = true;
	await entries.put(entry);
	all = await entries.all();
	render();
	await sync();
}

// -------------------------------------------------------------- wire up --

for (const el of [ui.title, ui.desc, ui.date, ui.tags, ui.body]) el.addEventListener("input", onEdit);
ui.slug.addEventListener("input", () => {
	if (!current) return;
	current.slugEdited = true;
	ui.slug.value = slugify(ui.slug.value);
	clearTimeout(saveTimer);
	saveTimer = setTimeout(() => void save(), 300);
});
ui.filter.addEventListener("input", renderList);
ui.newPost.addEventListener("click", () => void newPost());
ui.discard.addEventListener("click", () => void discard());
ui.publish.addEventListener("click", () => void publish());
ui.sync.addEventListener("click", () => void sync());
ui.back.addEventListener("click", () => {
	current = null;
	render();
});
// A top-level navigation lets Access show its login page.
ui.signin.addEventListener("click", () => location.assign(`/?signin=${Date.now()}`));
ui.togglePreview.addEventListener("click", () => {
	const on = ui.panes.dataset.preview !== "true";
	ui.panes.dataset.preview = String(on);
	ui.togglePreview.setAttribute("aria-pressed", String(on));
	renderPreview();
});
ui.image.addEventListener("change", () => {
	const file = ui.image.files?.[0];
	if (file) void addImage(file);
	ui.image.value = "";
});
window.addEventListener("online", () => void sync());
window.addEventListener("offline", () => {
	session = "offline";
	renderStatus();
});
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible") void sync();
});

if (matchMedia("(min-width: 1100px)").matches) {
	ui.panes.dataset.preview = "true";
	ui.togglePreview.setAttribute("aria-pressed", "true");
}

if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");

for (const a of await assets.all()) blobUrls.set(`/images/${UPLOADS}/${a.key}`, URL.createObjectURL(a.blob));
all = await entries.all();
render();
await sync();
