// === КОНФИГУРАЦИЯ КАТЕГОРИЙ ===
const categories = {
    anime: { years: [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2012, 2011, 2010, 2009, 2008, 2006, 2004, 2003, 2001, 1995, 1988], hasPlanned: true },
};

const homeItemsPerPage = 10;
const categoryItemsPerPage = 20;
const defaultCategory = 'anime';
let currentPage = 1;

let allData = [];
let filteredData = [];

// Фоны
const backgrounds = {
    anime: [
        'assets/img/breadcrumb/anime/1.jpeg',
        'assets/img/breadcrumb/anime/2.jpg',
        'assets/img/breadcrumb/anime/3.png',
        'assets/img/breadcrumb/anime/4.jpg'
    ]
};

(function ($) {
    "use strict";
    $(window).on("load", function () {
        $(".preloader").fadeOut("slow");
    });

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

// === ОПРЕДЕЛЕНИЕ СТРАНИЦЫ И КАТЕГОРИИ ===
function getPageContext() {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view'); // 'watched' или 'planned'
    const categoryParam = params.get('category');

    let pageType = 'home';
    let category = defaultCategory;
    let isPlanned = false;

    if (!path.includes('index.html')) {
        pageType = 'category';
    }

    // Переопределяем через GET
    if (categoryParam && categories[categoryParam]) {
        category = categoryParam;
    }

    if (view === 'planned') isPlanned = true;
    if (view === 'watched') isPlanned = false;

    return { pageType, category, isPlanned };
}

// === ЗАГРУЗКА ДАННЫХ ===
async function loadData({ category, isPlanned, pageType }) {
    allData = [];

    if (!categories[category]) return;

    const { years, hasPlanned } = categories[category];

    // Загрузка просмотренного
    if (!isPlanned) {
        for (const year of years) {
            try {
                const res = await fetch(`data/${category}/${year}.json`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) allData = allData.concat(data);
                }
            } catch (e) { console.warn(`Failed to load ${year}.json for ${category}`); }
        }
    }

    // Загрузка запланированного
    if (hasPlanned && (isPlanned || pageType === 'home')) {
        try {
            const res = await fetch(`data/${category}/planned.json`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    data.forEach(item => item.isPlanned = true);
                    allData = allData.concat(data);
                }
            }
        } catch (e) { console.warn(`Failed to load planned.json for ${category}`); }
    }

    filteredData = allData;

    if (pageType === 'home') {
        const movies = allData.filter(i => i.movie == 1 && !i.isPlanned);
        const series = allData.filter(i => i.movie == 0 && !i.isPlanned);
        renderGallery(movies, 'movie', 'home');
        renderGallery(series, 'series', 'home');
        initMovieCarousel('movie');
        initMovieCarousel('series');
    } else {
        renderGallery(filteredData, 'series', 'category');
        renderPagination(filteredData);
    }
}

// === РЕНДЕР И ПАГИНАЦИЯ ===
function renderGallery(dataList, galleryType, pageType) {
    const gallery = document.getElementById(galleryType + '-gallery');
    if (!gallery) return;
    gallery.innerHTML = '';

    if (!dataList.length) {
        gallery.innerHTML = '<div class="no-results">Ничего не найдено</div>';
        return;
    }

    const paginated = pageType === 'home'
        ? shuffleArray(dataList).slice(0, homeItemsPerPage)
        : dataList.slice((currentPage - 1) * categoryItemsPerPage, currentPage * categoryItemsPerPage);

    paginated.forEach(item => {
        const card = document.createElement('div');
        const eps = (item.series || 0) >= 1 ? `<span class="movie-episode">EPS<small>${item.series}</small></span>` : '';

        card.innerHTML = `
            ${eps}
            <div class="movie-img">
                <img src="${item.img}" alt="${item.name}">
                <a href="#" class="movie-play"><i class="icon-play-3"></i></a>
            </div>
            <div class="movie-content">
                <h6 class="movie-title"><a href="#">${item.name}${status}</a></h6>
                <div class="movie-info">
                    <span class="movie-time">${item.time || 'N/A'} мин</span>
                </div>
            </div>`;

        card.className = pageType === 'home' ? 'movie-item' : 'col-6 col-md-4 col-lg-3 col-xl';
        if (pageType !== 'home') card.innerHTML = '<div class="movie-item">' + card.innerHTML + '</div>';

        card.addEventListener('click', e => {
            if (e.target.closest('a') && !e.target.closest('.movie-play')) return;
            showModal(item);
        });

        gallery.appendChild(card);
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

// === ПАГИНАЦИЯ, ФИЛЬТРЫ, МОДАЛКА ===
function renderPagination(animeList) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // Очистка пагинации

    const totalPages = Math.ceil(animeList.length / categoryItemsPerPage);

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

// Фильтры
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
            (typeFilter === 'series' && anime.movie == 0) ||
            (typeFilter === 'movie' && anime.movie == 1);

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

    renderGallery(filteredAnimeSeries, 'series', 'category');
    renderPagination(filteredAnimeSeries);
}

// Перемешивание масива алгоритмом Фишера-Йейтса
function shuffleArray(array) {
    const shuffled = [...array]; // создаем копию массива
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // меняем местами
    }
    return shuffled;
}

function safeAddEvent(id, event, handler) {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, handler);
}

// === ЗАПУСК ===
document.addEventListener('DOMContentLoaded', () => {
    const ctx = getPageContext();
    const { pageType, category, isPlanned } = ctx;

    // Фон
    if (backgrounds[category]) {
        const img = backgrounds[category][Math.floor(Math.random() * backgrounds[category].length)];
        document.querySelector('.site-breadcrumb')?.style?.setProperty('background-image', `url(${img})`);
    }

    // Годы в фильтр
    const yearFilter = document.getElementById('year-filter');
    if (yearFilter && pageType === 'category' && !isPlanned) {
        categories[category].years.forEach(y => {
            const opt = document.createElement('option');
            opt.value = y; opt.text = y;
            yearFilter.appendChild(opt);
        });
    }
    if ($(".select").length) {
        $(".select").niceSelect();
    };

    loadData(ctx);

    // Фильтры
    if (pageType !== 'home') {
        // Добавление обработчиков событий
        safeAddEvent('search-input', 'input', applyFilters);
        safeAddEvent('type-filter', 'change', applyFilters);
        safeAddEvent('year-filter', 'change', applyFilters);
        safeAddEvent('sort-filter', 'change', applyFilters);
        safeAddEvent('apply-filter', 'click', applyFilters);

        // Обновляем заголовок
        const titleEl = document.getElementById('page-title');
        if (titleEl && pageType !== 'planned') {
            titleEl.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        }
        const breadcrumbTitleEl = document.getElementById('breadcrumb-title');
        if (breadcrumbTitleEl && pageType !== 'planned') {
            breadcrumbTitleEl.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        }
    }
});