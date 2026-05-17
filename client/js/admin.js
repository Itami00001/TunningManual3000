/**
 * TuningManual3000 - Admin Page JavaScript
 * Улучшенная админ-панель с табами и таблицами
 */

// API Base URL
const API_BASE = '/api';

// Состояние
const state = {
    categories: [],
    cars: [],
    parts: [],
    kits: [],
    currentTab: 'dashboard'
};

// DOM Elements
const elements = {
    alertContainer: null,
    partsTableBody: null,
    carsTableBody: null,
    categoriesTableBody: null,
    kitsTableBody: null,
    partForm: null,
    partCategorySelect: null,
    compatibilitySelect: null,
    partsSearch: null,
    partsCategoryFilter: null
};

/**
 * Переключение табов
 */
function switchTab(tabName) {
    state.currentTab = tabName;
    
    // Обновляем навигацию
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.classList.remove('admin-nav-item--active');
        if (item.dataset.tab === tabName) {
            item.classList.add('admin-nav-item--active');
        }
    });
    
    // Обновляем контент
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('tab-content--active');
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
        activeTab.classList.add('tab-content--active');
    }
    
    // Загружаем данные для таба
    if (tabName === 'dashboard') {
        loadDashboardStats();
    } else if (tabName === 'parts') {
        loadPartsTable();
    } else if (tabName === 'cars') {
        loadCarsTable();
    } else if (tabName === 'categories') {
        loadCategoriesTable();
    } else if (tabName === 'kits') {
        loadKitsTable();
    }
}

/**
 * Загрузка статистики для дашборда
 */
async function loadDashboardStats() {
    try {
        const [carsRes, partsRes, categoriesRes, kitsRes] = await Promise.all([
            fetch(`${API_BASE}/cars`),
            fetch(`${API_BASE}/parts`),
            fetch(`${API_BASE}/categories`),
            fetch(`${API_BASE}/kits`)
        ]);
        
        const cars = await carsRes.json();
        const parts = await partsRes.json();
        const categories = await categoriesRes.json();
        const kits = await kitsRes.json();
        
        document.getElementById('stat-cars').textContent = cars.success ? cars.data.length : 0;
        document.getElementById('stat-parts').textContent = parts.success ? parts.data.length : 0;
        document.getElementById('stat-categories').textContent = categories.success ? categories.data.length : 0;
        document.getElementById('stat-kits').textContent = kits.success ? kits.data.length : 0;
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

/**
 * Загрузка таблицы деталей
 */
async function loadPartsTable() {
    try {
        const response = await fetch(`${API_BASE}/parts`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        state.parts = data.data;
        renderPartsTable(state.parts);
    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
        elements.partsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--color-error);">
                    Ошибка загрузки данных
                </td>
            </tr>
        `;
    }
}

/**
 * Рендер таблицы деталей
 */
function renderPartsTable(parts) {
    if (parts.length === 0) {
        elements.partsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--color-text-muted);">
                    Нет деталей
                </td>
            </tr>
        `;
        return;
    }
    
    const html = parts.map(part => {
        const category = state.categories.find(c => c.id === part.categoryId);
        return `
            <tr>
                <td><strong>${part.name}</strong></td>
                <td>${category ? `${category.icon} ${category.name}` : 'Без категории'}</td>
                <td>${part.manufacturer || '-'}</td>
                <td>${part.price_approx || '-'}</td>
                <td>
                    <span class="badge badge--success">Активен</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn--sm btn--primary" onclick="editPart('${part.id}')">✏️</button>
                        <button class="btn btn--sm" onclick="deletePart('${part.id}')" style="background: var(--color-error);">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    elements.partsTableBody.innerHTML = html;
}

/**
 * Загрузка таблицы автомобилей
 */
async function loadCarsTable() {
    try {
        const response = await fetch(`${API_BASE}/cars`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        state.cars = data.data;
        renderCarsTable(state.cars);
    } catch (error) {
        console.error('Ошибка загрузки автомобилей:', error);
        elements.carsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--color-error);">
                    Ошибка загрузки данных
                </td>
            </tr>
        `;
    }
}

/**
 * Рендер таблицы автомобилей
 */
function renderCarsTable(cars) {
    if (cars.length === 0) {
        elements.carsTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--color-text-muted);">
                    Нет автомобилей
                </td>
            </tr>
        `;
        return;
    }
    
    const html = cars.map(car => `
        <tr>
            <td><strong>${car.brand}</strong></td>
            <td>${car.model}</td>
            <td>${car.generation || '-'}</td>
            <td>${car.basePower || 0} л.с.</td>
            <td>
                <span class="badge badge--success">Активен</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn--sm btn--primary">✏️</button>
                    <button class="btn btn--sm" style="background: var(--color-error);">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    elements.carsTableBody.innerHTML = html;
}

/**
 * Загрузка таблицы категорий
 */
async function loadCategoriesTable() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        state.categories = data.data;
        renderCategoriesTable(state.categories);
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        elements.categoriesTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--color-error);">
                    Ошибка загрузки данных
                </td>
            </tr>
        `;
    }
}

/**
 * Рендер таблицы категорий
 */
function renderCategoriesTable(categories) {
    if (categories.length === 0) {
        elements.categoriesTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: var(--color-text-muted);">
                    Нет категорий
                </td>
            </tr>
        `;
        return;
    }
    
    const html = categories.map(cat => `
        <tr>
            <td style="font-size: 1.5rem;">${cat.icon || '🔧'}</td>
            <td><strong>${cat.name}</strong></td>
            <td><code>${cat.slug}</code></td>
            <td>${cat.order || 0}</td>
            <td>
                <span class="badge badge--success">Активен</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn--sm btn--primary">✏️</button>
                    <button class="btn btn--sm" style="background: var(--color-error);">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    elements.categoriesTableBody.innerHTML = html;
}

/**
 * Загрузка таблицы комплектов
 */
async function loadKitsTable() {
    try {
        const response = await fetch(`${API_BASE}/kits`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        state.kits = data.data;
        renderKitsTable(state.kits);
    } catch (error) {
        console.error('Ошибка загрузки комплектов:', error);
        elements.kitsTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--color-error);">
                    Ошибка загрузки данных
                </td>
            </tr>
        `;
    }
}

/**
 * Рендер таблицы комплектов
 */
function renderKitsTable(kits) {
    if (kits.length === 0) {
        elements.kitsTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; color: var(--color-text-muted);">
                    Нет комплектов
                </td>
            </tr>
        `;
        return;
    }
    
    const html = kits.map(kit => {
        const car = state.cars.find(c => c.id === kit.forCarId);
        return `
            <tr>
                <td><strong>${kit.name}</strong></td>
                <td>${car ? car.fullName : '-'}</td>
                <td>${kit.description || '-'}</td>
                <td>
                    <span class="badge badge--success">Активен</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn--sm btn--primary">✏️</button>
                        <button class="btn btn--sm" style="background: var(--color-error);">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    elements.kitsTableBody.innerHTML = html;
}

/**
 * Загрузка категорий для select
 */
async function loadCategoriesForSelect() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        state.categories = data.data;
        
        const options = state.categories.map(cat =>
            `<option value="${cat.id}">${cat.icon || '🔧'} ${cat.name}</option>`
        ).join('');
        
        elements.partCategorySelect.innerHTML = `
            <option value="">Выберите категорию...</option>
            ${options}
        `;
        
        elements.partsCategoryFilter.innerHTML = `
            <option value="">Все категории</option>
            ${options}
        `;
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

/**
 * Загрузка автомобилей для совместимости
 */
async function loadCarsForCompatibility() {
    try {
        const response = await fetch(`${API_BASE}/cars`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        state.cars = data.data;
        
        const items = state.cars.map(car => `
            <label style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem; background: var(--color-bg-tertiary); border-radius: var(--radius-sm); cursor: pointer;">
                <input type="checkbox" name="compatibility" value="${car.id}">
                <span>${car.brand} ${car.model} ${car.generation || ''}</span>
            </label>
        `).join('');
        
        elements.compatibilitySelect.innerHTML = items;
    } catch (error) {
        console.error('Ошибка загрузки автомобилей:', error);
    }
}

/**
 * Показать форму добавления детали
 */
function showAddPartForm() {
    document.getElementById('add-part-form-container').style.display = 'block';
    loadCategoriesForSelect();
    loadCarsForCompatibility();
}

/**
 * Скрыть форму добавления детали
 */
function hideAddPartForm() {
    document.getElementById('add-part-form-container').style.display = 'none';
    elements.partForm.reset();
}

/**
 * Показать уведомление
 */
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.style.cssText = `
        padding: 1rem 1.5rem;
        margin-bottom: 1rem;
        border-radius: var(--radius-sm);
        background: ${type === 'success' ? 'rgba(0, 210, 106, 0.2)' : 'rgba(255, 71, 87, 0.2)'};
        border: 1px solid ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
        color: ${type === 'success' ? 'var(--color-success)' : 'var(--color-error)'};
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    alert.innerHTML = `
        <span>${type === 'success' ? '✅' : '❌'}</span>
        <span>${message}</span>
    `;
    
    elements.alertContainer.innerHTML = '';
    elements.alertContainer.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
}

/**
 * Валидация JSON
 */
function isValidJSON(str) {
    if (!str || str.trim() === '') return true;
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
}

/**
 * Обработка отправки формы детали
 */
async function handlePartFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(elements.partForm);
    
    // Получаем совместимость
    const compatibility = [];
    elements.compatibilitySelect.querySelectorAll('input:checked').forEach(input => {
        compatibility.push(input.value);
    });
    
    if (compatibility.length === 0) {
        showAlert('Выберите хотя бы один автомобиль', 'error');
        return;
    }
    
    // Валидация JSON
    const specsInput = formData.get('specs');
    if (!isValidJSON(specsInput)) {
        showAlert('Неверный формат JSON', 'error');
        return;
    }
    
    const partData = {
        name: formData.get('name'),
        categoryId: formData.get('category'),
        manufacturer: formData.get('manufacturer'),
        description: formData.get('description'),
        specs: specsInput ? JSON.parse(specsInput) : {},
        compatibleCars: compatibility,
        price_approx: formData.get('price'),
        imageUrl: formData.get('image')
    };
    
    Object.keys(partData).forEach(key => {
        if (partData[key] === '' || partData[key] === undefined) {
            delete partData[key];
        }
    });
    
    try {
        const response = await fetch(`${API_BASE}/parts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(partData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error);
        }
        
        showAlert('Деталь успешно добавлена!', 'success');
        hideAddPartForm();
        loadPartsTable();
    } catch (error) {
        console.error('Ошибка:', error);
        showAlert(error.message || 'Ошибка добавления', 'error');
    }
}

/**
 * Кэширование элементов
 */
function cacheElements() {
    elements.alertContainer = document.getElementById('alert-container');
    elements.partsTableBody = document.getElementById('parts-table-body');
    elements.carsTableBody = document.getElementById('cars-table-body');
    elements.categoriesTableBody = document.getElementById('categories-table-body');
    elements.kitsTableBody = document.getElementById('kits-table-body');
    elements.partForm = document.getElementById('add-part-form');
    elements.partCategorySelect = document.getElementById('part-category');
    elements.compatibilitySelect = document.getElementById('compatibility-select');
    elements.partsSearch = document.getElementById('parts-search');
    elements.partsCategoryFilter = document.getElementById('parts-category-filter');
}

/**
 * Инициализация
 */
async function initAdminPage() {
    cacheElements();
    
    // Обработчики табов
    document.querySelectorAll('.admin-nav-item').forEach(item => {
        item.addEventListener('click', () => switchTab(item.dataset.tab));
    });
    
    // Обработчик формы
    if (elements.partForm) {
        elements.partForm.addEventListener('submit', handlePartFormSubmit);
    }
    
    // Загружаем начальные данные
    await loadDashboardStats();
    await loadCategoriesForSelect();
}

// Глобальные функции для onclick
window.switchTab = switchTab;
window.showAddPartForm = showAddPartForm;
window.hideAddPartForm = hideAddPartForm;

// Запуск
document.addEventListener('DOMContentLoaded', initAdminPage);
