/**
 * Маршруты для расчетов параметров тюнинг-сборки
 * /api/calculate
 */

const express = require('express');
const router = express.Router();
const calculationController = require('../controllers/calculationController');

// POST /api/calculate - Рассчитать параметры сборки
router.post('/', calculationController.calculateBuild);

module.exports = router;
