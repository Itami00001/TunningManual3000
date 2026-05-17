/**
 * Маршруты для работы с категориями деталей
 * /api/categories
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET /api/categories - Получить все категории
router.get('/', categoryController.getAllCategories);

// GET /api/categories/:slug - Получить категорию по slug
router.get('/:slug', categoryController.getCategoryBySlug);

// POST /api/categories - Создать новую категорию (TODO: защитить авторизацией)
router.post('/', categoryController.createCategory);

module.exports = router;
