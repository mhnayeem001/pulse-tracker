-- Migration: Add wait_seconds to activity_summaries and update ingest_activity_batch RPC

-- 1. Add column to activity_summaries
ALTER TABLE public.activity_summaries 
ADD COLUMN IF NOT EXISTS wait_seconds INTEGER DEFAULT 0;

-- 2. Update ingest_activity_batch stored procedure to ingest wait_seconds
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
            wait_seconds,
            idle_seconds,
            session_id,
            key_counts
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
            COALESCE((v_record->>'wait_seconds')::INT, 0),
            COALESCE((v_record->>'idle_seconds')::INT, 0),
            COALESCE(v_record->>'session_id', 'default'),
            COALESCE(v_record->'key_counts', '{}'::jsonb)
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
            wait_seconds = EXCLUDED.wait_seconds,
            idle_seconds = EXCLUDED.idle_seconds,
            key_counts = COALESCE(EXCLUDED.key_counts, activity_summaries.key_counts);

        v_inserted_count := v_inserted_count + 1;
    END LOOP;

    -- Record sync batch
    INSERT INTO public.sync_batches (user_id, device_id, batch_uuid, record_count)
    VALUES (v_user_id, p_device_id, p_batch_uuid, v_inserted_count);

    RETURN jsonb_build_object(
        'status', 'success',
        'batch_uuid', p_batch_uuid,
        'records_inserted', v_inserted_count
    );
END;
$$;
