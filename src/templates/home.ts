import { intro } from "~/config.ts";
import { dateTag } from "~/lib/date.ts";
import { html, type Html, raw } from "~/lib/html.ts";
import { type Post, sortByDate } from "~/lib/posts.ts";
import { renderLinkList } from "./components/linkList.ts";
import { renderSocialList } from "./components/socialList.ts";
import { renderLayout } from "./layout.ts";

const SECTIONS = [
	{ title: "Back Catalogue", href: "/back-catalogue/", desc: "Everything I've written and the talks I've given" },
	{ title: "Library", href: "/library/", desc: "Books and papers I recommend" },
	{ title: "Side Quests", href: "/side-quests/", desc: "Things I build for fun" },
	{ title: "Open Source", href: "/open-source/", desc: "Code on GitHub" },
	{ title: "Book", href: "/book/", desc: "Serverless Development on AWS (O'Reilly, 2024)" },
];

export function renderHome(posts: Post[]): Html {
	const latest = sortByDate(posts)[0];
	const content = html`
		<section id="hello">
			<h1 class="title">${intro.heading}</h1>
			<ul class="hero-roles">
				${intro.roles.map((r) => html`<li>${raw(r)}</li>`)}
			</ul>
			${renderSocialList()}
		</section>

		${latest
			? html`<section aria-label="Latest post" class="section" id="latest">
					<h2 class="section-title">Latest post</h2>
					<article class="latest-post">
						${dateTag(latest.frontmatter.publishDate, undefined, "post-preview-date")}
						<h3 class="latest-post-title">
							<a class="cactus-link" href="/posts/${latest.slug}/">${latest.frontmatter.title}</a>
						</h3>
						<div class="prose latest-post-excerpt">${raw(latest.excerpt)}</div>
						<a class="cactus-link read-more" href="/posts/${latest.slug}/"
							>Read more<span class="sr-only"> of ${latest.frontmatter.title}</span> →</a
						>
					</article>
				</section>`
			: null}

		<section aria-label="Explore" class="section" id="explore">
			<h2 class="section-title">my stuff</h2>
			${renderLinkList(SECTIONS, { external: false })}
		</section>
	`;

	return renderLayout({ title: "Home", path: "/", content });
}
