import json
import os
import re
import time
import random
import glob
from collections import defaultdict

import requests

# Shikimori API
# https://shikimori.one/api/doc/1.0

USERNAME = "Divarion_D"
HEADER = {"X-User-Nickname": USERNAME, "User-Agent": USERNAME}


def ReadDB(file_path):
    """Читает JSON файл и возвращает данные. Возвращает пустой список при ошибках."""
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return []  # Возвращаем пустой список если файла нет
    except json.JSONDecodeError:
        print(f"Ошибка чтения файла {file_path}. Файл будет пересоздан.")
        return []
    except Exception as e:
        print(f"Неизвестная ошибка при чтении {file_path}: {str(e)}")
        return []


def WriteDB(file_path, data):
    """Сохраняет данные в JSON файл с автоматическим созданием директорий."""
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print(f"Ошибка записи в файл {file_path}: {str(e)}")


def GetAnimeInfo(id, max_retries=5, base_delay=1):
    """Получает информацию об аниме по его ID с обработкой ограничений запросов."""
    headers = {
        "User-Agent": "MyApp/1.0 (contact@example.com)",
        "Accept-Encoding": "gzip, deflate, br",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Connection": "keep-alive",
        "DNT": "1",
        "Origin": "https://shikimori.one",
    }

    # Исправленный GraphQL-запрос
    query = """
    {
    animes(ids: "$id", limit: 1) {
        id
        name
        russian
        kind
        rating
        score
        status
        episodes
        duration
        airedOn { year month day date }
        poster {originalUrl}
        rating
        genres {russian}
        description
    }
    }
    """.replace(
        "$id", str(id)
    )

    for attempt in range(max_retries):
        try:
            response = requests.post(
                "https://shikimori.one/api/graphql",
                json={"query": query},
                headers=headers,
            )

            # Если получили 429 - ждем и повторяем
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                if retry_after:
                    wait_time = int(retry_after)
                else:
                    # Экспоненциальная backoff задержка с джиттером
                    wait_time = base_delay * (2**attempt) + random.uniform(0, 1)

                print(
                    f"Rate limit exceeded. Waiting {wait_time:.2f} seconds (attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(wait_time)
                continue

            response.raise_for_status()
            data = response.json()

            if data.get("data", {}).get("animes"):
                return data["data"]["animes"][0]
            else:
                print(f"No anime found with ID: {id}")
                return None

        except requests.exceptions.HTTPError as e:
            if response.status_code == 429:
                # Обработка 429 в исключении (на случай если raise_for_status вызвал исключение)
                retry_after = response.headers.get("Retry-After")
                if retry_after:
                    wait_time = int(retry_after)
                else:
                    wait_time = base_delay * (2**attempt) + random.uniform(0, 1)

                print(
                    f"HTTP 429 error. Waiting {wait_time:.2f} seconds (attempt {attempt + 1}/{max_retries})"
                )
                time.sleep(wait_time)
                continue
            else:
                print(f"HTTP error: {e}")
                if attempt == max_retries - 1:
                    return None

        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            if attempt == max_retries - 1:
                return None

        except KeyError as e:
            print(f"Data parsing error: {e}")
            return None

        except Exception as e:
            print(f"Unexpected error: {e}")
            if attempt == max_retries - 1:
                return None

    print(f"Failed after {max_retries} attempts")
    return None


def download_image(url, save_path=None):
    """
    Скачивает изображение по URL
    :param url: Ссылка на изображение
    :param save_path: Путь для сохранения (если не указан - используется имя файла из URL)
    :return: Путь к сохраненному файлу
    """
    try:
        # Отправляем GET-запрос
        response = requests.get(url, headers=HEADER, stream=True)
        response.raise_for_status()

        # Определяем имя файла
        if not save_path:
            filename = os.path.basename(url)
            save_path = os.path.join(os.getcwd(), filename)

        # Сохраняем изображение
        with open(save_path, "wb") as file:
            for chunk in response.iter_content(1024):
                file.write(chunk)

        print(f"Изображение сохранено: {save_path}")
        return save_path

    except Exception as e:
        print(f"Ошибка загрузки: {str(e)}")
        return None


def WatchAnime(data):
    # Собираем все существующие ID из всех годовых файлов
    existing_ids = set()
    year_files = glob.glob("data/anime/*.json")

    for file_path in year_files:
        year_data = ReadDB(file_path)
        existing_ids.update({item["id"] for item in year_data})

    new_data = defaultdict(list)

    for item in data:
        anime_id = item.get("anime").get("id")

        # Пропускаем уже существующие аниме
        if anime_id in existing_ids:
            print(f"Anime with ID {anime_id} already exists. Skipping.")
            continue

        # Делаем запрос только для новых аниме
        anime = GetAnimeInfo(anime_id)

        year = anime["airedOn"]["year"]
        desc = "" if anime["description"] is None else anime["description"]
        desc = re.sub(r"\[.*?\]", "", desc)  # remove [*] from description
        genres_list = [genre["russian"] for genre in anime["genres"]]

        while True:
            try:
                img = download_image(
                    anime["poster"]["originalUrl"], f"data/img/anime/{anime_id}.jpg"
                )
                break
            except Exception as e:
                print(f"Error downloading image for anime {anime_id}: {e}")
                time.sleep(5)  # wait 5 seconds before retrying

        # Формируем запись
        entry = {
            "id": anime_id,
            "name": anime["russian"],
            "originalName": anime["name"],
            "date": anime["airedOn"]["date"],
            "img": img,
            "description": desc,
            "genres": genres_list,
        }

        # Добавляем специфичные поля
        if anime["kind"] == "movie":
            time_m = time.strftime("%H:%M:%S", time.gmtime(anime["duration"] * 60))
            entry.update({"time": time_m, "movie": "1"})
        else:
            entry.update(
                {
                    "time": str(anime["duration"]),
                    "series": anime["episodes"],
                    "movie": "0",
                }
            )

        new_data[year].append(entry)
        print(f"Added anime with ID {anime_id}")
        existing_ids.add(anime_id)  # Запоминаем обработанные ID

        # delete in shedschedule
        shed_data = ReadDB("data/anime/planned.json")
        shed_data = [item for item in shed_data if item["id"] != anime_id]
        WriteDB("data/anime/planned.json", shed_data)

    # Сохраняем новые данные по годам
    for year, entries in new_data.items():
        filename = f"data/anime/{year}.json"

        # Загружаем существующие данные для года
        if os.path.exists(filename):
            year_entries = ReadDB(filename)
            existing_ids_year = {item["id"] for item in year_entries}
        else:
            year_entries = []
            existing_ids_year = set()

        # Фильтруем уже существующие записи (на случай дубликатов в data)
        filtered_entries = [
            entry for entry in entries if entry["id"] not in existing_ids_year
        ]

        if filtered_entries:
            # Объединяем и сортируем
            combined = year_entries + filtered_entries
            combined.sort(key=lambda x: x.get("date") or "", reverse=True)

            # Сохраняем обновленные данные
            WriteDB(filename, combined)


def Schuduled(data):
    existing_data = ReadDB("data/anime/planned.json")
    existing_ids = {item["id"] for item in existing_data}

    new_entries = []

    for item in data:
        anime_id = item.get("anime").get("id")

        # Skip if already exists
        if anime_id in existing_ids:
            print(f"Skipping duplicate anime ID: {anime_id}")
            continue

        anime = GetAnimeInfo(anime_id)

        desc = "" if anime["description"] is None else anime["description"]
        desc = re.sub(r"\[.*?\]", "", desc)  # remove [*] from description
        genres_list = [genre["russian"] for genre in anime["genres"]]

        while True:
            try:
                img = download_image(
                    anime["poster"]["originalUrl"], f"data/img/anime/{anime_id}.jpg"
                )
                break
            except Exception as e:
                print(f"Error downloading image for anime {anime_id}: {e}")
                time.sleep(5)  # wait 5 seconds before retrying

        # Prepare data entry
        entry = {
            "id": anime_id,
            "name": anime["russian"],
            "originalName": anime["name"],
            "date": anime["airedOn"]["date"],
            "img": img,
            "description": desc,
            "genres": genres_list,
        }

        # Add type-specific fields
        if anime["kind"] == "movie":
            time_m = time.strftime("%H:%M:%S", time.gmtime(anime["duration"] * 60))
            entry.update({"time": time_m, "movie": "1"})
        else:
            entry.update(
                {
                    "time": str(anime["duration"]),
                    "series": anime["episodes"],
                    "movie": "0",
                }
            )
        new_entries.append(entry)
        print(f"Added new anime entry: {anime_id}")
        existing_ids.add(anime_id)  # Prevent duplicates in current session

    # Merge and sort data
    if new_entries:
        combined_data = existing_data + new_entries
        # Sort by date in reverse chronological order
        combined_data.sort(key=lambda x: x["date"] or "", reverse=True)

        # Save updated data
        WriteDB("data/anime/planned.json", combined_data)


if __name__ == "__main__":
    data = requests.get(
        f"https://shikimori.one/api/users/{USERNAME}/anime_rates?limit=1000000000&status=completed",
        headers=HEADER,
    )
    data = json.loads(data.text)
    WatchAnime(data)

    data = requests.get(
        f"https://shikimori.one/api/users/{USERNAME}/anime_rates?limit=1000000000&status=planned",
        headers=HEADER,
    )
    data = json.loads(data.text)
    Schuduled(data)
