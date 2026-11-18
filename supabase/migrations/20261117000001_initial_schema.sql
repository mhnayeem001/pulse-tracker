-- Project PULSE: Supabase Schema Migration
-- Migration: 20261117000001_initial_schema.sql
-- Description: Core tables, constraints, indexes, RLS policies, and triggers

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_type TEXT NOT NULL DEFAULT 'desktop',
    hostname TEXT,
    os_version TEXT,
    agent_version TEXT,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_sync_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    revoked_at TIMESTAMPTZ,
    CONSTRAINT uq_user_device_name UNIQUE (user_id, device_name)
);

-- 3. Activity Summaries Table (Aggregated 60s windows)
CREATE TABLE IF NOT EXISTS public.activity_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    bucket_start TIMESTAMPTZ NOT NULL,
    bucket_end TIMESTAMPTZ NOT NULL,
    left_clicks INTEGER NOT NULL DEFAULT 0 CHECK (left_clicks >= 0),
    right_clicks INTEGER NOT NULL DEFAULT 0 CHECK (right_clicks >= 0),
    middle_clicks INTEGER NOT NULL DEFAULT 0 CHECK (middle_clicks >= 0),
    x1_clicks INTEGER NOT NULL DEFAULT 0 CHECK (x1_clicks >= 0),
    x2_clicks INTEGER NOT NULL DEFAULT 0 CHECK (x2_clicks >= 0),
    keyboard_presses INTEGER NOT NULL DEFAULT 0 CHECK (keyboard_presses >= 0),
    vertical_scroll INTEGER NOT NULL DEFAULT 0,
    horizontal_scroll INTEGER NOT NULL DEFAULT 0,
    mouse_movement_events INTEGER NOT NULL DEFAULT 0 CHECK (mouse_movement_events >= 0),
    mouse_distance DOUBLE PRECISION NOT NULL DEFAULT 0.0 CHECK (mouse_distance >= 0.0),
    active_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_seconds >= 0 AND active_seconds <= 60),
    idle_seconds INTEGER NOT NULL DEFAULT 0 CHECK (idle_seconds >= 0 AND idle_seconds <= 60),
    session_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_device_bucket UNIQUE (device_id, bucket_start)
);

-- 4. Device Sessions Table
CREATE TABLE IF NOT EXISTS public.device_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    active_seconds INTEGER NOT NULL DEFAULT 0 CHECK (active_seconds >= 0),
    idle_seconds INTEGER NOT NULL DEFAULT 0 CHECK (idle_seconds >= 0),
    session_status TEXT NOT NULL DEFAULT 'active' CHECK (session_status IN ('active', 'paused', 'locked', 'ended'))
);

-- 5. Sync Batches Table (For batch idempotency & acknowledgment)
CREATE TABLE IF NOT EXISTS public.sync_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
    batch_uuid UUID NOT NULL UNIQUE,
    record_count INTEGER NOT NULL DEFAULT 0 CHECK (record_count >= 0),
    synced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. User Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    idle_threshold_seconds INTEGER NOT NULL DEFAULT 300 CHECK (idle_threshold_seconds >= 30 AND idle_threshold_seconds <= 3600),
    tracking_enabled BOOLEAN NOT NULL DEFAULT true,
    timezone TEXT NOT NULL DEFAULT 'Asia/Dhaka',
    data_retention_days INTEGER NOT NULL DEFAULT 90 CHECK (data_retention_days >= 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_devices_user ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON public.devices(last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_user_bucket ON public.activity_summaries(user_id, bucket_start DESC);
CREATE INDEX IF NOT EXISTS idx_activity_device_bucket ON public.activity_summaries(device_id, bucket_start DESC);
CREATE INDEX IF NOT EXISTS idx_activity_bucket_range ON public.activity_summaries(bucket_start, bucket_end);

CREATE INDEX IF NOT EXISTS idx_sessions_user_device ON public.device_sessions(user_id, device_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_batches_device ON public.sync_batches(device_id, synced_at DESC);

-- 8. Row Level Security (RLS) Enablement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- 9. Row Level Security Policies

-- Profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Devices
CREATE POLICY "Users can view own devices"
    ON public.devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own devices"
    ON public.devices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own devices"
    ON public.devices FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own devices"
    ON public.devices FOR DELETE
    USING (auth.uid() = user_id);

-- Activity Summaries
CREATE POLICY "Users can view own activity summaries"
    ON public.activity_summaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity summaries"
    ON public.activity_summaries FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.id = activity_summaries.device_id
              AND devices.user_id = auth.uid()
              AND devices.is_active = true
              AND devices.revoked_at IS NULL
        )
    );

CREATE POLICY "Users can delete own activity summaries"
    ON public.activity_summaries FOR DELETE
    USING (auth.uid() = user_id);

-- Device Sessions
CREATE POLICY "Users can view own device sessions"
    ON public.device_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own device sessions"
    ON public.device_sessions FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.id = device_sessions.device_id
              AND devices.user_id = auth.uid()
              AND devices.is_active = true
              AND devices.revoked_at IS NULL
        )
    );

CREATE POLICY "Users can update own device sessions"
    ON public.device_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Sync Batches
CREATE POLICY "Users can view own sync batches"
    ON public.sync_batches FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync batches"
    ON public.sync_batches FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.devices
            WHERE devices.id = sync_batches.device_id
              AND devices.user_id = auth.uid()
              AND devices.is_active = true
              AND devices.revoked_at IS NULL
        )
    );

-- User Settings
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- 10. Triggers and Stored Procedures

-- Automatically create profile and user_settings on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.user_settings (user_id, timezone)
    VALUES (NEW.id, 'Asia/Dhaka')
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto update updated_at on user_settings
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_settings_updated ON public.user_settings;
CREATE TRIGGER on_user_settings_updated
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Stored RPC: Ingest Batch of Activity Summaries with Device Heartbeat Update
CREATE OR REPLACE FUNCTION public.ingest_activity_batch(
    p_batch_uuid UUID,
    p_device_id UUID,
    p_records JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_device_active BOOLEAN;
    v_inserted_count INT := 0;
    v_record JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User must be authenticated';
    END IF;

    -- Verify device exists, belongs to user, and is active
    SELECT is_active AND (revoked_at IS NULL)
    INTO v_device_active
    FROM public.devices
    WHERE id = p_device_id AND user_id = v_user_id;

    IF v_device_active IS NULL OR NOT v_device_active THEN
        RAISE EXCEPTION 'Device is inactive, revoked, or not found';
    END IF;

    -- Check if batch already processed (Idempotency)
    IF EXISTS (SELECT 1 FROM public.sync_batches WHERE batch_uuid = p_batch_uuid) THEN
        RETURN jsonb_build_object(
            'status', 'already_processed',
            'batch_uuid', p_batch_uuid,
            'message', 'Batch has already been synced previously'
        );
    END IF;

    -- Insert records
    FOR v_record IN SELECT * FROM jsonb_array_elements(p_records)
    LOOP
        INSERT INTO public.activity_summaries (
            user_id,
            device_id,
            bucket_start,
            bucket_end,
            left_clicks,
            right_clicks,
            middle_clicks,
            x1_clicks,
            x2_clicks,
            keyboard_presses,
            vertical_scroll,
            horizontal_scroll,
            mouse_movement_events,
            mouse_distance,
            active_seconds,
            idle_seconds,
            session_id
        )
        VALUES (
            v_user_id,
            p_device_id,
            (v_record->>'bucket_start')::TIMESTAMPTZ,
            (v_record->>'bucket_end')::TIMESTAMPTZ,
            COALESCE((v_record->>'left_clicks')::INT, 0),
            COALESCE((v_record->>'right_clicks')::INT, 0),
            COALESCE((v_record->>'middle_clicks')::INT, 0),
            COALESCE((v_record->>'x1_clicks')::INT, 0),
            COALESCE((v_record->>'x2_clicks')::INT, 0),
            COALESCE((v_record->>'keyboard_presses')::INT, 0),
            COALESCE((v_record->>'vertical_scroll')::INT, 0),
            COALESCE((v_record->>'horizontal_scroll')::INT, 0),
            COALESCE((v_record->>'mouse_movement_events')::INT, 0),
            COALESCE((v_record->>'mouse_distance')::DOUBLE PRECISION, 0.0),
            COALESCE((v_record->>'active_seconds')::INT, 0),
            COALESCE((v_record->>'idle_seconds')::INT, 0),
            COALESCE(v_record->>'session_id', 'default')
        )
        ON CONFLICT (device_id, bucket_start) DO UPDATE SET
            left_clicks = EXCLUDED.left_clicks,
            right_clicks = EXCLUDED.right_clicks,
            middle_clicks = EXCLUDED.middle_clicks,
            x1_clicks = EXCLUDED.x1_clicks,
            x2_clicks = EXCLUDED.x2_clicks,
            keyboard_presses = EXCLUDED.keyboard_presses,
            vertical_scroll = EXCLUDED.vertical_scroll,
            horizontal_scroll = EXCLUDED.horizontal_scroll,
            mouse_movement_events = EXCLUDED.mouse_movement_events,
            mouse_distance = EXCLUDED.mouse_distance,
            active_seconds = EXCLUDED.active_seconds,
            idle_seconds = EXCLUDED.idle_seconds;

        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    -- Record sync batch
    INSERT INTO public.sync_batches (user_id, device_id, batch_uuid, record_count)
    VALUES (v_user_id, p_device_id, p_batch_uuid, v_inserted_count);

    -- Update device heartbeat & last_sync_at
    UPDATE public.devices
    SET last_seen_at = timezone('utc'::text, now()),
        last_sync_at = timezone('utc'::text, now())
    WHERE id = p_device_id;

    RETURN jsonb_build_object(
        'status', 'success',
        'batch_uuid', p_batch_uuid,
        'records_synced', v_inserted_count
    );
END;
$$;

-- Seed existing auth user profile & settings if user already created
INSERT INTO public.profiles (id, email, display_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.user_settings (user_id, timezone)
SELECT id, 'Asia/Dhaka'
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
