/**
 * The visual editor: Tiptap with Markdown in and out, configured to write the
 * same Markdown the site's renderer (marked) reads.
 */
import { type AnyExtension, Editor, Mark, mergeAttributes } from "@tiptap/core";
import Image from "@tiptap/extension-image";
import Italic from "@tiptap/extension-italic";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";
import { Markdown } from "@tiptap/markdown";
import StarterKit from "@tiptap/starter-kit";
import { renderMarkdown } from "~/lib/markdown.ts";

/** Inline `<mark>` highlights, which some posts use. Markdown has no syntax, so it stays HTML. */
const Highlight = Mark.create({
	name: "highlight",
	parseHTML: () => [{ tag: "mark" }],
	renderHTML: ({ HTMLAttributes }) => ["mark", mergeAttributes(HTMLAttributes), 0],
	renderMarkdown: (node, h) => `<mark>${h.renderChildren(node)}</mark>`,
	addKeyboardShortcuts() {
		return { "Mod-Shift-h": () => this.editor.commands.toggleMark(this.name) };
	},
});

/** Images show local uploads (blob: URLs) and site images, but keep their repo path in the Markdown. */
export type ResolveSrc = (src: string) => string;

function imageExtension(resolve: ResolveSrc) {
	return Image.extend({
		addNodeView() {
			return ({ node }) => {
				const img = document.createElement("img");
				const apply = (n: typeof node) => {
					img.src = resolve(n.attrs.src ?? "");
					img.alt = n.attrs.alt ?? "";
					if (n.attrs.title) img.title = n.attrs.title;
				};
				apply(node);
				return {
					dom: img,
					update: (n) => {
						if (n.type !== node.type) return false;
						apply(n);
						return true;
					},
				};
			};
		},
	});
}

export function extensions(opts: { resolveSrc?: ResolveSrc; placeholder?: string } = {}): AnyExtension[] {
	return [
		StarterKit.configure({
			heading: { levels: [1, 2, 3, 4, 5, 6] },
			link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
			// No Markdown syntax for underline.
			underline: false,
			italic: false,
		}),
		// The posts use _underscores_ for emphasis.
		Italic.extend({ renderMarkdown: (node, h) => `_${h.renderChildren(node)}_` }),
		Highlight,
		imageExtension(opts.resolveSrc ?? ((s) => s)),
		TableKit.configure({ table: { resizable: false } }),
		Placeholder.configure({ placeholder: opts.placeholder ?? "Start writing…" }),
		Markdown.configure({ markedOptions: { gfm: true } }),
	];
}

export function createEditor(o: {
	element: HTMLElement;
	content: string;
	editable: boolean;
	resolveSrc: ResolveSrc;
	onUpdate: () => void;
	onSelection: () => void;
}): Editor {
	// Leave room for the sticky header and toolbar when scrolling the caret into view.
	const margin = { top: 150, bottom: 80, left: 0, right: 0 };
	return new Editor({
		element: o.element,
		extensions: extensions({ resolveSrc: o.resolveSrc }),
		content: o.content,
		contentType: "markdown",
		editable: o.editable,
		editorProps: {
			attributes: { class: "prose ed-pm", "aria-label": "Post body", spellcheck: "true" },
			scrollMargin: margin,
			scrollThreshold: margin,
		},
		onUpdate: o.onUpdate,
		onSelectionUpdate: o.onSelection,
		onTransaction: o.onSelection,
	});
}

const normHtml = (h: string) => h.replace(/\s+/g, " ").replace(/> </g, "><").trim();

/**
 * Whether the visual editor can hold this Markdown without changing how the post
 * renders. Posts that fail open in Markdown mode so nothing is silently rewritten.
 */
const roundTripCache = new Map<string, boolean>();
export function roundTrips(md: string): boolean {
	if (!md.trim()) return true;
	const hit = roundTripCache.get(md);
	if (hit !== undefined) return hit;
	const ok = checkRoundTrip(md);
	roundTripCache.set(md, ok);
	return ok;
}

function checkRoundTrip(md: string): boolean {
	const el = document.createElement("div");
	const ed = new Editor({ element: el, extensions: extensions(), content: md, contentType: "markdown" });
	try {
		return normHtml(renderMarkdown(md).html) === normHtml(renderMarkdown(ed.getMarkdown()).html);
	} finally {
		ed.destroy();
	}
}
