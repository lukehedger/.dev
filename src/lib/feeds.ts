import { site } from "~/config.ts";
import type { Post } from "./posts.ts";

function xmlEscape(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;");
}

const RSS_ITEMS = 20;

export function renderRss(posts: Post[]): string {
	const items = posts
		.slice(0, RSS_ITEMS)
		.map((p) => {
			const pubDate = (p.frontmatter.updatedDate ?? p.frontmatter.publishDate).toUTCString();
			const link = `${site.url}/posts/${p.slug}/`;
			return `\t\t<item>
\t\t\t<title>${xmlEscape(p.frontmatter.title)}</title>
\t\t\t<description>${xmlEscape(p.frontmatter.description)}</description>
\t\t\t<pubDate>${pubDate}</pubDate>
\t\t\t<link>${xmlEscape(link)}</link>
\t\t\t<guid isPermaLink="true">${xmlEscape(link)}</guid>
\t\t</item>`;
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
\t<channel>
\t\t<title>${xmlEscape(site.title)}</title>
\t\t<description>${xmlEscape(site.description)}</description>
\t\t<link>${xmlEscape(site.url + "/")}</link>
\t\t<atom:link href="${xmlEscape(site.url + "/rss.xml")}" rel="self" type="application/rss+xml" />
${items}
\t</channel>
</rss>
`;
}

export function renderSitemap(routes: string[]): string {
	const urls = routes
		.map((route) => {
			const loc = `${site.url}${route}`;
			return `\t<url><loc>${xmlEscape(loc)}</loc></url>`;
		})
		.join("\n");

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
