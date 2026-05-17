/**
 * Маршруты для расчетов (файловая БД)
 */

const express = require('express');
const router = express.Router();
const calculationsController = require('../controllers/fileDBCalculationsController');

// POST /api/calculate - Рассчитать характеристики сборки
router.post('/', calculationsController.calculateBuild);

module.exports = router;
