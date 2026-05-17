-- ====================================
-- TuningManual3000 - PostgreSQL Schema
-- ====================================
-- Инициализация базы данных PostgreSQL

-- Расширение для UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================
-- Таблица: Автомобили
-- ====================================
CREATE TABLE IF NOT EXISTS cars (
    id VARCHAR(50) PRIMARY KEY,
    brand VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    generation VARCHAR(50),
    slug VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    main_image_url TEXT,
    year_start INTEGER,
    year_end INTEGER,
    base_power INTEGER NOT NULL DEFAULT 0,
    base_torque INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    parts_group VARCHAR(50)[], -- Массив групп деталей
    default_kit_id VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- Таблица: Категории деталей
-- ====================================
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon VARCHAR(10),
    description TEXT,
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- Таблица: Детали
-- ====================================
CREATE TABLE IF NOT EXISTS parts (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id VARCHAR(50) REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    manufacturer VARCHAR(100),
    price_approx VARCHAR(50),
    image_url TEXT,
    market_search_query TEXT,
    compatibility_score INTEGER CHECK (compatibility_score BETWEEN 0 AND 10),
    compatibility_notes TEXT,
    complexity_install INTEGER CHECK (complexity_install BETWEEN 1 AND 10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- Таблица: Характеристики деталей (specs)
-- ====================================
CREATE TABLE IF NOT EXISTS part_specs (
    id SERIAL PRIMARY KEY,
    part_id VARCHAR(50) REFERENCES parts(id) ON DELETE CASCADE,
    spec_key VARCHAR(100) NOT NULL,
    spec_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(part_id, spec_key)
);

-- ====================================
-- Таблица: Совместимость деталей с автомобилями
-- ====================================
CREATE TABLE IF NOT EXISTS part_compatibility (
    part_id VARCHAR(50) REFERENCES parts(id) ON DELETE CASCADE,
    car_id VARCHAR(50) REFERENCES cars(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (part_id, car_id)
);

-- ====================================
-- Таблица: Синергия деталей
-- ====================================
CREATE TABLE IF NOT EXISTS part_synergy (
    part_id VARCHAR(50) REFERENCES parts(id) ON DELETE CASCADE,
    related_part_id VARCHAR(50) REFERENCES parts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (part_id, related_part_id)
);

-- ====================================
-- Таблица: Источники деталей
-- ====================================
CREATE TABLE IF NOT EXISTS part_sources (
    id SERIAL PRIMARY KEY,
    part_id VARCHAR(50) REFERENCES parts(id) ON DELETE CASCADE,
    url TEXT,
    title VARCHAR(255),
    quote TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- Таблица: Комплекты (Kits)
-- ====================================
CREATE TABLE IF NOT EXISTS kits (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    for_car_id VARCHAR(50) REFERENCES cars(id) ON DELETE SET NULL,
    description TEXT,
    estimated_power_gain INTEGER,
    estimated_cost VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- Таблица: Детали в комплектах
-- ====================================
CREATE TABLE IF NOT EXISTS kit_parts (
    kit_id VARCHAR(50) REFERENCES kits(id) ON DELETE CASCADE,
    part_id VARCHAR(50) REFERENCES parts(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (kit_id, part_id)
);

-- ====================================
-- Таблица: Формулы расчетов
-- ====================================
CREATE TABLE IF NOT EXISTS formulas (
    id SERIAL PRIMARY KEY,
    formula_key VARCHAR(100) UNIQUE NOT NULL,
    formula_type VARCHAR(50), -- 'display', 'chart', etc.
    category VARCHAR(50),
    formula_text TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- Таблица: Сохраненные сборки (Builds)
-- ====================================
CREATE TABLE IF NOT EXISTS builds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    car_id VARCHAR(50) REFERENCES cars(id) ON DELETE SET NULL,
    name VARCHAR(255),
    description TEXT,
    total_power INTEGER,
    total_torque INTEGER,
    total_cost VARCHAR(50),
    build_compatibility DECIMAL(3,2),
    install_difficulty INTEGER,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- Таблица: Детали в сборках
-- ====================================
CREATE TABLE IF NOT EXISTS build_parts (
    build_id UUID REFERENCES builds(id) ON DELETE CASCADE,
    part_id VARCHAR(50) REFERENCES parts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (build_id, part_id)
);

-- ====================================
-- Индексы для оптимизации
-- ====================================
CREATE INDEX idx_parts_category ON parts(category_id);
CREATE INDEX idx_parts_active ON parts(is_active);
CREATE INDEX idx_parts_manufacturer ON parts(manufacturer);
CREATE INDEX idx_cars_active ON cars(is_active);
CREATE INDEX idx_cars_brand ON cars(brand);
CREATE INDEX idx_kits_car ON kits(for_car_id);
CREATE INDEX idx_builds_car ON builds(car_id);
CREATE INDEX idx_builds_public ON builds(is_public);

-- ====================================
-- Триггеры для обновления updated_at
-- ====================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kits_updated_at BEFORE UPDATE ON kits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_builds_updated_at BEFORE UPDATE ON builds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_formulas_updated_at BEFORE UPDATE ON formulas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
