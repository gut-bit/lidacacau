-- LidaCacau - Database Schema
-- PostgreSQL schema for rural marketplace application
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    location VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'worker' CHECK (role IN ('producer', 'worker', 'admin')),
    roles TEXT[] DEFAULT ARRAY['worker'],
    active_role VARCHAR(20) NOT NULL DEFAULT 'worker' CHECK (active_role IN ('producer', 'worker', 'admin')),
    avatar TEXT,
    cover_photo TEXT,
    level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
    producer_level INTEGER DEFAULT 1 CHECK (producer_level BETWEEN 1 AND 5),
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    producer_reviews INTEGER DEFAULT 0,
    producer_rating DECIMAL(3,2) DEFAULT 0,
    tutorial_completed BOOLEAN DEFAULT FALSE,
    search_radius INTEGER DEFAULT 50,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    profile_type VARCHAR(20) NOT NULL CHECK (profile_type IN ('worker', 'producer')),
    bio TEXT,
    skills TEXT[],
    equipment TEXT[],
    certifications TEXT[],
    availability VARCHAR(255),
    preferred_radius INTEGER DEFAULT 50,
    total_jobs INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,
    total_spent DECIMAL(12,2) DEFAULT 0,
    pix_key VARCHAR(255),
    pix_key_type VARCHAR(20) CHECK (pix_key_type IN ('cpf', 'email', 'phone', 'random')),
    UNIQUE(user_id, profile_type)
);

CREATE TABLE IF NOT EXISTS user_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (status IN ('none', 'pending', 'approved', 'rejected')),
    document_type VARCHAR(20) CHECK (document_type IN ('rg', 'cnh', 'ctps')),
    document_photo_uri TEXT,
    selfie_photo_uri TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT
);

CREATE TABLE IF NOT EXISTS user_social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    whatsapp VARCHAR(255),
    whatsapp_group VARCHAR(255),
    instagram VARCHAR(255),
    facebook VARCHAR(255),
    telegram VARCHAR(255),
    youtube VARCHAR(255),
    linkedin VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS user_personal_background (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    birth_place VARCHAR(255),
    years_in_region INTEGER,
    family_connections TEXT,
    personal_story TEXT,
    fun_fact TEXT
);

CREATE TABLE IF NOT EXISTS user_referral (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    code VARCHAR(50) UNIQUE NOT NULL,
    referred_by UUID REFERENCES users(id),
    total_xp_earned INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referrer_id, referred_id)
);

CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_uri TEXT NOT NULL,
    description TEXT,
    service_type_id UUID,
    item_type VARCHAR(20) DEFAULT 'portfolio' CHECK (item_type IN ('portfolio', 'work_photo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    institution VARCHAR(255),
    photo_uri TEXT,
    description TEXT,
    issue_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    type VARCHAR(20) DEFAULT 'text' CHECK (type IN ('text', 'audio')),
    content TEXT NOT NULL,
    audio_uri TEXT,
    relationship VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(20),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target INTEGER NOT NULL,
    current INTEGER DEFAULT 0,
    reward VARCHAR(255),
    icon VARCHAR(50),
    UNIQUE(user_id, goal_id)
);

-- ============================================
-- SERVICE TYPES
-- ============================================

CREATE TABLE IF NOT EXISTS service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    min_level INTEGER DEFAULT 1 CHECK (min_level BETWEEN 1 AND 5),
    icon VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROPERTIES & RURAL MANAGEMENT
-- ============================================

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(255) DEFAULT 'Uruara',
    state VARCHAR(50) DEFAULT 'PA',
    area_hectares DECIMAL(10,2),
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    polygon_boundary JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_at TIMESTAMP WITH TIME ZONE,
    cover_photo_uri TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS talhoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    area_hectares DECIMAL(10,2) NOT NULL,
    crop_type VARCHAR(50) NOT NULL CHECK (crop_type IN ('cacau', 'cafe', 'banana', 'pasto', 'reserva', 'outro')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS talhao_service_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talhao_id UUID NOT NULL REFERENCES talhoes(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date DATE
);

CREATE TABLE IF NOT EXISTS property_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('car', 'matricula', 'licenca_ambiental', 'outro')),
    name VARCHAR(255) NOT NULL,
    file_uri TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- JOBS (DEMANDAS)
-- ============================================

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES service_types(id),
    quantity INTEGER NOT NULL,
    location_text VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    start_date DATE,
    end_date DATE,
    offer DECIMAL(10,2) NOT NULL,
    notes TEXT,
    photos TEXT[],
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    price DECIMAL(10,2) NOT NULL,
    message TEXT,
    proposed_terms JSONB,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WORK ORDERS (ORDENS DE SERVIÇO)
-- ============================================

CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id),
    worker_id UUID NOT NULL REFERENCES users(id),
    producer_id UUID NOT NULL REFERENCES users(id),
    final_price DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'checked_in', 'checked_out', 'completed')),
    payment_terms JSONB,
    negotiation_history JSONB,
    negotiation_status VARCHAR(20) CHECK (negotiation_status IN ('pending', 'proposed', 'counter', 'accepted', 'rejected')),
    signed_contract JSONB,
    payment JSONB,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_in_latitude DECIMAL(10,7),
    check_in_longitude DECIMAL(10,7),
    check_out_time TIMESTAMP WITH TIME ZONE,
    check_out_latitude DECIMAL(10,7),
    check_out_longitude DECIMAL(10,7),
    photo_before TEXT,
    photo_after TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id),
    reviewee_id UUID NOT NULL REFERENCES users(id),
    reviewer_role VARCHAR(20) NOT NULL CHECK (reviewer_role IN ('producer', 'worker')),
    quality INTEGER NOT NULL CHECK (quality BETWEEN 1 AND 5),
    safety INTEGER NOT NULL CHECK (safety BETWEEN 1 AND 5),
    punctuality INTEGER NOT NULL CHECK (punctuality BETWEEN 1 AND 5),
    communication INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 5),
    fairness INTEGER NOT NULL CHECK (fairness BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(work_order_id, reviewer_role)
);

-- ============================================
-- SERVICE OFFERS (OFERTAS DE TRABALHADORES)
-- ============================================

CREATE TABLE IF NOT EXISTS service_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type_ids UUID[] NOT NULL,
    price_per_unit DECIMAL(10,2),
    price_per_day DECIMAL(10,2),
    price_per_hour DECIMAL(10,2),
    price_negotiable BOOLEAN DEFAULT TRUE,
    location_text VARCHAR(255) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    available_radius INTEGER DEFAULT 50,
    availability VARCHAR(255),
    description TEXT,
    photos TEXT[],
    extras JSONB,
    visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'deleted')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'matched', 'completed', 'expired', 'cancelled')),
    view_count INTEGER DEFAULT 0,
    interest_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS offer_interests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    offer_id UUID NOT NULL REFERENCES service_offers(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES users(id),
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(offer_id, producer_id)
);

-- ============================================
-- SOCIAL: FRIENDS (AMIGOS DO CAMPO)
-- ============================================

CREATE TABLE IF NOT EXISTS friend_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(requester_id, receiver_id)
);

-- ============================================
-- SOCIAL: CHAT & MESSAGES
-- ============================================

CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_ids UUID[] NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_room_unread (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unread_count INTEGER DEFAULT 0,
    UNIQUE(room_id, user_id)
);

CREATE TABLE IF NOT EXISTS direct_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SOCIAL: USER PRESENCE
-- ============================================

CREATE TABLE IF NOT EXISTS user_presence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- WORK TEAMS (ESQUADRAO DA LIDA)
-- ============================================

CREATE TABLE IF NOT EXISTS work_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    leader_id UUID NOT NULL REFERENCES users(id),
    description TEXT,
    max_members INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'disbanded', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES work_teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    joined_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(team_id, user_id)
);

-- ============================================
-- PIX PAYMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS pix_charges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    correlation_id VARCHAR(255) UNIQUE NOT NULL,
    work_order_id UUID REFERENCES work_orders(id),
    payer_id UUID NOT NULL REFERENCES users(id),
    payer_name VARCHAR(255) NOT NULL,
    receiver_id UUID NOT NULL REFERENCES users(id),
    receiver_name VARCHAR(255) NOT NULL,
    receiver_pix_key VARCHAR(255),
    value DECIMAL(10,2) NOT NULL,
    description TEXT,
    br_code TEXT NOT NULL,
    qr_code_image TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled', 'refunded')),
    charge_type VARCHAR(20) NOT NULL CHECK (charge_type IN ('worker_payout', 'platform_fee', 'manual')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CONTRACT HISTORY
-- ============================================

CREATE TABLE IF NOT EXISTS contract_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id),
    job_id UUID NOT NULL REFERENCES jobs(id),
    contract JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('producer', 'worker')),
    other_party_id UUID NOT NULL REFERENCES users(id),
    other_party_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(255) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'completed', 'cancelled')),
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- EDUCATION SYSTEM
-- ============================================

CREATE TABLE IF NOT EXISTS skill_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id VARCHAR(100) NOT NULL,
    xp_total INTEGER DEFAULT 0,
    level VARCHAR(50) DEFAULT 'teaser' CHECK (level IN ('teaser', 'N1_assistido', 'N2_autonomo', 'N3_mentoravel')),
    courses_completed TEXT[],
    quizzes_completed JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, skill_id)
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_questions INTEGER NOT NULL,
    correct_questions INTEGER NOT NULL,
    percent DECIMAL(5,2) NOT NULL,
    passed BOOLEAN DEFAULT FALSE,
    xp_calculated INTEGER DEFAULT 0,
    xp_awarded INTEGER DEFAULT 0,
    answers INTEGER[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    preferred_service_types UUID[],
    preferred_radius INTEGER DEFAULT 50,
    min_price DECIMAL(10,2),
    max_price DECIMAL(10,2),
    preferred_payment_terms TEXT[],
    notification_new_matches BOOLEAN DEFAULT TRUE,
    notification_new_offers BOOLEAN DEFAULT TRUE,
    notification_new_demands BOOLEAN DEFAULT TRUE,
    notification_price_changes BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CARD PRESETS
-- ============================================

CREATE TABLE IF NOT EXISTS card_presets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('demand', 'offer')),
    service_type_ids UUID[],
    default_price DECIMAL(10,2),
    default_location VARCHAR(255),
    default_description TEXT,
    default_extras JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CARD MATCHES
-- ============================================

CREATE TABLE IF NOT EXISTS card_matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demand_id UUID REFERENCES jobs(id),
    offer_id UUID REFERENCES service_offers(id),
    producer_id UUID NOT NULL REFERENCES users(id),
    worker_id UUID NOT NULL REFERENCES users(id),
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(30) DEFAULT 'pending_negotiation' CHECK (status IN ('pending_negotiation', 'negotiating', 'agreed', 'cancelled')),
    chat_messages JSONB,
    agreed_price DECIMAL(10,2),
    agreed_terms JSONB
);

-- ============================================
-- ANALYTICS EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- SESSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(active_role);

CREATE INDEX IF NOT EXISTS idx_properties_owner ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(verification_status);

CREATE INDEX IF NOT EXISTS idx_jobs_producer ON jobs(producer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_service_type ON jobs(service_type_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bids_job ON bids(job_id);
CREATE INDEX IF NOT EXISTS idx_bids_worker ON bids(worker_id);
CREATE INDEX IF NOT EXISTS idx_bids_status ON bids(status);

CREATE INDEX IF NOT EXISTS idx_work_orders_job ON work_orders(job_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_worker ON work_orders(worker_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_producer ON work_orders(producer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);

CREATE INDEX IF NOT EXISTS idx_reviews_work_order ON reviews(work_order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewee ON reviews(reviewee_id);

CREATE INDEX IF NOT EXISTS idx_friend_connections_requester ON friend_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_friend_connections_receiver ON friend_connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_connections_status ON friend_connections(status);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_participants ON chat_rooms USING GIN(participant_ids);
CREATE INDEX IF NOT EXISTS idx_direct_messages_room ON direct_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created ON direct_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_service_offers_worker ON service_offers(worker_id);
CREATE INDEX IF NOT EXISTS idx_service_offers_status ON service_offers(status);
CREATE INDEX IF NOT EXISTS idx_service_offers_location ON service_offers(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_pix_charges_work_order ON pix_charges(work_order_id);
CREATE INDEX IF NOT EXISTS idx_pix_charges_payer ON pix_charges(payer_id);
CREATE INDEX IF NOT EXISTS idx_pix_charges_receiver ON pix_charges(receiver_id);
CREATE INDEX IF NOT EXISTS idx_pix_charges_status ON pix_charges(status);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at DESC);

-- ============================================
-- SEED DEFAULT SERVICE TYPES
-- ============================================

INSERT INTO service_types (id, name, unit, base_price, min_level, icon) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Poda de Cacau', 'hectare', 300.00, 1, 'cut'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Colheita de Cacau', 'arroba', 15.00, 1, 'package'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Quebra de Cacau', 'arroba', 8.00, 1, 'box'),
    ('d4e5f6a7-b8c9-0123-def1-234567890123', 'Limpeza de Area', 'hectare', 400.00, 2, 'trash-2'),
    ('e5f6a7b8-c9d0-1234-ef12-345678901234', 'Roçagem', 'hectare', 250.00, 1, 'wind'),
    ('f6a7b8c9-d0e1-2345-f123-456789012345', 'Aplicação de Adubo', 'hectare', 200.00, 2, 'droplet'),
    ('a7b8c9d0-e1f2-3456-0123-567890123456', 'Plantio', 'muda', 5.00, 1, 'plus-circle'),
    ('b8c9d0e1-f2a3-4567-1234-678901234567', 'Construção Rural', 'diária', 150.00, 3, 'home'),
    ('c9d0e1f2-a3b4-5678-2345-789012345678', 'Manutenção de Cercas', 'metro', 12.00, 2, 'grid'),
    ('d0e1f2a3-b4c5-6789-3456-890123456789', 'Transporte', 'viagem', 100.00, 2, 'truck')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_talhoes_updated_at
    BEFORE UPDATE ON talhoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_offers_updated_at
    BEFORE UPDATE ON service_offers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_teams_updated_at
    BEFORE UPDATE ON work_teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
