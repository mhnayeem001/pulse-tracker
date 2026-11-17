# Project PULSE — Database Architecture & Schema Specification

## 1. Cloud PostgreSQL / Supabase Schema

The cloud database is partitioned and isolated strictly by authenticated user through PostgreSQL Row Level Security (RLS).

### Entity Relationship Diagram (Mermaid)

```mermaid
erDiagram
    PROFILES ||--o{ DEVICES : owns
    PROFILES ||--o{ USER_SETTINGS : configures
    DEVICES ||--o{ ACTIVITY_SUMMARIES : records
    DEVICES ||--o{ DEVICE_SESSIONS : tracks
    DEVICES ||--o{ SYNC_BATCHES : acknowledges

    PROFILES {
        uuid id PK
        text email
        text display_name
        timestamptz created_at
    }

    DEVICES {
        uuid id PK
        uuid user_id FK
        text device_name
        text device_type
        text hostname
        text os_version
        text agent_version
        timestamptz registered_at
        timestamptz last_seen_at
        timestamptz last_sync_at
        boolean is_active
        timestamptz revoked_at
    }

    ACTIVITY_SUMMARIES {
        uuid id PK
        uuid user_id FK
        uuid device_id FK
        timestamptz bucket_start
        timestamptz bucket_end
        int left_clicks
        int right_clicks
        int middle_clicks
        int x1_clicks
        int x2_clicks
        int keyboard_presses
        int vertical_scroll
        int horizontal_scroll
        int mouse_movement_events
        float mouse_distance
        int active_seconds
        int idle_seconds
        text session_id
        timestamptz created_at
    }

    SYNC_BATCHES {
        uuid id PK
        uuid user_id FK
        uuid device_id FK
        uuid batch_uuid UK
        int record_count
        timestamptz synced_at
    }

    USER_SETTINGS {
        uuid id PK
        uuid user_id FK
        int idle_threshold_seconds
        boolean tracking_enabled
        text timezone
        int data_retention_days
        timestamptz updated_at
    }
```

---

## 2. Row Level Security (RLS) Implementation

Every table has RLS enabled. Users can only select, insert, or modify records where `auth.uid() = user_id`.

```sql
-- Enforces that input can only be uploaded from active, non-revoked devices owned by the authenticated user
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
```

---

## 3. Local SQLite Schema

Stored on each device at `%LOCALAPPDATA%\ProjectPulse\pulse.db`.

1. `local_device`: Local registration state, device UUID, device name, and heartbeat.
2. `activity_summaries`: 60-second quantized aggregations with unique constraint `(device_id, bucket_start)` and `is_synced` flag.
3. `sync_queue`: Transient queue for retrying batches.
4. `application_settings`: Key-value storage for encrypted tokens, endpoints, and thresholds.
5. `agent_logs`: Internal diagnostic logs with timestamp and severity.
