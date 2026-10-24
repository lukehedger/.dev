import { menu, site } from "~/config.ts";
import { attrs, html, type Html, raw } from "~/lib/html.ts";

const SEARCH_ICON = raw(
	`<svg aria-label="search" class="icon-lg" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" stroke="none"/><path d="M3 10a7 7 0 1 0 14 0 7 7 0 1 0-14 0M21 21l-6-6"/></svg>`,
);
const SUN_ICON = raw(
	`<svg aria-hidden="true" class="icon-sun" fill="none" focusable="false" stroke-width="1.5" viewBox="0 0 24 24"><path d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 12L23 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 2V1" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 23V22" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 20L19 19" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 4L19 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 20L5 19" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 4L5 5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/><path d="M1 12L2 12" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
);
const MOON_ICON = raw(
	`<svg aria-hidden="true" class="icon-moon" fill="none" focusable="false" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none" stroke="none"/><path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/><path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2"/><path d="M19 11h2m-1 -1v2"/></svg>`,
);
const HAMBURGER_ICON = raw(
	`<svg aria-hidden="true" class="icon-hamburger" fill="none" focusable="false" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M3.75 9h16.5m-16.5 6.75h16.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
);
const CROSS_ICON = raw(
	`<svg aria-hidden="true" class="icon-cross" fill="none" focusable="false" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
);

export function renderHeader(currentPath: string): Html {
	return html`
		<header class="site-header" id="main-header">
			<div class="site-header-top">
				<a ${attrs({ "aria-current": currentPath === "/" ? "page" : false, class: "brand-link", href: "/" })}>
					<img
						alt="A gif of a nice warm matcha latte"
						class="matcha"
						loading="eager"
						src="/matcha.gif"
					/>
					<span class="brand-name">${site.title}</span>
				</a>
				<button
					aria-expanded="false"
					aria-haspopup="menu"
					aria-label="Open main menu"
					class="mobile-menu-button"
					id="toggle-navigation-menu"
					type="button"
				>
					${HAMBURGER_ICON}${CROSS_ICON}
				</button>
			</div>
			<div class="site-header-bottom">
				<nav aria-label="Main menu" class="main-menu" id="navigation-menu">
					${menu.map(
						(link) => html`
							<a
								${attrs({
									"aria-current": (link.path === "/" ? currentPath === "/" : currentPath.startsWith(link.path))
										? "page"
										: false,
									class: "main-menu-link",
									href: link.path,
								})}
							>
								${link.title}
							</a>
						`,
					)}
				</nav>
				<div class="site-header-actions">
					<div class="site-search" id="search">
						<button aria-label="Search" class="icon-button" data-open-modal disabled type="button">
							${SEARCH_ICON}
						</button>
						<dialog aria-label="Search" class="search-dialog">
							<div class="search-dialog-frame">
								<button class="search-close" data-close-modal type="button">Close</button>
								<input
									autocomplete="off"
									class="search-input"
									id="search-input"
									placeholder="Search posts"
									type="search"
								/>
								<ul class="search-results" id="search-results"></ul>
							</div>
						</dialog>
					</div>
					<button aria-label="Toggle theme" class="icon-button theme-toggle" id="theme-toggle" role="switch" type="button">
						<span class="sr-only">Toggle theme</span>
						${SUN_ICON}${MOON_ICON}
					</button>
				</div>
			</div>
		</header>
	`;
}
