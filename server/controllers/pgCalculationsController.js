/**
 * Контроллер расчётов — PostgreSQL
 */

const { query } = require('../config/postgres');
const {
    calculateBuildCompatibility,
    calculateInstallComplexity,
    calculateTotalPower,
    generateRadarChartData,
    generatePowerBarData,
    calculateTotalPrice,
} = require('../utils/calculations');

/**
 * POST /api/calculate
 * Рассчитать характеристики сборки
 * Body: { partIds: string[], basePower?: number }
 */
exports.calculateBuild = async (req, res) => {
    try {
        const { partIds, basePower = 220 } = req.body;

        if (!partIds || !Array.isArray(partIds) || partIds.length === 0) {
            return res.status(400).json({ success: false, error: 'Требуется массив ID деталей' });
        }

        // Получаем детали из БД
        const placeholders = partIds.map((_, i) => `$${i + 1}`).join(',');
        const partsResult = await query(
            `SELECT
                p.id, p.name, p.category_id AS "categoryId",
                p.description, p.manufacturer, p.price_approx AS "price_approx",
                p.compatibility_score, p.compatibility_notes, p.complexity_install,
                c.name AS "categoryName", c.slug AS "categorySlug", c.icon AS "categoryIcon",
                COALESCE(
                    json_object_agg(ps.spec_key, ps.spec_value) FILTER (WHERE ps.spec_key IS NOT NULL),
                    '{}'::json
                ) AS specs
             FROM parts p
             LEFT JOIN categories c ON c.id = p.category_id
             LEFT JOIN part_specs ps ON ps.part_id = p.id
             WHERE p.id IN (${placeholders})
             GROUP BY p.id, p.name, p.category_id, p.description, p.manufacturer,
                      p.price_approx, p.compatibility_score, p.compatibility_notes,
                      p.complexity_install, c.name, c.slug, c.icon`,
            partIds
        );

        const selectedParts = partsResult.rows;

        if (selectedParts.length === 0) {
            return res.status(404).json({ success: false, error: 'Детали не найдены' });
        }

        // Нормализуем specs для функций расчётов
        // specs из PG приходит как объект, но функции ожидают part.specs.power_gain
        const normalizedParts = selectedParts.map(part => ({
            ...part,
            specs: part.specs || {},
            // Для совместимости с расчётами: categoryId = slug категории
            categoryId: part.categorySlug || part.categoryId,
        }));

        // Расчёты
        const compatibility    = calculateBuildCompatibility(normalizedParts);
        const installComplexity = calculateInstallComplexity(normalizedParts);
        const powerData        = calculateTotalPower(basePower, normalizedParts);
        const priceData        = calculateTotalPrice(normalizedParts);
        const radarChartData   = generateRadarChartData(normalizedParts);
        const powerBarData     = generatePowerBarData(basePower, normalizedParts);

        res.json({
            success: true,
            data: {
                compatibility,
                installComplexity,
                power: powerData,
                price: priceData,
                radarChartData,
                powerBarData,
                parts: normalizedParts.map(part => ({
                    id: part.id,
                    name: part.name,
                    category: {
                        id: part.categoryId,
                        name: part.categoryName,
                        slug: part.categorySlug,
                        icon: part.categoryIcon,
                    },
                    specs: part.specs,
                    compatibility_score: part.compatibility_score,
                    complexity_install: part.complexity_install,
                    price_approx: part.price_approx,
                })),
            },
        });
    } catch (error) {
        console.error('pgCalculationsController.calculateBuild:', error.message);
        res.status(500).json({ success: false, error: 'Ошибка сервера при расчёте сборки' });
    }
};
