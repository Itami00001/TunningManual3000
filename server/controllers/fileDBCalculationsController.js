/**
 * Контроллер для расчетов (файловая БД)
 */

const FileDB = require('../config/fileDB');
const fileDB = new FileDB();

// Импортируем функции расчетов
const {
    calculateBuildCompatibility,
    calculateInstallComplexity,
    calculateTotalPower,
    generateRadarChartData,
    generatePowerBarData,
    calculateTotalPrice
} = require('../utils/calculations');

/**
 * @desc    Рассчитать характеристики сборки
 * @route   POST /api/calculate
 * @access  Public
 */
exports.calculateBuild = async (req, res) => {
    try {
        const { partIds, basePower = 220 } = req.body;

        if (!partIds || !Array.isArray(partIds)) {
            return res.status(400).json({
                success: false,
                error: 'Требуется массив ID деталей'
            });
        }

        // Получаем все детали
        const allParts = await fileDB.readFile('parts.json') || [];
        
        // Находим детали по ID
        const selectedParts = allParts.filter(part => partIds.includes(part.id));
        
        if (selectedParts.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Детали не найдены'
            });
        }

        // Получаем категории
        const categories = await fileDB.readFile('categories.json') || [];

        // Расчеты
        const compatibility = calculateBuildCompatibility(selectedParts);
        const installComplexity = calculateInstallComplexity(selectedParts);
        const powerData = calculateTotalPower(basePower, selectedParts);
        const priceData = calculateTotalPrice(selectedParts);

        // Генерация данных для графиков
        const radarChartData = generateRadarChartData(selectedParts, categories);
        const powerBarData = generatePowerBarData(basePower, selectedParts);

        // Формируем ответ
        const buildData = {
            compatibility,
            installComplexity,
            power: powerData,
            price: priceData,
            radarChartData,
            powerBarData,
            parts: selectedParts.map(part => ({
                id: part.id,
                name: part.name,
                category: categories.find(cat => cat.id === part.categoryId),
                specs: part.specs,
                compatibility_score: part.compatibility_score,
                complexity_install: part.complexity_install,
                price_approx: part.price_approx
            }))
        };

        res.status(200).json({
            success: true,
            data: buildData
        });

    } catch (error) {
        console.error('Ошибка при расчете сборки:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при расчете сборки'
        });
    }
};
