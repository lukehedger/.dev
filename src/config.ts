export const site = {
	title: "lukehedger.dev",
	description: "Luke Hedger Software Engineer",
	author: "Luke Hedger",
	url: "https://lukehedger.dev",
	lang: "en-GB",
	ogLocale: "en_GB",
	dateLocale: "en-GB",
	dateOptions: {
		day: "numeric",
		month: "short",
		year: "numeric",
	} satisfies Intl.DateTimeFormatOptions,
} as const;

export const menu: ReadonlyArray<{ title: string; path: string }> = [
	{ title: "Home", path: "/" },
	{ title: "Back Catalogue", path: "/back-catalogue/" },
	{ title: "Library", path: "/library/" },
	{ title: "Side Quests", path: "/side-quests/" },
	{ title: "Open Source", path: "/open-source/" },
	{ title: "Book", path: "/book/" },
];

export const social: ReadonlyArray<{
	name: string;
	href: string;
	icon: "bluesky" | "github";
}> = [
	{
		name: "Bluesky",
		href: "https://bsky.app/profile/lukehedger.dev",
		icon: "bluesky",
	},
	{ name: "GitHub", href: "https://github.com/lukehedger", icon: "github" },
];

export const intro = {
	heading: "Luke Hedger",
	roles: [
		`software engineer working on distributed systems, serverless, event sourcing, durable execution and continuous ai`,
		`co-author of <a class="cactus-link" href="/book">The Serverless Book</a>`,
		`<a class="cactus-link" href="/back-catalogue/talks/">speaker</a> at ServerlessDays, GOTO and AWS Summit`,
		`engineering lead at the LEGO Group since 2021. Previously at Cancer Research UK, JAAK Music, Unlease, M&C Saatchi and Lean Mean Fighting Machine`,
	],
} as const;

export const POSTS_PER_PAGE = 10;
