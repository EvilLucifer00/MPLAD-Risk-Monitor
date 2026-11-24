-- ============================================================================
-- MPLADS Risk Monitor - Supabase Database Initialization
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- ============================================================================

-- 1. District Authority (DM / Collector)
CREATE TABLE IF NOT EXISTS mplads_dm (
    id SERIAL PRIMARY KEY,
    dm_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    dist TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Member of Parliament (MP)
CREATE TABLE IF NOT EXISTS mplads_mp (
    id SERIAL PRIMARY KEY,
    mp_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    constituency TEXT NOT NULL,
    dist TEXT NOT NULL,
    house TEXT NOT NULL, -- 'Lok Sabha' or 'Rajya Sabha'
    state TEXT NOT NULL,
    dm_id INT REFERENCES mplads_dm(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vendors
CREATE TABLE IF NOT EXISTS mplads_vendors (
    id SERIAL PRIMARY KEY,
    vendor_name TEXT NOT NULL,
    registration_number TEXT,
    global_risk_score NUMERIC(5,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Cost Details
CREATE TABLE IF NOT EXISTS mplads_cost_details (
    id SERIAL PRIMARY KEY,
    estimated_cost NUMERIC(12,2) DEFAULT 0.0,
    sanctioned_amount NUMERIC(12,2) DEFAULT 0.0,
    utilized_amount NUMERIC(12,2) DEFAULT 0.0,
    unspent_balance NUMERIC(12,2) DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Risk Scores (Evaluated by ML pipeline)
CREATE TABLE IF NOT EXISTS mplads_risk_scores (
    id SERIAL PRIMARY KEY,
    work_id TEXT, -- Queue correlation UUID
    risk_score NUMERIC(5,2) DEFAULT 0.0,
    risk_level TEXT DEFAULT 'LOW', -- 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'
    cost_anomaly_risk NUMERIC(5,2) DEFAULT 0.0,
    timeline_delay_risk NUMERIC(5,2) DEFAULT 0.0,
    duplicate_work_risk NUMERIC(5,2) DEFAULT 0.0,
    vendor_risk NUMERIC(5,2) DEFAULT 0.0,
    top_factors JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Main Projects Table
CREATE TABLE IF NOT EXISTS mplads_new_projects (
    id SERIAL PRIMARY KEY,
    mp_id INT REFERENCES mplads_mp(id) ON DELETE CASCADE,
    dm_id INT REFERENCES mplads_dm(id) ON DELETE SET NULL,
    state TEXT NOT NULL,
    district TEXT NOT NULL,
    constituency TEXT NOT NULL,
    project_title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'
    submit_date DATE DEFAULT CURRENT_DATE,
    start_date DATE,
    end_date DATE,
    vendor_id INT REFERENCES mplads_vendors(id) ON DELETE SET NULL,
    rejection_reason TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    implementing_agency_id INT,
    cost_details_id INT REFERENCES mplads_cost_details(id) ON DELETE SET NULL,
    risk_id INT REFERENCES mplads_risk_scores(id) ON DELETE SET NULL,
    risk_work_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Project Documents (Cloudinary links)
CREATE TABLE IF NOT EXISTS mplads_documents (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES mplads_new_projects(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_by TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Project Events (Timeline & Audit)
CREATE TABLE IF NOT EXISTS mplads_project_events (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES mplads_new_projects(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    actor_role TEXT,
    actor_id INT,
    new_status TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Notifications
CREATE TABLE IF NOT EXISTS mplads_notifications (
    id SERIAL PRIMARY KEY,
    project_id INT REFERENCES mplads_new_projects(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    recipient_role TEXT,
    recipient_id INT,
    actor_role TEXT,
    actor_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Disable RLS for Initial Setup (Allows API reading & writing)
-- ============================================================================
ALTER TABLE mplads_dm DISABLE ROW LEVEL SECURITY;
ALTER TABLE mplads_mp DISABLE ROW LEVEL SECURITY;
ALTER TABLE mplads_vendors DISABLE ROW LEVEL SECURITY;
ALTER TABLE mplads_cost_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE mplads_risk_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE mplads_new_projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE mplads_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE mplads_project_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE mplads_notifications DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Seed Sample Data (1 DM, 1 MP, 2 Sample Projects)
-- ============================================================================
INSERT INTO mplads_dm (id, dm_name, username, password_hash, dist, state)
VALUES (1, 'Dr. Rajesh Sharma, IAS', 'dm_pune', 'admin123', 'Pune', 'Maharashtra')
ON CONFLICT (id) DO NOTHING;

INSERT INTO mplads_mp (id, mp_name, username, password_hash, constituency, dist, house, state, dm_id)
VALUES (1, 'Shri Supriya Sule', 'mp_baramati', 'admin123', 'Baramati', 'Pune', 'Lok Sabha', 'Maharashtra', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mplads_cost_details (id, estimated_cost, sanctioned_amount, utilized_amount, unspent_balance)
VALUES 
    (1, 2500000.00, 2500000.00, 1800000.00, 700000.00),
    (2, 1200000.00, 1200000.00, 1200000.00, 0.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mplads_risk_scores (id, work_id, risk_score, risk_level, cost_anomaly_risk, timeline_delay_risk, duplicate_work_risk, vendor_risk)
VALUES 
    (1, 'w-001', 22.5, 'LOW', 10.0, 15.0, 5.0, 8.0),
    (2, 'w-002', 78.0, 'HIGH', 65.0, 80.0, 12.0, 75.0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO mplads_new_projects (id, mp_id, dm_id, state, district, constituency, project_title, category, description, status, cost_details_id, risk_id)
VALUES 
    (1, 1, 1, 'Maharashtra', 'Pune', 'Baramati', 'Construction of Rural Community Health Centre', 'HEALTH', 'Provision of OPD rooms and primary care infrastructure.', 'IN_PROGRESS', 1, 1),
    (2, 1, 1, 'Maharashtra', 'Pune', 'Baramati', 'Solar Powered Drinking Water Filtration Unit', 'WATER_SUPPLY', 'Installation of RO water purification plant in Gram Panchayat.', 'COMPLETED', 2, 2)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence counters to avoid duplicate keys on next inserts
SELECT setval('mplads_dm_id_seq', (SELECT MAX(id) FROM mplads_dm));
SELECT setval('mplads_mp_id_seq', (SELECT MAX(id) FROM mplads_mp));
SELECT setval('mplads_cost_details_id_seq', (SELECT MAX(id) FROM mplads_cost_details));
SELECT setval('mplads_risk_scores_id_seq', (SELECT MAX(id) FROM mplads_risk_scores));
SELECT setval('mplads_new_projects_id_seq', (SELECT MAX(id) FROM mplads_new_projects));
