-- LifeLine Platform Database Setup Script (Revamped for Clerk Auth)
-- This is the single source of truth for your database schema.

-- First, ensure PostGIS extension is enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create custom types/enums
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('donor', 'staff', 'admin'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE blood_group AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE urgency_level AS ENUM ('low', 'medium', 'critical'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE camp_status AS ENUM ('upcoming', 'ongoing', 'completed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE rsvp_status AS ENUM ('confirmed', 'attended', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE notification_type AS ENUM ('urgent_camp', 'reminder', 'confirmation'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Users table with Clerk integration and mandatory location
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT UNIQUE NOT NULL, -- Link to Clerk's user ID
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'donor',
    blood_group blood_group,
    location GEOMETRY(POINT, 4326) NOT NULL, -- Location is a required field
    last_donation_date TIMESTAMP WITH TIME ZONE,
    is_approved BOOLEAN DEFAULT true, -- Donors are approved by default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for the users table
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users (clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_location ON users USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- Camps table
CREATE TABLE IF NOT EXISTS camps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    location GEOMETRY(POINT, 4326) NOT NULL,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIME,
    end_time TIME,
    blood_types_needed blood_group[] DEFAULT '{}',
    urgency_level urgency_level DEFAULT 'low',
    urgency_radius INTEGER CHECK (urgency_radius >= 5 AND urgency_radius <= 50),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_capacity INTEGER DEFAULT 50,
    current_rsvps INTEGER DEFAULT 0,
    status camp_status DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_bank_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_type blood_group NOT NULL,
    available_units INTEGER DEFAULT 0 CHECK (available_units >= 0),
    requested_units INTEGER DEFAULT 0 CHECK (requested_units >= 0),
    incoming_units INTEGER DEFAULT 0 CHECK (incoming_units >= 0),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(blood_bank_id, blood_type)
);

-- RSVPs table
CREATE TABLE IF NOT EXISTS rsvps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    camp_id UUID NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
    status rsvp_status DEFAULT 'confirmed',
    rsvp_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    donation_completed BOOLEAN DEFAULT false,
    UNIQUE(donor_id, camp_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    camp_id UUID REFERENCES camps(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type notification_type NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--- TRIGGERS AND AUTOMATION ---

-- Function to automatically update the `updated_at` column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_camps_updated_at BEFORE UPDATE ON camps FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update a camp's `current_rsvps` count automatically
CREATE OR REPLACE FUNCTION update_camp_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE camps SET current_rsvps = current_rsvps + 1 WHERE id = NEW.camp_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE camps SET current_rsvps = current_rsvps - 1 WHERE id = OLD.camp_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
            UPDATE camps SET current_rsvps = current_rsvps - 1 WHERE id = NEW.camp_id;
        ELSIF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
            UPDATE camps SET current_rsvps = current_rsvps + 1 WHERE id = NEW.camp_id;
        END IF;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_camp_rsvp_count_trigger AFTER INSERT OR UPDATE OR DELETE ON rsvps FOR EACH ROW EXECUTE FUNCTION update_camp_rsvp_count();

-- Function to update inventory counts based on RSVP changes
CREATE OR REPLACE FUNCTION update_inventory_on_rsvp()
RETURNS TRIGGER AS $$
DECLARE
    donor_blood_type blood_group;
    camp_creator_id UUID;
BEGIN
    SELECT u.blood_group INTO donor_blood_type FROM users u WHERE u.id = COALESCE(NEW.donor_id, OLD.donor_id);
    SELECT c.created_by INTO camp_creator_id FROM camps c WHERE c.id = COALESCE(NEW.camp_id, OLD.camp_id);
    
    IF donor_blood_type IS NULL OR camp_creator_id IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

    IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
        INSERT INTO inventory (blood_bank_id, blood_type, incoming_units, updated_by)
        VALUES (camp_creator_id, donor_blood_type, 1, NEW.donor_id)
        ON CONFLICT (blood_bank_id, blood_type) DO UPDATE SET incoming_units = inventory.incoming_units + 1, last_updated = NOW(), updated_by = NEW.donor_id;
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'confirmed' AND NEW.status = 'attended' AND NEW.donation_completed = true THEN
            UPDATE inventory SET incoming_units = GREATEST(incoming_units - 1, 0), available_units = available_units + 1, last_updated = NOW(), updated_by = NEW.donor_id WHERE blood_bank_id = camp_creator_id AND blood_type = donor_blood_type;
        ELSIF OLD.status = 'confirmed' AND NEW.status = 'cancelled' THEN
            UPDATE inventory SET incoming_units = GREATEST(incoming_units - 1, 0), last_updated = NOW(), updated_by = NEW.donor_id WHERE blood_bank_id = camp_creator_id AND blood_type = donor_blood_type;
        END IF;
    ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
        UPDATE inventory SET incoming_units = GREATEST(incoming_units - 1, 0), last_updated = NOW() WHERE blood_bank_id = camp_creator_id AND blood_type = donor_blood_type;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_inventory_on_rsvp_trigger AFTER INSERT OR UPDATE OR DELETE ON rsvps FOR EACH ROW EXECUTE FUNCTION update_inventory_on_rsvp();