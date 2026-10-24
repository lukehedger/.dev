import { html, type Html } from "~/lib/html.ts";

type Item = { title: string; href: string; desc: string };

export function renderLinkList(items: readonly Item[], { external = true } = {}): Html {
	return html`
		<dl class="link-list">
			${items.map(
				(item) => html`
					<div class="link-list-item">
						<dt>
							${external
								? html`<a class="cactus-link" href="${item.href}" rel="noopener noreferrer" target="_blank">${item.title}</a>`
								: html`<a class="cactus-link" href="${item.href}">${item.title}</a>`}
						</dt>
						<dd>${item.desc}</dd>
					</div>
				`,
			)}
		</dl>
	`;
}
