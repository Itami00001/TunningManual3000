/**
 * Middleware для обработки ошибок
 * Централизованная обработка всех ошибок приложения
 */

/**
 * Обработчик ошибок для 404 (маршрут не найден)
 */
const notFound = (req, res, next) => {
    const error = new Error(`Не найдено - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

/**
 * Общий обработчик ошибок
 * Ловит все ошибки и возвращает унифицированный JSON-ответ
 */
const errorHandler = (err, req, res, next) => {
    // Определяем статус код (500 если не был установлен)
    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    let message = err.message;

    // Обработка ошибки невалидного ObjectId (CastError)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        statusCode = 400;
        message = 'Неверный формат ID';
    }

    // Обработка ошибки дублирования ключа (MongoDB E11000)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `Значение поля '${field}' уже существует`;
    }

    // Обработка ошибок валидации Mongoose
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors)
            .map(e => e.message)
            .join(', ');
    }

    // Логируем ошибку в development режиме
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Ошибка:', err);
    }

    res.status(statusCode).json({
        success: false,
        error: message,
        // Стек ошибки только в development
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = { notFound, errorHandler };
