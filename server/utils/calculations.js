/**
 * Модуль расчетов для тюнинг-сборки автомобиля
 * Содержит функции для вычисления совместимости, мощности и данных для графиков
 */

/**
 * Вычисляет общий индекс совместимости сборки
 * @param {Array} selectedParts - Массив выбранных деталей
 * @returns {number} Средневзвешенное значение совместимости (0-10)
 */
function calculateBuildCompatibility(selectedParts) {
    if (!selectedParts || selectedParts.length === 0) {
        return 0;
    }

    // Фильтруем детали, у которых есть оценка совместимости
    const partsWithScore = selectedParts.filter(part =>
        part.compatibility_score !== null &&
        part.compatibility_score !== undefined
    );

    if (partsWithScore.length === 0) {
        return 0;
    }

    // Вычисляем среднее значение
    const totalScore = partsWithScore.reduce((sum, part) =>
        sum + part.compatibility_score, 0
    );

    const averageScore = totalScore / partsWithScore.length;

    // Округляем до 1 знака после запятой
    return Math.round(averageScore * 10) / 10;
}

/**
 * Вычисляет общую сложность установки сборки
 * @param {Array} selectedParts - Массив выбранных деталей
 * @returns {number} Средняя сложность установки (0-10)
 */
function calculateInstallComplexity(selectedParts) {
    if (!selectedParts || selectedParts.length === 0) {
        return 0;
    }

    const partsWithComplexity = selectedParts.filter(part =>
        part.complexity_install !== null &&
        part.complexity_install !== undefined
    );

    if (partsWithComplexity.length === 0) {
        return 0;
    }

    const totalComplexity = partsWithComplexity.reduce((sum, part) =>
        sum + part.complexity_install, 0
    );

    const averageComplexity = totalComplexity / partsWithComplexity.length;

    return Math.round(averageComplexity * 10) / 10;
}

/**
 * Извлекает прирост мощности из строки specs.power_gain
 * @param {string} powerGainStr - Строка типа "+80-100 л.с." или "+150 л.с."
 * @returns {number} Среднее значение прироста мощности
 */
function parsePowerGain(powerGainStr) {
    if (!powerGainStr || typeof powerGainStr !== 'string') {
        return 0;
    }

    // Удаляем все кроме чисел, дефисов и плюсов
    const cleaned = powerGainStr.replace(/[^\d\-+]/g, '');

    // Ищем паттерн "+80-100" или "+150"
    const rangeMatch = cleaned.match(/\+?(\d+)-(\d+)/);
    if (rangeMatch) {
        const min = parseInt(rangeMatch[1], 10);
        const max = parseInt(rangeMatch[2], 10);
        return (min + max) / 2;
    }

    // Если просто число "+150"
    const singleMatch = cleaned.match(/\+?(\d+)/);
    if (singleMatch) {
        return parseInt(singleMatch[1], 10);
    }

    return 0;
}

/**
 * Вычисляет ожидаемую мощность с учетом установленных деталей
 * @param {number} basePower - Базовая мощность автомобиля (л.с.)
 * @param {Array} selectedParts - Массив выбранных деталей
 * @returns {Object} { basePower, estimatedPower, totalGain }
 */
function calculateTotalPower(basePower, selectedParts) {
    if (!basePower || basePower <= 0) {
        basePower = 220; // Дефолтное значение (примерно для SR20DET)
    }

    if (!selectedParts || selectedParts.length === 0) {
        return {
            basePower: Math.round(basePower),
            estimatedPower: Math.round(basePower),
            totalGain: 0,
            gainPercentage: 0
        };
    }

    // Суммируем приросты мощности от всех деталей
    let totalGain = 0;
    selectedParts.forEach(part => {
        if (part.specs && part.specs.power_gain) {
            const gain = parsePowerGain(part.specs.power_gain);
            totalGain += gain;
        }
    });

    const estimatedPower = basePower + totalGain;
    const gainPercentage = Math.round((totalGain / basePower) * 100);

    return {
        basePower: Math.round(basePower),
        estimatedPower: Math.round(estimatedPower),
        totalGain: Math.round(totalGain),
        gainPercentage
    };
}

/**
 * Генерирует данные для лепестковой диаграммы (Radar Chart)
 * Показывает различные параметры сборки
 * @param {Array} selectedParts - Массив выбранных деталей
 * @returns {Object} Данные для Chart.js radar chart
 */
function generateRadarChartData(selectedParts) {
    // Категории для радар-диаграммы
    const categories = {
        turbo: 'Турбина',
        intake: 'Впуск',
        exhaust: 'Выхлоп',
        fuel: 'Топливо',
        ecu: 'ЭБУ',
        engine: 'Двигатель',
        camshaft: 'ГРМ',
        ignition: 'Зажигание'
    };

    // Инициализируем данные (все категории имеют значение 0)
    const data = {};
    Object.keys(categories).forEach(key => {
        data[key] = 0;
    });

    // Заполняем данные на основе выбранных деталей
    selectedParts.forEach(part => {
        const categorySlug = part.categoryId; // В файловой БД categoryId это slug
        if (categorySlug && categories[categorySlug]) {
            // Используем compatibility_score как "уровень апгрейда" для категории
            // Если несколько деталей в одной категории, берем максимальное значение
            const score = part.compatibility_score || 5;
            data[categorySlug] = Math.max(data[categorySlug], score);
        }
    });

    // Формируем данные для Chart.js
    const labels = Object.values(categories);
    const values = Object.keys(categories).map(key => data[key]);

    return {
        labels,
        datasets: [{
            label: 'Уровень апгрейда',
            data: values,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)'
        }]
    };
}

/**
 * Генерирует данные для гистограммы мощности (Bar Chart)
 * Сравнивает стоковую и тюнингованную мощность
 * @param {number} basePower - Базовая мощность
 * @param {Array} selectedParts - Массив выбранных деталей
 * @returns {Object} Данные для Chart.js bar chart
 */
function generatePowerBarData(basePower, selectedParts) {
    const powerData = calculateTotalPower(basePower, selectedParts);

    return {
        labels: ['Мощность двигателя'],
        datasets: [
            {
                label: 'Стоковая',
                data: [powerData.basePower],
                backgroundColor: 'rgba(201, 203, 207, 0.6)',
                borderColor: 'rgba(201, 203, 207, 1)',
                borderWidth: 1
            },
            {
                label: 'Тюнингованная',
                data: [powerData.estimatedPower],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            }
        ]
    };
}

/**
 * Вычисляет примерную стоимость сборки
 * @param {Array} selectedParts - Массив выбранных деталей
 * @returns {Object} { minPrice, maxPrice, formattedRange }
 */
function calculateTotalPrice(selectedParts) {
    if (!selectedParts || selectedParts.length === 0) {
        return {
            minPrice: 0,
            maxPrice: 0,
            formattedRange: '0 ₽'
        };
    }

    let minTotal = 0;
    let maxTotal = 0;

    selectedParts.forEach(part => {
        const priceStr = part.price_approx || part.priceEstimate?.toString();
        if (priceStr) {
            // Парсим строку типа "90000-180000"
            const rangeMatch = priceStr.match(/(\d+)-(\d+)/);
            if (rangeMatch) {
                minTotal += parseInt(rangeMatch[1], 10);
                maxTotal += parseInt(rangeMatch[2], 10);
            } else {
                // Если просто число
                const singleMatch = priceStr.match(/(\d+)/);
                if (singleMatch) {
                    const price = parseInt(singleMatch[1], 10);
                    minTotal += price;
                    maxTotal += price;
                }
            }
        }
    });

    const formattedRange = minTotal === maxTotal
        ? `${minTotal.toLocaleString('ru-RU')} ₽`
        : `${minTotal.toLocaleString('ru-RU')} - ${maxTotal.toLocaleString('ru-RU')} ₽`;

    return {
        minPrice: minTotal,
        maxPrice: maxTotal,
        formattedRange
    };
}

module.exports = {
    calculateBuildCompatibility,
    calculateInstallComplexity,
    calculateTotalPower,
    generateRadarChartData,
    generatePowerBarData,
    calculateTotalPrice,
    parsePowerGain
};
