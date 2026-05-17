/**
 * Модель PartCategory (Категория деталей)
 * Группирует детали по типам: Двигатель, Подвеска, Выхлоп и т.д.
 */

const mongoose = require('mongoose');

const partCategorySchema = new mongoose.Schema({
    // Название категории (например, "Двигатель")
    name: {
        type: String,
        required: [true, 'Укажите название категории'],
        trim: true,
        maxlength: [50, 'Название не может быть длиннее 50 символов']
    },

    // Slug для URL и фильтрации (например, "engine")
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    // Иконка категории (CSS класс или путь к изображению)
    icon: {
        type: String,
        default: '🔧'
    },

    // Порядок отображения в списке
    order: {
        type: Number,
        default: 0
    },

    // Описание категории (опционально)
    description: {
        type: String,
        maxlength: [500, 'Описание не может быть длиннее 500 символов']
    }

}, {
    timestamps: true
});

// Индекс для сортировки по порядку
partCategorySchema.index({ order: 1 });

// Индекс для поиска по slug
partCategorySchema.index({ slug: 1 });

module.exports = mongoose.model('PartCategory', partCategorySchema);
