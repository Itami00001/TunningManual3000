/**
 * Простая файловая база данных для надежной работы
 */

const fs = require('fs').promises;
const path = require('path');

class FileDB {
    constructor(dataDir = './data') {
        this.dataDir = dataDir;
        this.ensureDataDir();
    }

    async ensureDataDir() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
        } catch (error) {
            console.error('Ошибка создания директории данных:', error);
        }
    }

    async readFile(filename) {
        try {
            const filePath = path.join(this.dataDir, filename);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return null; // Файл не найден
            }
            throw error;
        }
    }

    async writeFile(filename, data) {
        const filePath = path.join(this.dataDir, filename);
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }

    async getCars() {
        const cars = await this.readFile('cars.json');
        return cars || this.getDefaultCars();
    }

    async getCarBySlug(slug) {
        const cars = await this.getCars();
        return cars.find(car => car.slug === slug);
    }

    async getPartsByCarSlug(carSlug) {
        const parts = await this.readFile('parts.json');
        const car = await this.getCarBySlug(carSlug);
        
        if (!parts || !car) return [];
        
        return parts.filter(part => 
            part.compatibleCars && part.compatibleCars.includes(car.id)
        );
    }

    getDefaultCars() {
        return [
            {
                id: 'nissan-silvia-s14',
                brand: 'Nissan',
                model: 'Silvia',
                generation: 'S14',
                slug: 'nissan-silvia-s14',
                fullName: 'Nissan Silvia S14',
                mainImageUrl: '/assets/images/nissan-silvia-s14.png',
                yearStart: 1993,
                yearEnd: 1998,
                basePower: 220,
                description: 'Легендарное JDM купе с двигателем SR20DET',
                isActive: true
            },
            {
                id: 'nissan-skyline-r34-gtr',
                brand: 'Nissan',
                model: 'Skyline',
                generation: 'R34 GT-R',
                slug: 'nissan-skyline-r34-gtr',
                fullName: 'Nissan Skyline R34 GT-R',
                mainImageUrl: '/assets/images/nissan-skyline-r34.png',
                yearStart: 1999,
                yearEnd: 2002,
                basePower: 280,
                description: 'Godzilla - культовый спортивный автомобиль',
                isActive: true
            },
            {
                id: 'toyota-supra-a80',
                brand: 'Toyota',
                model: 'Supra',
                generation: 'A80',
                slug: 'toyota-supra-a80',
                fullName: 'Toyota Supra A80',
                mainImageUrl: '/assets/images/toyota-supra-a80.png',
                yearStart: 1993,
                yearEnd: 1998,
                basePower: 220,
                description: '2JZ-GTE - легендарный двигатель с огромным потенциалом',
                isActive: true
            },
            {
                id: 'mazda-rx7-fd3s',
                brand: 'Mazda',
                model: 'RX-7',
                generation: 'FD3S',
                slug: 'mazda-rx7-fd3s',
                fullName: 'Mazda RX-7 FD3S',
                mainImageUrl: '/assets/images/mazda-rx7-fd3s.png',
                yearStart: 1992,
                yearEnd: 2002,
                basePower: 280,
                description: 'Роторный двигатель 13B-REW - уникальная конструкция',
                isActive: true
            },
            {
                id: 'nissan-silvia-s15',
                brand: 'Nissan',
                model: 'Silvia',
                generation: 'S15',
                slug: 'nissan-silvia-s15',
                fullName: 'Nissan Silvia S15',
                mainImageUrl: '/assets/images/nissan-silvia-s15.png',
                yearStart: 1999,
                yearEnd: 2002,
                basePower: 250,
                description: 'Последнее поколение Silvia с улучшенным дизайном',
                isActive: true
            }
        ];
    }

    async initializeData() {
        try {
            // Проверяем, есть ли данные
            const cars = await this.getCars();
            
            if (cars && cars.length > 0) {
                console.log('✅ Данные уже существуют');
                return;
            }

            // Инициализируем данными по умолчанию
            console.log('🔄 Инициализация данных...');
            
            // Сохраняем автомобили
            await this.writeFile('cars.json', this.getDefaultCars());
            
            // Импортируем детали
            await this.importParts();
            
            console.log('✅ Данные инициализированы');
        } catch (error) {
            console.error('❌ Ошибка инициализации данных:', error);
        }
    }

    async importParts() {
        try {
            const fs = require('fs');
            const partsData = JSON.parse(fs.readFileSync('./tuning_parts_final.json', 'utf8'));
            const cars = await this.getCars();
            
            // Создаем категории
            const categories = [
                { id: 'engine', name: 'Двигатель', slug: 'engine', icon: '⚙️', order: 1 },
                { id: 'turbo', name: 'Турбина', slug: 'turbo', icon: '💨', order: 2 },
                { id: 'exhaust', name: 'Выхлопная система', slug: 'exhaust', icon: '💥', order: 3 },
                { id: 'suspension', name: 'Подвеска', slug: 'suspension', icon: '🔩', order: 4 },
                { id: 'brakes', name: 'Тормоза', slug: 'brakes', icon: '🛑', order: 5 },
                { id: 'intake', name: 'Впуск', slug: 'intake', icon: '🌪️', order: 6 },
                { id: 'fuel', name: 'Топливная система', slug: 'fuel', icon: '⛽', order: 7 },
                { id: 'ecu', name: 'ЭБУ и электроника', slug: 'ecu', icon: '💻', order: 8 },
                { id: 'camshaft', name: 'Распредвалы', slug: 'camshaft', icon: '⚙️', order: 9 },
                { id: 'ignition', name: 'Зажигание', slug: 'ignition', icon: '⚡', order: 10 },
                { id: 'cooling', name: 'Охлаждение', slug: 'cooling', icon: '❄️', order: 11 },
                { id: 'engine_management', name: 'Управление двигателем', slug: 'engine_management', icon: '🔧', order: 12 },
                { id: 'other', name: 'Другое', slug: 'other', icon: '🔧', order: 99 }
            ];
            
            await this.writeFile('categories.json', categories);
            
            // Обрабатываем детали
            const processedParts = partsData.map(partData => {
                // Находим совместимый автомобиль
                let compatibleCars = [];
                
                // Сначала точное совпадение
                let compatibleCar = cars.find(car => 
                    car.fullName.toLowerCase().includes(partData.vehicle.toLowerCase()) ||
                    partData.vehicle.toLowerCase().includes(car.fullName.toLowerCase())
                );
                
                // Если не нашли, ищем по модели
                if (!compatibleCar) {
                    if (partData.vehicle.toLowerCase().includes('skyline')) {
                        compatibleCar = cars.find(car => car.model.toLowerCase() === 'skyline');
                    } else if (partData.vehicle.toLowerCase().includes('silvia s15')) {
                        compatibleCar = cars.find(car => car.slug === 'nissan-silvia-s15');
                    } else if (partData.vehicle.toLowerCase().includes('silvia s14')) {
                        compatibleCar = cars.find(car => car.slug === 'nissan-silvia-s14');
                    } else if (partData.vehicle.toLowerCase().includes('silvia')) {
                        // Для деталей, подходящих для S14/S15, добавляем оба автомобиля
                        if (partData.vehicle.toLowerCase().includes('s14/s15')) {
                            const s14 = cars.find(car => car.slug === 'nissan-silvia-s14');
                            const s15 = cars.find(car => car.slug === 'nissan-silvia-s15');
                            if (s14) compatibleCars.push(s14.id);
                            if (s15) compatibleCars.push(s15.id);
                        } else if (partData.name.toLowerCase().includes('s14/s15')) {
                            // Если в названии есть S14/S15, добавляем оба
                            const s14 = cars.find(car => car.slug === 'nissan-silvia-s14');
                            const s15 = cars.find(car => car.slug === 'nissan-silvia-s15');
                            if (s14) compatibleCars.push(s14.id);
                            if (s15) compatibleCars.push(s15.id);
                        } else if (partData.name.toLowerCase().includes('drift angle lock kit') && 
                                   partData.name.toLowerCase().includes('s14/s15')) {
                            // Drift Angle Lock Kit для S14/S15
                            const s14 = cars.find(car => car.slug === 'nissan-silvia-s14');
                            const s15 = cars.find(car => car.slug === 'nissan-silvia-s15');
                            if (s14) compatibleCars.push(s14.id);
                            if (s15) compatibleCars.push(s15.id);
                        } else if (partData.name.toLowerCase().includes('rear suspension') && 
                                   partData.name.toLowerCase().includes('s14/s15')) {
                            // Rear Suspension для S14/S15
                            const s14 = cars.find(car => car.slug === 'nissan-silvia-s14');
                            const s15 = cars.find(car => car.slug === 'nissan-silvia-s15');
                            if (s14) compatibleCars.push(s14.id);
                            if (s15) compatibleCars.push(s15.id);
                        } else if (partData.name.toLowerCase().includes('walbro 255')) {
                            // Walbro 255lph - универсальный для многих
                            const s14 = cars.find(car => car.slug === 'nissan-silvia-s14');
                            const s15 = cars.find(car => car.slug === 'nissan-silvia-s15');
                            if (s14) compatibleCars.push(s14.id);
                            if (s15) compatibleCars.push(s15.id);
                        } else if (partData.name.toLowerCase().includes('walbro 255') && 
                                   partData.name.toLowerCase().includes('л/ч')) {
                            // Walbro 255л/ч - универсальный для многих
                            const s14 = cars.find(car => car.slug === 'nissan-silvia-s14');
                            const s15 = cars.find(car => car.slug === 'nissan-silvia-s15');
                            if (s14) compatibleCars.push(s14.id);
                            if (s15) compatibleCars.push(s15.id);
                        } else if (partData.vehicle.toLowerCase().includes('s14')) {
                            // Проверяем, не относится ли деталь также к S15
                            if (partData.name.toLowerCase().includes('s15') || 
                                partData.name.toLowerCase().includes('s14/s15')) {
                                const s14 = cars.find(car => car.slug === 'nissan-silvia-s14');
                                const s15 = cars.find(car => car.slug === 'nissan-silvia-s15');
                                if (s14) compatibleCars.push(s14.id);
                                if (s15) compatibleCars.push(s15.id);
                            } else {
                                compatibleCar = cars.find(car => car.slug === 'nissan-silvia-s14');
                            }
                        } else if (partData.vehicle.toLowerCase().includes('s15')) {
                            // Проверяем, не относится ли деталь также к S14
                            if (partData.name.toLowerCase().includes('s14') || 
                                partData.name.toLowerCase().includes('s14/s15')) {
                                const s14 = cars.find(car => car.slug === 'nissan-silvia-s14');
                                const s15 = cars.find(car => car.slug === 'nissan-silvia-s15');
                                if (s14) compatibleCars.push(s14.id);
                                if (s15) compatibleCars.push(s15.id);
                            } else {
                                compatibleCar = cars.find(car => car.slug === 'nissan-silvia-s15');
                            }
                        }
                    }
                }
                
                if (compatibleCar && compatibleCars.length === 0) {
                    compatibleCars.push(compatibleCar.id);
                }
                
                // Находим категорию
                const category = categories.find(cat => cat.slug === partData.category);
                
                const part = {
                    id: `part_${Math.random().toString(36).substr(2, 9)}`,
                    name: partData.name,
                    categoryId: category?.id || 'other',
                    description: partData.description,
                    specs: partData.specs || {},
                    imageUrl: partData.imageUrl || '/assets/images/placeholder-part.png',
                    marketSearchQuery: partData.marketSearchQuery || `${partData.name} купить`,
                    manufacturer: partData.manufacturer,
                    price_approx: partData.price_approx,
                    compatibility_score: partData.compatibility_score,
                    compatibility_notes: partData.compatibility_notes,
                    complexity_install: partData.complexity_install,
                    compatibleCars: compatibleCars,
                    isActive: true
                };
                
                if (compatibleCars.length > 0) {
                    console.log(`✅ Привязка: ${part.name} → ${compatibleCars.map(id => {
                        const car = cars.find(c => c.id === id);
                        return car ? car.fullName : id;
                    }).join(', ')}`);
                } else {
                    console.warn(`⚠️ Не найден автомобиль для: ${partData.vehicle} - ${part.name}`);
                }
                
                return part;
            });
            
            await this.writeFile('parts.json', processedParts);
            console.log(`✅ Импортировано деталей: ${processedParts.length}`);
            
        } catch (error) {
            console.error('❌ Ошибка импорта деталей:', error);
        }
    }
}

module.exports = FileDB;
