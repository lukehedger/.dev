import type { Editor } from "@tiptap/core";
import { site } from "~/config.ts";
import { renderMarkdown } from "~/lib/markdown.ts";
import { type Doc, newDoc, parseDoc, serializeDoc, slugify } from "./doc.ts";
import { icon } from "./icons.ts";
import { preserveSource } from "./merge.ts";
import { createEditor, roundTrips } from "./rich.ts";
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

// ---------------------------------------------------------------- dom ----

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const ui = {
	status: $<HTMLButtonElement>("status"),
	statusText: $("status-text"),
	theme: $<HTMLButtonElement>("theme"),
	back: $<HTMLButtonElement>("back"),
	format: $("format"),
	insertBtn: $<HTMLButtonElement>("insert-btn"),
	image: $<HTMLInputElement>("image"),
	listView: $("list-view"),
	newPost: $<HTMLButtonElement>("new"),
	filter: $<HTMLInputElement>("filter"),
	groupWip: $("group-wip"),
	groupPub: $("group-pub"),
	postsWip: $<HTMLUListElement>("posts-wip"),
	postsPub: $<HTMLUListElement>("posts-pub"),
	listEmpty: $("list-empty"),
	docView: $("doc-view"),
	card: $("card"),
	badge: $("badge"),
	previewBtn: $<HTMLButtonElement>("preview-btn"),
	tagsBtn: $<HTMLButtonElement>("tags-btn"),
	primary: $<HTMLButtonElement>("primary"),
	moreBtn: $<HTMLButtonElement>("more-btn"),
	notice: $("notice"),
	title: $<HTMLTextAreaElement>("f-title"),
	desc: $<HTMLTextAreaElement>("f-desc"),
	chips: $("chips"),
	rich: $("rich"),
	source: $<HTMLTextAreaElement>("f-body"),
	preview: $("preview"),
	insertMenu: $("insert-menu"),
	moreMenu: $("more-menu"),
	date: $<HTMLInputElement>("f-date"),
	dateText: $("m-date-text"),
	mSlug: $<HTMLButtonElement>("m-slug"),
	mSlugText: $("m-slug-text"),
	mSlugHint: $("m-slug-hint"),
	mView: $<HTMLAnchorElement>("m-view"),
	mMode: $<HTMLButtonElement>("m-mode"),
	mModeText: $("m-mode-text"),
	mModeHint: $("m-mode-hint"),
	mSync: $<HTMLButtonElement>("m-sync"),
	mDiscard: $<HTMLButtonElement>("m-discard"),
	mDiscardText: $("m-discard-text"),
	tagSheet: $<HTMLDialogElement>("tag-sheet"),
	tagForm: $<HTMLFormElement>("tag-form"),
	tagInput: $<HTMLInputElement>("tag-input"),
	tagGrid: $("tag-grid"),
	linkSheet: $<HTMLDialogElement>("link-sheet"),
	linkForm: $<HTMLFormElement>("link-form"),
	linkInput: $<HTMLInputElement>("link-input"),
	linkRemove: $<HTMLButtonElement>("link-remove"),
	slugSheet: $<HTMLDialogElement>("slug-sheet"),
	slugForm: $<HTMLFormElement>("slug-form"),
	slugInput: $<HTMLInputElement>("slug-input"),
	confirm: $<HTMLDialogElement>("confirm"),
	confirmTitle: $("confirm-title"),
	confirmText: $("confirm-text"),
	confirmOk: $<HTMLButtonElement>("confirm-ok"),
	toast: $("toast"),
};

// -------------------------------------------------------------- state ----

type Mode = "visual" | "source";

type Current = {
	entry: Entry;
	doc: Doc;
	/** The draft's slug was set by hand, so it no longer follows the title. */
	slugEdited: boolean;
	/** Body the visual editor loaded; blocks left untouched keep this source. */
	baseBody: string;
	mode: Mode;
	/** Opened as Markdown because the visual editor can't hold this post exactly. */
	forcedSource: boolean;
	/** Published posts open read-only until Edit is tapped. */
	editing: boolean;
	preview: boolean;
};

let all: Entry[] = [];
let current: Current | null = null;
let editor: Editor | null = null;
let session: "unknown" | "ok" | "signin" | "offline" = "unknown";
let syncing: Promise<void> | null = null;
let publishing = false;
let flushing = false;
let listScroll = 0;
const blobUrls = new Map<string, string>();

const textOf = (e: Entry) => e.local ?? e.remote?.text ?? "";
const isDraft = (e: Entry) => !e.remote;
const isDirty = (e: Entry) => e.local !== undefined;

const parsed = new Map<string, Doc>();
function docOf(e: Entry): Doc {
	const text = textOf(e);
	let d = parsed.get(text);
	if (!d) {
		if (parsed.size > 500) parsed.clear();
		d = parseDoc(text);
		parsed.set(text, d);
	}
	return d;
}

type Tone = "draft" | "published" | "edited" | "queued" | "conflict";
const LABEL: Record<Tone, string> = { draft: "Draft", published: "Published", edited: "Edited", queued: "Queued", conflict: "Conflict" };
const toneOf = (e: Entry): Tone =>
	e.conflict ? "conflict" : e.queued ? "queued" : isDraft(e) ? "draft" : isDirty(e) ? "edited" : "published";

const fmtDate = (iso: string) => {
	const d = new Date(`${iso}T12:00:00`);
	return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const postUrl = (slug: string) => `${site.url}/posts/${slug}/`;

/** Image paths in posts point at the site; local uploads show from IndexedDB until published. */
function resolveSrc(src: string): string {
	const blob = blobUrls.get(src);
	if (blob) return blob;
	if (location.hostname !== "localhost" && src.startsWith("/") && !src.startsWith("//")) return `${site.url}${src}`;
	return src;
}

// ------------------------------------------------------------ feedback ----

let toastTimer: ReturnType<typeof setTimeout> | undefined;
function toast(msg: string, tone: "ok" | "error" | "" = ""): void {
	ui.toast.textContent = msg;
	ui.toast.dataset.tone = tone;
	ui.toast.classList.add("is-on");
	clearTimeout(toastTimer);
	toastTimer = setTimeout(() => ui.toast.classList.remove("is-on"), tone === "error" ? 5000 : 2600);
}

function ask(title: string, text: string, ok: string): Promise<boolean> {
	ui.confirmTitle.textContent = title;
	ui.confirmText.textContent = text;
	ui.confirmOk.textContent = ok;
	ui.confirm.returnValue = "";
	ui.confirm.showModal();
	return new Promise((resolve) => ui.confirm.addEventListener("close", () => resolve(ui.confirm.returnValue === "ok"), { once: true }));
}

// ------------------------------------------------------------- render ----

function renderStatus(): void {
	const queued = all.filter((e) => e.queued).length;
	const label = syncing
		? "Syncing"
		: session === "offline"
			? "Offline"
			: session === "signin"
				? "Sign in"
				: session === "ok"
					? "Synced"
					: "Connecting";
	ui.statusText.textContent = queued ? `${label} · ${queued} queued` : label;
	ui.status.dataset.state = syncing ? "syncing" : session;
	ui.status.title = session === "signin" ? "Your session expired. Tap to sign in again." : "Tap to sync";
}

function postItem(e: Entry): HTMLLIElement {
	const doc = docOf(e);
	const tone = toneOf(e);
	const li = document.createElement("li");
	const a = document.createElement("a");
	a.className = "ed-post";
	a.href = `#/p/${encodeURIComponent(e.slug)}`;
	a.innerHTML = `<span class="ed-post-title"></span><span class="ed-post-desc"></span><span class="ed-post-meta"><span class="ed-badge ed-badge-sm"></span><time></time></span>`;
	a.querySelector(".ed-post-title")!.textContent = doc.fields.title || "Untitled";
	const desc = a.querySelector<HTMLElement>(".ed-post-desc")!;
	desc.textContent = doc.fields.description;
	desc.hidden = !doc.fields.description;
	const badge = a.querySelector<HTMLElement>(".ed-badge")!;
	badge.textContent = LABEL[tone];
	badge.dataset.tone = tone;
	badge.hidden = tone === "published";
	a.querySelector("time")!.textContent = fmtDate(doc.fields.publishDate);
	a.addEventListener("click", (ev) => {
		if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
		ev.preventDefault();
		go(e.slug);
	});
	li.append(a);
	return li;
}

function renderList(): void {
	const q = ui.filter.value.trim().toLowerCase();
	const match = (e: Entry) => {
		if (!q) return true;
		const d = docOf(e);
		return [d.fields.title, d.fields.description, e.slug, ...d.fields.tags].some((s) => s.toLowerCase().includes(q));
	};
	const shown = all.filter(match);
	const wip = shown.filter((e) => isDirty(e) || isDraft(e) || e.queued || e.conflict).sort((a, b) => b.updatedAt - a.updatedAt);
	const pub = shown
		.filter((e) => !wip.includes(e))
		.sort((a, b) => docOf(b).fields.publishDate.localeCompare(docOf(a).fields.publishDate));
	ui.postsWip.replaceChildren(...wip.map(postItem));
	ui.postsPub.replaceChildren(...pub.map(postItem));
	ui.groupWip.hidden = !wip.length;
	ui.groupPub.hidden = !pub.length;
	ui.listEmpty.hidden = !!shown.length;
	ui.listEmpty.textContent = q
		? `No posts match “${ui.filter.value.trim()}”.`
		: session === "unknown"
			? "Loading posts…"
			: "No posts yet. Start one with New post.";
}

function renderPrimary(): void {
	if (!current) return;
	const { entry, editing } = current;
	let label = "Update";
	let tone = "go";
	let disabled = false;
	if (!editing) {
		label = "Edit";
		tone = "edit";
	} else if (publishing) {
		label = "Publishing…";
		disabled = true;
	} else if (entry.queued) {
		label = "Queued";
		tone = "queued";
		disabled = true;
	} else if (entry.conflict) {
		label = "Overwrite";
		tone = "danger";
	} else if (isDraft(entry)) {
		label = "Publish";
	} else {
		disabled = !isDirty(entry);
	}
	ui.primary.textContent = label;
	if (!editing) ui.primary.insertAdjacentHTML("beforeend", icon("pencil"));
	ui.primary.dataset.tone = tone;
	ui.primary.disabled = disabled;
}

function renderChips(): void {
	if (!current) return;
	const { doc, editing } = current;
	const chips = doc.fields.tags.map((t) => {
		const b = document.createElement("button");
		b.type = "button";
		b.className = "ed-chip";
		b.textContent = t;
		b.addEventListener("click", openTags);
		return b;
	});
	if (editing && !doc.fields.tags.length) {
		const b = document.createElement("button");
		b.type = "button";
		b.className = "ed-chip ed-chip-ghost";
		b.textContent = "+ Add tags";
		b.addEventListener("click", openTags);
		chips.push(b);
	}
	ui.chips.replaceChildren(...chips);
	ui.chips.hidden = !chips.length;
}

function renderNotice(): void {
	const c = current;
	let msg = "";
	let tone = "";
	if (c?.entry.conflict) {
		msg = "This post changed in the repo since you started editing. Overwrite to publish your version, or discard your changes to load the latest.";
		tone = "danger";
	} else if (c?.entry.queued) {
		msg = "Waiting to publish. It goes out automatically when you're back online and signed in.";
	} else if (c?.forcedSource && c.mode === "source") {
		msg = "This post uses Markdown the visual editor can't keep exactly (like raw HTML), so it's open as Markdown.";
	}
	ui.notice.textContent = msg;
	ui.notice.dataset.tone = tone;
	ui.notice.hidden = !msg;
}

function renderMenu(): void {
	if (!current) return;
	const { entry, doc, editing, mode, slugEdited } = current;
	const draft = isDraft(entry);
	ui.dateText.textContent = fmtDate(doc.fields.publishDate) || "Set publish date";
	ui.date.disabled = !editing;
	const untitled = entry.slug.startsWith("untitled-");
	ui.mSlugText.textContent = untitled ? "Slug" : `/posts/${entry.slug}/`;
	ui.mSlugHint.textContent = !draft ? "Fixed once published" : slugEdited ? "Tap to change" : "Follows the title";
	ui.mSlug.disabled = !draft;
	ui.mView.hidden = draft;
	ui.mView.href = postUrl(entry.slug);
	ui.mMode.hidden = !editing;
	ui.mModeText.textContent = mode === "visual" ? "Edit as Markdown" : "Use visual editor";
	ui.mModeHint.textContent = mode === "source" && current.forcedSource ? "Some formatting may change" : "";
	ui.mMode.querySelector("svg")!.outerHTML = icon(mode === "visual" ? "markdown" : "visual");
	ui.mDiscardText.textContent = draft ? "Delete draft" : "Discard changes";
	ui.mDiscard.hidden = !draft && !isDirty(entry);
}

let previewTimer: ReturnType<typeof setTimeout> | undefined;
function renderPreview(): void {
	clearTimeout(previewTimer);
	previewTimer = setTimeout(() => {
		if (!current?.preview) return;
		let html = renderMarkdown(current.doc.body).html;
		html = html.replace(/src="([^"]+)"/g, (_, src: string) => `src="${escapeHtml(resolveSrc(src))}"`);
		const { title, description } = current.doc.fields;
		ui.preview.innerHTML =
			`<h1 class="title">${escapeHtml(title || "Untitled")}</h1>` +
			(description ? `<p class="ed-preview-desc">${escapeHtml(description)}</p>` : "") +
			html;
	}, 120);
}

const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function autosize(el: HTMLTextAreaElement): void {
	if (el.hidden) return;
	// Collapsing the box to measure it can clamp the page scroll, so put it back.
	const y = window.scrollY;
	el.style.height = "auto";
	el.style.height = `${el.scrollHeight}px`;
	if (window.scrollY !== y) window.scrollTo({ top: y });
}

function renderDoc(): void {
	const open = !!current;
	document.body.dataset.view = open ? "doc" : "list";
	ui.listView.hidden = open;
	ui.docView.hidden = !open;
	ui.format.hidden = true;
	if (!current) return;
	const { entry, doc, editing, preview, mode } = current;

	const tone = toneOf(entry);
	ui.badge.textContent = LABEL[tone];
	ui.badge.dataset.tone = tone;
	renderPrimary();
	ui.previewBtn.hidden = !editing;
	ui.previewBtn.setAttribute("aria-pressed", String(preview));
	ui.previewBtn.classList.toggle("is-on", preview);

	// Only touch fields whose value changed, so a re-render never moves the caret.
	const set = (el: HTMLTextAreaElement, v: string) => {
		if (el.value !== v) el.value = v;
	};
	set(ui.title, doc.fields.title);
	set(ui.desc, doc.fields.description);
	if (ui.date.value !== doc.fields.publishDate) ui.date.value = doc.fields.publishDate;
	ui.title.readOnly = ui.desc.readOnly = ui.source.readOnly = !editing;
	ui.title.hidden = preview;
	ui.desc.hidden = preview || (!editing && !doc.fields.description);
	renderChips();
	if (preview) ui.chips.hidden = true;

	ui.rich.hidden = preview || mode !== "visual";
	ui.source.hidden = preview || mode !== "source";
	ui.preview.hidden = !preview;
	if (mode === "source") set(ui.source, doc.body);
	if (editor && editor.isEditable !== (editing && !preview)) editor.setEditable(editing && !preview, false);

	ui.format.hidden = !editing || preview;
	ui.format.dataset.mode = mode;
	ui.card.dataset.editing = String(editing);
	renderNotice();
	renderMenu();
	renderPreview();
	updateFormatState();
	for (const el of [ui.title, ui.desc, ui.source]) autosize(el);
}

function render(): void {
	renderStatus();
	renderList();
	renderDoc();
}

// ------------------------------------------------------------- editor ----

let bodyStale = false;

function mountEditor(body: string): void {
	editor?.destroy();
	editor = null;
	ui.rich.replaceChildren();
	if (!current || current.mode !== "visual") return;
	current.baseBody = body;
	editor = createEditor({
		element: ui.rich,
		content: body,
		editable: current.editing && !current.preview,
		resolveSrc,
		onUpdate: () => {
			bodyStale = true;
			scheduleCommit();
		},
		onSelection: updateFormatState,
	});
}

/**
 * Focus the view before running a focusing command. On iOS, Tiptap's focus command focuses
 * the DOM synchronously, which dispatches its own transaction under the pending one.
 */
function focused(): Editor | null {
	if (editor && !editor.view.hasFocus()) editor.view.focus();
	return editor;
}

/** Fold the visual editor's document back into Markdown. Deferred because it re-serialises everything. */
function readEditorBody(): void {
	if (!bodyStale || !editor || !current || current.mode !== "visual") return;
	bodyStale = false;
	current.doc.body = preserveSource(current.baseBody, editor.getMarkdown());
}

function updateFormatState(): void {
	const visual = current?.mode === "visual" && !!editor;
	for (const b of ui.format.querySelectorAll<HTMLButtonElement>("[data-cmd]")) {
		const on = visual && editor!.isActive(b.dataset.cmd!);
		b.classList.toggle("is-on", on);
		b.setAttribute("aria-pressed", String(on));
	}
}

// ---------------------------------------------------------- source mode --

function insertText(text: string): void {
	const ta = ui.source;
	ta.focus();
	// execCommand keeps the textarea's native undo stack; setRangeText is the fallback.
	if (!document.execCommand("insertText", false, text)) {
		ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, "end");
		ta.dispatchEvent(new Event("input"));
	}
}

function wrapSelection(before: string, after: string, placeholder: string): void {
	const ta = ui.source;
	const { selectionStart: s, selectionEnd: e, value } = ta;
	const inner = value.slice(s, e) || placeholder;
	insertText(`${before}${inner}${after}`);
	ta.setSelectionRange(s + before.length, s + before.length + inner.length);
}

function prefixLine(prefix: string): void {
	const ta = ui.source;
	const start = ta.value.lastIndexOf("\n", ta.selectionStart - 1) + 1;
	ta.setSelectionRange(start, start);
	insertText(prefix);
}

function insertBlock(block: string): void {
	const ta = ui.source;
	const before = ta.value.slice(0, ta.selectionStart);
	const lead = !before || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
	insertText(`${lead}${block}\n\n`);
}

// ------------------------------------------------------------ editing ----

let commitTimer: ReturnType<typeof setTimeout> | undefined;
/** Something was typed or changed since the last commit. Opening a post alone never writes it. */
let touched = false;
function scheduleCommit(): void {
	touched = true;
	clearTimeout(commitTimer);
	commitTimer = setTimeout(() => void commit(), 300);
}

/** Fold the form into the current entry and persist it. */
async function commit(): Promise<void> {
	clearTimeout(commitTimer);
	if (!current || !touched) return;
	touched = false;
	const c = current;
	const { doc, entry } = c;
	if (c.editing) {
		doc.fields.title = ui.title.value;
		doc.fields.description = ui.desc.value;
		doc.fields.publishDate = ui.date.value;
		if (c.mode === "visual") readEditorBody();
		else doc.body = ui.source.value;
	}
	const text = serializeDoc(doc);
	if (entry.remote && text === entry.remote.text) {
		entry.local = undefined;
		entry.baseSha = undefined;
	} else if (text !== textOf(entry)) {
		if (entry.local === undefined) entry.baseSha = entry.remote?.sha;
		entry.local = text;
	}
	entry.updatedAt = Date.now();

	// Drafts are keyed by slug, which follows the title until set by hand or published.
	if (isDraft(entry)) {
		const want = c.slugEdited ? entry.slug : slugify(doc.fields.title);
		if (want && want !== entry.slug && !all.some((e) => e !== entry && e.slug === want)) {
			await entries.delete(entry.slug);
			entry.slug = want;
			history.replaceState(history.state, "", `#/p/${encodeURIComponent(want)}`);
		}
	}
	await entries.put(entry);
	all = await entries.all();
	if (current !== c) return;
	// Keep the in-memory entry the one being edited (entries.all returns copies).
	all = all.map((e) => (e.slug === entry.slug ? entry : e));
	renderStatus();
	renderList();
	const tone = toneOf(entry);
	ui.badge.textContent = LABEL[tone];
	ui.badge.dataset.tone = tone;
	renderPrimary();
	renderMenu();
	renderPreview();
}

function blankCurrent(entry: Entry, editing: boolean): Current {
	const doc = parseDoc(textOf(entry));
	const visualOk = roundTrips(doc.body);
	return {
		entry,
		doc,
		slugEdited: !isDraft(entry),
		baseBody: doc.body,
		mode: visualOk ? "visual" : "source",
		forcedSource: !visualOk,
		editing,
		preview: false,
	};
}

async function openEntry(slug: string): Promise<void> {
	await commit();
	const entry = all.find((e) => e.slug === slug) ?? (await entries.get(slug));
	if (!entry) {
		// Before the first sync a deep link may name a post not cached yet; keep it and retry after.
		if (session !== "unknown") history.replaceState(null, "", "#/");
		return closeDoc();
	}
	if (!current) listScroll = window.scrollY;
	const editing = isDraft(entry) || isDirty(entry) || !!entry.queued || !!entry.conflict;
	current = blankCurrent(entry, editing);
	touched = false;
	mountEditor(current.doc.body);
	render();
	window.scrollTo({ top: 0 });
}

async function closeDoc(): Promise<void> {
	await commit();
	editor?.destroy();
	editor = null;
	const wasOpen = !!current;
	current = null;
	render();
	if (wasOpen) window.scrollTo({ top: listScroll });
}

/** Navigate to a post, leaving a history entry so the back gesture returns to the list. */
function go(slug: string): void {
	history.pushState({ ed: 1 }, "", `#/p/${encodeURIComponent(slug)}`);
	void openEntry(slug);
}

function goBack(): void {
	if (history.state?.ed) history.back();
	else {
		history.replaceState(null, "", "#/");
		void closeDoc();
	}
}

function route(): void {
	const m = location.hash.match(/^#\/p\/(.+)$/);
	const slug = m ? decodeURIComponent(m[1]!) : null;
	if (slug && current?.entry.slug === slug) return;
	void (slug ? openEntry(slug) : closeDoc());
}

async function newPost(): Promise<void> {
	await commit();
	const entry: Entry = { slug: `untitled-${Date.now().toString(36)}`, local: serializeDoc(newDoc()), updatedAt: Date.now() };
	if (!current) listScroll = window.scrollY;
	current = { ...blankCurrent(entry, true), slugEdited: false };
	all = [...all, entry];
	history.pushState({ ed: 1 }, "", `#/p/${encodeURIComponent(entry.slug)}`);
	mountEditor("");
	render();
	window.scrollTo({ top: 0 });
	ui.title.focus();
	await entries.put(entry);
}

function startEditing(): void {
	if (!current) return;
	// Just unlock it: jumping the caret somewhere would scroll away from what's being read.
	current.editing = true;
	renderDoc();
}

async function discard(): Promise<void> {
	if (!current) return;
	await commit();
	const { entry } = current;
	const draft = isDraft(entry);
	const ok = draft
		? await ask("Delete this draft?", "It only exists on this device, so it can't be recovered.", "Delete")
		: await ask("Discard your changes?", "The post goes back to its published version.", "Discard");
	if (!ok || !current) return;
	if (draft) {
		await entries.delete(entry.slug);
		all = await entries.all();
		current = null;
		goBack();
		toast("Draft deleted");
		return;
	}
	Object.assign(entry, { local: undefined, baseSha: undefined, queued: false, conflict: false });
	await entries.put(entry);
	all = await entries.all();
	current = blankCurrent(entry, false);
	mountEditor(current.doc.body);
	render();
	toast("Changes discarded");
}

async function setMode(mode: Mode): Promise<void> {
	if (!current || current.mode === mode) return;
	await commit();
	if (mode === "visual" && !roundTrips(current.doc.body)) {
		const ok = await ask(
			"Switch to the visual editor?",
			"This post uses Markdown the visual editor can't represent exactly, such as raw HTML. Parts of it may render differently once you edit.",
			"Switch",
		);
		if (!ok || !current) return;
	}
	current.mode = mode;
	current.preview = false;
	if (mode === "visual") mountEditor(current.doc.body);
	else mountEditor("");
	renderDoc();
	if (mode === "visual") focused()?.commands.focus();
	else ui.source.focus();
}

async function addImage(file: File): Promise<void> {
	if (!current) return;
	const ext = (file.name.split(".").pop() ?? "png").toLowerCase().replace("jpeg", "jpg");
	const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
	const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
	const key = `${stamp}-${base}.${ext}`;
	await assets.put({ key, blob: file });
	const src = `/images/${UPLOADS}/${key}`;
	blobUrls.set(src, URL.createObjectURL(file));
	const alt = base.replace(/-/g, " ");
	if (current.mode === "visual" && editor) focused()!.chain().focus().setImage({ src, alt }).run();
	else insertBlock(`![${alt}](${src})`);
}

// ------------------------------------------------------------ toolbar ----

function runFormat(cmd: string): void {
	if (!current) return;
	if (cmd === "link") return openLink();
	if (current.mode === "source") {
		const wraps: Record<string, [string, string, string]> = {
			bold: ["**", "**", "bold"],
			italic: ["_", "_", "italic"],
			strike: ["~~", "~~", "struck"],
			code: ["`", "`", "code"],
		};
		const w = wraps[cmd];
		if (w) wrapSelection(...w);
		return;
	}
	const chain = focused()?.chain().focus();
	if (!chain) return;
	if (cmd === "bold") chain.toggleBold().run();
	else if (cmd === "italic") chain.toggleItalic().run();
	else if (cmd === "strike") chain.toggleStrike().run();
	else if (cmd === "code") chain.toggleCode().run();
}

function runInsert(kind: string): void {
	if (!current) return;
	if (current.mode === "source") {
		const prefixes: Record<string, string> = { h2: "## ", h3: "### ", quote: "> ", bullet: "- ", ordered: "1. " };
		const blocks: Record<string, string> = {
			codeblock: "```\n\n```",
			table: "| Column | Column |\n| --- | --- |\n|  |  |",
			divider: "---",
		};
		if (prefixes[kind]) prefixLine(prefixes[kind]);
		else if (blocks[kind]) insertBlock(blocks[kind]);
		else if (kind === "highlight") wrapSelection("<mark>", "</mark>", "highlight");
		return;
	}
	const chain = focused()?.chain().focus();
	if (!chain) return;
	if (kind === "h2") chain.toggleHeading({ level: 2 }).run();
	else if (kind === "h3") chain.toggleHeading({ level: 3 }).run();
	else if (kind === "quote") chain.toggleBlockquote().run();
	else if (kind === "bullet") chain.toggleBulletList().run();
	else if (kind === "ordered") chain.toggleOrderedList().run();
	else if (kind === "codeblock") chain.toggleCodeBlock().run();
	else if (kind === "highlight") chain.toggleMark("highlight").run();
	else if (kind === "table") chain.insertTable({ rows: 3, cols: 2, withHeaderRow: true }).run();
	else if (kind === "divider") chain.setHorizontalRule().run();
}

// -------------------------------------------------------------- sheets ----

function openSheet(d: HTMLDialogElement, focus?: HTMLElement): void {
	d.showModal();
	// Focus after the sheet is shown so mobile keyboards open with it.
	focus?.focus();
}

function normaliseTag(t: string): string {
	return t.trim().toLowerCase().replace(/\s+/g, "-");
}

function renderTagGrid(): void {
	if (!current) return;
	const selected = current.doc.fields.tags;
	const q = normaliseTag(ui.tagInput.value);
	const counts = new Map<string, number>();
	for (const e of all) for (const t of docOf(e).fields.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
	const others = [...counts.keys()]
		.filter((t) => !selected.includes(t) && (!q || t.includes(q)))
		.sort((a, b) => counts.get(b)! - counts.get(a)! || a.localeCompare(b));
	const chip = (t: string, on: boolean, label = t) => {
		const b = document.createElement("button");
		b.type = "button";
		b.className = "ed-tag";
		b.textContent = label;
		b.setAttribute("aria-pressed", String(on));
		b.addEventListener("click", () => toggleTag(t));
		return b;
	};
	const nodes = [
		...selected.map((t) => chip(t, true)),
		...(q && !counts.has(q) && !selected.includes(q) ? [chip(q, false, `+ Create “${q}”`)] : []),
		...others.map((t) => chip(t, false)),
	];
	ui.tagGrid.replaceChildren(...nodes);
}

function toggleTag(t: string): void {
	if (!current?.editing) return;
	const tags = current.doc.fields.tags;
	current.doc.fields.tags = tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t];
	ui.tagInput.value = "";
	renderTagGrid();
	renderChips();
	touched = true;
	void commit();
}

function openTags(): void {
	if (!current) return;
	if (!current.editing) {
		startEditing();
		openTags();
		return;
	}
	ui.tagInput.value = "";
	renderTagGrid();
	openSheet(ui.tagSheet, ui.tagInput);
}

function openLink(): void {
	if (!current) return;
	const href = current.mode === "visual" ? (editor?.getAttributes("link").href as string | undefined) : undefined;
	ui.linkInput.value = href ?? "";
	ui.linkRemove.hidden = !href;
	openSheet(ui.linkSheet, ui.linkInput);
}

function applyLink(raw: string): void {
	if (!current) return;
	let url = raw.trim();
	if (url && !/^([a-z][a-z0-9+.-]*:|\/|#)/i.test(url)) url = `https://${url}`;
	if (current.mode === "source") {
		if (url) wrapSelection("[", `](${url})`, "link text");
		return;
	}
	if (!editor) return;
	const chain = focused()!.chain().focus().extendMarkRange("link");
	if (!url) chain.unsetLink().run();
	else if (editor.state.selection.empty && !editor.isActive("link"))
		chain.insertContent({ type: "text", text: raw.trim(), marks: [{ type: "link", attrs: { href: url } }] }).run();
	else chain.setLink({ href: url }).run();
}

// ------------------------------------------------------------ syncing ----

async function blobToBase64(blob: Blob): Promise<string> {
	const bytes = new Uint8Array(await blob.arrayBuffer());
	let bin = "";
	for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	return btoa(bin);
}

function sync(): Promise<void> {
	syncing ??= doSync().finally(() => {
		syncing = null;
		renderStatus();
	});
	renderStatus();
	return syncing;
}

/** Pull the repo's posts into IndexedDB, then publish anything queued. */
async function doSync(): Promise<void> {
	// Persist anything typed in the last moment, so the refresh below can't drop it.
	await commit();
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
		if (!(err instanceof AuthError || err instanceof OfflineError)) toast(`Sync failed: ${(err as Error).message}`, "error");
	}
	all = await entries.all();
	if (current) {
		const fresh = all.find((e) => e.slug === current!.entry.slug);
		if (!fresh) {
			current = null;
			history.replaceState(null, "", "#/");
		} else if (fresh.local === undefined && textOf(fresh) !== textOf(current.entry)) {
			// Nothing local to clobber: show the latest version.
			const { editing, mode, preview } = current;
			current = { ...blankCurrent(fresh, editing), preview };
			if (mode === "source") current.mode = "source";
			mountEditor(current.doc.body);
		} else {
			current.entry = fresh;
			all = all.map((e) => (e.slug === fresh.slug ? fresh : e));
		}
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
	if (!current || publishing) return;
	await commit();
	const { entry, doc } = current;
	if (!doc.fields.title.trim()) {
		toast("Give the post a title first.", "error");
		ui.title.focus();
		return;
	}
	if (!doc.body.trim()) return toast("Write something first.", "error");
	if (!/^[a-z0-9][a-z0-9-]*$/.test(entry.slug) || entry.slug.startsWith("untitled-")) return toast("Give the post a slug first.", "error");
	const wasDraft = isDraft(entry);
	// Publishing over a conflict overwrites the repo version (sync already stored its sha).
	entry.queued = true;
	await entries.put(entry);
	publishing = true;
	renderPrimary();
	try {
		await sync();
	} finally {
		publishing = false;
	}
	const fresh = all.find((e) => e.slug === entry.slug);
	if (fresh?.conflict) toast("The post changed in the repo. Review it, then overwrite or discard.", "error");
	else if (fresh?.queued) toast("Saved. It'll publish when you're back online.");
	else if (fresh) toast(wasDraft ? "Published" : "Updated", "ok");
	render();
}

// --------------------------------------------------------- positioning ----

/** Pin the header and sheets to the visible area when a mobile keyboard is open. */
function trackViewport(): void {
	const vv = window.visualViewport;
	if (!vv) return;
	const update = () => {
		const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
		document.documentElement.style.setProperty("--kb", `${Math.round(kb)}px`);
		document.documentElement.style.setProperty("--vv-top", `${Math.max(0, Math.round(vv.offsetTop))}px`);
	};
	vv.addEventListener("resize", update);
	vv.addEventListener("scroll", update);
	update();
}

function anchorMenu(menu: HTMLElement, btn: HTMLElement, align: "start" | "end"): void {
	menu.addEventListener("beforetoggle", (ev) => {
		if ((ev as ToggleEvent).newState !== "open") return;
		const r = btn.getBoundingClientRect();
		const vv = window.visualViewport;
		const bottom = vv ? vv.height + vv.offsetTop : window.innerHeight;
		menu.style.top = `${r.bottom + 8}px`;
		menu.style.maxHeight = `${Math.max(160, bottom - r.bottom - 20)}px`;
		if (align === "end") {
			menu.style.right = `${Math.max(12, window.innerWidth - r.right)}px`;
			menu.style.left = "auto";
		} else {
			menu.style.left = `${Math.max(12, r.left)}px`;
			menu.style.right = "auto";
		}
	});
}

// -------------------------------------------------------------- wire up --

for (const el of [ui.title, ui.desc, ui.source]) {
	el.addEventListener("input", () => {
		autosize(el);
		scheduleCommit();
	});
}
for (const el of [ui.title, ui.desc]) {
	el.addEventListener("keydown", (ev) => {
		if (ev.key !== "Enter" || ev.isComposing) return;
		ev.preventDefault();
		if (el === ui.title) ui.desc.focus();
		else if (current?.mode === "visual") focused()?.commands.focus("start");
		else ui.source.focus();
	});
}
ui.date.addEventListener("change", () => {
	touched = true;
	void commit().then(renderMenu);
});

// Keep focus (and the on-screen keyboard) in the editor while tapping toolbar buttons.
for (const el of [ui.format, ui.insertMenu]) el.addEventListener("pointerdown", (ev) => {
	if ((ev.target as HTMLElement).closest("button")) ev.preventDefault();
});
ui.format.addEventListener("click", (ev) => {
	const b = (ev.target as HTMLElement).closest<HTMLButtonElement>("[data-cmd]");
	if (b) runFormat(b.dataset.cmd!);
});
ui.insertMenu.addEventListener("click", (ev) => {
	const b = (ev.target as HTMLElement).closest<HTMLButtonElement>("[data-insert]");
	if (!b) return;
	ui.insertMenu.hidePopover();
	runInsert(b.dataset.insert!);
});
anchorMenu(ui.insertMenu, ui.insertBtn, "start");
anchorMenu(ui.moreMenu, ui.moreBtn, "end");

ui.primary.addEventListener("click", () => void (current?.editing ? publish() : startEditing()));
ui.previewBtn.addEventListener("click", async () => {
	if (!current) return;
	await commit();
	current.preview = !current.preview;
	renderDoc();
	window.scrollTo({ top: 0 });
});
ui.tagsBtn.addEventListener("click", openTags);
ui.mSlug.addEventListener("click", () => {
	if (!current || !isDraft(current.entry)) return;
	ui.moreMenu.hidePopover();
	ui.slugInput.value = current.entry.slug.startsWith("untitled-") ? slugify(current.doc.fields.title) : current.entry.slug;
	openSheet(ui.slugSheet, ui.slugInput);
});
ui.mMode.addEventListener("click", () => {
	ui.moreMenu.hidePopover();
	void setMode(current?.mode === "visual" ? "source" : "visual");
});
ui.mSync.addEventListener("click", () => {
	ui.moreMenu.hidePopover();
	void sync();
});
ui.mDiscard.addEventListener("click", () => {
	ui.moreMenu.hidePopover();
	void discard();
});
ui.mView.addEventListener("click", () => ui.moreMenu.hidePopover());

ui.tagInput.addEventListener("input", renderTagGrid);
ui.tagForm.addEventListener("submit", (ev) => {
	ev.preventDefault();
	const t = normaliseTag(ui.tagInput.value);
	if (t) toggleTag(t);
	else ui.tagSheet.close();
});
ui.linkForm.addEventListener("submit", (ev) => {
	ev.preventDefault();
	ui.linkSheet.close();
	applyLink(ui.linkInput.value);
});
ui.linkRemove.addEventListener("click", () => {
	ui.linkSheet.close();
	applyLink("");
});
ui.slugForm.addEventListener("submit", async (ev) => {
	ev.preventDefault();
	if (!current) return;
	const want = slugify(ui.slugInput.value);
	if (!want) return;
	if (all.some((e) => e !== current!.entry && e.slug === want)) {
		toast("Another post already uses that slug.", "error");
		return;
	}
	ui.slugSheet.close();
	await commit();
	if (!current) return;
	if (want !== current.entry.slug) {
		await entries.delete(current.entry.slug);
		current.entry.slug = want;
		history.replaceState(history.state, "", `#/p/${encodeURIComponent(want)}`);
	}
	current.slugEdited = true;
	touched = true;
	await commit();
});
for (const d of document.querySelectorAll<HTMLDialogElement>("dialog")) {
	// Tapping the backdrop (the dialog box itself, outside its content) closes it.
	d.addEventListener("click", (ev) => {
		if (ev.target === d) d.close();
	});
	for (const b of d.querySelectorAll("[data-close]")) b.addEventListener("click", () => d.close());
}

ui.filter.addEventListener("input", renderList);
ui.newPost.addEventListener("click", () => void newPost());
ui.back.addEventListener("click", goBack);
// A top-level navigation lets Access show its login page.
ui.status.addEventListener("click", () => (session === "signin" ? location.assign(`/?signin=${Date.now()}`) : void sync()));
ui.theme.addEventListener("click", () => {
	const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
	document.documentElement.dataset.theme = next;
	document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')!.content = next === "light" ? "#fafafa" : "#0a0a0a";
	try {
		localStorage.setItem("theme", next);
	} catch {}
});
ui.image.addEventListener("change", () => {
	const file = ui.image.files?.[0];
	if (file) void addImage(file);
	ui.image.value = "";
});

window.addEventListener("popstate", route);
window.addEventListener("online", () => void sync());
window.addEventListener("offline", () => {
	session = "offline";
	renderStatus();
});
document.addEventListener("visibilitychange", () => {
	if (document.visibilityState === "visible") void sync();
	else void commit();
});
document.addEventListener("keydown", (ev) => {
	if ((ev.metaKey || ev.ctrlKey) && ev.key === "s") {
		ev.preventDefault();
		void commit().then(() => toast("Saved on this device"));
	}
	if ((ev.metaKey || ev.ctrlKey) && ev.key === "k" && current?.editing) {
		ev.preventDefault();
		openLink();
	}
});
window.addEventListener("resize", () => {
	if (current) for (const el of [ui.title, ui.desc, ui.source]) autosize(el);
});

trackViewport();
if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js");

for (const a of await assets.all()) blobUrls.set(`/images/${UPLOADS}/${a.key}`, URL.createObjectURL(a.blob));
all = await entries.all();
render();
route();
await sync();
if (!current) route();
