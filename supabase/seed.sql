-- Project PULSE: Supabase Seed Data (Development Fixture)
-- Note: Replace with actual auth user ID when deploying to test or production

-- Placeholder user uuid: 00000000-0000-0000-0000-000000000001
DO $$
DECLARE
    v_user_id UUID := '00000000-0000-0000-0000-000000000001';
    v_laptop_id UUID := '11111111-1111-1111-1111-111111111111';
    v_office_id UUID := '22222222-2222-2222-2222-222222222222';
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_start TIMESTAMPTZ;
    v_i INT;
BEGIN
    -- Check if auth user exists, else exit gracefully
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
        RAISE NOTICE 'No dummy auth user found. Skipping seed insert.';
        RETURN;
    END IF;

    -- Upsert profile
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (v_user_id, 'demo@projectpulse.dev', 'Alex Vance')
    ON CONFLICT (id) DO UPDATE SET display_name = 'Alex Vance';

    -- Upsert user settings
    INSERT INTO public.user_settings (user_id, idle_threshold_seconds, timezone)
    VALUES (v_user_id, 300, 'Asia/Dhaka')
    ON CONFLICT (user_id) DO NOTHING;

    -- Upsert Devices
    INSERT INTO public.devices (id, user_id, device_name, device_type, hostname, os_version, agent_version, last_seen_at, last_sync_at)
    VALUES 
        (v_laptop_id, v_user_id, 'Personal Laptop', 'laptop', 'ALEX-LAPTOP', 'Microsoft Windows 11 Pro 10.0.26100', '1.0.0', v_now, v_now),
        (v_office_id, v_user_id, 'Office PC', 'desktop', 'ALEX-WORKSTATION', 'Microsoft Windows 11 Enterprise 10.0.26100', '1.0.0', v_now - interval '30 minutes', v_now - interval '30 minutes')
    ON CONFLICT (id) DO NOTHING;

    -- Generate some sample activity summaries for the past 24 hours
    FOR v_i IN 0..24 LOOP
        v_start := v_now - (v_i || ' hours')::interval;

        -- Laptop activity
        INSERT INTO public.activity_summaries (
            user_id, device_id, bucket_start, bucket_end,
            left_clicks, right_clicks, middle_clicks, x1_clicks, x2_clicks,
            keyboard_presses, vertical_scroll, horizontal_scroll,
            mouse_movement_events, mouse_distance, active_seconds, idle_seconds, session_id
        ) VALUES (
            v_user_id, v_laptop_id, v_start, v_start + interval '1 minute',
            45 + (v_i * 3) % 20, 12 + v_i % 7, 3, 1, 0,
            120 + (v_i * 15) % 100, 320, 0,
            240, 1845.5, 52, 8, 'sess_laptop_001'
        ) ON CONFLICT (device_id, bucket_start) DO NOTHING;

        -- Office PC activity
        IF v_i BETWEEN 6 AND 16 THEN
            INSERT INTO public.activity_summaries (
                user_id, device_id, bucket_start, bucket_end,
                left_clicks, right_clicks, middle_clicks, x1_clicks, x2_clicks,
                keyboard_presses, vertical_scroll, horizontal_scroll,
                mouse_movement_events, mouse_distance, active_seconds, idle_seconds, session_id
            ) VALUES (
                v_user_id, v_office_id, v_start, v_start + interval '1 minute',
                68 + (v_i * 5) % 30, 24 + v_i % 10, 5, 2, 1,
                210 + (v_i * 22) % 150, 540, 12,
                380, 3120.0, 58, 2, 'sess_office_001'
            ) ON CONFLICT (device_id, bucket_start) DO NOTHING;
        END IF;
    END LOOP;
END;
$$;
