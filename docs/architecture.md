# Architecture

MyShelf is a two-page static site. All logic lives in a single file, [`assets/js/main.js`](../assets/js/main.js) (~1000 lines of vanilla JS). jQuery and a handful of plugins (Bootstrap, Owl Carousel, Isotope, Nice Select) provide UI behavior; there is no framework, bundler, or backend.

## Pages

| Page           | Role |
|----------------|------|
| `index.html`   | Home / overview for one category — carousels of the latest watched items and planned items, plus summary stats. |
| `watched.html` | Full catalog for one category and view (watched or planned) — searchable, filterable, sortable, paginated grid. |

Both pages load the same `main.js`, which detects which page it is on from the URL path.

## Load lifecycle

On `DOMContentLoaded`, `main.js`:

0. **Loads translations** (`loadTranslations`) — reads `assets/i18n/config.json`, resolves the active language, loads the matching `<lang>.json` (plus the default as fallback), applies static translations to the markup, and builds the language switcher. See [i18n.md](i18n.md).
1. **Reads page context** (`getPageContext`) — page type (`home` / `category`), category, and view (watched/planned) from the path and query string.
2. **Builds the header menu and headings** for the current context.
3. **Picks a random breadcrumb background** image.
4. **Loads data** (`loadData`):
   - Watched items are fetched per year from `data/<category>/<year>.json`.
   - Planned items are fetched from `data/<category>/planned.json` (if the category has `hasPlanned`).
   - Each raw record is passed through `normalizeItem`.
   - Everything is sorted by date (descending), then by name.
5. **Renders**:
   - *Home* → two Owl carousels (latest watched, latest planned) + stat counters.
   - *Category* → a paginated grid, plus type/year/sort/search filters.

## Category configuration

Categories are declared at the top of `main.js`:

```js
const categories = {
    anime:   {years: [2026], hasPlanned: true},
    cartoon: {years: [2026], hasPlanned: true},
    series:  {years: [2026], hasPlanned: true},
    movie:   {years: [2026], hasPlanned: true},
    manga:   {years: [2026], hasPlanned: true},
    book:    {years: [2026], hasPlanned: true},
    other:   {years: [2026], hasPlanned: true}
};
```

- `years` — **which `<year>.json` files are fetched.** A file that exists but whose year is not listed here will not load. When you add a new year (e.g. `data/anime/2027.json`), add `2027` to that category's `years`.
- `hasPlanned` — whether `planned.json` is fetched and the "planned" view is enabled.

Category **display names** are not stored here — they come from the translation files as `category.<key>` (see [i18n.md](i18n.md)). Media-type names come from `mediaType.<key>`; the valid media types are the `MEDIA_TYPES` array.

`defaultCategory` (`anime`) is used when the `category` parameter is missing or invalid.

## Normalization (`normalizeItem`)

Every raw record is normalized into a consistent shape before rendering. Key behaviors:

- **Category** — an unknown `category` on the record is replaced by the folder's category.
- **Media type** — inferred when missing (see [data-schema.md](data-schema.md#media-type-inference)).
- **`id`** — generated (`custom_<time>_<rand>`) when absent.
- **`name`** — falls back to `originalName`, then to a localized "Untitled" (`common.untitled`) at render time.
- **`date`** — parsed and reformatted to `YYYY-MM-DD`; invalid dates become `""`.
- **`img`** — validated by `sanitizeImageUrl`; when empty/invalid it falls back to the category cover `data/img/category/<category>.svg` (`getCategoryCover`), and to `assets/img/logo/logo.png` only if the category is unknown.
- **`series`** — kept only if it parses to a number `> 0`, else `null`.
- **`isPlanned`** — taken from the record if present, else from the file it came from.
- **`source`** — set to `"remote"` for file-loaded data.
- **`movie`** — normalized back to `"1"`/`"0"` for movie/series to preserve legacy compatibility.

## Rendering

- `renderGallery` builds card markup. All user-facing strings pass through `escapeHtml`, and image URLs through `sanitizeImageUrl` — so untrusted values in the JSON cannot inject markup.
- Cards show a status badge (`badge.watched` / `badge.planned`, e.g. "DONE" / "PLAN"), an optional `#N` episode/chapter badge, cover, title, category•type meta, and duration.
- Clicking a card opens a Bootstrap modal (`showModal`) with full details.
- The category page paginates at 20 items/page; the home carousels show up to 10 items each.

## Filtering & sorting (category page)

`applyFilters` runs on input/change of the filter controls:

- **Search** — case-insensitive substring match against `name` and `originalName`.
- **Type** — exact `mediaType` match; options are populated from the data present.
- **Year** — derived from each record's `date`; options populated from the data.
- **Sort** — date ascending/descending or name ascending/descending (Russian locale collation).

## Caching

- JSON responses are cached in `localStorage` under the `myshelf_cache_` prefix with a **7-day TTL**.
- Cache keys are `<category>_<year>` and `<category>_planned`.
- Expired entries are pruned lazily (`getCache` / `clearOldCache`), and the cache is cleared opportunistically if a write fails (e.g. quota exceeded).
- A cache-busting `?t=<timestamp>` query is still appended to fetches, but a fresh `localStorage` hit short-circuits the network request. To force-refresh during editing, clear site data or bump the TTL.

## Theme

A light/dark toggle stores the choice under the `theme` key in `localStorage` and swaps a body class plus logo variants on load.
