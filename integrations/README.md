# Integrations

Drop scripts here that connect MyShelf to external services — trackers, catalogs, and APIs — and turn their data into the JSON files the site reads.

## What integrations do

MyShelf renders whatever lives in `data/<category>/`. An integration's job is to **produce or update those files** so you don't have to hand-edit JSON. Typical flow:

```text
external service  →  integration script  →  data/<category>/<year>.json
   (API / export)     (fetch + transform)     data/<category>/planned.json
                                              data/img/<category>/<id>.<ext>
```

Ideas for integrations:

- Import a watched list from a tracking service (Shikimori, MyAnimeList, Trakt, Letterboxd, Goodreads, …).
- Sync a spreadsheet or Notion database into the `data/` files.
- Fetch cover art and metadata by title/ID and fill in `img`, `date`, `description`, `time`.
- Validate existing JSON against the schema.

## Output contract

Any script here should write records that match the schema in
[`../docs/data-schema.md`](../docs/data-schema.md). In short, each `data/<category>/<file>.json`
is a JSON **array** of objects, and the important fields are:

- `id` — unique, stable per item (used for image filenames too).
- `name` — display title (`originalName` optional, also searched).
- `date` — `YYYY-MM-DD`.
- `mediaType` and `category` — see the schema for allowed values.
- `img` — path like `data/img/<category>/<id>.<ext>` (optional).
- Watched/read items go in `data/<category>/<year>.json`; planned items in `data/<category>/planned.json`.

After adding a **new year** file, remember to register the year in the category config
(`categories[...].years`) in [`../assets/js/main.js`](../assets/js/main.js), or it will not be loaded.
See [`../docs/architecture.md`](../docs/architecture.md#category-configuration).

## Conventions

- Keep one folder or file per integration, e.g. `integrations/shikimori/` or `integrations/letterboxd.py`.
- Document each integration's usage (required tokens, arguments, what it writes) in its own README or header comment.
- Never commit secrets. Read API keys/tokens from environment variables or a git-ignored local config.
- Prefer scripts that are **idempotent** — safe to re-run, updating existing records by `id` rather than duplicating them.
- Validate output is valid JSON before writing over existing data files.

## Suggested layout

```text
integrations/
├── README.md                # this file
├── <service-name>/          # one folder per service
│   ├── README.md            # how to run it, required config
│   └── ...                  # the script(s)
└── ...
```
