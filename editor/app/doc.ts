import { parseDocument, stringify } from "yaml";

/** The frontmatter fields the editor form edits. Other keys are preserved untouched. */
export type Fields = {
	title: string;
	description: string;
	/** YYYY-MM-DD for the date input */
	publishDate: string;
	tags: string[];
};

export type Doc = { fields: Fields; body: string; extra: Record<string, unknown>; rawDate: string };

const FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

function toInputDate(raw: string): string {
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
	const d = new Date(raw);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseDoc(text: string): Doc {
	const m = text.match(FM);
	const data = (m ? parseDocument(m[1]!).toJS() : {}) as Record<string, unknown>;
	const { title, description, publishDate, tags, ...extra } = data;
	const rawDate = publishDate instanceof Date ? publishDate.toISOString().slice(0, 10) : String(publishDate ?? "");
	return {
		fields: {
			title: String(title ?? ""),
			description: String(description ?? ""),
			publishDate: toInputDate(rawDate),
			tags: Array.isArray(tags) ? tags.map(String) : [],
		},
		body: m ? text.slice(m[0].length).replace(/^\n/, "") : text,
		extra,
		rawDate,
	};
}

export function serializeDoc(doc: Doc): string {
	const { fields, extra } = doc;
	// Keep the original date string (e.g. "30 April 2026") unless it was changed.
	const publishDate = toInputDate(doc.rawDate) === fields.publishDate ? doc.rawDate : fields.publishDate;
	const data = { title: fields.title, description: fields.description, publishDate, tags: fields.tags, ...extra };
	return `---\n${stringify(data, { lineWidth: 0 }).trimEnd()}\n---\n\n${doc.body.trim()}\n`;
}

export function slugify(title: string): string {
	return title
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/['‘’“”"]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 80);
}

export function newDoc(): Doc {
	const today = toInputDate(new Date().toString());
	return { fields: { title: "", description: "", publishDate: today, tags: [] }, body: "", extra: {}, rawDate: today };
}
