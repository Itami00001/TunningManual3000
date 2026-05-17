/**
 * TuningManual3000 - Main JavaScript
 * Загрузка списка автомобилей на главной странице
 */

// API Base URL (в dev через Vite proxy)
const API_BASE = '/api';

/**
 * Загрузить все автомобили с API
 * @returns {Promise<Array>} Массив автомобилей
 */
async function fetchCars() {
    try {
        const response = await fetch(`${API_BASE}/cars`);
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Ошибка загрузки автомобилей');
        }

        return data.data;
    } catch (error) {
        console.error('Ошибка при загрузке автомобилей:', error);
        throw error;
    }
}

/**
 * Создать HTML-карточку автомобиля
 * @param {Object} car - Объект автомобиля
 * @returns {string} HTML строка
 */
function createCarCard(car) {
    // Форматируем годы выпуска
    const years = car.yearStart && car.yearEnd
        ? `${car.yearStart}-${car.yearEnd}`
        : car.yearStart || '';

    // Определяем иконку по марке (можно расширить)
    const brandIcons = {
        'Nissan': '🔵',
        'Toyota': '🔴',
        'Mazda': '🟣',
        'Honda': '⚫',
        'Subaru': '🔵',
        'Mitsubishi': '🔴'
    };
    const brandIcon = brandIcons[car.brand] || '🚗';

    return `
    <article class="card car-card">
      <a href="/car.html?slug=${car.slug}" class="car-card__link">
        ${car.generation ? `<span class="car-card__badge">${car.generation}</span>` : ''}
        <div class="car-card__image">
          ${car.mainImageUrl && !car.mainImageUrl.includes('placeholder')
            ? `<img src="${car.mainImageUrl}" alt="${car.brand} ${car.model}" loading="lazy">`
            : brandIcon
        }
        </div>
        <div class="card__body">
          <h3 class="card__title">${car.brand} ${car.model}</h3>
          <p class="car-card__year">${years}</p>
        </div>
      </a>
    </article>
  `;
}

/**
 * Отобразить ошибку
 * @param {HTMLElement} container - Контейнер для сообщения
 * @param {string} message - Текст ошибки
 */
function showError(container, message) {
    container.innerHTML = `
    <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
      <h3>😔 ${message}</h3>
      <p class="mt-2 text-muted">Проверьте подключение к серверу и MongoDB</p>
      <button onclick="location.reload()" class="btn btn--secondary mt-3">
        Попробовать снова
      </button>
    </div>
  `;
}

/**
 * Инициализация главной страницы
 */
async function initHomePage() {
    const carsGrid = document.getElementById('cars-grid');

    if (!carsGrid) {
        console.error('Cars grid container not found');
        return;
    }

    try {
        // Загружаем автомобили
        const cars = await fetchCars();

        if (cars.length === 0) {
            carsGrid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <h3>📭 Автомобили не найдены</h3>
          <p class="mt-2 text-muted">Запустите <code>npm run seed</code> для заполнения базы данных</p>
        </div>
      `;
            return;
        }

        // Генерируем карточки
        const cardsHTML = cars.map(createCarCard).join('');
        carsGrid.innerHTML = cardsHTML;

        // Добавляем анимацию появления
        const cards = carsGrid.querySelectorAll('.car-card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `opacity 0.5s ease ${index * 0.1}s, transform 0.5s ease ${index * 0.1}s`;

            // Триггерим анимацию
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            });
        });

    } catch (error) {
        console.error('Ошибка загрузки автомобилей:', error);
        
        // Проверяем, это ошибка сети или MongoDB
        if (error.message.includes('ECONNREFUSED') || error.message.includes('MongoDB')) {
            showError(carsGrid, `
                <h3>🗄️ Сервер баз данных недоступен</h3>
                <p class="mt-2">Проверьте, что MongoDB запущена и доступна</p>
                <div class="mt-3" style="text-align: left; max-width: 400px; margin: 0 auto;">
                    <h4>Варианты решения:</h4>
                    <ol style="font-size: 0.9rem; line-height: 1.6;">
                        <li>Запустите MongoDB: <code>mongod</code></li>
                        <li>Используйте Docker: <code>docker-compose -f docker-compose.mongodb.yml up -d</code></li>
                        <li>Настройте MongoDB Atlas в .env.local</li>
                    </ol>
                </div>
            `);
        } else {
            showError(carsGrid, 'Не удалось загрузить автомобили');
        }
    }
}

// Запускаем инициализацию при загрузке DOM
document.addEventListener('DOMContentLoaded', initHomePage);
