/**
 * Маршруты для деталей (файловая БД)
 */

const express = require('express');
const router = express.Router();
const partsController = require('../controllers/fileDBPartsController');

// GET /api/parts - Получить детали для автомобиля
router.get('/', partsController.getParts);

module.exports = router;
