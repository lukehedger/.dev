import { isScalar, isSeq, parseDocument, stringify } from "yaml";

/** The frontmatter fields the editor form edits. Other keys are preserved untouched. */
export type Fields = {
	title: string;
	description: string;
	/** YYYY-MM-DD for the date input */
	publishDate: string;
	tags: string[];
};

export type Doc = {
	fields: Fields;
	body: string;
	extra: Record<string, unknown>;
	rawDate: string;
	/** The frontmatter as written, so unchanged fields keep their formatting. */
	rawFrontmatter?: string;
	/** Field values as loaded, to tell which ones were edited. */
	loaded?: Fields;
};

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
	const fields: Fields = {
		title: String(title ?? ""),
		description: String(description ?? ""),
		publishDate: toInputDate(rawDate),
		tags: Array.isArray(tags) ? tags.map(String) : [],
	};
	return {
		fields,
		body: m ? text.slice(m[0].length).replace(/^\n/, "") : text,
		extra,
		rawDate,
		rawFrontmatter: m?.[1],
		loaded: { ...fields, tags: [...fields.tags] },
	};
}

export function serializeDoc(doc: Doc): string {
	return `---\n${frontmatter(doc)}\n---\n\n${doc.body.trim()}\n`;
}

function frontmatter(doc: Doc): string {
	const { fields, extra } = doc;
	// Keep the original date string (e.g. "30 April 2026") unless it was changed.
	const publishDate = toInputDate(doc.rawDate) === fields.publishDate ? doc.rawDate : fields.publishDate;
	if (doc.rawFrontmatter === undefined || !doc.loaded) {
		const data = { title: fields.title, description: fields.description, publishDate, tags: fields.tags, ...extra };
		return stringify(data, { lineWidth: 0 }).trimEnd();
	}
	const was = doc.loaded;
	const changed = {
		title: fields.title !== was.title,
		description: fields.description !== was.description,
		publishDate: fields.publishDate !== was.publishDate,
		tags: fields.tags.join("\n") !== was.tags.join("\n"),
	};
	if (!Object.values(changed).some(Boolean)) return doc.rawFrontmatter;
	// Edit the original YAML in place: untouched keys keep their quoting and list style.
	const yd = parseDocument(doc.rawFrontmatter);
	const set = (key: keyof Fields, value: string | string[]) => {
		const node = yd.get(key, true);
		if (isScalar(node) && typeof value === "string") node.value = value;
		else if (isSeq(node) && Array.isArray(value)) {
			const next = yd.createNode(value);
			// Match the existing items, or the quoted style recent posts use.
			const style = isScalar(node.items[0]) ? node.items[0].type : "QUOTE_DOUBLE";
			for (const item of next.items) if (isScalar(item) && style) item.type = style;
			next.flow = node.flow;
			yd.set(key, next);
		} else yd.set(key, value);
	};
	if (changed.title) set("title", fields.title);
	if (changed.description) set("description", fields.description);
	if (changed.publishDate) set("publishDate", publishDate);
	if (changed.tags) set("tags", fields.tags);
	return yd.toString({ flowCollectionPadding: false, lineWidth: 0 }).trimEnd();
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
