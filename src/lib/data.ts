import { join } from "node:path";

export type Link = { title: string; href: string; desc: string };
export type Talk = { title: string; event: string; date: string; href: string };
export type Conference = { name: string; location?: string; date: string; href?: string };
export type LibraryItem = { type: LibraryType; title: string; author: string; href?: string; note?: string };

export const LIBRARY_TYPES = ["book", "paper", "article", "video", "podcast"] as const;
export type LibraryType = (typeof LIBRARY_TYPES)[number];

export type SiteData = {
	talks: Talk[];
	conferences: Conference[];
	library: LibraryItem[];
	sideQuests: Link[];
	openSource: Link[];
};

// "YYYY" or "YYYY-MM" or "YYYY-MM-DD"
const PARTIAL_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

function str(v: unknown, file: string, i: number, key: string, optional = false): string | undefined {
	if (v === undefined && optional) return undefined;
	if (typeof v !== "string" || !v) throw new Error(`${file}[${i}]: missing ${key}`);
	return v;
}

function date(v: unknown, file: string, i: number): string {
	const s = str(v, file, i, "date")!;
	if (!PARTIAL_DATE.test(s)) throw new Error(`${file}[${i}]: date must be YYYY, YYYY-MM or YYYY-MM-DD`);
	return s;
}

async function readArray(dir: string, file: string): Promise<Record<string, unknown>[]> {
	const data = (await Bun.file(join(dir, file)).json()) as unknown;
	if (!Array.isArray(data)) throw new Error(`${file}: expected an array`);
	return data as Record<string, unknown>[];
}

function links(rows: Record<string, unknown>[], file: string): Link[] {
	return rows.map((r, i) => ({
		title: str(r.title, file, i, "title")!,
		href: str(r.href, file, i, "href")!,
		desc: str(r.desc, file, i, "desc")!,
	}));
}

export async function loadData(dir: string): Promise<SiteData> {
	const talks = (await readArray(dir, "talks.json")).map((r, i) => ({
		title: str(r.title, "talks.json", i, "title")!,
		event: str(r.event, "talks.json", i, "event")!,
		date: date(r.date, "talks.json", i),
		href: str(r.href, "talks.json", i, "href")!,
	}));
	const conferences = (await readArray(dir, "conferences.json")).map((r, i) => ({
		name: str(r.name, "conferences.json", i, "name")!,
		location: str(r.location, "conferences.json", i, "location", true),
		date: date(r.date, "conferences.json", i),
		href: str(r.href, "conferences.json", i, "href", true),
	}));
	const library = (await readArray(dir, "library.json")).map((r, i) => {
		const type = r.type as LibraryType;
		if (!LIBRARY_TYPES.includes(type)) throw new Error(`library.json[${i}]: type must be one of ${LIBRARY_TYPES.join(", ")}`);
		return {
			type,
			title: str(r.title, "library.json", i, "title")!,
			author: str(r.author, "library.json", i, "author")!,
			href: str(r.href, "library.json", i, "href", true),
			note: str(r.note, "library.json", i, "note", true),
		};
	});
	return {
		talks,
		conferences,
		library,
		sideQuests: links(await readArray(dir, "side-quests.json"), "side-quests.json"),
		openSource: links(await readArray(dir, "open-source.json"), "open-source.json"),
	};
}

/** Parse a partial date ("2018", "2024-05", "2024-05-02") to a UTC date and its display precision. */
export function parsePartialDate(s: string): { date: Date; precision: "year" | "month" | "day" } {
	const [y, m, d] = s.split("-").map(Number);
	const precision = d ? "day" : m ? "month" : "year";
	return { date: new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1)), precision };
}
