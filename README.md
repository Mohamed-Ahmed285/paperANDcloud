# Paper & Cloud

A calm personal library for links, text snippets, quotes, images/media and document references.
Next.js (App Router) · TypeScript (strict) · Tailwind CSS v4 · Zod · JSONBin.io · Lucide icons.

> **Status:** this source was written in an environment with no network access, so
> `npm install`, `tsc`, `next build` and a live JSONBin request have **not** been run yet.
> Run the verification checklist below on your machine and fix anything it reports.

## Quick start

```bash
npm install
cp .env.example .env.local     # then fill in the two values below
npm run dev                    # http://localhost:3000
npm run typecheck && npm run build
```

## JSONBin setup (from scratch)

1. Create an account at <https://jsonbin.io>.
2. Create a bin and set it to **Private**. Paste this as its initial content (JSONBin rejects empty bins):
   ```json
   { "version": 1, "items": [], "collections": [] }
   ```
3. Copy the **Bin ID** (shown in the bin's details / URL).
4. Copy your **Master Key** from the *API Keys* page.
5. Put them in `.env.local`:
   ```
   JSONBIN_API_KEY=<master key>
   JSONBIN_BIN_ID=<bin id>
   ```
   **Escape every `$` in the key with a backslash.** JSONBin keys look like `$2a$10$AbC…`, and Next.js
   treats `$name` in `.env` files as a variable reference, silently deleting parts of the key. Write it as
   `JSONBIN_API_KEY=\$2a\$10\$AbC…`. (The Bin ID has no `$`, so it needs nothing.)

   *(Optional)* Instead of the master key you can create a scoped **Access Key** with *Bins Read* and
   *Bins Update* permission and set `JSONBIN_ACCESS_KEY`; it is used in place of the master key.
6. Restart `npm run dev`.

### Verify it works

1. Open the app. The sidebar footer shows **"Synced with JSONBin"** only after a real read has succeeded.
2. Quick add an item, then refresh the page: it should still be there.
3. Open the bin in the JSONBin dashboard: you should see the item in `items`.
4. Favorite, edit, and delete an item; create, rename and delete a collection; refresh after each.

### Troubleshooting

| Message in the app | Likely cause |
|---|---|
| "Connect JSONBin to get started" | `.env.local` missing/placeholder values, or the dev server wasn't restarted |
| "key … looks mangled" or "JSONBin rejected your API key" | Unescaped `$` in the key (see step 5), or  Wrong key, or an Access Key without Read/Update permission |
| "That bin couldn't be found" | Wrong `JSONBIN_BIN_ID`, or the bin belongs to a different account |
| "Can't reach the server" / network | No internet, or JSONBin unreachable (10 s timeout) |
| "rate limiting" | JSONBin's request quota for your plan was hit |
| "stored data looks invalid" | The bin contains something other than a JSON object |

Server logs contain only an error code and a short note (e.g. `JSONBin PUT responded 401`); never keys or upstream bodies.

## JSONBin endpoints used

Checked against the JSONBin API reference (`https://jsonbin.io/api-reference`):

- Base URL `https://api.jsonbin.io/v3`
- Read: `GET /b/<BIN_ID>/latest` → `{ record, metadata }`
- Update: `PUT /b/<BIN_ID>` with the full JSON document
- Auth: `X-Master-Key` or `X-Access-Key`

All of this lives in `src/lib/jsonbin.ts`. The `/latest` path is the one detail to re-confirm if reads fail with a 404 on a bin you know exists.

## Data model

One JSON document holds everything:

```jsonc
{
  "version": 1,
  "collections": [{ "id": "uuid", "name": "Reading", "createdAt": "ISO", "updatedAt": "ISO" }],
  "items": [{
    "id": "uuid", "type": "link|text|quote|media|file",
    "title?": "", "content?": "", "url?": "", "description?": "", "author?": "", "source?": "",
    "filename?": "", "mimeType?": "", "size?": 0,
    "tags": ["lowercase", "deduped"], "collectionId?": "uuid",
    "isFavorite": false, "createdAt": "ISO", "updatedAt": "ISO"
  }]
}
```

Empty optional fields are omitted, not stored as `""`. On read, `normalizeLibrary` tolerates a fresh bin,
missing fields, unknown/malformed records (skipped) and dangling `collectionId`s (cleared).
Each content type stores only its relevant fields (see `FIELDS_BY_TYPE` in `src/lib/store.ts`).

## Architecture

```
src/app/page.tsx                    renders <LibraryApp />
src/app/api/library                 GET   whole library
src/app/api/items[/id]              POST create · PATCH edit or {isFavorite} · DELETE
src/app/api/collections[/id]        POST create · PATCH rename · DELETE (items are kept, uncategorised)
src/lib/schemas.ts                  Zod schemas, shared by browser (inline errors) and server (authoritative)
src/lib/jsonbin.ts                  ONLY file that talks to JSONBin (server-only, keys never leave the server)
src/lib/store.ts                    domain operations: read → modify → write
src/lib/http.ts                     body-size limit, validation → 422, safe error responses
src/lib/view.ts                     client search / filter / sort
src/components/*                    AppShell, Sidebar, MasonryGrid, SavedItemCard, ItemForm, QuickAddDialog, …
```

The browser only sees `/api/*` and its own typed shapes, never JSONBin's response format.

## Design notes & deliberate choices

- **Palette** is exactly the Paper & Cloud set, exposed as CSS variables and Tailwind tokens
  (`bg-canvas`, `bg-card`, `bg-surface`, `border-line`, `text-ink`, `text-muted`, `text-accent`).
  One addition: `--accent-strong` (`#2563EB`), a deeper step of the accent used for button fills and blue
  text, because `#3B82F6` on white is ~3.7:1 and fails WCAG AA for small text. `#3B82F6` itself is used for
  focus rings, icons and indicators. Change `--accent-strong` to `#3B82F6` in `globals.css` if you prefer strict fidelity.
- **Masonry** uses CSS grid row-spans (each card measured with `ResizeObserver`) rather than CSS `columns`,
  so DOM/tab order equals visual reading order. Column count uses container queries (adapts beside the sidebar).
- **Dialogs** use native `<dialog>` (focus trap, Escape, inert background). Forms remount on each open, so they reset.
- **Favorites** update optimistically and roll back with a message if saving fails. Everything else waits for the server.
- **Link previews / thumbnails:** not implemented. Scraping other sites from the server adds SSRF risk and is
  unreliable; you enter the title yourself. Cards degrade cleanly.
- **Files:** only metadata and a URL are stored. Picking a local file reads its name/type/size and nothing else;
  the file is *not* uploaded and won't exist on other devices. For real uploads, use a storage service
  (S3, R2, UploadThing, …) and save the returned URL in the item's `url`.
- **Not built:** date-range filters (optional in the brief), authentication (see below).

## Limitations

- **No auth.** Anyone who can reach the deployed URL can read and edit the library (the JSONBin key stays
  server-side, but the app's own routes are open). Run it locally, or put it behind your host's access control
  (e.g. Vercel password protection, Cloudflare Access) before deploying publicly.
- **Concurrency.** The whole library is one JSON document using read-modify-write. Requests handled by one
  server process are serialised in memory, but JSONBin has no locking or versioned writes, so two server
  instances (or two browser sessions on separate deployments) saving at the same instant can lose an update (last write wins).
  Fine for one person; not a multi-user database.
- **Size and quota.** JSONBin plans limit bin size and request counts; check your plan. Every change rewrites the whole document.
- The in-memory queue does not protect across serverless instances.
