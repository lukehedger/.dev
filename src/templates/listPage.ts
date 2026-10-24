import { html, type Html } from "~/lib/html.ts";
import { renderLinkList } from "./components/linkList.ts";
import { renderLayout } from "./layout.ts";

type Item = { title: string; href: string; desc: string };

export type ListPageOpts = {
	title: string;
	description: string;
	path: string;
	sections: ReadonlyArray<{ heading?: string; items: readonly Item[] }>;
};

/** A titled page of link lists: Open Source, Side Quests. */
export function renderListPage({ title, description, path, sections }: ListPageOpts): Html {
	const content = html`
		<div class="list-page">
			<h1 class="title">${title}</h1>
			<p class="list-page-intro">${description}</p>
			${sections.map(
				(s) => html`<section class="section">
					${s.heading ? html`<h2 class="section-title">${s.heading}</h2>` : null}
					${renderLinkList(s.items)}
				</section>`,
			)}
		</div>
	`;
	return renderLayout({ title, description, path, content });
}
