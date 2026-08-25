// === APP SETTINGS AND STATE ===

// How many cards to show in the carousels on the home page.
const homeItemsPerPage = 10;
// How many cards to show per catalog page (watched.html).
const categoryItemsPerPage = 20;
// Default category used when the URL is missing or has an invalid one.
const defaultCategory = 'anime';
// Prefix for cached JSON data keys in localStorage.
const CACHE_PREFIX = 'myshelf_cache_';
// Cache lifetime: 7 days in milliseconds.
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
// Fallback cover used when a record has no valid image.
const FALLBACK_COVER = 'assets/img/logo/logo.png';

// Header (breadcrumb) background images. Key is the category, value is a list
// of paths one of which is picked at random; `default` is the shared set.
const backgrounds = {
    default: [
        'assets/img/breadcrumb/anime/1.jpeg',
        'assets/img/breadcrumb/anime/2.jpg',
        'assets/img/breadcrumb/anime/3.png',
        'assets/img/breadcrumb/anime/4.jpg'
    ]
};

// Current pagination page in the catalog.
let currentPage = 1;
// All loaded and normalized records for the current category.
let allData = [];
// Records after search/filters/sorting are applied (catalog).
let filteredData = [];
// Page context: page type, category, view (watched/planned).
let currentContext = null;

// Localization (i18n) state. Populated in loadTranslations().
let i18nDict = {};          // dictionary of the active language
let i18nFallbackDict = {};  // dictionary of the default (fallback) language
let availableLanguages = [];// list of available languages from config.json
let defaultLang = 'ru';     // default / fallback language
let currentLang = 'ru';     // active UI language

// === CATEGORY CONFIGURATION ===
const categories = {
    anime: {years: [2026], hasPlanned: true},
    cartoon: {years: [2026], hasPlanned: true},
    series: {years: [2026], hasPlanned: true},
    movie: {years: [2026], hasPlanned: true},
    manga: {years: [2026], hasPlanned: true},
    book: {years: [2026], hasPlanned: true},
    other: {years: [2026], hasPlanned: true}
};

// Valid content types. Display names come from the translations (mediaType.*).
const MEDIA_TYPES = ['movie', 'series', 'anime', 'cartoon', 'manga', 'book', 'other'];

function isValidMediaType(type) {
    return MEDIA_TYPES.includes(type);
}

function getDefaultMediaTypeByCategory(category) {
    return isValidMediaType(category) ? category : 'other';
}

// === LOCALIZATION (i18n) ===
// Each language is described by its own file: assets/i18n/<code>.json.
// The language list and the default language live in assets/i18n/config.json.
const I18N_DIR = 'assets/i18n';
const I18N_CONFIG_PATH = `${I18N_DIR}/config.json`;
const I18N_STORAGE_KEY = 'myshelf_lang';

async function fetchI18nJson(path) {
    try {
        const res = await fetch(`${path}?t=${Date.now()}`);
        if (res.ok) {
            return await res.json();
        }
    } catch (e) {
        console.warn(`Failed to load ${path}`, e);
    }
    return null;
}

async function loadTranslations() {
    const config = (await fetchI18nJson(I18N_CONFIG_PATH)) || {};
    availableLanguages = Array.isArray(config.languages) ? config.languages : [];
    defaultLang = config.default || availableLanguages[0]?.code || 'ru';

    currentLang = resolveLanguage();

    // Always load the default language as the fallback dictionary.
    i18nFallbackDict = (await fetchI18nJson(`${I18N_DIR}/${defaultLang}.json`)) || {};
    i18nDict = currentLang === defaultLang
        ? i18nFallbackDict
        : ((await fetchI18nJson(`${I18N_DIR}/${currentLang}.json`)) || i18nFallbackDict);

    document.documentElement.setAttribute('lang', currentLang);
}

function resolveLanguage() {
    const codes = availableLanguages.map((lang) => lang.code);

    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('lang');
    if (fromUrl && codes.includes(fromUrl)) {
        try {
            localStorage.setItem(I18N_STORAGE_KEY, fromUrl);
        } catch (e) {
            console.warn('Failed to save language', e);
        }
        return fromUrl;
    }

    const stored = localStorage.getItem(I18N_STORAGE_KEY);
    if (stored && codes.includes(stored)) {
        return stored;
    }

    return codes.includes(defaultLang) ? defaultLang : (codes[0] || defaultLang);
}

// Translate by key. params are substituted into "{name}"-style placeholders.
function t(key, params) {
    let template = key in i18nDict
        ? i18nDict[key]
        : key in i18nFallbackDict
            ? i18nFallbackDict[key]
            : key;

    if (params) {
        template = template.replace(/\{(\w+)\}/g, (match, name) =>
            params[name] !== undefined ? String(params[name]) : match);
    }

    return template;
}

// Apply static translations to the markup via data attributes.
function applyStaticTranslations(root = document) {
    root.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(el.getAttribute('data-i18n'));
    });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    root.querySelectorAll('[data-i18n-content]').forEach((el) => {
        el.setAttribute('content', t(el.getAttribute('data-i18n-content')));
    });
    root.querySelectorAll('[data-i18n-alt]').forEach((el) => {
        el.setAttribute('alt', t(el.getAttribute('data-i18n-alt')));
    });
}

function buildLanguageSwitch() {
    const containers = document.querySelectorAll('.language-switch');
    if (!containers.length || !availableLanguages.length) {
        return;
    }

    containers.forEach((container) => {
        container.setAttribute('aria-label', t('language.label'));
        container.innerHTML = availableLanguages
            .map((lang) => {
                const activeClass = lang.code === currentLang ? ' active' : '';
                const label = escapeHtml(lang.label || lang.code.toUpperCase());
                return `<button type="button" class="language-btn${activeClass}" data-lang="${escapeHtml(lang.code)}" title="${label}">${escapeHtml(lang.code.toUpperCase())}</button>`;
            })
            .join('');

        container.querySelectorAll('.language-btn').forEach((btn) => {
            btn.addEventListener('click', () => setLanguage(btn.getAttribute('data-lang')));
        });
    });
}

function setLanguage(code) {
    if (!code || code === currentLang) {
        return;
    }

    try {
        localStorage.setItem(I18N_STORAGE_KEY, code);
    } catch (e) {
        console.warn('Failed to save language', e);
    }

    // Re-render the whole UI in the new language via a page reload.
    const url = new URL(window.location.href);
    url.searchParams.delete('lang');
    window.location.href = url.toString();
}

(function ($) {
    'use strict';

    $(window).on('load', function () {
        $('.preloader').fadeOut('slow');
    });

    $(window).scroll(function () {
        if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
            $('#scroll-top').addClass('active');
        } else {
            $('#scroll-top').removeClass('active');
        }
    });

    $('#scroll-top').on('click', function () {
        $('html, body').animate({ scrollTop: 0 }, 600);
        return false;
    });

    $(window).scroll(function () {
        if ($(this).scrollTop() > 50) {
            $('.navbar').addClass('fixed-top');
        } else {
            $('.navbar').removeClass('fixed-top');
        }
    });

    $(window).on('load', function () {
        if ($('.filter-box').children().length > 0) {
            $('.filter-box').isotope({ itemSelector: '.filter-item', masonry: { columnWidth: 1 } });
            $('.filter-btn').on('click', 'li', function () {
                const filterValue = $(this).attr('data-filter');
                $('.filter-box').isotope({ filter: filterValue });
            });
            $('.filter-btn li').each(function () {
                $(this).on('click', function () {
                    $(this).siblings('li.active').removeClass('active');
                    $(this).addClass('active');
                });
            });
        }
    });

    const dateEl = document.getElementById('date');
    if (dateEl) {
        dateEl.textContent = new Date().getFullYear();
    }

    const getMode = localStorage.getItem('theme');
    if (getMode === 'dark') {
        $('body').addClass('theme-mode-variables');
        $('.light-btn').css('display', 'none');
        $('.dark-btn').css('display', 'block');
    }

    $('.theme-mode-control').on('click', function () {
        $('body').toggleClass('theme-mode-variables');
        const darkEnabled = $('body').hasClass('theme-mode-variables');
        localStorage.setItem('theme', darkEnabled ? 'dark' : 'light');

        if (darkEnabled) {
            $('.light-btn').css('display', 'none');
            $('.dark-btn').css('display', 'block');
        } else {
            $('.light-btn').css('display', 'block');
            $('.dark-btn').css('display', 'none');
        }

        logoMode();
    });

    $(window).on('load', function () {
        logoMode();
    });

    function logoMode() {
        if (document.querySelector('.theme-mode-variables')) {
            $('.logo-light-mode').css('display', 'block');
            $('.logo-dark-mode').css('display', 'none');
        } else {
            $('.logo-light-mode').css('display', 'none');
            $('.logo-dark-mode').css('display', 'block');
        }
    }
})(jQuery);

function setCache(key, data) {
    const cacheData = {
        data,
        timestamp: Date.now()
    };

    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData));
    } catch (e) {
        console.warn('Failed to save cache', e);
        clearOldCache();
    }
}

function getCache(key) {
    const item = localStorage.getItem(CACHE_PREFIX + key);
    if (!item) {
        return null;
    }

    try {
        const cacheData = JSON.parse(item);
        if (Date.now() - cacheData.timestamp > CACHE_TTL) {
            localStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return cacheData.data;
    } catch (e) {
        console.warn('Cache read error', e);
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
    }
}

function clearOldCache() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(CACHE_PREFIX)) {
            continue;
        }

        const item = localStorage.getItem(key);
        try {
            const cacheData = JSON.parse(item);
            if (Date.now() - cacheData.timestamp > CACHE_TTL) {
                localStorage.removeItem(key);
                i--;
            }
        } catch (e) {
            localStorage.removeItem(key);
            i--;
        }
    }
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, (char) => {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return map[char];
    });
}

function sanitizeImageUrl(url) {
    const raw = String(url || '').trim();
    if (!raw) {
        return FALLBACK_COVER;
    }

    const isAllowed = /^(https?:\/\/|data:image\/|\.?\.?\/|\/|[a-zA-Z0-9_-]+\/)/i.test(raw);
    return isAllowed ? raw : FALLBACK_COVER;
}

function parseDateValue(value) {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(value) {
    const date = parseDateValue(value);
    if (!date) {
        return '';
    }
    return date.toISOString().slice(0, 10);
}

function getCategoryLabel(category) {
    const key = categories[category] ? category : defaultCategory;
    return t(`category.${key}`);
}

function getMediaTypeLabel(mediaType) {
    return t(`mediaType.${isValidMediaType(mediaType) ? mediaType : 'other'}`);
}

function inferMediaType(item, category) {
    const explicit = String(item.mediaType || '').trim();
    if (explicit && isValidMediaType(explicit)) {
        return explicit;
    }

    if (item.movie === 1 || item.movie === '1') {
        return 'movie';
    }

    if (item.movie === 0 || item.movie === '0') {
        return category === 'anime' ? 'series' : getDefaultMediaTypeByCategory(category);
    }

    return getDefaultMediaTypeByCategory(category);
}

function normalizeItem(item, category, isPlanned, source) {
    const normalizedCategory = categories[item.category] ? item.category : category;
    const mediaType = inferMediaType(item, normalizedCategory);

    const parsedSeries = Number(item.series);
    const hasSeries = Number.isFinite(parsedSeries) && parsedSeries > 0;

    return {
        ...item,
        id: item.id || `custom_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
        name: String(item.name || item.originalName || '').trim(),
        originalName: String(item.originalName || '').trim(),
        description: String(item.description || '').trim(),
        date: toIsoDate(item.date) || '',
        img: sanitizeImageUrl(item.img),
        time: String(item.time || '').trim(),
        series: hasSeries ? parsedSeries : null,
        category: normalizedCategory,
        mediaType,
        isPlanned: Boolean(item.isPlanned ?? isPlanned),
        source: item.source || source || 'remote',
        movie: mediaType === 'movie' ? '1' : mediaType === 'series' ? '0' : item.movie
    };
}

function sortByDateDescThenName(list) {
    return [...list].sort((a, b) => {
        const dateA = parseDateValue(a.date);
        const dateB = parseDateValue(b.date);

        if (dateA && dateB) {
            return dateB - dateA;
        }
        if (dateA && !dateB) {
            return -1;
        }
        if (!dateA && dateB) {
            return 1;
        }

        return String(a.name || '').localeCompare(String(b.name || ''), currentLang);
    });
}

function getPageContext() {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);

    const pageType = path.endsWith('watched.html') ? 'category' : 'home';
    const categoryParam = params.get('category');
    const view = params.get('view');

    const category = categories[categoryParam] ? categoryParam : defaultCategory;
    const isPlanned = view === 'planned';

    return { pageType, category, isPlanned };
}

async function loadWatchedData(category) {
    const watchedItems = [];
    const categoryConfig = categories[category];

    for (const year of categoryConfig.years) {
        const cacheKey = `${category}_${year}`;
        let data = getCache(cacheKey);

        if (!data) {
            try {
                const res = await fetch(`data/${category}/${year}.json?t=${Date.now()}`);
                if (res.ok) {
                    data = await res.json();
                    if (Array.isArray(data)) {
                        setCache(cacheKey, data);
                    }
                }
            } catch (e) {
                console.warn(`Failed to load data/${category}/${year}.json`, e);
            }
        }

        if (Array.isArray(data)) {
            data.forEach((item) => watchedItems.push(normalizeItem(item, category, false, 'remote')));
        }
    }

    return watchedItems;
}

async function loadPlannedData(category) {
    const categoryConfig = categories[category];
    if (!categoryConfig.hasPlanned) {
        return [];
    }

    const cacheKey = `${category}_planned`;
    let data = getCache(cacheKey);

    if (!data) {
        try {
            const res = await fetch(`data/${category}/planned.json?t=${Date.now()}`);
            if (res.ok) {
                data = await res.json();
                if (Array.isArray(data)) {
                    setCache(cacheKey, data);
                }
            } else {
                data = [];
                setCache(cacheKey, data);
            }
        } catch (e) {
            console.warn(`Failed to load data/${category}/planned.json`, e);
        }
    }

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map((item) => normalizeItem(item, category, true, 'remote'));
}

async function loadData({ category, isPlanned, pageType }) {
    allData = [];

    if (!categories[category]) {
        return;
    }

    const shouldLoadWatched = pageType === 'home' || !isPlanned;
    const shouldLoadPlanned = categories[category].hasPlanned && (pageType === 'home' || isPlanned);

    if (shouldLoadWatched) {
        allData = allData.concat(await loadWatchedData(category));
    }

    if (shouldLoadPlanned) {
        allData = allData.concat(await loadPlannedData(category));
    }

    allData = sortByDateDescThenName(allData);

    if (pageType === 'home') {
        const watchedItems = allData.filter((item) => !item.isPlanned);
        const plannedItems = allData.filter((item) => item.isPlanned);

        renderGallery(watchedItems, 'movie', 'home');
        renderGallery(plannedItems, 'series', 'home');

        initMovieCarousel('movie');
        initMovieCarousel('series');
    } else {
        filteredData = [...allData];
        renderGallery(filteredData, 'series', 'category');
        renderPagination(filteredData);
    }
}

function getItemMeta(item) {
    const categoryLabel = getCategoryLabel(item.category);
    const mediaTypeLabel = getMediaTypeLabel(item.mediaType);

    if (item.category === 'anime' && item.mediaType === 'movie') {
        return t('meta.animeMovie');
    }
    if (item.category === 'anime' && item.mediaType === 'series') {
        return t('meta.animeSeries');
    }

    if (mediaTypeLabel === categoryLabel) {
        return categoryLabel;
    }

    return `${categoryLabel} • ${mediaTypeLabel}`;
}

function getDurationText(item) {
    if (item.time) {
        return item.time;
    }

    if (item.mediaType === 'book' || item.mediaType === 'manga') {
        return t('duration.noVolume');
    }

    return t('duration.noDuration');
}

function renderGallery(dataList, galleryType, pageType) {
    const gallery = document.getElementById(`${galleryType}-gallery`);
    if (!gallery) {
        return;
    }

    gallery.innerHTML = '';

    if (!dataList.length) {
        gallery.innerHTML = `<div class="no-results">${escapeHtml(t('gallery.empty'))}</div>`;
        return;
    }

    const paginated = pageType === 'home'
        ? dataList.slice(0, homeItemsPerPage)
        : dataList.slice((currentPage - 1) * categoryItemsPerPage, currentPage * categoryItemsPerPage);

    paginated.forEach((item) => {
        const card = document.createElement('div');

        const statusBadge = item.isPlanned
            ? `<span class="movie-quality shelf-badge planned">${escapeHtml(t('badge.planned'))}</span>`
            : `<span class="movie-quality shelf-badge watched">${escapeHtml(t('badge.watched'))}</span>`;

        const countBadge = item.series
            ? `<span class="movie-episode">#<small>${escapeHtml(item.series)}</small></span>`
            : '';

        const imageUrl = sanitizeImageUrl(item.img);
        const title = escapeHtml(item.name || t('common.untitled'));
        const meta = escapeHtml(getItemMeta(item));
        const duration = escapeHtml(getDurationText(item));

        const cardHtml = `
            ${statusBadge}
            ${countBadge}
            <div class="movie-img">
                <img src="${imageUrl}" alt="${title}">
                <a class="movie-play"><i class="icon-play-3"></i></a>
            </div>
            <div class="movie-content">
                <h6 class="movie-title"><span class="title-link">${title}</span></h6>
                <div class="movie-info">
                    <span class="movie-season">${meta}</span>
                </div>
                <div class="movie-info">
                    <span class="movie-time">${duration}</span>
                </div>
            </div>`;

        if (pageType === 'home') {
            card.className = 'movie-item';
            card.innerHTML = cardHtml;
        } else {
            card.className = 'col-6 col-md-4 col-lg-3 col-xl-2';
            card.innerHTML = `<div class="movie-item">${cardHtml}</div>`;
        }

        card.addEventListener('click', () => {
            showModal(item);
        });

        gallery.appendChild(card);
    });
}

function buildCategoryMenuLinks(context) {
    const targetPage = context.pageType === 'home' ? 'index.html' : 'watched.html';
    const viewSuffix = context.pageType === 'home'
        ? ''
        : `&view=${context.isPlanned ? 'planned' : 'watched'}`;

    return Object.keys(categories)
        .map((key) => {
            const activeClass = key === context.category ? ' active' : '';
            const currentAttr = key === context.category ? ' aria-current="page"' : '';
            return `<li><a class="dropdown-item${activeClass}" href="${targetPage}?category=${key}${viewSuffix}"${currentAttr}>${escapeHtml(getCategoryLabel(key))}</a></li>`;
        })
        .join('');
}

function buildViewSwitchLinks(context) {
    const hasPlanned = Boolean(categories[context.category]?.hasPlanned);
    const watchedActive = context.pageType === 'category' && !context.isPlanned ? ' active' : '';
    const plannedActive = context.pageType === 'category' && context.isPlanned ? ' active' : '';

    const watchedCurrent = context.pageType === 'category' && !context.isPlanned
        ? ' aria-current="page"'
        : '';
    const plannedCurrent = context.pageType === 'category' && context.isPlanned
        ? ' aria-current="page"'
        : '';

    const plannedDisabledClass = hasPlanned ? '' : ' is-disabled';
    const plannedHref = hasPlanned
        ? `watched.html?category=${context.category}&view=planned`
        : '#';
    const plannedAriaDisabled = hasPlanned ? 'false' : 'true';

    return `
        <a class="nav-view-link${watchedActive}" href="watched.html?category=${context.category}&view=watched"${watchedCurrent}>${escapeHtml(t('view.watched'))}</a>
        <a class="nav-view-link${plannedActive}${plannedDisabledClass}" href="${plannedHref}" aria-disabled="${plannedAriaDisabled}"${plannedCurrent}>${escapeHtml(t('view.planned'))}</a>
    `;
}

function buildHomeCategorySwitch(currentCategory) {
    const switchEl = document.getElementById('home-category-switch');
    if (!switchEl) {
        return;
    }

    switchEl.innerHTML = Object.keys(categories)
        .map((key) => {
            const isActive = key === currentCategory;
            const activeClass = isActive ? ' active' : '';
            const currentAttr = isActive ? ' aria-current="page"' : '';
            return `<a class="home-category-chip${activeClass}" href="index.html?category=${key}"${currentAttr}>${escapeHtml(getCategoryLabel(key))}</a>`;
        })
        .join('');
}

function updateHomeStats(context) {
    if (context.pageType !== 'home') {
        return;
    }

    const watchedCount = allData.filter((item) => !item.isPlanned).length;
    const plannedCount = allData.filter((item) => item.isPlanned).length;
    const totalCount = watchedCount + plannedCount;

    const totalEl = document.getElementById('home-stat-total');
    const watchedEl = document.getElementById('home-stat-watched');
    const plannedEl = document.getElementById('home-stat-planned');

    if (totalEl) {
        totalEl.textContent = String(totalCount);
    }
    if (watchedEl) {
        watchedEl.textContent = String(watchedCount);
    }
    if (plannedEl) {
        plannedEl.textContent = String(plannedCount);
    }
}

function headerMenu(context) {
    const menuContainer = document.getElementById('category-menu');
    if (!menuContainer) {
        return;
    }

    const isHome = context.pageType === 'home';

    menuContainer.innerHTML = `
        <li class="nav-item">
            <a class="nav-link${isHome ? ' active' : ''}" href="index.html?category=${context.category}"${isHome ? ' aria-current="page"' : ''}>${escapeHtml(t('nav.home'))}</a>
        </li>
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">${escapeHtml(t('nav.categories'))}</a>
            <ul class="dropdown-menu fade-down">
                ${buildCategoryMenuLinks(context)}
            </ul>
        </li>
        <li class="nav-item nav-view-switch">
            ${buildViewSwitchLinks(context)}
        </li>
    `;

    menuContainer.querySelectorAll('a[aria-disabled="true"]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
        });
    });
}

function initMovieCarousel(type) {
    if (typeof jQuery === 'undefined' || typeof jQuery().owlCarousel !== 'function') {
        return;
    }

    const $gallery = jQuery(`#${type}-gallery`);
    if (!$gallery.length) {
        return;
    }

    if ($gallery.hasClass('owl-loaded') || $gallery.data('owl.carousel')) {
        try {
            $gallery.trigger('destroy.owl.carousel');
            $gallery.find('.owl-stage-outer').children().unwrap();
            $gallery.removeClass('owl-loaded owl-hidden');
            $gallery.find('.owl-stage').children().unwrap();
        } catch (err) {
            console.warn('Failed to reset owlCarousel', err);
        }
    }

    $gallery.owlCarousel({
        loop: false,
        margin: 20,
        nav: true,
        dots: false,
        autoplay: false,
        navText: ["<i class='far fa-angle-left'></i>", "<i class='far fa-angle-right'></i>"],
        responsive: {
            0: { items: 2 },
            600: { items: 3 },
            1000: { items: 4 },
            1200: { items: 5 }
        }
    });
}

function renderPagination(items) {
    const pagination = document.getElementById('pagination');
    if (!pagination) {
        return;
    }

    pagination.innerHTML = '';

    const totalPages = Math.ceil(items.length / categoryItemsPerPage);
    if (totalPages <= 1) {
        return;
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const renderPage = (page) => {
        currentPage = page;
        renderGallery(items, 'series', 'category');
        renderPagination(items);
        scrollToTop();
    };

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = '<a class="page-link" href="#" aria-label="Previous"><span aria-hidden="true"><i class="fas fa-arrow-left"></i></span></a>';
    if (currentPage > 1) {
        prevLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            renderPage(currentPage - 1);
        });
    }
    pagination.appendChild(prevLi);

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
            e.preventDefault();
            renderPage(1);
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
            e.preventDefault();
            renderPage(i);
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
            e.preventDefault();
            renderPage(totalPages);
        });
        pagination.appendChild(lastPageLi);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = '<a class="page-link" href="#" aria-label="Next"><span aria-hidden="true"><i class="fas fa-arrow-right"></i></span></a>';
    if (currentPage < totalPages) {
        nextLi.querySelector('a').addEventListener('click', (e) => {
            e.preventDefault();
            renderPage(currentPage + 1);
        });
    }
    pagination.appendChild(nextLi);
}

function showModal(item) {
    const modalEl = document.getElementById('animeModal');
    if (!modalEl) {
        return;
    }

    const modal = new bootstrap.Modal(modalEl);
    const title = document.getElementById('modal-title');
    const cover = document.getElementById('modal-cover');
    const category = document.getElementById('modal-category');
    const mediaType = document.getElementById('modal-type');
    const date = document.getElementById('modal-date');
    const series = document.getElementById('modal-series');
    const time = document.getElementById('modal-time');
    const description = document.getElementById('modal-description');
    const backdrop = modalEl.querySelector('.image-backdrop');

    const image = sanitizeImageUrl(item.img);

    if (title) {
        title.textContent = item.name || t('common.untitled');
    }
    if (cover) {
        cover.src = image;
    }
    if (category) {
        category.textContent = getCategoryLabel(item.category);
    }
    if (mediaType) {
        mediaType.textContent = getMediaTypeLabel(item.mediaType);
    }
    if (date) {
        date.textContent = item.date || t('common.notSpecified');
    }
    if (series) {
        series.textContent = item.series || t('common.notSpecified');
    }
    if (time) {
        time.textContent = item.time || t('common.notSpecified');
    }
    if (description) {
        description.textContent = item.description || t('modal.noDescription');
    }
    if (backdrop) {
        backdrop.style.backgroundImage = `url(${image})`;
    }

    modal.show();
}

function applyFilters() {
    if (!currentContext || currentContext.pageType === 'home') {
        return;
    }

    const searchQuery = String(document.getElementById('search-input')?.value || '').toLowerCase();
    const typeFilter = document.getElementById('type-filter')?.value || 'any';
    const yearFilter = document.getElementById('year-filter')?.value || 'any';
    const sortFilter = document.getElementById('sort-filter')?.value || 'none';

    filteredData = allData.filter((item) => {
        const name = String(item.name || '').toLowerCase();
        const originalName = String(item.originalName || '').toLowerCase();

        const matchesSearch = !searchQuery || name.includes(searchQuery) || originalName.includes(searchQuery);
        const matchesType = typeFilter === 'any' || item.mediaType === typeFilter;

        const itemYear = getYearFromDate(item.date);
        const matchesYear = yearFilter === 'any' || itemYear === yearFilter;

        return matchesSearch && matchesType && matchesYear;
    });

    if (sortFilter !== 'none') {
        filteredData.sort((a, b) => {
            if (sortFilter === 'date-desc') {
                return (parseDateValue(b.date)?.getTime() || 0) - (parseDateValue(a.date)?.getTime() || 0);
            }
            if (sortFilter === 'date-asc') {
                return (parseDateValue(a.date)?.getTime() || 0) - (parseDateValue(b.date)?.getTime() || 0);
            }
            if (sortFilter === 'name-asc') {
                return String(a.name || '').localeCompare(String(b.name || ''), currentLang);
            }
            if (sortFilter === 'name-desc') {
                return String(b.name || '').localeCompare(String(a.name || ''), currentLang);
            }
            return 0;
        });
    }

    currentPage = 1;
    renderGallery(filteredData, 'series', 'category');
    renderPagination(filteredData);
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function safeAddEvent(id, event, handler) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener(event, handler);
    }
}

function getYearFromDate(dateValue) {
    const date = parseDateValue(dateValue);
    return date ? String(date.getFullYear()) : '';
}

function populateTypeFilter() {
    const typeFilter = document.getElementById('type-filter');
    if (!typeFilter) {
        return;
    }

    const currentValue = typeFilter.value || 'any';
    const mediaTypes = [...new Set(allData
        .map((item) => String(item.mediaType || '').trim())
        .filter((type) => Boolean(type) && isValidMediaType(type)))
    ].sort((a, b) => getMediaTypeLabel(a).localeCompare(getMediaTypeLabel(b), currentLang));

    typeFilter.innerHTML = `<option value="any">${escapeHtml(t('filter.type'))}</option>`;

    mediaTypes.forEach((type) => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = getMediaTypeLabel(type);
        typeFilter.appendChild(option);
    });

    if (currentValue === 'any' || mediaTypes.includes(currentValue)) {
        typeFilter.value = currentValue;
    }

    refreshNiceSelect();
}

function populateYearFilter() {
    const yearFilter = document.getElementById('year-filter');
    if (!yearFilter) {
        return;
    }

    const currentValue = yearFilter.value || 'any';
    const years = [...new Set(allData.map((item) => getYearFromDate(item.date)).filter(Boolean))]
        .sort((a, b) => Number(b) - Number(a));

    yearFilter.innerHTML = `<option value="any">${escapeHtml(t('filter.year'))}</option>`;
    years.forEach((year) => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });

    if (years.includes(currentValue)) {
        yearFilter.value = currentValue;
    }

    refreshNiceSelect();
}

function refreshNiceSelect() {
    if (typeof jQuery === 'undefined' || typeof jQuery.fn.niceSelect !== 'function') {
        return;
    }

    jQuery('.select').each(function () {
        const $select = jQuery(this);
        if ($select.next('.nice-select').length) {
            $select.niceSelect('update');
        } else {
            $select.niceSelect();
        }
    });
}

function updateHomeContent(context) {
    if (context.pageType !== 'home') {
        return;
    }

    const label = getCategoryLabel(context.category);
    const hasPlanned = Boolean(categories[context.category]?.hasPlanned);

    const overviewTitle = document.getElementById('home-overview-title');
    const overviewText = document.getElementById('home-overview-text');
    const watchedTitle = document.getElementById('home-watched-title');
    const plannedTitle = document.getElementById('home-planned-title');
    const watchedLink = document.getElementById('home-watched-link');
    const plannedLink = document.getElementById('home-planned-link');
    const plannedSection = document.getElementById('home-planned-section');

    if (overviewTitle) {
        overviewTitle.textContent = t('home.overview.title', { label });
    }
    if (overviewText) {
        overviewText.textContent = hasPlanned
            ? t('home.overview.textPlanned', { label })
            : t('home.overview.textNoPlanned', { label });
    }
    if (watchedTitle) {
        watchedTitle.textContent = t('home.watched.title', { label });
    }
    if (plannedTitle) {
        plannedTitle.textContent = hasPlanned
            ? t('home.planned.title', { label })
            : t('home.planned.noPlanTitle', { label });
    }
    if (watchedLink) {
        watchedLink.href = `watched.html?category=${context.category}&view=watched`;
    }
    if (plannedLink) {
        plannedLink.href = hasPlanned
            ? `watched.html?category=${context.category}&view=planned`
            : `watched.html?category=${context.category}&view=watched`;
        plannedLink.classList.toggle('is-disabled', !hasPlanned);
        plannedLink.setAttribute('aria-disabled', hasPlanned ? 'false' : 'true');
        plannedLink.title = hasPlanned
            ? t('home.planned.linkTitle')
            : t('home.planned.noPlanLinkTitle');
    }
    if (plannedSection) {
        plannedSection.classList.toggle('is-disabled', !hasPlanned);
    }

    buildHomeCategorySwitch(context.category);
}

function updateCategoryHeadings(context) {
    if (context.pageType !== 'category') {
        return;
    }

    const categoryLabel = getCategoryLabel(context.category);
    const viewLabel = context.isPlanned ? t('view.planned') : t('view.watched');
    const titleText = t('category.heading', { category: categoryLabel, view: viewLabel });

    const titleEl = document.getElementById('page-title');
    const breadcrumbTitleEl = document.getElementById('breadcrumb-title');
    const searchInput = document.getElementById('search-input');

    if (titleEl) {
        titleEl.textContent = titleText;
    }
    if (breadcrumbTitleEl) {
        breadcrumbTitleEl.textContent = titleText;
    }
    if (searchInput) {
        searchInput.placeholder = t('category.searchPlaceholder', { category: categoryLabel.toLowerCase() });
    }
}

// === STARTUP ===
document.addEventListener('DOMContentLoaded', async () => {
    await loadTranslations();
    applyStaticTranslations();
    buildLanguageSwitch();

    currentContext = getPageContext();

    headerMenu(currentContext);
    updateHomeContent(currentContext);
    updateCategoryHeadings(currentContext);

    const breadcrumb = document.querySelector('.site-breadcrumb');
    const categoryBackgrounds = backgrounds[currentContext.category] || backgrounds.default;
    if (breadcrumb && categoryBackgrounds.length) {
        const bg = categoryBackgrounds[Math.floor(Math.random() * categoryBackgrounds.length)];
        breadcrumb.style.setProperty('background-image', `url(${bg})`);
    }

    await loadData(currentContext);

    if (currentContext.pageType === 'home' && !categories[currentContext.category]?.hasPlanned) {
        const plannedGallery = document.getElementById('series-gallery');
        if (plannedGallery) {
            plannedGallery.innerHTML = `<div class="no-results">${escapeHtml(t('home.planned.empty'))}</div>`;
        }
    }

    updateHomeStats(currentContext);

    if (currentContext.pageType === 'category') {
        populateTypeFilter();
        populateYearFilter();

        safeAddEvent('search-input', 'input', applyFilters);
        safeAddEvent('type-filter', 'change', applyFilters);
        safeAddEvent('year-filter', 'change', applyFilters);
        safeAddEvent('sort-filter', 'change', applyFilters);
        safeAddEvent('apply-filter', 'click', applyFilters);

        applyFilters();
    }

    refreshNiceSelect();
});
