/**
 * Маршруты для файловой базы данных
 */

const express = require('express');
const router = express.Router();
const fileDBController = require('../controllers/fileDBController');

// GET /api/cars - Получить все автомобили
router.get('/', fileDBController.getAllCars);

// GET /api/cars/:slug - Получить автомобиль по slug
router.get('/:slug', fileDBController.getCarBySlug);

module.exports = router;
