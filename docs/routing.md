# Routing

MyShelf has no router — it reads the page filename and URL query parameters directly and adapts what it renders.

## Pages

| File           | Page type  | Purpose |
|----------------|------------|---------|
| `index.html`   | `home`     | Category overview: latest watched + latest planned carousels and stats. |
| `watched.html` | `category` | Full catalog for one category and view, with filters and pagination. |

The page type is decided by the path: a URL ending in `watched.html` is the category page; anything else is treated as home.

## Query parameters

| Parameter  | Values | Applies to | Default |
|------------|--------|------------|---------|
| `category` | `anime`, `cartoon`, `series`, `movie`, `manga`, `book`, `other` | both pages | `anime` |
| `view`     | `watched`, `planned` | `watched.html` | `watched` |

- An unknown or missing `category` falls back to `anime` (`defaultCategory`).
- `view=planned` loads `data/<category>/planned.json`; anything else loads the watched year files.
- The planned view is only meaningful for categories with `hasPlanned: true` in the config.

## Examples

| URL | Result |
|-----|--------|
| `index.html` | Home for anime (default). |
| `index.html?category=movie` | Home for movies. |
| `watched.html?category=book&view=watched` | Book catalog, read items. |
| `watched.html?category=manga&view=planned` | Manga catalog, planned items. |
| `watched.html?category=series` | Series catalog, watched (view defaults to watched). |

Navigation links in the header and home page are generated from the category config, so they always carry the correct `category` and `view` parameters.
