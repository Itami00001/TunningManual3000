/**
 * Маршруты для категорий (файловая БД)
 */

const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/fileDBCategoriesController');

// GET /api/categories - Получить все категории
router.get('/', categoriesController.getAllCategories);

module.exports = router;
