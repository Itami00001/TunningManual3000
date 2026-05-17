/**
 * Временное решение - эмуляция API без MongoDB
 * Для быстрого тестирования фронтенда
 */

const express = require('express');
const router = express.Router();

// Эмулированные данные автомобилей
const mockCars = [
    {
        _id: "nissan-silvia-s14",
        brand: "Nissan",
        model: "Silvia",
        generation: "S14",
        slug: "nissan-silvia-s14",
        fullName: "Nissan Silvia S14",
        mainImageUrl: "/assets/images/nissan-silvia-s14.png",
        yearStart: 1993,
        yearEnd: 1998,
        basePower: 220,
        description: "Легендарное JDM купе с потенциалом для дрифта и тюнинга"
    },
    {
        _id: "nissan-skyline-r34-gtr",
        brand: "Nissan",
        model: "Skyline",
        generation: "R34 GT-R",
        slug: "nissan-skyline-r34-gtr",
        fullName: "Nissan Skyline R34 GT-R",
        mainImageUrl: "/assets/images/nissan-skyline-r34-gtr.png",
        yearStart: 1999,
        yearEnd: 2002,
        basePower: 280,
        description: "Godzilla - культовый спортивный автомобиль"
    },
    {
        _id: "toyota-supra-a80",
        brand: "Toyota",
        model: "Supra",
        generation: "A80",
        slug: "toyota-supra-a80",
        fullName: "Toyota Supra A80",
        mainImageUrl: "/assets/images/toyota-supra-a80.png",
        yearStart: 1993,
        yearEnd: 1998,
        basePower: 220,
        description: "2JZ-GTE - легендарный двигатель с огромным потенциалом"
    },
    {
        _id: "mazda-rx7-fd3s",
        brand: "Mazda",
        model: "RX-7",
        generation: "FD3S",
        slug: "mazda-rx7-fd3s",
        fullName: "Mazda RX-7 FD3S",
        mainImageUrl: "/assets/images/mazda-rx7-fd3s.png",
        yearStart: 1992,
        yearEnd: 2002,
        basePower: 280,
        description: "Роторный двигатель 13B-REW - уникальная конструкция"
    },
    {
        _id: "nissan-silvia-s15",
        brand: "Nissan",
        model: "Silvia",
        generation: "S15",
        slug: "nissan-silvia-s15",
        fullName: "Nissan Silvia S15",
        mainImageUrl: "/assets/images/nissan-silvia-s15.png",
        yearStart: 1999,
        yearEnd: 2002,
        basePower: 250,
        description: "Последнее поколение Silvia с улучшенным дизайном"
    }
];

// GET /api/cars
router.get('/', (req, res) => {
    res.json({
        success: true,
        count: mockCars.length,
        data: mockCars
    });
});

// GET /api/cars/:slug
router.get('/:slug', (req, res) => {
    const { slug } = req.params;
    const car = mockCars.find(c => c.slug === slug);
    
    if (!car) {
        return res.status(404).json({
            success: false,
            error: 'Автомобиль не найден'
        });
    }
    
    res.json({
        success: true,
        data: {
            car: car,
            parts: [], // Временно пусто
            partsByCategory: [] // Временно пусто
        }
    });
});

module.exports = router;
