/**
 * Модель Part (Деталь/Запчасть)
 * Хранит информацию о тюнинг-деталях с привязкой к категориям и совместимости
 */

const mongoose = require('mongoose');

const partSchema = new mongoose.Schema({
    // Название детали (например, "SR20DET")
    name: {
        type: String,
        required: [true, 'Укажите название детали'],
        trim: true,
        maxlength: [100, 'Название не может быть длиннее 100 символов']
    },

    // Ссылка на категорию детали
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PartCategory',
        required: [true, 'Укажите категорию детали']
    },

    // Описание детали
    description: {
        type: String,
        maxlength: [2000, 'Описание не может быть длиннее 2000 символов']
    },

    // Технические характеристики (гибкий объект)
    specs: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
        // Пример структуры:
        // {
        //   power: "250 л.с.",
        //   torque: "280 Нм",
        //   weight: "150 кг",
        //   displacement: "2.0L"
        // }
    },

    // Совместимость: массив ID автомобилей, к которым подходит деталь
    compatibility: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Car'
    }],

    // URL изображения детали
    imageUrl: {
        type: String,
        default: '/assets/images/placeholder-part.png'
    },

    // Строка для поиска на маркетплейсе (Avito)
    marketSearchQuery: {
        type: String,
        trim: true
        // Пример: "Nissan Silvia SR20DET двигатель купить"
    },

    // Производитель (опционально)
    manufacturer: {
        type: String,
        trim: true,
        maxlength: [100, 'Производитель не может быть длиннее 100 символов']
    },

    // Артикул/SKU (опционально)
    sku: {
        type: String,
        trim: true
    },

    // Примерная цена (для информации)
    priceEstimate: {
        type: Number,
        min: 0
    },

    // Примерная цена (диапазон в виде строки, например "90000-180000")
    price_approx: {
        type: String,
        trim: true
    },

    // Оценка совместимости (1-10, где 10 = Plug&Play)
    compatibility_score: {
        type: Number,
        min: 1,
        max: 10
    },

    // Примечания по совместимости
    compatibility_notes: {
        type: String,
        maxlength: [1000, 'Примечания по совместимости не могут быть длиннее 1000 символов']
    },

    // Сложность установки (1-10, где 1 = очень просто, 10 = требует профессионала)
    complexity_install: {
        type: Number,
        min: 1,
        max: 10
    },

    // Активна ли деталь (для возможности скрытия)
    isActive: {
        type: Boolean,
        default: true
    }

}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Виртуальное поле: URL для поиска на Avito
partSchema.virtual('avitoUrl').get(function () {
    if (!this.marketSearchQuery) return null;
    const query = encodeURIComponent(this.marketSearchQuery);
    return `https://www.avito.ru/all?q=${query}`;
});

// Индексы для эффективных запросов
partSchema.index({ categoryId: 1 });
partSchema.index({ compatibility: 1 });
partSchema.index({ categoryId: 1, compatibility: 1 });
partSchema.index({ isActive: 1 });

// Populate категории при find запросах (опционально, можно отключить)
// partSchema.pre(/^find/, function(next) {
//   this.populate('categoryId', 'name slug icon');
//   next();
// });

module.exports = mongoose.model('Part', partSchema);
