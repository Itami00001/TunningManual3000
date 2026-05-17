/**
 * TuningManual3000 - Charts and Calculations Module
 * Логика для расчетов и отрисовки графиков
 */

// Глобальные переменные для хранения экземпляров графиков
let radarChart = null;
let powerChart = null;

/**
 * Получить данные расчетов с API
 * @param {Array} partIds - Массив ID деталей
 * @param {number} basePower - Базовая мощность автомобиля
 * @returns {Promise<Object>}
 */
async function fetchCalculations(partIds, basePower = 220) {
    const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            partIds,
            basePower
        })
    });

    const data = await response.json();

    if (!data.success) {
        throw new Error(data.error || 'Ошибка расчетов');
    }

    return data.data;
}

/**
 * Отобразить индекс совместимости
 * @param {number} score - Оценка совместимости (0-10)
 */
function renderCompatibilityScore(score) {
    const scoreEl = document.getElementById('compatibility-score');
    const barEl = document.getElementById('compatibility-bar');

    if (!scoreEl || !barEl) return;

    scoreEl.textContent = `${score}/10`;
    barEl.style.width = `${(score / 10) * 100}%`;

    // Цвет в зависимости от значения
    if (score >= 8) {
        barEl.style.background = '#4caf50'; // Зеленый
    } else if (score >= 5) {
        barEl.style.background = '#ff9800'; // Оранжевый
    } else {
        barEl.style.background = '#f44336'; // Красный
    }
}

/**
 * Отобразить сложность установки
 * @param {number} score - Сложность (0-10)
 */
function renderComplexityScore(score) {
    const scoreEl = document.getElementById('complexity-score');
    const barEl = document.getElementById('complexity-bar');

    if (!scoreEl || !barEl) return;

    scoreEl.textContent = `${score}/10`;
    barEl.style.width = `${(score / 10) * 100}%`;
}

/**
 * Отобразить статистику мощности
 * @param {Object} powerData - Данные о мощности
 */
function renderPowerStats(powerData) {
    const powerDisplayEl = document.getElementById('power-display');
    const powerGainEl = document.getElementById('power-gain');

    if (!powerDisplayEl || !powerGainEl) return;

    powerDisplayEl.textContent = `${powerData.estimatedPower} л.с.`;

    if (powerData.totalGain > 0) {
        powerGainEl.textContent = `Прирост: +${powerData.totalGain} л.с. (+${powerData.gainPercentage}%)`;
    } else {
        powerGainEl.textContent = '';
    }
}

/**
 * Отобразить примерную стоимость
 * @param {Object} priceData - Данные о цене
 */
function renderPriceEstimate(priceData) {
    const priceDisplayEl = document.getElementById('price-display');

    if (!priceDisplayEl) return;

    priceDisplayEl.textContent = priceData.formattedRange;
}

/**
 * Отрисовать лепестковую диаграмму (Radar Chart)
 * @param {Object} chartData - Данные для Chart.js
 */
function renderRadarChart(chartData) {
    const ctx = document.getElementById('radar-chart');

    if (!ctx) return;

    // Уничтожаем предыдущий график
    if (radarChart) {
        radarChart.destroy();
    }

    radarChart = new Chart(ctx, {
        type: 'radar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        font: {
                            size: 11
                        }
                    },
                    pointLabels: {
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Отрисовать гистограмму мощности (Bar Chart)
 * @param {Object} chartData - Данные для Chart.js
 */
function renderPowerBarChart(chartData) {
    const ctx = document.getElementById('power-chart');

    if (!ctx) return;

    // Уничтожаем предыдущий график
    if (powerChart) {
        powerChart.destroy();
    }

    powerChart = new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Мощность (л.с.)',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

/**
 * Обновить статистику сборки
 * @param {Map} appliedPartsMap - Map деталей (categoryId -> part)
 * @param {number} basePower - Базовая мощность автомобиля
 */
async function updateBuildStats(appliedPartsMap, basePower = 220) {
    const buildStatsEl = document.getElementById('build-stats');

    if (!buildStatsEl) return;

    if (appliedPartsMap.size === 0) {
    // Показываем графики с базовыми данными
    buildStatsEl.classList.remove('hidden');
    
    // Отображаем базовые значения
    renderCompatibilityScore(0);
    renderComplexityScore(0);
    renderPowerStats({
        basePower: basePower,
        estimatedPower: basePower,
        totalGain: 0,
        gainPercentage: 0
    });
    renderPriceEstimate({
        minPrice: 0,
        maxPrice: 0,
        formattedRange: '0 ₽'
    });
    
    // Показываем пустые графики с базовыми настройками
    const emptyRadarData = {
        labels: ['Турбина', 'Впуск', 'Выхлоп', 'Топливо', 'ЭБУ', 'Двигатель'],
        datasets: [{
            label: 'Уровень апгрейда',
            data: [0, 0, 0, 0, 0, 0],
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
        }]
    };
    
    const emptyBarData = {
        labels: ['Мощность двигателя'],
        datasets: [
            {
                label: 'Стоковая',
                data: [basePower],
                backgroundColor: 'rgba(201, 203, 207, 0.6)',
                borderColor: 'rgba(201, 203, 207, 1)',
                borderWidth: 1
            },
            {
                label: 'Тюнингованная',
                data: [basePower],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }
        ]
    };
    
    renderRadarChart(emptyRadarData);
    renderPowerBarChart(emptyBarData);
    
    return;
}

    // Показываем секцию статистики
    buildStatsEl.classList.remove('hidden');

    try {
        // Собираем ID выбранных деталей
        const partIds = Array.from(appliedPartsMap.values()).map(part => part.id);

        // Отправляем запрос на расчеты
        const buildData = await fetchCalculations(partIds, basePower);

        // Обновляем индикаторы
        renderCompatibilityScore(buildData.compatibility);
        renderComplexityScore(buildData.installComplexity);
        renderPowerStats(buildData.power);
        renderPriceEstimate(buildData.price);

        // Обновляем графики
        renderRadarChart(buildData.radarChartData);
        renderPowerBarChart(buildData.powerBarData);

        console.log('✅ Статистика сборки обновлена:', buildData);
    } catch (error) {
        console.error('❌ Ошибка при расчете статистики:', error);
        buildStatsEl.classList.add('hidden');
    }
}

// Экспортируем функции для использования в car.js
window.tuningCharts = {
    updateBuildStats,
    renderCompatibilityScore,
    renderComplexityScore,
    renderPowerStats,
    renderPriceEstimate,
    renderRadarChart,
    renderPowerBarChart
};
