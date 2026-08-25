# MyShelf

MyShelf is a static, client-side showcase for your personal media collection — anime, cartoons, series, movies, manga, books, and anything else. It renders filterable, paginated card galleries straight from JSON files, with no backend, build step, or database.

There is no "add" form in the UI. Content is described and maintained by hand in JSON files under `data/<category>/`, and the site reads them directly in the browser.

## Features

- **Pure static site** — plain HTML, CSS, and vanilla JS (with jQuery/Bootstrap plugins). Host it anywhere that serves files.
- **Seven content categories** — anime, cartoon, series, movie, manga, book, other.
- **Two views per category** — *watched/read* and *planned*.
- **Search, filter, and sort** — by title, media type, year, and date/name ordering.
- **Detail modal** — cover, category, type, date, episode/chapter count, duration, description.
- **Multilingual UI** — Russian and English out of the box, switchable in the header; add more via JSON. See [`docs/i18n.md`](docs/i18n.md).
- **Client-side caching** — JSON responses are cached in `localStorage` for 7 days.
- **Light/dark theme** — remembered across visits.

## Quick start

The site uses `fetch()` to load JSON, so it must be served over HTTP — opening `index.html` from the filesystem (`file://`) will not work.

```bash
# From the project root, start any static server, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

Any static host works too — GitHub Pages, Netlify, Nginx, etc. Just serve the repository root.

## Adding content

1. Pick a category folder under `data/` (e.g. `data/movie/`).
2. Add your entry to the year file for watched/read items (`data/movie/2026.json`) or to `planned.json` for planned items. Each file is a JSON array of objects.
3. Register the year in the category config so it gets loaded — see [`docs/architecture.md`](docs/architecture.md#category-configuration).
4. Optionally drop a cover image in `data/img/<category>/` and point `img` at it.

A minimal entry:

```json
{
  "id": 20001,
  "name": "Inception",
  "date": "2010-07-16",
  "mediaType": "movie",
  "category": "movie",
  "img": "data/img/movie/inception.jpg"
}
```

The full field reference and per-type templates live in [`docs/data-schema.md`](docs/data-schema.md).

## Project layout

```text
MyShelf/
├── index.html          # Home page (per-category overview: latest + planned)
├── watched.html        # Category catalog (watched / planned, with filters)
├── assets/
│   ├── css/            # Styles + vendor CSS
│   ├── js/main.js      # All application logic
│   ├── js/*.min.js     # jQuery, Bootstrap, Owl Carousel, Isotope, etc.
│   ├── i18n/           # UI translations (config.json + <lang>.json)
│   ├── fonts/          # Icon fonts
│   └── img/            # Logo and breadcrumb backgrounds
├── data/
│   ├── <category>/<year>.json    # Watched / read items
│   ├── <category>/planned.json   # Planned items
│   ├── img/<category>/           # Per-item cover images
│   └── img/category/             # Per-category fallback covers (<category>.svg)
├── integrations/       # Your own scripts that generate / sync data (see below)
└── docs/               # Full documentation
```

## Documentation

- [`docs/data-schema.md`](docs/data-schema.md) — record schema, every field, and per-type templates.
- [`docs/architecture.md`](docs/architecture.md) — how the app loads, normalizes, and renders data.
- [`docs/routing.md`](docs/routing.md) — pages and URL parameters.
- [`docs/i18n.md`](docs/i18n.md) — the localization system and how to add a language.
- [`integrations/README.md`](integrations/README.md) — how to plug in scripts that produce `data/` files.

## URL routing (at a glance)

- Home for a category: `index.html?category=anime`
- Watched catalog: `watched.html?category=book&view=watched`
- Planned catalog: `watched.html?category=manga&view=planned`

## License

No license file is present. Add one if you intend to distribute or open-source the project.
