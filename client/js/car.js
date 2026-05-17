/**
 * TuningManual3000 - Car Page JavaScript
 * Логика страницы автомобиля: загрузка данных, модальные окна, применение деталей
 */

// API Base URL
const API_BASE = '/api';

// Состояние страницы
const state = {
    car: null,
    categories: [],
    partsByCategory: {},
    appliedParts: new Map(), // categoryId -> part
    selectedPart: null,
    currentCategorySlug: null
};

// DOM Elements
const elements = {
    loadingState: null,
    errorState: null,
    carContent: null,
    carTitle: null,
    carDescription: null,
    carSpecs: null,
    carImage: null,
    carPlaceholder: null,
    categoriesList: null,
    appliedPartsList: null,
    appliedPartsCount: null,
    noPartsMessage: null,

    // Modal
    modal: null,
    modalTitle: null,
    modalIcon: null,
    modalLoading: null,
    modalParts: null,
    partDetails: null,
    btnBackToList: null,
    btnFindMarket: null,
    btnApplyPart: null,
    modalClose: null
};

/**
 * Получить slug автомобиля из URL
 * @returns {string|null}
 */
function getCarSlugFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug');
}

/**
 * Загрузить данные автомобиля с API
 * @param {string} slug - Slug автомобиля
 * @returns {Promise<Object>}
 */
async function fetchCarData(slug) {
    const response = await fetch(`${API_BASE}/cars/${slug}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Автомобиль не найден');
    }

    return data.data;
}

/**
 * Загрузить все категории
 * @returns {Promise<Array>}
 */
async function fetchCategories() {
    const response = await fetch(`${API_BASE}/categories`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Ошибка загрузки категорий');
    }

    return data.data;
}

/**
 * Загрузить детали по категории и автомобилю
 * @param {string} categoryId - ID категории
 * @param {string} carId - ID автомобиля
 * @returns {Promise<Array>}
 */
async function fetchParts(categoryId, carId) {
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId);
    if (carId) params.append('carId', carId);

    const response = await fetch(`${API_BASE}/parts?${params}`);
    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Ошибка загрузки деталей');
    }

    return data.data;
}

/**
 * Отобразить информацию об автомобиле
 * @param {Object} carData - Данные автомобиля
 */
function renderCarInfo(carData) {
    const { car, partsByCategory } = carData;

    // Сохраняем в state
    state.car = car;
    state.partsByCategory = {};

    // Группируем детали
    partsByCategory.forEach(group => {
        if (group.category) {
            state.partsByCategory[group.category.id] = {
                category: group.category,
                parts: group.parts
            };
        }
    });

    // Заголовок
    elements.carTitle.textContent = car.fullName || `${car.brand} ${car.model} ${car.generation || ''}`;
    document.title = `${car.brand} ${car.model} - TuningManual3000`;

    // Описание
    elements.carDescription.textContent = car.description || '';

    // Характеристики
    const specsHTML = [];
    if (car.yearStart) {
        specsHTML.push(`
      <div class="car-info__spec">
        <span class="car-info__spec-label">Годы выпуска</span>
        <span class="car-info__spec-value">${car.yearStart}${car.yearEnd ? ` - ${car.yearEnd}` : ''}</span>
      </div>
    `);
    }
    if (car.brand) {
        specsHTML.push(`
      <div class="car-info__spec">
        <span class="car-info__spec-label">Марка</span>
        <span class="car-info__spec-value">${car.brand}</span>
      </div>
    `);
    }
    if (car.generation) {
        specsHTML.push(`
      <div class="car-info__spec">
        <span class="car-info__spec-label">Поколение</span>
        <span class="car-info__spec-value">${car.generation}</span>
      </div>
    `);
    }
    elements.carSpecs.innerHTML = specsHTML.join('');

    // Изображение
    if (car.mainImageUrl && !car.mainImageUrl.includes('placeholder')) {
        elements.carImage.src = car.mainImageUrl;
        elements.carImage.alt = `${car.brand} ${car.model}`;
        elements.carImage.classList.remove('hidden');
        elements.carPlaceholder.classList.add('hidden');
    }
}

/**
 * Отобразить категории с подсчётом деталей
 * @param {Array} categories - Список категорий
 */
function renderCategories(categories) {
    state.categories = categories;

    const html = categories.map(cat => {
        // Считаем детали в этой категории для текущего авто
        const group = state.partsByCategory[cat.id];
        const count = group ? group.parts.length : 0;

        return `
      <div class="category-item" data-category-id="${cat.id}" data-category-slug="${cat.slug}">
        <span class="category-item__icon">${cat.icon || '🔧'}</span>
        <span class="category-item__name">${cat.name}</span>
        <span class="category-item__count">${count}</span>
      </div>
    `;
    }).join('');

    elements.categoriesList.innerHTML = html;

    // Добавляем обработчики кликов
    elements.categoriesList.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', () => {
            const categoryId = item.dataset.categoryId;
            const categorySlug = item.dataset.categorySlug;
            openPartsModal(categoryId, categorySlug);
        });
    });
}

/**
 * Открыть модальное окно с деталями категории
 * @param {string} categoryId - ID категории
 * @param {string} categorySlug - Slug категории
 */
async function openPartsModal(categoryId, categorySlug) {
    state.currentCategorySlug = categorySlug;
    state.selectedPart = null;

    // Находим категорию
    const category = state.categories.find(c => c.id === categoryId);
    if (!category) return;

    // Обновляем заголовок модалки
    elements.modalTitle.textContent = category.name;
    elements.modalIcon.textContent = category.icon || '🔧';

    // Показываем модалку
    elements.modal.classList.add('modal-overlay--active');

    // Показываем загрузку
    elements.modalLoading.classList.remove('hidden');
    elements.modalParts.classList.add('hidden');
    elements.partDetails.classList.add('hidden');
    elements.btnBackToList.classList.add('hidden');
    elements.btnApplyPart.disabled = true;
    elements.btnFindMarket.disabled = true;

    // Активируем категорию в сайдбаре
    elements.categoriesList.querySelectorAll('.category-item').forEach(item => {
        item.classList.toggle('category-item--active', item.dataset.categoryId === categoryId);
    });

    try {
        // Загружаем детали (можно использовать кэш из state.partsByCategory)
        let parts;
        if (state.partsByCategory[categoryId]) {
            parts = state.partsByCategory[categoryId].parts;
        } else {
            parts = await fetchParts(categoryId, state.car._id);
        }

        renderPartsList(parts);

    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
        elements.modalParts.innerHTML = `
      <p style="text-align: center; color: var(--color-error);">
        ❌ Ошибка загрузки деталей
      </p>
    `;
        elements.modalLoading.classList.add('hidden');
        elements.modalParts.classList.remove('hidden');
    }
}

/**
 * Получить иконку категории по ID
 * @param {string} categoryId - ID категории
 * @returns {string} Иконка категории
 */
function getCategoryIcon(categoryId) {
    const category = state.categories.find(c => c.id === categoryId);
    return category ? category.icon : '🔧';
}

/**
 * Отобразить список деталей в модалке
 * @param {Array} parts - Массив деталей
 */
function renderPartsList(parts) {
    if (parts.length === 0) {
        elements.modalParts.innerHTML = `
      <p style="text-align: center; color: var(--color-text-muted);">
        😔 Нет доступных деталей в этой категории для данного автомобиля
      </p>
    `;
    } else {
        const html = parts.map(part => {
            const isApplied = state.appliedParts.has(part.categoryId);
            const appliedPart = state.appliedParts.get(part.categoryId);
            const isSelected = appliedPart && appliedPart.id === part.id;

            return `
        <div class="part-item ${isSelected ? 'part-item--selected' : ''}" data-part-id="${part.id}">
          <div class="part-item__image" style="display: flex; align-items: center; justify-content: center; font-size: 2rem;">
            ${part.categoryId ? getCategoryIcon(part.categoryId) : '🔧'}
          </div>
          <div class="part-item__content">
            <h4 class="part-item__name">${part.name}</h4>
            ${part.manufacturer ? `<p class="part-item__manufacturer">${part.manufacturer}</p>` : ''}
            <p class="part-item__description">${part.description || ''}</p>
          </div>
          ${part.price_approx ? `<div class="part-item__price">≈ ${part.price_approx}</div>` : ''}
        </div>
      `;
        }).join('');

        elements.modalParts.innerHTML = html;

        // Добавляем обработчики кликов на детали
        elements.modalParts.querySelectorAll('.part-item').forEach(item => {
            item.addEventListener('click', () => {
                const partId = item.dataset.partId;
                const part = parts.find(p => p.id === partId);
                if (part) {
                    selectPart(part);
                }
            });
        });
    }

    elements.modalLoading.classList.add('hidden');
    elements.modalParts.classList.remove('hidden');
}

/**
 * Выбрать деталь и показать подробности
 * @param {Object} part - Объект детали
 */
function selectPart(part) {
    state.selectedPart = part;

    // Обновляем заголовок
    document.getElementById('part-detail-name').textContent = part.name;
    document.getElementById('part-detail-manufacturer').textContent = part.manufacturer || '';
    document.getElementById('part-detail-description').textContent = part.description || '';

    // Характеристики
    const specsContainer = document.getElementById('part-detail-specs');
    if (part.specs && Object.keys(part.specs).length > 0) {
        const specsHTML = Object.entries(part.specs).map(([key, value]) => `
      <div class="part-specs__item">
        <span class="part-specs__label">${formatSpecKey(key)}</span>
        <span class="part-specs__value">${value}</span>
      </div>
    `).join('');
        specsContainer.innerHTML = specsHTML;
        specsContainer.classList.remove('hidden');
    } else {
        specsContainer.classList.add('hidden');
    }

    // Скрываем список, показываем детали
    elements.modalParts.classList.add('hidden');
    elements.partDetails.classList.remove('hidden');
    elements.btnBackToList.classList.remove('hidden');

    // Активируем кнопки
    elements.btnApplyPart.disabled = false;
    elements.btnFindMarket.disabled = !part.marketSearchQuery;
}

/**
 * Вернуться к списку деталей
 */
function backToPartsList() {
    state.selectedPart = null;
    elements.partDetails.classList.add('hidden');
    elements.modalParts.classList.remove('hidden');
    elements.btnBackToList.classList.add('hidden');
    elements.btnApplyPart.disabled = true;
    elements.btnFindMarket.disabled = true;
}

/**
 * Применить выбранную деталь
 */
function applySelectedPart() {
    if (!state.selectedPart) return;

    const categoryId = state.selectedPart.categoryId;
    state.appliedParts.set(categoryId, state.selectedPart);

    // Обновляем UI
    renderAppliedParts();

    // Закрываем модалку
    closeModal();

    // Показываем уведомление (можно добавить toast)
    console.log(`✅ Деталь "${state.selectedPart.name}" применена`);
}

/**
 * Открыть поиск на маркетплейсе
 */
function openMarketSearch() {
    if (!state.selectedPart || !state.selectedPart.marketSearchQuery) return;

    const query = encodeURIComponent(state.selectedPart.marketSearchQuery);
    const url = `https://www.avito.ru/all?q=${query}`;

    window.open(url, '_blank');
}

/**
 * Отобразить примененные детали
 */
function renderAppliedParts() {
    const count = state.appliedParts.size;
    elements.appliedPartsCount.textContent = `(${count})`;

    if (count === 0) {
        elements.noPartsMessage.classList.remove('hidden');
        elements.appliedPartsList.innerHTML = '';
        elements.appliedPartsList.appendChild(elements.noPartsMessage);

        // Скрываем статистику, если нет деталей
        const buildStatsEl = document.getElementById('build-stats');
        if (buildStatsEl) {
            buildStatsEl.classList.add('hidden');
        }
        return;
    }

    elements.noPartsMessage.classList.add('hidden');

    const html = Array.from(state.appliedParts.entries()).map(([categoryId, part]) => {
        const category = state.categories.find(c => c.id === categoryId);
        return `
      <div class="applied-part-tag">
        <span>${category?.icon || '🔧'}</span>
        <span>${part.name}</span>
        <button class="applied-part-tag__remove" data-category-id="${categoryId}" title="Удалить">×</button>
      </div>
    `;
    }).join('');

    elements.appliedPartsList.innerHTML = html;

    // Добавляем обработчики удаления
    elements.appliedPartsList.querySelectorAll('.applied-part-tag__remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const categoryId = btn.dataset.categoryId;
            state.appliedParts.delete(categoryId);
            renderAppliedParts();
        });
    });

    // Обновляем статистику сборки (графики и расчеты)
    if (window.tuningCharts) {
        window.tuningCharts.updateBuildStats(state.appliedParts, state.car.basePower || 220);
    }
}

/**
 * Закрыть модальное окно
 */
function closeModal() {
    elements.modal.classList.remove('modal-overlay--active');
    state.selectedPart = null;
    state.currentCategorySlug = null;

    // Снимаем активность с категорий
    elements.categoriesList.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('category-item--active');
    });
}

/**
 * Форматирование цены
 * @param {number} price - Цена
 * @returns {string}
 */
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0
    }).format(price);
}

/**
 * Форматирование ключа характеристики
 * @param {string} key - Ключ
 * @returns {string}
 */
function formatSpecKey(key) {
    const keyMap = {
        power: 'Мощность',
        torque: 'Крутящий момент',
        weight: 'Вес',
        displacement: 'Объём',
        type: 'Тип',
        material: 'Материал',
        maxPower: 'Макс. мощность',
        tuningPotential: 'Потенциал тюнинга',
        includes: 'Включает',
        adjustability: 'Регулировка',
        pistons: 'Поршни',
        discSize: 'Диаметр диска',
        ratio: 'Передаточное число',
        maxTorque: 'Макс. момент',
        disc: 'Диск',
        diameter: 'Диаметр',
        sound: 'Звук',
        bearing: 'Подшипник',
        compressorWheel: 'Колесо компрессора',
        heightAdjustable: 'Регулировка высоты',
        widening: 'Расширение',
        application: 'Применение'
    };

    return keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * Кэширование DOM элементов
 */
function cacheElements() {
    elements.loadingState = document.getElementById('loading-state');
    elements.errorState = document.getElementById('error-state');
    elements.carContent = document.getElementById('car-content');
    elements.carTitle = document.getElementById('car-title');
    elements.carDescription = document.getElementById('car-description');
    elements.carSpecs = document.getElementById('car-specs');
    elements.carImage = document.getElementById('car-image');
    elements.carPlaceholder = document.getElementById('car-placeholder');
    elements.categoriesList = document.getElementById('categories-list');
    elements.appliedPartsList = document.getElementById('applied-parts-list');
    elements.appliedPartsCount = document.getElementById('applied-parts-count');
    elements.noPartsMessage = document.getElementById('no-parts-message');

    // Modal
    elements.modal = document.getElementById('parts-modal');
    elements.modalTitle = document.getElementById('modal-title');
    elements.modalIcon = document.getElementById('modal-icon');
    elements.modalLoading = document.getElementById('modal-loading');
    elements.modalParts = document.getElementById('modal-parts');
    elements.partDetails = document.getElementById('part-details');
    elements.btnBackToList = document.getElementById('btn-back-to-list');
    elements.btnFindMarket = document.getElementById('btn-find-market');
    elements.btnApplyPart = document.getElementById('btn-apply-part');
    elements.modalClose = document.getElementById('modal-close');
}

/**
 * Привязка событий
 */
function bindEvents() {
    // Закрытие модалки
    elements.modalClose.addEventListener('click', closeModal);
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) closeModal();
    });

    // Кнопки модалки
    elements.btnBackToList.addEventListener('click', backToPartsList);
    elements.btnApplyPart.addEventListener('click', applySelectedPart);
    elements.btnFindMarket.addEventListener('click', openMarketSearch);

    // Закрытие по Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && elements.modal.classList.contains('modal-overlay--active')) {
            closeModal();
        }
    });

    // Хотспоты на изображении авто
    document.querySelectorAll('.car-viewer__hotspot').forEach(hotspot => {
        hotspot.addEventListener('click', () => {
            const categorySlug = hotspot.dataset.category;
            const category = state.categories.find(c => c.slug === categorySlug);
            if (category) {
                openPartsModal(category._id, categorySlug);
            }
        });
    });
}

/**
 * Инициализация страницы
 */
async function initCarPage() {
    cacheElements();

    const slug = getCarSlugFromUrl();

    if (!slug) {
        elements.loadingState.classList.add('hidden');
        elements.errorState.classList.remove('hidden');
        return;
    }

    try {
        // Загружаем данные параллельно
        const [carData, categories] = await Promise.all([
            fetchCarData(slug),
            fetchCategories()
        ]);

        // Отображаем данные
        renderCarInfo(carData);
        renderCategories(categories);

        // Показываем графики с базовыми данными
        if (window.tuningCharts && carData.car.basePower) {
            window.tuningCharts.updateBuildStats(new Map(), carData.car.basePower);
        }

        // Показываем контент
        elements.loadingState.classList.add('hidden');
        elements.carContent.classList.remove('hidden');

        // Привязываем события
        bindEvents();

    } catch (error) {
        console.error('Ошибка загрузки страницы автомобиля:', error);
        elements.loadingState.classList.add('hidden');
        elements.errorState.classList.remove('hidden');
    }
}

// Запуск при загрузке DOM
document.addEventListener('DOMContentLoaded', initCarPage);
