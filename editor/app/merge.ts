/**
 * Keep the author's own Markdown for every block the visual editor didn't change.
 *
 * The visual editor re-serialises the whole document, which normalises things
 * like list indentation and escaping. That would turn a one-word edit into a
 * noisy diff, so each top-level block of the new Markdown that renders exactly
 * like a block of the original is swapped back for the original's source, along
 * with the original spacing between neighbouring blocks that both survived.
 */
import { Lexer } from "marked";
import { renderMarkdown } from "~/lib/markdown.ts";

const norm = (h: string) => h.replace(/\s+/g, " ").replace(/> </g, "><").trim();

// Rendering is the slow part and most blocks repeat between keystrokes, so remember them.
const keys = new Map<string, string>();
function keyOf(md: string): string {
	let k = keys.get(md);
	if (k === undefined) {
		if (keys.size > 4000) keys.clear();
		k = norm(renderMarkdown(md).html);
		keys.set(md, k);
	}
	return k;
}

type Block = { text: string; /** Whitespace up to the next block. */ sep: string };

function blocks(md: string): Block[] {
	const out: Block[] = [];
	for (const t of new Lexer({ gfm: true }).lex(md)) {
		if (t.type === "space") {
			if (out.length) out[out.length - 1]!.sep += t.raw;
			continue;
		}
		const text = t.raw.replace(/\n+$/, "");
		if (!text.trim()) continue;
		out.push({ text, sep: t.raw.slice(text.length) });
	}
	return out;
}

export function preserveSource(original: string, next: string): string {
	if (!original.trim()) return next;
	const orig = blocks(original);
	const byRender = new Map<string, number[]>();
	orig.forEach((b, i) => {
		const key = keyOf(b.text);
		byRender.set(key, [...(byRender.get(key) ?? []), i]);
	});
	const matched = blocks(next).map((b) => {
		const i = byRender.get(keyOf(b.text))?.shift();
		return i === undefined ? { text: b.text, from: -1 } : { text: orig[i]!.text, from: i };
	});
	return matched
		.map((b, j) => {
			const nxt = matched[j + 1];
			if (!nxt) return b.text;
			const sep = b.from >= 0 && nxt.from === b.from + 1 ? orig[b.from]!.sep : "";
			// A separator must still end the block; fall back to a blank line.
			return b.text + (/\n/.test(sep) ? sep : "\n\n");
		})
		.join("");
}
