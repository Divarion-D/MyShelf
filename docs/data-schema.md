# Data schema

All content lives in JSON files under `data/<category>/`. Each file is a JSON **array** of record objects. The site reads them in the browser and normalizes every record before rendering.

## Categories

The `category` field (and the folder name) is one of the codes below. The display
label is not stored here — it comes from the translations (`category.<code>`), so it
differs per language. The English labels are shown for reference.

| Category  | Label (en) |
|-----------|------------|
| `anime`   | Anime      |
| `cartoon` | Cartoons   |
| `series`  | Series     |
| `movie`   | Movies     |
| `manga`   | Manga      |
| `book`    | Books      |
| `other`   | Other      |

## Media types

The `mediaType` field is one of: `movie`, `series`, `anime`, `cartoon`, `manga`, `book`, `other`.

## Watched vs. planned

Status is determined by **which file** the record lives in, not by a field:

| File                              | Meaning              | `isPlanned` |
|-----------------------------------|----------------------|-------------|
| `data/<category>/<year>.json`     | Watched / read       | `false`     |
| `data/<category>/planned.json`    | Planned              | `true`      |

`planned.json` is optional. Which year files get loaded is controlled by the category config in [`assets/js/main.js`](../assets/js/main.js) — see [architecture.md](architecture.md#category-configuration).

## Base record

```json
{
  "id": 910001,
  "name": "Neon Harbor",
  "originalName": "Neon Harbor",
  "date": "2026-01-11",
  "img": "data/img/anime/910001.svg",
  "description": "Cyberpunk anime series about divers of a flooded megacity.",
  "time": "24 min",
  "series": 12,
  "movie": "0",
  "mediaType": "series",
  "category": "anime"
}
```

## Fields

| Field          | Type            | Required | Description |
|----------------|-----------------|----------|-------------|
| `id`           | number \| string| No       | Unique identifier. If omitted, one is generated at load time. |
| `name`         | string          | Yes*     | Display title. Falls back to `originalName`, then to a localized "Untitled" (`common.untitled`). |
| `originalName` | string          | No       | Original-language title; also matched by search. |
| `date`         | string          | No       | `YYYY-MM-DD`. Used for sorting and the year filter. Invalid dates become empty. |
| `img`          | string          | No       | URL or path to the cover. Invalid/empty values fall back to the category cover `data/img/category/<category>.svg`. |
| `description`  | string          | No       | Free text shown in the detail modal. |
| `time`         | string          | No       | Duration or volume, free text (e.g. `"148 min"`, `"42 vols"`). |
| `series`       | number          | No       | Episode / chapter count. Shown as a `#N` badge. Must be `> 0` to display. |
| `movie`        | `"1"` \| `"0"`  | No       | Legacy anime flag; see [inference](#media-type-inference). |
| `mediaType`    | string          | No       | Content type. If omitted, it is inferred (see below). |
| `category`     | string          | No       | Category. If missing or unknown, the folder's category is used. |
| `isPlanned`    | boolean         | No       | Normally derived from the file. An explicit value overrides. |
| `source`       | string          | No       | Set automatically to `"remote"` for file-loaded data. |

\* `name` is effectively required for a useful card, but the app tolerates its absence.

### Media type inference

When `mediaType` is missing or not a known type, it is inferred:

1. `movie: "1"` → `movie`
2. `movie: "0"` and `category: "anime"` → `series`
3. `movie: "0"` and any other category → the category's default type
4. Otherwise → the category's default type (the category name itself, if it is a valid media type; else `other`)

The `movie` field exists only for backward compatibility with older anime data. For new records, set `mediaType` explicitly and you can omit `movie`.

## Per-type templates

### Movie

```json
{
  "id": 20001,
  "name": "Inception",
  "originalName": "Inception",
  "date": "2010-07-16",
  "img": "data/img/movie/inception.jpg",
  "description": "Sci-fi thriller",
  "time": "148 min",
  "mediaType": "movie",
  "category": "movie"
}
```

### Series

```json
{
  "id": 30001,
  "name": "Dark",
  "originalName": "Dark",
  "date": "2017-12-01",
  "img": "data/img/series/dark.jpg",
  "description": "Mystery drama",
  "time": "50 min",
  "series": 26,
  "mediaType": "series",
  "category": "series"
}
```

### Anime (legacy-compatible)

```json
{
  "id": 40001,
  "name": "Cowboy Bebop",
  "originalName": "Cowboy Bebop",
  "date": "1998-04-03",
  "img": "data/img/anime/40001.jpg",
  "description": "Space western",
  "time": "24 min",
  "series": 26,
  "movie": "0",
  "mediaType": "series",
  "category": "anime"
}
```

### Cartoon

```json
{
  "id": 50001,
  "name": "Soul",
  "originalName": "Soul",
  "date": "2020-12-25",
  "img": "data/img/cartoon/soul.jpg",
  "description": "Pixar animation",
  "time": "100 min",
  "mediaType": "cartoon",
  "category": "cartoon"
}
```

### Manga

```json
{
  "id": 60001,
  "name": "Berserk",
  "originalName": "Berserk",
  "date": "1989-08-01",
  "img": "data/img/manga/berserk.jpg",
  "description": "Dark fantasy manga",
  "time": "42 vols",
  "series": 42,
  "mediaType": "manga",
  "category": "manga"
}
```

### Book

```json
{
  "id": 70001,
  "name": "1984",
  "originalName": "Nineteen Eighty-Four",
  "date": "1949-06-08",
  "img": "data/img/book/1984.jpg",
  "description": "Dystopian novel",
  "time": "328 pages",
  "mediaType": "book",
  "category": "book"
}
```

### Other

```json
{
  "id": 80001,
  "name": "Film Editing Course",
  "date": "2026-01-13",
  "description": "Online course about editing workflow.",
  "time": "14 hours",
  "mediaType": "other",
  "category": "other"
}
```
