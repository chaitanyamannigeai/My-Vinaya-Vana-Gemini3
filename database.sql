CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    capacity INT NOT NULL DEFAULT 2,
    amenities LONGTEXT, 
    images LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(50) PRIMARY KEY,
    room_id VARCHAR(50),
    guest_name VARCHAR(255),
    guest_phone VARCHAR(50),
    check_in DATE,
    check_out DATE,
    total_amount DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS drivers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    phone VARCHAR(50),
    whatsapp VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    vehicle_info VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CAB LOCATIONS TABLE
-- 'image_url' uses LONGTEXT to allow Base64 image uploads
-- 'price' defaults to 0.00 to prevent crash on empty input
CREATE TABLE IF NOT EXISTS cab_locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    image_url LONGTEXT,
    price DECIMAL(10,2) DEFAULT 0.00,
    driver_id VARCHAR(50),
    active BOOLEAN DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(50) PRIMARY KEY,
    guest_name VARCHAR(255),
    location VARCHAR(255),
    rating INT DEFAULT 5,
    comment TEXT,
    date DATE,
    show_on_home BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. SITE SETTINGS TABLE
-- 'value' uses LONGTEXT because it stores the Hero Image (large string)
CREATE TABLE IF NOT EXISTS site_settings (
    key_name VARCHAR(50) PRIMARY KEY,
    value LONGTEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. GALLERY TABLE
-- 'url' uses LONGTEXT for image data
CREATE TABLE IF NOT EXISTS gallery (
    id VARCHAR(50) PRIMARY KEY,
    url LONGTEXT,
    category VARCHAR(100),
    caption TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. PRICING RULES TABLE
CREATE TABLE IF NOT EXISTS pricing_rules (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    start_date DATE,
    end_date DATE,
    multiplier DECIMAL(3,2) DEFAULT 1.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
