# Project PULSE — API Specification

## 1. Cloud Ingestion RPC Endpoint

### `POST /rest/v1/rpc/ingest_activity_batch`

Atomically ingests a batch of activity summaries, records the batch UUID to guarantee idempotency, updates the device heartbeat, and returns the processing result.

#### Headers
```http
Content-Type: application/json
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <USER_ACCESS_TOKEN>
```

#### Request Payload
```json
{
  "p_batch_uuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "p_device_id": "11111111-1111-1111-1111-111111111111",
  "p_records": [
    {
      "bucket_start": "2026-11-17T09:00:00Z",
      "bucket_end": "2026-11-17T09:01:00Z",
      "left_clicks": 35,
      "right_clicks": 10,
      "middle_clicks": 2,
      "x1_clicks": 1,
      "x2_clicks": 0,
      "keyboard_presses": 140,
      "vertical_scroll": 360,
      "horizontal_scroll": 0,
      "mouse_movement_events": 280,
      "mouse_distance": 2100.4,
      "active_seconds": 54,
      "idle_seconds": 6,
      "session_id": "sess_001"
    }
  ]
}
```

#### Response (Success - 200 OK)
```json
{
  "status": "success",
  "batch_uuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "records_synced": 1
}
```

#### Response (Idempotent replay - 200 OK)
```json
{
  "status": "already_processed",
  "batch_uuid": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "message": "Batch has already been synced previously"
}
```

---

## 2. Device Registration API

### `POST /rest/v1/devices`
Inserts or merges device registration.

#### Request Payload
```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "device_name": "Personal Laptop",
  "device_type": "laptop",
  "hostname": "MY-LAPTOP",
  "os_version": "Microsoft Windows 11 Pro 10.0.26100",
  "agent_version": "1.0.0",
  "is_active": true,
  "last_seen_at": "2026-11-17T09:00:00Z"
}
```

---

## 3. Device Revocation API

### `PATCH /rest/v1/devices?id=eq.{id}`
Revokes device authorization. Subsequent sync calls will receive HTTP 403 Forbidden.

#### Request Payload
```json
{
  "is_active": false,
  "revoked_at": "2026-11-17T09:30:00Z"
}
```
