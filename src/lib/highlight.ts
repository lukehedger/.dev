import { createHighlighter } from "shiki";
import type { Highlight } from "./markdown.ts";

const SHIKI_LANGS = [
	"typescript",
	"ts",
	"javascript",
	"js",
	"tsx",
	"jsx",
	"bash",
	"shell",
	"sh",
	"json",
	"markdown",
	"md",
	"html",
	"css",
	"python",
	"py",
	"yaml",
	"yml",
	"toml",
	"go",
	"rust",
	"rs",
	"diff",
	"sql",
] as const;

let highlightPromise: Promise<Highlight> | null = null;

/** Shiki-backed code highlighter used by the site build (dual light/dark themes). */
export function getHighlight(): Promise<Highlight> {
	if (!highlightPromise) {
		highlightPromise = createHighlighter({
			themes: ["dracula", "github-light"],
			langs: [...SHIKI_LANGS],
		}).then((highlighter) => (code, lang) =>
			highlighter.codeToHtml(code, {
				lang: (SHIKI_LANGS as readonly string[]).includes(lang) ? lang : "text",
				themes: { light: "github-light", dark: "dracula" },
				defaultColor: false,
			}),
		);
	}
	return highlightPromise;
}
