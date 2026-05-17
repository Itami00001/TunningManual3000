/**
 * Модель Car (Автомобиль)
 * Хранит информацию о моделях автомобилей для тюнинга
 */

const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
    // Марка автомобиля (например, "Nissan")
    brand: {
        type: String,
        required: [true, 'Укажите марку автомобиля'],
        trim: true,
        maxlength: [50, 'Марка не может быть длиннее 50 символов']
    },

    // Модель автомобиля (например, "Silvia")
    model: {
        type: String,
        required: [true, 'Укажите модель автомобиля'],
        trim: true,
        maxlength: [50, 'Модель не может быть длиннее 50 символов']
    },

    // Поколение (например, "S14", "S15") - опционально
    generation: {
        type: String,
        trim: true,
        maxlength: [20, 'Поколение не может быть длиннее 20 символов']
    },

    // Slug для ЧПУ URL (например, "nissan-silvia-s14")
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    // URL главного изображения автомобиля
    mainImageUrl: {
        type: String,
        default: '/assets/images/placeholder-car.png'
    },

    // Описание автомобиля (опционально)
    description: {
        type: String,
        maxlength: [1000, 'Описание не может быть длиннее 1000 символов']
    },

    // Год выпуска (диапазон)
    yearStart: {
        type: Number
    },
    yearEnd: {
        type: Number
    },
    
    // Базовая мощность двигателя (л.с.)
    basePower: {
        type: Number,
        default: 0
    }

}, {
    // Автоматические поля createdAt и updatedAt
    timestamps: true,

    // Виртуальные поля при конвертации в JSON
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Виртуальное поле: полное название автомобиля
carSchema.virtual('fullName').get(function () {
    const gen = this.generation ? ` ${this.generation}` : '';
    return `${this.brand} ${this.model}${gen}`;
});

// Индекс для быстрого поиска по slug
carSchema.index({ slug: 1 });

// Индекс для поиска по марке и модели
carSchema.index({ brand: 1, model: 1 });

// Статический метод: генерация slug из названия
carSchema.statics.generateSlug = function (brand, model, generation) {
    const parts = [brand, model];
    if (generation) parts.push(generation);
    return parts
        .join('-')
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
};

module.exports = mongoose.model('Car', carSchema);
