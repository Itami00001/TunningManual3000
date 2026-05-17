/**
 * Маршруты для работы с автомобилями
 * /api/cars
 */

const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');

// GET /api/cars - Получить все автомобили
router.get('/', carController.getAllCars);

// GET /api/cars/:slug - Получить автомобиль по slug
router.get('/:slug', carController.getCarBySlug);

// POST /api/cars - Создать новый автомобиль (TODO: защитить авторизацией)
router.post('/', carController.createCar);

module.exports = router;
