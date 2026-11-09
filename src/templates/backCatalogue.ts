import type { SiteData } from "~/lib/data.ts";
import { parsePartialDate } from "~/lib/data.ts";
import { formatDate } from "~/lib/date.ts";
import { attrs, html, type Html } from "~/lib/html.ts";
import type { Post } from "~/lib/posts.ts";
import { renderLayout } from "./layout.ts";

export type CatalogueKind = "writing" | "talk" | "conference";

type Entry = {
	kind: CatalogueKind;
	title: string;
	href: string;
	external: boolean;
	date: Date;
	precision: "year" | "month" | "day";
	meta?: string;
};

export type CatalogueView = { key: "all" | "writing" | "talks" | "conferences"; label: string; path: string };

const KIND_LABEL: Record<CatalogueKind, string> = { writing: "Writing", talk: "Talk", conference: "Conference" };

const BOOK = { title: "Serverless Development on AWS", date: "2024", meta: "Book, O'Reilly" };

export function catalogueEntries(posts: Post[], data: SiteData): Entry[] {
	const entries: Entry[] = [
		...posts.map((p) => ({
			kind: "writing" as const,
			title: p.frontmatter.title,
			href: `/posts/${p.slug}/`,
			external: false,
			date: p.frontmatter.publishDate,
			precision: "day" as const,
		})),
		{ kind: "writing", title: BOOK.title, href: "/book/", external: false, ...parsePartialDate(BOOK.date), meta: BOOK.meta },
		...data.talks.map((t) => ({
			kind: "talk" as const,
			title: t.title,
			href: t.href,
			external: true,
			...parsePartialDate(t.date),
			meta: t.event,
		})),
		...data.conferences.map((c) => ({
			kind: "conference" as const,
			title: c.name,
			href: c.href ?? "",
			external: true,
			...parsePartialDate(c.date),
			meta: c.location,
		})),
	];
	return entries.sort((a, b) => b.date.valueOf() - a.date.valueOf());
}

export function catalogueViews(data: SiteData): CatalogueView[] {
	const views: CatalogueView[] = [
		{ key: "all", label: "All", path: "/back-catalogue/" },
		{ key: "writing", label: "Writing", path: "/back-catalogue/writing/" },
		{ key: "talks", label: "Talks", path: "/back-catalogue/talks/" },
	];
	// Conferences attended appear once content/data/conferences.json has entries.
	if (data.conferences.length > 0) views.push({ key: "conferences", label: "Conferences", path: "/back-catalogue/conferences/" });
	return views;
}

const VIEW_KIND: Record<CatalogueView["key"], CatalogueKind | null> = {
	all: null,
	writing: "writing",
	talks: "talk",
	conferences: "conference",
};

function formatEntryDate(e: Entry): string {
	if (e.precision === "year") return String(e.date.getUTCFullYear());
	if (e.precision === "month") return formatDate(e.date, { month: "short", year: "numeric", timeZone: "UTC" });
	return formatDate(e.date, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function renderEntry(e: Entry, showKind: boolean): Html {
	const link = e.href
		? html`<a ${attrs({ class: "cactus-link", href: e.href, rel: e.external ? "noopener noreferrer" : false, target: e.external ? "_blank" : false })}>${e.title}</a>`
		: html`<span>${e.title}</span>`;
	return html`<li class="catalogue-item">
		<time class="catalogue-date" datetime="${e.date.toISOString()}">${formatEntryDate(e)}</time>
		<div class="catalogue-body">
			<span class="catalogue-title">${link}</span>
			<span class="catalogue-meta">${showKind ? html`<span class="catalogue-kind">${KIND_LABEL[e.kind]}</span>` : null}${e.meta ?? ""}</span>
		</div>
	</li>`;
}

export function renderBackCatalogue(view: CatalogueView, views: CatalogueView[], all: Entry[]): Html {
	const kind = VIEW_KIND[view.key];
	const entries = kind ? all.filter((e) => e.kind === kind) : all;
	const years = [...new Set(entries.map((e) => e.date.getUTCFullYear()))];
	const description = "Everything I've written and the talks I've given, newest first";

	const content = html`
		<div class="list-page catalogue-page">
			<h1 class="title">Back Catalogue</h1>
			<p class="list-page-intro">${description}</p>
			<nav aria-label="Filter the back catalogue" class="catalogue-filters">
				${views.map(
					(v) => html`<a ${attrs({ "aria-current": v.key === view.key ? "page" : false, class: "tag-pill", href: v.path })}>${v.label}</a>`,
				)}
			</nav>
			${years.map(
				(year) => html`<section class="section catalogue-year">
					<h2 class="section-title">${year}</h2>
					<ul class="catalogue-list">
						${entries.filter((e) => e.date.getUTCFullYear() === year).map((e) => renderEntry(e, kind === null))}
					</ul>
				</section>`,
			)}
			${view.key === "writing" || view.key === "all"
				? html`<p class="catalogue-footer"><a class="cactus-link" href="/posts/">Browse all posts →</a></p>`
				: null}
		</div>
	`;

	return renderLayout({
		title: view.key === "all" ? "Back Catalogue" : `Back Catalogue: ${view.label}`,
		description,
		path: view.path,
		content,
	});
}
