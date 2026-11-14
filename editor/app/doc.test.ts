import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { newDoc, parseDoc, serializeDoc } from "./doc.ts";
import { preserveSource } from "./merge.ts";

const POSTS = join(import.meta.dir, "../../content/posts");
const posts = readdirSync(POSTS)
	.filter((f) => f.endsWith(".md"))
	.map((f) => ({ name: f, text: readFileSync(join(POSTS, f), "utf8") }));

const fm = (text: string) => text.match(/^---\n([\s\S]*?)\n---/)![1]!;

describe("serializeDoc", () => {
	test.each(posts.map((p) => [p.name, p.text]))("leaves %s untouched when nothing changed", (_, text) => {
		const doc = parseDoc(text);
		expect(fm(serializeDoc(doc))).toBe(fm(text));
	});

	test("rewrites only the edited field and keeps its quoting", () => {
		const text = '---\ntitle: "Old"\ndescription: "Keep me"\npublishDate: "2 May 2026"\ntags: ["ai"]\n---\n\nBody\n';
		const doc = parseDoc(text);
		doc.fields.title = "New";
		doc.fields.tags = ["ai", "serverless"];
		expect(serializeDoc(doc)).toBe(
			'---\ntitle: "New"\ndescription: "Keep me"\npublishDate: "2 May 2026"\ntags: ["ai", "serverless"]\n---\n\nBody\n',
		);
	});

	test("keeps extra keys such as source and originalUrl", () => {
		const text = "---\ntitle: A\ndescription: B\npublishDate: 2020-01-01\ntags: []\nsource: medium\n---\n\nBody\n";
		const doc = parseDoc(text);
		doc.fields.description = "C";
		expect(serializeDoc(doc)).toContain("source: medium");
		expect(serializeDoc(doc)).toContain("description: C");
	});

	test("writes fresh frontmatter for a new post", () => {
		const doc = newDoc();
		doc.fields.title = "Hello";
		doc.body = "World";
		expect(serializeDoc(doc)).toMatch(/^---\ntitle: Hello\ndescription: ""\npublishDate: \d{4}-\d{2}-\d{2}\ntags: \[\]\n---\n\nWorld\n$/);
	});
});

describe("preserveSource", () => {
	const original = "Intro with _emphasis_.\n\n-   loose list\n-   item two\n\nA line\nwith a soft break.\n\n```bash\necho hi\n```\n\nLast paragraph.";

	test("returns the original for an unchanged document re-serialised differently", () => {
		const reserialised = "Intro with *emphasis*.\n\n- loose list\n- item two\n\nA line\nwith a soft break.\n\n```bash\necho hi\n```\n\nLast paragraph.";
		expect(preserveSource(original, reserialised)).toBe(original);
	});

	test("only the edited block changes", () => {
		const edited = "Intro with *emphasis*.\n\n- loose list\n- item two\n\nA line\nwith a soft break.\n\n```bash\necho hi\n```\n\nLast paragraph, edited.";
		expect(preserveSource(original, edited)).toBe(original.replace("Last paragraph.", "Last paragraph, edited."));
	});

	test("new blocks are kept in order", () => {
		const edited = "Intro with *emphasis*.\n\nA new paragraph.\n\n- loose list\n- item two\n\nA line\nwith a soft break.\n\n```bash\necho hi\n```\n\nLast paragraph.";
		const out = preserveSource(original, edited);
		expect(out).toContain("Intro with _emphasis_.\n\nA new paragraph.\n\n-   loose list");
	});

	test.each(posts.map((p) => [p.name, parseDoc(p.text).body]))("%s survives a no-op merge", (_, body) => {
		expect(preserveSource(body, body)).toBe(body.replace(/\n+$/, ""));
	});
});
