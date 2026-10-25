import { dateTag } from "~/lib/date.ts";
import { html, type Html } from "~/lib/html.ts";
import type { Post } from "~/lib/posts.ts";

const TAG_ICON = html`<svg
	aria-hidden="true"
	class="icon-tag"
	fill="none"
	focusable="false"
	stroke="currentColor"
	stroke-linecap="round"
	stroke-linejoin="round"
	stroke-width="1.5"
	viewBox="0 0 24 24"
>
	<path d="M0 0h24v24H0z" fill="none" stroke="none" />
	<path
		d="M7.859 6h-2.834a2.025 2.025 0 0 0 -2.025 2.025v2.834c0 .537 .213 1.052 .593 1.432l6.116 6.116a2.025 2.025 0 0 0 2.864 0l2.834 -2.834a2.025 2.025 0 0 0 0 -2.864l-6.117 -6.116a2.025 2.025 0 0 0 -1.431 -.593z"
	/>
	<path d="M17.573 18.407l2.834 -2.834a2.025 2.025 0 0 0 0 -2.864l-7.117 -7.116" />
	<path d="M6 9h-.01" />
</svg>`;

const MONTH_LONG: Intl.DateTimeFormatOptions = {
	day: "numeric",
	month: "long",
	year: "numeric",
};

export function renderHero(post: Post): Html {
	const { title, publishDate, updatedDate, tags, draft } = post.frontmatter;
	return html`
		${draft ? html`<span class="draft-tag">(Draft)</span>` : null}
		<h1 class="title">${title}</h1>
		<div class="post-meta">
			<p class="post-date">
				${dateTag(publishDate, MONTH_LONG)} / ${post.readingMinutes}
			</p>
			${updatedDate
				? html`<span class="post-updated">Last Updated: ${dateTag(updatedDate, MONTH_LONG)}</span>`
				: null}
		</div>
		${tags.length > 0
			? html`<div class="post-tags">
					${TAG_ICON}
					${tags.map(
						(tag, i) => html`<a
							aria-label="View more posts with the tag ${tag}"
							class="cactus-link tag-link"
							href="/tags/${tag}/"
							>${tag}</a
						>${i < tags.length - 1 ? ", " : ""}`,
					)}
				</div>`
			: null}
	`;
}
