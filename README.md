# MyShelf

MyShelf это универсальная витрина контента с фильтрацией и просмотром карточек.

Публичной формы добавления в интерфейсе нет. Контент описывается и поддерживается через JSON-файлы в `data/<category>/`.

## Поддерживаемые варианты контента

Категории (`category`):

- `anime` — аниме
- `cartoon` — мультики
- `series` — сериалы
- `movie` — фильмы
- `manga` — манга
- `book` — книги
- `other` — прочее

Типы (`mediaType`):

- `movie`
- `series`
- `anime`
- `cartoon`
- `manga`
- `book`
- `other`

Статус определяется по расположению файла:

- `data/<category>/<year>.json` → просмотрено/прочитано (`isPlanned: false`)
- `data/<category>/planned.json` → запланировано (`isPlanned: true`)

В URL-параметрах страницы: `?view=watched` / `?view=planned`.

## Где лежат данные

- Просмотренное/прочитанное: `data/<category>/<year>.json`
- Запланированное: `data/<category>/planned.json` (опционально)

Пример:

- `data/anime/2024.json`
- `data/anime/planned.json`

## Базовая схема записи

```json
{
  "id": 10001,
  "name": "Название",
  "originalName": "Original Name",
  "date": "2026-04-25",
  "img": "data/img/anime/10001.jpg",
  "description": "Краткое описание",
  "time": "120",
  "series": 12,
  "movie": "0",
  "mediaType": "series",
  "category": "anime"
}
```

### Поля

- `id` (number|string): уникальный идентификатор.
- `name` (string): отображаемое название.
- `originalName` (string, optional): оригинальное название.
- `date` (string, optional): дата в формате `YYYY-MM-DD`.
- `img` (string, optional): URL или путь к изображению.
- `description` (string, optional): описание.
- `time` (string, optional): длительность или объем.
- `series` (number, optional): количество серий/глав.
- `movie` ("1"|"0", optional): обратная совместимость со старыми аниме-данными. При `"1"` → `movie`, при `"0"` и `anime` → `series`, при `"0"` и другой категории → тип по умолчанию категории.
- `mediaType` (string, optional): тип контента.
- `category` (string, optional): категория. Если отсутствует, берется из папки.

## Рекомендованные шаблоны по типам контента

### Фильм

```json
{
  "id": 20001,
  "name": "Inception",
  "originalName": "Inception",
  "date": "2010-07-16",
  "img": "data/img/movie/inception.jpg",
  "description": "Sci-fi thriller",
  "time": "148 мин",
  "mediaType": "movie",
  "category": "movie"
}
```

### Сериал

```json
{
  "id": 30001,
  "name": "Dark",
  "originalName": "Dark",
  "date": "2017-12-01",
  "img": "data/img/series/dark.jpg",
  "description": "Mystery drama",
  "time": "50 мин",
  "series": 26,
  "mediaType": "series",
  "category": "series"
}
```

### Аниме (совместимо со старым форматом)

```json
{
  "id": 40001,
  "name": "Cowboy Bebop",
  "originalName": "Cowboy Bebop",
  "date": "1998-04-03",
  "img": "data/img/anime/40001.jpg",
  "description": "Space western",
  "time": "24",
  "series": 26,
  "movie": "0",
  "mediaType": "series",
  "category": "anime"
}
```

### Мультик

```json
{
  "id": 50001,
  "name": "Soul",
  "originalName": "Soul",
  "date": "2020-12-25",
  "img": "data/img/cartoon/soul.jpg",
  "description": "Pixar animation",
  "time": "100 мин",
  "mediaType": "cartoon",
  "category": "cartoon"
}
```

### Манга

```json
{
  "id": 60001,
  "name": "Berserk",
  "originalName": "Berserk",
  "date": "1989-08-01",
  "img": "data/img/manga/berserk.jpg",
  "description": "Dark fantasy manga",
  "time": "42 тома",
  "series": 42,
  "mediaType": "manga",
  "category": "manga"
}
```

### Книга

```json
{
  "id": 70001,
  "name": "1984",
  "originalName": "Nineteen Eighty-Four",
  "date": "1949-06-08",
  "img": "data/img/book/1984.jpg",
  "description": "Dystopian novel",
  "time": "328 стр",
  "mediaType": "book",
  "category": "book"
}
```

### Прочее

```json
{
  "id": 80001,
  "name": "Курс по режиссуре",
  "date": "2025-09-01",
  "description": "Учебный контент",
  "time": "12 часов",
  "mediaType": "other",
  "category": "other"
}
```

## URL-роутинг

- Главная по категории: `index.html?category=anime`
- Каталог просмотренного: `watched.html?category=book&view=watched`
- Каталог запланированного: `watched.html?category=manga&view=planned`

## Технические заметки

- Чтение данных кэшируется в `localStorage` с TTL 7 дней (префикс ключа: `myshelf_cache_`).
- Если `mediaType` не задан:
  - при `movie: "1"` считается `movie`
  - при `movie: "0"` и `category: anime` считается `series`
  - при `movie: "0"` и другой категории — используется тип по умолчанию категории (например, `book` → `book`, `series` → `series`)
  - иначе тип по умолчанию для категории (название категории = тип, если это валидный `mediaType`)
- Если `img` невалиден или пустой, используется fallback-изображение.
- Поле `source` добавляется автоматически при нормализации (`"remote"` для данных из JSON-файлов).
