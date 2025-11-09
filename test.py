import json
import glob


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


def WatchAnime():
    # Собираем все существующие ID из всех годовых файлов
    year_files = glob.glob("data/*.json")

    for file_path in year_files:
        year_data = ReadDB(file_path)
        for data in year_data:
            data["genre"] = ""

        WriteDB(file_path, year_data)


if __name__ == "__main__":
    WatchAnime()
