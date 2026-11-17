# Project PULSE — Troubleshooting Guide

## 1. Windows Desktop Agent

### Symptom: Status says "No internet connection" or "Pending records" increasing
- **Cause**: Computer is offline or Supabase URL is unreachable.
- **Resolution**: PULSE is fully offline-first. It preserves all 60-second summary buckets in your local SQLite database at `%LOCALAPPDATA%\ProjectPulse\pulse.db`. Once internet connectivity is restored, the sync worker automatically retries with exponential backoff and uploads pending batches without losing data.

### Symptom: Status shows "Device has been revoked in cloud console"
- **Cause**: The device was revoked on the Web Dashboard under Device Management.
- **Resolution**: Re-open the **Device Pairing & Settings** tab in the desktop agent, re-enter your credentials, and re-pair with a new label or reactivate the device in the cloud database.

### Symptom: Window is not visible on launch
- **Cause**: Started with `--minimized` flag (e.g. via Windows auto-start).
- **Resolution**: Double-click the Project PULSE icon in your Windows System Tray (next to the clock) or right-click and select **Open Status Window**.

---

## 2. Web Dashboard

### Symptom: Metrics display zero or demo fixtures
- **Cause**: Supabase environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are not configured in `apps/web/.env.local`.
- **Resolution**: Copy `.env.example` to `apps/web/.env.local`, insert your keys, and restart the Next.js development server.
