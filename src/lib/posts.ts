import matter from "gray-matter";
import { readdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { getHighlight } from "./highlight.ts";
import { type Heading, renderMarkdown } from "./markdown.ts";

export type Frontmatter = {
	title: string;
	description: string;
	publishDate: Date;
	updatedDate?: Date;
	tags: string[];
	draft: boolean;
	/** Where a rehosted post was first published, e.g. "Medium". Absent for posts written here. */
	source?: string;
	/** Live URL of the original, when the original site still exists. */
	originalUrl?: string;
};

export type Post = {
	slug: string;
	frontmatter: Frontmatter;
	html: string;
	headings: Heading[];
	readingMinutes: string;
	plainText: string;
	excerpt: string;
};

function normalizeTags(tags: unknown): string[] {
	if (!Array.isArray(tags)) return [];
	const lowered = tags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase());
	return Array.from(new Set(lowered));
}

function parseFrontmatter(data: Record<string, unknown>, file: string): Frontmatter {
	const title = typeof data.title === "string" ? data.title : "";
	const description = typeof data.description === "string" ? data.description : "";
	const publishDateRaw = data.publishDate;
	const updatedDateRaw = data.updatedDate;

	const source = typeof data.source === "string" && data.source ? data.source : undefined;
	const originalUrl = typeof data.originalUrl === "string" && data.originalUrl ? data.originalUrl : undefined;

	if (!title) throw new Error(`${file}: missing frontmatter.title`);
	// Rehosted posts keep their original title and description; new posts stay within SEO limits.
	if (!source && title.length > 60) throw new Error(`${file}: title exceeds 60 chars`);
	if (!source && description.length > 160) throw new Error(`${file}: description exceeds 160 chars`);

	const publishDate =
		publishDateRaw instanceof Date
			? publishDateRaw
			: typeof publishDateRaw === "string"
				? new Date(publishDateRaw)
				: undefined;
	if (!publishDate || Number.isNaN(publishDate.getTime())) {
		throw new Error(`${file}: invalid or missing publishDate`);
	}

	const updatedDate =
		updatedDateRaw instanceof Date
			? updatedDateRaw
			: typeof updatedDateRaw === "string"
				? new Date(updatedDateRaw)
				: undefined;

	return {
		title,
		description,
		publishDate,
		updatedDate: updatedDate && !Number.isNaN(updatedDate.getTime()) ? updatedDate : undefined,
		tags: normalizeTags(data.tags),
		draft: data.draft === true,
		source,
		originalUrl,
	};
}

export async function loadPosts(dir: string): Promise<Post[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = entries
		.filter((e) => e.isFile() && extname(e.name) === ".md")
		.map((e) => join(dir, e.name));
	const highlight = await getHighlight();
	const posts: Post[] = [];
	for (const file of files) {
		const raw = await Bun.file(file).text();
		const parsed = matter(raw);
		const fm = parseFrontmatter(parsed.data as Record<string, unknown>, file);
		if (fm.draft && process.env.INCLUDE_DRAFTS !== "1") continue;
		const slug = basename(file, ".md");
		const { html, headings, readingMinutes, plainText, excerpt } = renderMarkdown(parsed.content, highlight);
		if (!fm.description) fm.description = summarise(plainText);
		posts.push({ slug, frontmatter: fm, html, headings, readingMinutes, plainText, excerpt });
	}
	return sortByDate(posts);
}

/** Up to ~155 characters of text, cut at a word boundary. */
function summarise(text: string): string {
	if (text.length <= 155) return text;
	return `${text.slice(0, 155).replace(/\s+\S*$/, "")}…`;
}

export function sortByDate(posts: Post[]): Post[] {
	return [...posts].sort((a, b) => {
		const aDate = (a.frontmatter.updatedDate ?? a.frontmatter.publishDate).valueOf();
		const bDate = (b.frontmatter.updatedDate ?? b.frontmatter.publishDate).valueOf();
		return bDate - aDate;
	});
}

export function uniqueTags(posts: Post[]): string[] {
	return Array.from(new Set(posts.flatMap((p) => p.frontmatter.tags)));
}

export function tagsWithCount(posts: Post[]): Array<[string, number]> {
	const map = new Map<string, number>();
	for (const post of posts) {
		for (const tag of post.frontmatter.tags) {
			map.set(tag, (map.get(tag) ?? 0) + 1);
		}
	}
	return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

export function postsByTag(posts: Post[], tag: string): Post[] {
	return posts.filter((p) => p.frontmatter.tags.includes(tag));
}
