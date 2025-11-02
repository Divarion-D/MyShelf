const animeYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2012, 2011, 2010, 2009, 2008, 2006, 2004, 2003, 2001, 1995, 1988]; // Массив годов для загрузки JSON файлов
let allData = []; // Хранит все аниме
let filteredAnimeSeries = []; // Хранит отфильтрованные аниме сериалы
let filteredAnimeMovies = []; // Хранит отфильтрованные аниме фильмы=

const homeItemsPerPage = 10; // Количество элементов на главной странице
const animeItemsPerPage = 20; // Количество элементов на аниме странице
let currentPage = 1; // Текущая страница (не редактировать)

// Список изображений для фона
const animeBackgroundImages = [
    'assets/img/breadcrumb/anime/1.jpeg',
    'assets/img/breadcrumb/anime/2.jpg',
    'assets/img/breadcrumb/anime/3.png',
    'assets/img/breadcrumb/anime/4.jpg'
];

// Добавляем доступные года в фильтр
const yearFilterID = document.getElementById('year-filter');
if (yearFilterID != null) {
    for (const year of animeYears) {
        const yearFiletrOption = document.createElement('option');
        yearFiletrOption.value = year;
        yearFiletrOption.text = year;
        yearFilterID.appendChild(yearFiletrOption)

    }
}

(function ($) {
    "use strict";
    $(window).on("load", function () {
        $(".preloader").fadeOut("slow");
    });

    $(".dropdown-menu a.dropdown-toggle").on("click", function (e) {
        if (!$(this).next().hasClass("show")) {
            $(this).parents(".dropdown-menu").first().find(".show").removeClass("show");
        }
        var $subMenu = $(this).next(".dropdown-menu");
        $subMenu.toggleClass("show");
        $(this)
            .parents("li.nav-item.dropdown.show")
            .on("hidden.bs.dropdown", function (e) {
                $(".dropdown-submenu .show").removeClass("show");
            });
        return false;
    });
    new WOW().init();
    $(window).scroll(function () {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            $("#scroll-top").addClass("active");
        } else {
            $("#scroll-top").removeClass("active");
        }
    });
    $("#scroll-top").on("click", function () {
        $("html, body").animate({ scrollTop: 0 }, 1000);
        return false;
    });
    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $(".navbar").addClass("fixed-top");
        } else {
            $(".navbar").removeClass("fixed-top");
        }
    });
    $(window).on("load", function () {
        if ($(".filter-box").children().length > 0) {
            $(".filter-box").isotope({ itemSelector: ".filter-item", masonry: { columnWidth: 1 } });
            $(".filter-btn").on("click", "li", function () {
                var filterValue = $(this).attr("data-filter");
                $(".filter-box").isotope({ filter: filterValue });
            });
            $(".filter-btn li").each(function () {
                $(this).on("click", function () {
                    $(this).siblings("li.active").removeClass("active");
                    $(this).addClass("active");
                });
            });
        }
    });
    if ($(".select").length) {
        $(".select").niceSelect();
    }

    // Установка текущего года в футере
    document.getElementById('date').textContent = new Date().getFullYear();

    const getMode = localStorage.getItem("theme");
    if (getMode === "dark") {
        $("body").addClass("theme-mode-variables");
        $(".light-btn").css("display", "none");
        $(".dark-btn").css("display", "block");
    }
    $(".theme-mode-control").on("click", function () {
        $("body").toggleClass("theme-mode-variables");
        const checkMode = $("body").hasClass("theme-mode-variables");
        const setMode = checkMode ? "dark" : "light";
        localStorage.setItem("theme", setMode);
        if (checkMode) {
            $(".light-btn").css("display", "none");
            $(".dark-btn").css("display", "block");
        } else {
            $(".light-btn").css("display", "block");
            $(".dark-btn").css("display", "none");
        }
    });
    $(window).on("load", function () {
        logoMode();
    });
    $(".theme-mode-control").on("click", function () {
        logoMode();
    });
    function logoMode() {
        let dtv = document.querySelector(".theme-mode-variables");
        if (dtv) {
            $(".logo-light-mode").css("display", "block");
            $(".logo-dark-mode").css("display", "none");
        } else {
            $(".logo-light-mode").css("display", "none");
            $(".logo-dark-mode").css("display", "block");
        }
    }
})(jQuery);





// Функция для установки случайного фона
function setRandomBackground() {
    const breadcrumb = document.querySelector('.site-breadcrumb');
    const randomIndex = Math.floor(Math.random() * animeBackgroundImages.length);
    const selectedImage = animeBackgroundImages[randomIndex];
    breadcrumb.style.backgroundImage = `url(${selectedImage})`;
}

// Load Anime Data
async function loadData(years, type) {
    allData = [];
    for (const year of years) {
        try {
            const response = await fetch(`data/${year}.json`);
            if (!response.ok) {
                console.warn(`Файл ${year}.json не доступен: ${response.status}`);
                continue;
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                allData = allData.concat(data);
            }
        } catch (error) {
            console.error(`Error loading ${year}.json:`, error);
        }
    }
    filteredAnimeMovies = allData.filter(anime => (anime.series || 0) <= 1);
    filteredAnimeSeries = allData.filter(anime => (anime.series || 0) > 1);

    if (type == 'home') {
        renderGallery(filteredAnimeMovies, 'movie', 'home');
        renderGallery(filteredAnimeSeries, 'series', 'home');

        // Инициализируем карусель после рендера (если она присутствует)
        initMovieCarousel('movie');
        initMovieCarousel('series');
    } else {
        renderGallery(allData, 'series', 'anime');
        renderPagination(allData);
    }
}

// Render Gallery
function renderGallery(animeList, type, page) {
    const gallery = document.getElementById(type === 'movie' ? 'movie-gallery' : 'series-gallery');
    let paginatedData = [];
    if (!gallery) return;
    gallery.innerHTML = '';

    if (!animeList || animeList.length === 0) {
        gallery.innerHTML = '<div class="no-results">Ничего не найдено</div>';
        return;
    }

    if (page == 'home') {
        paginatedData = animeList.slice(0, homeItemsPerPage);
    } else {
        // Вычисление индексов для текущей страницы
        const startIndex = (currentPage - 1) * animeItemsPerPage;
        const endIndex = startIndex + animeItemsPerPage;
        paginatedData = animeList.slice(startIndex, endIndex);
    }

    paginatedData.forEach(anime => {
        const item = document.createElement('div');
        item.innerHTML = `
                ${type === 'series' ? `<span class="movie-episode">EPS<small>${anime.series || 0}</small></span>` : ''}
                <div class="movie-img">
                    <img src="${anime.img}" alt="${anime.name}">
                    <a href="#" class="movie-play"><i class="icon-play-3"></i></a>
                </div>
                <div class="movie-content">
                    <h6 class="movie-title"><a href="#">${anime.name}</a></h6>
                    <div class="movie-info">
                        <span class="movie-time">${anime.time || 'N/A'} мин</span>
                        <div class="movie-genre">
                            <a href="index.html#">Action,</a>
                        </div>
                    </div>
                </div>`;

        if (page == 'home') {
            item.className = 'movie-item';
        } else {
            item.className = 'col-6 col-md-4 col-lg-3 col-xl';
            item.innerHTML = '<div class="movie-item">' + item.innerHTML + '</div>';
        }

        // Навешиваем обработчик на весь элемент (клик по карточке)
        item.addEventListener('click', (e) => {
            // если клик по .movie-play — уже обработано выше, но preventDefault не помешает
            // предотвращаем срабатывание при клике по внутренним ссылкам, если нужно
            const target = e.target;
            // если клик пришёл на ссылку внутри карточки — игнорируем чтобы не двойной вызов
            if (target && (target.closest('a') && !target.closest('.movie-play'))) {
                return;
            }
            showModal(anime);
        });

        gallery.appendChild(item);
    });
}

// Инициализация / реинициализация Owl Carousel
function initMovieCarousel(type) {
    // Убедимся что jQuery и owlCarousel доступны
    if (typeof jQuery === 'undefined' || typeof jQuery().owlCarousel !== 'function') {
        console.warn('jQuery или owlCarousel не найдены. Проверьте подключение скриптов owl.carousel.min.js и jQuery.');
        return;
    }
    const $gallery = jQuery('#' + type + '-gallery');

    // Если уже инициирован — уничтожаем, чтобы заново проинициализировать с новыми элементами
    if ($gallery.hasClass('owl-loaded') || $gallery.data('owl.carousel')) {
        try {
            $gallery.trigger('destroy.owl.carousel');
            // после destroy owl добавляет разметку — удаляем её чтобы начать с чистого листа
            $gallery.find('.owl-stage-outer').children().unwrap();
            $gallery.removeClass('owl-loaded owl-hidden');
            $gallery.removeData();
        } catch (err) {
            // не критично
            console.warn('Ошибка при destroy.owl.carousel:', err);
        }
    }

    // Настройки карусели можно подправить под ваш дизайн
    $gallery.owlCarousel({
        loop: true,
        margin: 20,
        nav: true,
        dots: false,
        autoplay: false,
        navText: ["<i class='far fa-angle-left'></i>", "<i class='far fa-angle-right'></i>"],
        responsive: { 0: { items: 2 }, 600: { items: 3 }, 1000: { items: 4 }, 1200: { items: 5 } },
    });

}

// Рендеринга пагинации
function renderPagination(animeList) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // Очистка пагинации

    const totalPages = Math.ceil(animeList.length / animeItemsPerPage);

    // Кнопка "Предыдущая"
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous">
            <span aria-hidden="true"><i class="fas fa-arrow-left"></i></span>
        </a>
    `;
    if (currentPage > 1) {
        prevLi.querySelector('a').addEventListener('click', (e) => {
            $("html, body").animate({ scrollTop: 0 }, 1000); //scroll page top
            e.preventDefault();
            currentPage--;
            renderGallery(animeList, 'series', 'anime');
            // Рендеринг пагинации
            renderPagination(animeList);
        });
    }
    pagination.appendChild(prevLi);

    // Номера страниц
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstPageLi = document.createElement('li');
        firstPageLi.className = 'page-item';
        firstPageLi.innerHTML = '<a class="page-link" href="#">1</a>';
        firstPageLi.querySelector('a').addEventListener('click', (e) => {
            $("html, body").animate({ scrollTop: 0 }, 1000); //scroll page top
            e.preventDefault();
            currentPage = 1;
            renderGallery(animeList, 'series', 'anime');
            // Рендеринг пагинации
            renderPagination(animeList);
        });
        pagination.appendChild(firstPageLi);

        if (startPage > 2) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item';
            dotsLi.innerHTML = '<span class="page-link">...</span>';
            pagination.appendChild(dotsLi);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        pageLi.querySelector('a').addEventListener('click', (e) => {
            $("html, body").animate({ scrollTop: 0 }, 1000); //scroll page top


            e.preventDefault();
            currentPage = i;
            renderGallery(animeList, 'series', 'anime');
            // Рендеринг пагинации
            renderPagination(animeList);
        });
        pagination.appendChild(pageLi);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const dotsLi = document.createElement('li');
            dotsLi.className = 'page-item';
            dotsLi.innerHTML = '<span class="page-link">...</span>';
            pagination.appendChild(dotsLi);
        }

        const lastPageLi = document.createElement('li');
        lastPageLi.className = 'page-item';
        lastPageLi.innerHTML = `<a class="page-link" href="#">${totalPages}</a>`;
        lastPageLi.querySelector('a').addEventListener('click', (e) => {
            $("html, body").animate({ scrollTop: 0 }, 1000); //scroll page top
            e.preventDefault();
            currentPage = totalPages;
            renderGallery(animeList, 'series', 'anime');
            // Рендеринг пагинации
            renderPagination(animeList);
        });
        pagination.appendChild(lastPageLi);
    }

    // Кнопка "Следующая"
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next">
            <span aria-hidden="true"><i class="fas fa-arrow-right"></i></span>
        </a>
    `;
    if (currentPage < totalPages) {
        nextLi.querySelector('a').addEventListener('click', (e) => {
            $("html, body").animate({ scrollTop: 0 }, 1000); //scroll page top
            e.preventDefault();
            currentPage++;
            renderGallery(animeList, 'series', 'anime');
            // Рендеринг пагинации
            renderPagination(animeList);
        });
    }
    pagination.appendChild(nextLi);
}

// Show Modal
function showModal(anime) {
    const modalEl = document.getElementById('animeModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    const title = document.getElementById('modal-title');
    const cover = document.getElementById('modal-cover');
    const date = document.getElementById('modal-date');
    const series = document.getElementById('modal-series');
    const time = document.getElementById('modal-time');
    const description = document.getElementById('modal-description');
    const backdrop = modalEl.querySelector('.image-backdrop');

    if (title) title.textContent = anime.name || '';
    if (cover) cover.src = anime.img || '';
    if (backdrop) backdrop.style.backgroundImage = anime.img ? `url(${anime.img})` : '';
    if (date) date.textContent = anime.date || 'Не указано';
    if (series) series.textContent = anime.series || 'Не указано';
    if (time) time.textContent = anime.time || 'Не указано';
    if (description) description.textContent = anime.description || 'Описание отсутствует';

    modal.show();
}

// Функция для фильтрации и сортировки
function applyFilters() {
    const searchQuery = document.getElementById('search-input').value.toLowerCase();
    const typeFilter = document.getElementById('type-filter').value;
    const yearFilter = document.getElementById('year-filter').value;
    const sortFilter = document.getElementById('sort-filter').value;

    // Получение выбранных годов из чекбоксов
    const selectedYears = Array.from(document.querySelectorAll('input[name="year"]:checked'))
        .map(input => input.value)
        .filter(year => year !== 'any');

    filteredAnimeSeries = allData.filter(anime => {
        // Фильтр по поиску
        const matchesSearch = anime.name.toLowerCase().includes(searchQuery);

        // Фильтр по типу (предполагаем: series > 1 - сериал, иначе фильм)
        const matchesType = typeFilter === 'any' ||
            (typeFilter === 'series' && anime.series > 1) ||
            (typeFilter === 'movie' && anime.series <= 1);

        // Фильтр по году
        const animeYear = new Date(anime.date).getFullYear().toString();
        const matchesYear = yearFilter === 'any' && selectedYears.length === 0 ||
            yearFilter !== 'any' && animeYear === yearFilter ||
            selectedYears.includes(animeYear);

        return matchesSearch && matchesType && matchesYear;
    });

    // Сортировка
    if (sortFilter !== 'none') {
        filteredAnimeSeries.sort((a, b) => {
            if (sortFilter === 'date-desc') {
                return new Date(b.date) - new Date(a.date);
            } else if (sortFilter === 'date-asc') {
                return new Date(a.date) - new Date(b.date);
            } else if (sortFilter === 'name-asc') {
                return a.name.localeCompare(b.name);
            } else if (sortFilter === 'name-desc') {
                return b.name.localeCompare(a.name);
            }
            return 0;
        });
    }

    renderGallery(filteredAnimeSeries, 'series', 'anime');
    renderPagination(filteredAnimeSeries);
}

// Обработчик для чекбоксов года
document.querySelectorAll('input[name="year"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        // Если выбран "Любой год", отключаем другие чекбоксы
        if (checkbox.value === 'any' && checkbox.checked) {
            document.querySelectorAll('input[name="year"]').forEach(cb => {
                if (cb !== checkbox) cb.checked = false;
            });
        } else if (checkbox.value !== 'any' && checkbox.checked) {
            document.getElementById('year1').checked = false;
        }
        applyFilters();
    });
});

// Обработчик для радиокнопок сортировки
document.querySelectorAll('input[name="sort"]').forEach(radio => {
    radio.addEventListener('change', () => {
        document.getElementById('sort-filter').value = radio.value;
        applyFilters();
    });
});

// Обработчик для чекбоксов типа
document.querySelectorAll('input[name="type"]').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        if (checkbox.value === 'any' && checkbox.checked) {
            document.querySelectorAll('input[name="type"]').forEach(cb => {
                if (cb !== checkbox) cb.checked = false;
            });
        } else if (checkbox.value !== 'any' && checkbox.checked) {
            document.getElementById('type1').checked = false;
        }
        const selectedTypes = Array.from(document.querySelectorAll('input[name="type"]:checked'))
            .map(cb => cb.value);
        document.getElementById('type-filter').value = selectedTypes.includes('any') ? 'any' :
            selectedTypes.includes('series') ? 'series' : 'movie';
        applyFilters();
    });
});
