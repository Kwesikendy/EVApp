-- ==============================================================================
-- XCharge EV Ecosystem - PostgreSQL Database Schema with PostGIS Support
-- Task 3: Users, Fleets, Wallets, Stations, Connectors, and Telemetry Sessions
-- ==============================================================================

-- Enable geospatial extension for fast geometric proximity queries
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- 1. FLEET ACCOUNTS & CORPORATE PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fleet_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(150) NOT NULL,
    fleet_code VARCHAR(50) UNIQUE NOT NULL,
    billing_account_no VARCHAR(50) UNIQUE NOT NULL,
    credit_limit DECIMAL(12, 2) NOT NULL DEFAULT 5000.00,
    current_utilization DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. USERS & COMMERCIAL FLEET PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(30) UNIQUE NOT NULL,
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    user_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL', -- 'INDIVIDUAL', 'FLEET_DRIVER', 'OPERATOR'
    fleet_account_id UUID REFERENCES fleet_accounts(id) ON DELETE SET NULL,
    employee_badge_id VARCHAR(50),
    preferred_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 3. VEHICLES & VIN PROFILES (Personal & Commercial Fleets)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vin VARCHAR(17) UNIQUE NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    battery_capacity_kwh DECIMAL(6, 2) NOT NULL,
    max_charge_rate_kw DECIMAL(6, 2) NOT NULL DEFAULT 150.00,
    connector_standard VARCHAR(20) NOT NULL DEFAULT 'CCS2', -- 'CCS2', 'CHAdeMO', 'Type2', 'GB/T'
    owner_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    fleet_account_id UUID REFERENCES fleet_accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. WALLETS & LEDGERS (Split Wallets & MoMo Pre-Auth)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    available_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    held_balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00, -- Locked pre-authorization funds
    momo_provider VARCHAR(30), -- 'MTN', 'VODAFONE', 'MPESA', 'AIRTELTIGO'
    momo_phone_number VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'TOPUP', 'PREAUTH_HOLD', 'PREAUTH_RELEASE', 'CHARGE_SETTLEMENT'
    status VARCHAR(20) NOT NULL, -- 'PENDING', 'SUCCESS', 'FAILED', 'RELEASED'
    provider VARCHAR(30) NOT NULL, -- 'MOMO', 'CARD', 'FLEET_LEDGER'
    reference VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 5. CHARGING STATIONS & CONNECTORS (PostGIS Geospatial Coordinates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS charging_stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id VARCHAR(50) UNIQUE NOT NULL, -- e.g. 'XC-AFR-001'
    name VARCHAR(150) NOT NULL,
    operator VARCHAR(100) NOT NULL DEFAULT 'XCharge Grid Network',
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    geom GEOMETRY(Point, 4326), -- PostGIS Spatial Point for spatial indexes
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    rating DECIMAL(2, 1) DEFAULT 5.0,
    amenities TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Spatial index for radius searches (e.g. Find stations within 10km)
CREATE INDEX IF NOT EXISTS idx_stations_geom ON charging_stations USING GIST(geom);

CREATE TABLE IF NOT EXISTS connectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    station_id UUID NOT NULL REFERENCES charging_stations(id) ON DELETE CASCADE,
    connector_id_num INTEGER NOT NULL, -- 1, 2, 3 mapped to OCPP connectorId
    type VARCHAR(20) NOT NULL, -- 'CCS2', 'CHAdeMO', 'Type2', 'GB/T'
    max_power_kw DECIMAL(6, 2) NOT NULL,
    current_power_kw DECIMAL(6, 2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'Available', -- 'Available', 'Preparing', 'Charging', 'Faulted'
    tariff_per_kwh DECIMAL(8, 4) NOT NULL DEFAULT 0.3200,
    tariff_currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unq_station_connector UNIQUE(station_id, connector_id_num)
);

-- ------------------------------------------------------------------------------
-- 6. ACTIVE & HISTORICAL TELEMETRY SESSIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS charging_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(100) UNIQUE NOT NULL,
    station_id UUID NOT NULL REFERENCES charging_stations(id),
    connector_id UUID NOT NULL REFERENCES connectors(id),
    user_id UUID NOT NULL REFERENCES users(id),
    vehicle_id UUID REFERENCES vehicles(id),
    is_fleet_session BOOLEAN NOT NULL DEFAULT FALSE,
    fleet_account_id UUID REFERENCES fleet_accounts(id),
    ocpp_transaction_id INTEGER,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) NOT NULL DEFAULT 'Charging', -- 'Starting', 'Charging', 'Stopping', 'Completed'
    preauth_hold_amount DECIMAL(10, 2) DEFAULT 20.00,
    initial_soc_percent DECIMAL(5, 2),
    current_soc_percent DECIMAL(5, 2),
    target_soc_percent DECIMAL(5, 2) DEFAULT 80.00,
    current_power_kw DECIMAL(6, 2) DEFAULT 0.00,
    voltage_v DECIMAL(6, 2) DEFAULT 400.00,
    current_a DECIMAL(6, 2) DEFAULT 0.00,
    total_kwh_delivered DECIMAL(8, 3) DEFAULT 0.000,
    accrued_cost DECIMAL(10, 2) DEFAULT 0.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD'
);

CREATE TABLE IF NOT EXISTS telemetry_meter_values (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES charging_sessions(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    soc_percent DECIMAL(5, 2),
    power_kw DECIMAL(6, 2),
    kwh_total DECIMAL(8, 3),
    voltage_v DECIMAL(6, 2),
    current_a DECIMAL(6, 2)
);

CREATE INDEX IF NOT EXISTS idx_telemetry_session_time ON telemetry_meter_values(session_id, recorded_at);
