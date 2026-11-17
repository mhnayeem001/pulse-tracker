# Project PULSE — System Architecture Specification

## Overview

Project PULSE is an enterprise-grade personal digital activity measurement platform engineered for Windows 11 devices (Personal Laptop and Office PC). It aggregates hardware-level user interactions locally, persists them in an offline-first SQLite database, synchronizes batches to a cloud PostgreSQL/Supabase database using cryptographic tokens and Row-Level Security, and visualizes comprehensive analytics on a responsive Next.js web dashboard.

---

## 1. High-Level Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                              PERSONAL LAPTOP (Win 11)                             |
|                                                                                   |
|  +------------------------+      +------------------------+                       |
|  | Win32 Raw Input Sink   | ---> | Activity Aggregator    |                       |
|  | (WM_INPUT, Mouse/Key)  |      | (60s Quantized Window) |                       |
|  +------------------------+      +-----------+------------+                       |
|               |                              |                                    |
|               v                              v                                    |
|  +------------------------+      +------------------------+                       |
|  | Idle & Session Monitor |      | Local SQLite Database  |                       |
|  | (GetLastInputInfo/WTS) |      | (WAL Mode, Idempotent) |                       |
|  +------------------------+      +-----------+------------+                       |
|                                              |                                    |
|                                              v                                    |
|                                  +------------------------+                       |
|                                  | Background Sync Worker |                       |
|                                  | (Exp Backoff, DPAPI)   |                       |
|                                  +-----------+------------+                       |
+----------------------------------------------|------------------------------------+
                                               |
                                               v HTTPS (Bearer Token, Batched)
+-----------------------------------------------------------------------------------+
|                              OFFICE PC (Win 11)                                   |
|                                                                                   |
|  [Identical PULSE Desktop Agent Running Independently with Unique Device UUID]    |
+----------------------------------------------|------------------------------------+
                                               |
                                               v HTTPS (Bearer Token, Batched)
+-----------------------------------------------------------------------------------+
|                              SUPABASE CLOUD BACKEND                               |
|                                                                                   |
|  +----------------------+  +---------------------+  +--------------------------+  |
|  | PostgREST / RPC API  |  | Row Level Security  |  | Postgres Tables          |  |
|  | (ingest_activity_   |  | (auth.uid() =       |  | - profiles               |  |
|  |  batch)              |  |  user_id)           |  | - devices                |  |
|  +----------------------+  +---------------------+  | - activity_summaries     |  |
|                                                     | - device_sessions        |  |
|                                                     | - sync_batches           |  |
|                                                     | - user_settings          |  |
|                                                     +--------------------------+  |
+----------------------------------------------+------------------------------------+
                                               |
                                               v HTTPS / WebSockets
+-----------------------------------------------------------------------------------+
|                             NEXT.JS WEB DASHBOARD                                 |
|                                                                                   |
|  +----------------------+  +---------------------+  +--------------------------+  |
|  | 8 Analytics Views    |  | Recharts Visualizer |  | Asia/Dhaka Timezone Conv |  |
|  | - Overview           |  | - Daily Trends      |  | Excel CSV / JSON Export  |  |
|  | - Device Analytics   |  | - 7x24 Heatmap      |  | Device Heartbeat Monitor |  |
|  | - Device Comparison  |  | - Input Ratios      |  | Device Revocation        |  |
|  +----------------------+  +---------------------+  +--------------------------+  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Components

### 2.1 Pulse.Collector
- **Win32 Raw Input Interop**: Uses `RegisterRawInputDevices` with `RIDEV_INPUTSINK` targeting a hidden `NativeWindow`. Captures mouse clicks (Left, Right, Middle, X1, X2), vertical/horizontal wheel delta, and relative movement displacement. Captures keyboard key-down events and repeat flags.
- **Privacy Enforcement**: Absolutely no keystrokes, scan codes, virtual keys, clipboard data, window titles, or screen coordinates are collected or stored.
- **Idle Detection**: Evaluates `GetLastInputInfo` periodically. Triggers state changes when idle time passes the configurable threshold (default: 300s).
- **Session & Power Management**: Receives `WM_WTSSESSION_CHANGE` (workstation lock/unlock) and `WM_POWERBROADCAST` (system sleep/resume).

### 2.2 Pulse.Storage
- **SQLite Engine**: Configured with Write-Ahead Logging (`PRAGMA journal_mode = WAL`) and `PRAGMA synchronous = NORMAL` for non-blocking concurrency.
- **Idempotent Storage**: Unique index on `(device_id, bucket_start)` ensures re-inserted or retried windows are upserted without duplication.
- **Secure Storage (DPAPI)**: Uses Windows Data Protection API (`ProtectedData.Protect` with `DataProtectionScope.CurrentUser`) to encrypt cloud tokens.

### 2.3 Pulse.Sync
- **Batched Ingestion**: Quantizes records into 60-second summary buckets and uploads batches of up to 100 summaries.
- **Idempotency & Acknowledgement**: Assigns a unique `batch_uuid` per sync request. Only marks local records `is_synced = 1` once HTTP 200/201 is confirmed.
- **Resilience**: Backoff retries with exponential backoff up to 300 seconds on connection loss. Auto-refreshes expired auth tokens.

### 2.4 Web Dashboard
- Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide Icons, and Recharts.
- 8 dedicated pages: Overview, Device Analytics, Activity Analytics, Activity Heatmap (7-day x 24-hr matrix), Device Comparison, Reports & Exports, Device Management, and Settings.
