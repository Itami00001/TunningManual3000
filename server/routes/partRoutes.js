/**
 * Маршруты для работы с деталями
 * /api/parts
 */

const express = require('express');
const router = express.Router();
const partController = require('../controllers/partController');

// GET /api/parts - Получить все детали (с фильтрацией)
// Query params: categoryId, carId, category (slug)
router.get('/', partController.getAllParts);

// GET /api/parts/:id - Получить деталь по ID
router.get('/:id', partController.getPartById);

// POST /api/parts - Создать новую деталь (TODO: защитить авторизацией)
router.post('/', partController.createPart);

// PUT /api/parts/:id - Обновить деталь (TODO: защитить авторизацией)
router.put('/:id', partController.updatePart);

// DELETE /api/parts/:id - Удалить деталь (TODO: защитить авторизацией)
router.delete('/:id', partController.deletePart);

module.exports = router;
