/**
 * Контроллер для расчетов параметров тюнинг-сборки
 * Обрабатывает запросы к /api/calculate
 */

const Part = require('../models/Part');
const calculations = require('../utils/calculations');
const mongoose = require('mongoose');

/**
 * @desc    Рассчитать параметры сборки на основе выбранных деталей
 * @route   POST /api/calculate
 * @body    { partIds: [...], basePower: 220 }
 * @access  Public
 */
exports.calculateBuild = async (req, res) => {
    try {
        const { partIds, basePower } = req.body;

        // Валидация входных данных
        if (!partIds || !Array.isArray(partIds)) {
            return res.status(400).json({
                success: false,
                error: 'Необходимо передать массив ID деталей (partIds)'
            });
        }

        if (partIds.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    compatibility: 0,
                    installComplexity: 0,
                    power: {
                        basePower: basePower || 220,
                        estimatedPower: basePower || 220,
                        totalGain: 0,
                        gainPercentage: 0
                    },
                    price: {
                        minPrice: 0,
                        maxPrice: 0,
                        formattedRange: '0 ₽'
                    },
                    radarChartData: calculations.generateRadarChartData([]),
                    powerBarData: calculations.generatePowerBarData(basePower || 220, [])
                }
            });
        }

        // Проверяем валидность всех ID
        const invalidIds = partIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                error: `Неверный формат ID деталей: ${invalidIds.join(', ')}`
            });
        }

        // Получаем детали из БД
        const parts = await Part.find({ _id: { $in: partIds } })
            .populate('categoryId', 'name slug icon');

        if (parts.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Ни одна из указанных деталей не найдена'
            });
        }

        // Выполняем расчеты
        const compatibility = calculations.calculateBuildCompatibility(parts);
        const installComplexity = calculations.calculateInstallComplexity(parts);
        const power = calculations.calculateTotalPower(basePower || 220, parts);
        const price = calculations.calculateTotalPrice(parts);
        const radarChartData = calculations.generateRadarChartData(parts);
        const powerBarData = calculations.generatePowerBarData(basePower || 220, parts);

        // Формируем ответ
        res.status(200).json({
            success: true,
            data: {
                compatibility,
                installComplexity,
                power,
                price,
                radarChartData,
                powerBarData,
                partsCount: parts.length
            }
        });

    } catch (error) {
        console.error('Ошибка при расчете сборки:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера при расчете параметров сборки'
        });
    }
};
