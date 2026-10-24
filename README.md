# lukehedger.dev

Hand-rolled static site built with Bun and TypeScript. No framework, no Tailwind, no Astro.

## Commands

| Command                 | Action                                                        |
| :---------------------- | :------------------------------------------------------------ |
| `bun install`           | Install dependencies                                          |
| `bun run dev`           | Build and serve at `http://localhost:3000` with watch         |
| `bun run build`         | Build the production site to `./dist/`                        |
| `bun run check`         | Type-check with `tsc --noEmit`                                |
| `bun test`              | Run unit tests                                                |
| `bun run editor`        | Run the editor locally at `http://localhost:3001` (edits files in this checkout) |
| `bun run editor:build`  | Build the editor PWA to `./editor/dist/`                      |

## Layout

```
content/posts/     Markdown posts (frontmatter: title, description, publishDate, tags;
                   rehosted posts add source and, when the original is still live, originalUrl)
content/data/      JSON for the Back Catalogue (talks, conferences), Library, Side Quests, Open Source
public/            Static files served verbatim (favicons, images, _redirects)
src/
  build.ts         Build pipeline entrypoint
  dev.ts           Dev server + file watcher
  config.ts        Site metadata, menu, intro prose, social links
  lib/             Markdown, posts, data, HTML helper, TOC, paginate, date, feeds, writeFile
  templates/       HTML templates (functions returning Html values)
  client/          Client-side TypeScript: theme toggle, menu, search, back-to-top
  styles/          main.css + shiki.css
editor/            Offline-first editor PWA and its Worker (w.lukehedger.dev)
dist/              Build output (gitignored)
```

## Hosting

Both sites are Cloudflare Workers with static assets, deployed by Workers Builds on every push to `main`:

- `wrangler.jsonc`: **lukehedger-dev** serves `dist/` on `lukehedger.dev`.
- `editor/wrangler.jsonc`: **lukehedger-editor** serves the editor on `w.lukehedger.dev`.

Neither has a `workers.dev` or preview URL; the custom domains are the only public addresses.

## Editor

`w.lukehedger.dev` is an installable PWA for writing new posts and editing existing ones.

- **Offline first.** Posts and drafts live in the browser (IndexedDB). New posts stay on the device
  until you publish. Publishing while offline queues the post and sends it when you're back online.
- **Publishing** commits the Markdown file (and any added images, under `public/images/uploads/`)
  straight to `main`, which triggers a deploy. If the post changed in the repo since you loaded it,
  the editor flags a conflict instead of overwriting it silently.
- **Access.** Cloudflare Access protects the whole hostname: one-time PIN emailed to lh4@pm.me,
  one-month session. The Worker also verifies the Access token on every API call.
- **GitHub token.** The Worker commits with a fine-grained personal access token stored as the
  `GITHUB_TOKEN` secret: repository access to `lukehedger/.dev` only, permission
  _Contents: Read and write_. Rotate it with
  `bunx wrangler secret put GITHUB_TOKEN -c editor/wrangler.jsonc` or in the Cloudflare dashboard.
