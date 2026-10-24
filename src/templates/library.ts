import { LIBRARY_TYPES, type LibraryItem, type LibraryType } from "~/lib/data.ts";
import { html, type Html } from "~/lib/html.ts";
import { renderLayout } from "./layout.ts";

const HEADINGS: Record<LibraryType, string> = {
	book: "Books",
	paper: "Papers",
	article: "Articles",
	video: "Videos",
	podcast: "Podcasts",
};

const DESCRIPTION = "Books, papers and other things worth your time";

export function renderLibrary(items: LibraryItem[]): Html {
	const sections = LIBRARY_TYPES.map((type) => ({ type, items: items.filter((i) => i.type === type) })).filter(
		(s) => s.items.length > 0,
	);
	const content = html`
		<div class="list-page">
			<h1 class="title">Library</h1>
			<p class="list-page-intro">${DESCRIPTION}</p>
			${sections.map(
				(s) => html`<section class="section" id="${s.type}s">
					<h2 class="section-title">${HEADINGS[s.type]}</h2>
					<ul class="library-list">
						${s.items.map(
							(i) => html`<li>
								${i.href
									? html`<a class="cactus-link" href="${i.href}" rel="noopener noreferrer" target="_blank">${i.title}</a>`
									: html`<span class="library-title">${i.title}</span>`}
								<span class="library-author">${i.author}</span>
								${i.note ? html`<p class="library-note">${i.note}</p>` : null}
							</li>`,
						)}
					</ul>
				</section>`,
			)}
		</div>
	`;
	return renderLayout({ title: "Library", description: DESCRIPTION, path: "/library/", content });
}
