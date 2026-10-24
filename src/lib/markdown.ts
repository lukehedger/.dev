import { Marked, type Tokens } from "marked";
import readingTime from "reading-time";
import { site } from "~/config.ts";

export type Heading = { depth: number; slug: string; text: string };

export type Rendered = {
	html: string;
	headings: Heading[];
	readingMinutes: string;
	plainText: string;
	/** First paragraph of the rendered HTML, for post snippets. */
	excerpt: string;
};

/** Returns highlighted HTML for a code block. */
export type Highlight = (code: string, lang: string) => string;

const plainHighlight: Highlight = (code) =>
	`<pre><code>${code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`;

export function slugify(s: string): string {
	return s
		.toLowerCase()
		.trim()
		.replace(/&/g, " and ")
		.replace(/[‘’“”]/g, "")
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
}

function escapeAttr(s: string): string {
	return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

const siteHost = new URL(site.url).host;

function isExternal(href: string): boolean {
	if (!/^https?:\/\//i.test(href)) return false;
	try {
		return new URL(href).host !== siteHost;
	} catch {
		return false;
	}
}

function ensureUniqueSlug(base: string, used: Map<string, number>): string {
	const count = used.get(base) ?? 0;
	used.set(base, count + 1);
	return count === 0 ? base : `${base}-${count}`;
}

export function renderMarkdown(md: string, highlight: Highlight = plainHighlight): Rendered {
	const headings: Heading[] = [];
	const usedSlugs = new Map<string, number>();

	const m = new Marked({
		gfm: true,
		renderer: {
			heading({ tokens, depth }: Tokens.Heading): string {
				const text = this.parser.parseInline(tokens, this.parser.textRenderer);
				const slug = ensureUniqueSlug(slugify(text), usedSlugs);
				headings.push({ depth, slug, text });
				const inner = this.parser.parseInline(tokens);
				return `<h${depth} id="${slug}"><a class="heading-anchor" href="#${slug}">${inner}</a></h${depth}>\n`;
			},
			code({ text, lang }: Tokens.Code): string {
				return highlight(text, lang ?? "text");
			},
			link({ href, title, tokens }: Tokens.Link): string {
				const inner = this.parser.parseInline(tokens);
				const rel = isExternal(href) ? ' target="_blank" rel="nofollow noopener noreferrer"' : "";
				const titleAttr = title ? ` title="${escapeAttr(title)}"` : "";
				return `<a href="${escapeAttr(href)}"${titleAttr}${rel}>${inner}</a>`;
			},
			paragraph({ tokens }: Tokens.Paragraph): string {
				if (tokens.length === 1 && tokens[0]?.type === "image") {
					return `${this.parser.parseInline(tokens)}\n`;
				}
				return `<p>${this.parser.parseInline(tokens)}</p>\n`;
			},
		},
	});

	const html = m.parse(md, { async: false });
	const { text: readingMinutes } = readingTime(md);
	const plainText = toPlainText(md);
	const excerpt = html.match(/<p>[\s\S]*?<\/p>/)?.[0] ?? "";

	return { html, headings, readingMinutes, plainText, excerpt };
}

function toPlainText(md: string): string {
	return md
		.replace(/```[\s\S]*?```/g, " ")
		.replace(/`[^`]*`/g, " ")
		.replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
		.replace(/[#>*_~\-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}
