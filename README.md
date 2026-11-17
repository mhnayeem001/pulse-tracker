# PROJECT PULSE — Cross-Device Digital Activity Analytics Platform

> **A production-ready personal digital activity measurement platform engineered for Windows 11 that tracks how much you interact with your computers throughout the day across multiple machines (Personal Laptop & Office PC), synchronizing aggregated metrics into a centralized cloud database with a modern analytics dashboard.**

---

## 1. Product Overview

Project PULSE is an activity analytics SaaS tailored for power users who work across multiple physical computers.

- **Independent Windows Desktop Agents**: Run silently in the interactive Windows 11 logged-in session, capturing hardware input counters via the Win32 Raw Input API.
- **Privacy-First Architecture**: Strictly measures aggregate activity volume. **Zero** keystroke content, typed text, passwords, clipboard contents, window titles, or screen coordinates are ever captured or stored.
- **Offline Resilience**: Inputs are aggregated into 60-second summary buckets and persisted in local SQLite databases before transmission. Disconnecting the internet never loses recorded activity.
- **Centralized Cloud Ingestion**: Batched sync with exponential backoff and idempotency guarantees into Supabase (PostgreSQL) with Row-Level Security.
- **Comprehensive Web Dashboard**: 8 dedicated analytics views displaying real-time metrics, 7x24 hourly activity heatmaps, cross-device comparisons, Excel-compatible CSV exports, device heartbeat monitors, and cryptographic authorization controls.

---

## 2. Monorepo Project Structure

```
project-pulse/
|-- apps/
|   |-- windows-agent/
|   |   |-- Pulse.Core/        # Domain entities, enums, interfaces, calculation models
|   |   |-- Pulse.Collector/   # Win32 Raw Input sink, GetLastInputInfo idle detector, session monitor
|   |   |-- Pulse.Storage/     # SQLite database (WAL mode), migrations, Windows DPAPI encryption
|   |   |-- Pulse.Sync/        # Resilient background cloud sync worker, token refresh, backoff
|   |   |-- Pulse.Agent/       # WinForms interactive UI, system tray icon, auto-start registry manager
|   |   |-- Pulse.Tests/       # Comprehensive automated test suite (xUnit)
|   |   +-- Pulse.sln          # Visual Studio / .NET Solution
|   |
|   |-- web/                   # Next.js 14 Web Analytics Dashboard
|       |-- app/
|       |   |-- page.tsx       # PAGE 1: Overview
|       |   |-- devices/       # PAGE 2: Device Analytics
|       |   |-- analytics/     # PAGE 3: Activity Analytics
|       |   |-- heatmap/       # PAGE 4: Activity Heatmap (7-day x 24-hr grid)
|       |   |-- comparison/    # PAGE 5: Device Comparison (Laptop vs Office PC)
|       |   |-- reports/       # PAGE 6: Reports & Data Exports (Excel CSV / JSON)
|       |   |-- management/    # PAGE 7: Device Management & Cryptographic Revocation
|       |   +-- settings/      # PAGE 8: Settings & Timezone Configuration
|       |-- components/        # Recharts visualizers, MetricCard, Sidebar, Header
|       |-- lib/               # Supabase client, calculation rules, timezone converters
|       +-- types/             # Full TypeScript interfaces
|
|-- supabase/
|   |-- migrations/            # 20261117000001_initial_schema.sql (Postgres tables, RLS, RPC)
|   +-- seed.sql               # Development fixtures for demo testing
|
|-- docs/                      # Architecture, database, security, API, installation, testing
|-- scripts/                   # PowerShell build, test, and run scripts
|-- publish/                   # Compiled release binaries for Windows Agent
|-- .github/workflows/ci.yml   # Continuous Integration pipeline
|-- README.md
+-- .env.example
```

---

## 3. Technology Stack

- **Windows Agent**: C#, .NET 8 LTS, Win32 Raw Input API (`user32.dll`), `Microsoft.Data.Sqlite`, Windows DPAPI (`ProtectedData`), Windows Forms message pump.
- **Cloud Backend**: Supabase, PostgreSQL 15, Row Level Security (RLS), PostgREST, Stored RPC procedures.
- **Web Dashboard**: Next.js 14, React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons, date-fns.
- **Timezone**: All timestamps stored in UTC and rendered in `Asia/Dhaka` (UTC+6) with user-configurable overrides.

---

## 4. Setup & Installation Instructions

### Step 1: Initialize Cloud Database (Supabase)
1. Sign in to your [Supabase Dashboard](https://supabase.com).
2. Open the **SQL Editor**.
3. Run the migration script located at [supabase/migrations/20261117000001_initial_schema.sql](file:///e:/counting%20click/supabase/migrations/20261117000001_initial_schema.sql).
4. Navigate to **Project Settings -> API** and copy your:
   - `Project URL` (e.g. `https://xyz.supabase.co`)
   - `anon / public API key`

---

### Step 2: Install on Computer 1 (Personal Laptop)
1. Locate the compiled Windows Agent binaries in `publish/Pulse.Agent` (or build using `.\scripts\build-agent.ps1`).
2. Run `Pulse.Agent.exe`.
3. In the Desktop Agent window, switch to the **Device Pairing & Settings** tab:
   - Paste your **Supabase Project URL**.
   - Paste your **Supabase Publishable/Anon Key**.
   - Enter your account **Email** and **Password**.
   - Set the Device Label to **"Personal Laptop"**.
   - Click **"Sign In & Pair This Device"**.
4. Check **"Start Project PULSE automatically on Windows login"**.
5. The green **TRACKING ACTIVE** badge confirms hardware collection is running.

---

### Step 3: Install on Computer 2 (Office PC)
1. Copy the `publish/Pulse.Agent` folder to your Office PC.
2. Launch `Pulse.Agent.exe`.
3. Switch to the **Device Pairing & Settings** tab:
   - Enter the same **Supabase Project URL** and **Anon Key**.
   - Enter the **same account Email and Password** used on your laptop.
   - Set the Device Label to **"Office PC"**.
   - Click **"Sign In & Pair This Device"**.
4. The Office PC Agent automatically provisions a unique local Device UUID, pairs to your account, and begins synchronizing independent metrics.

---

### Step 4: Run the Web Dashboard
```bash
cd apps/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in any web browser.

---

## 5. Running Automated Tests

Run the full .NET automated test suite:
```powershell
.\scripts\run-tests.ps1
```
All 13 unit and integration tests verify:
- Accurate click counting (Left, Right, Middle, X1, X2)
- Key-down counts and repeat detection (zero key-up duplication)
- Vertical and horizontal scroll accumulation
- Relative movement Euclidean distance calculation
- 60-second window rollover and memory resets
- Idle threshold detection and active/idle state transitions
- Local SQLite database persistence and duplicate bucket upserts (idempotency)
- Batch synchronization acknowledgment and queue clearing
- Windows DPAPI credential encryption and decryption

Verify Web Dashboard types:
```bash
cd apps/web
npm run typecheck
```

---

## 6. Security & Privacy Guarantees

1. **Zero Text Capture**: The agent registers only for raw message counters. It has zero capability to inspect or store typed text, passwords, or scan-codes.
2. **Zero Coordinate Tracking**: Cursor coordinates are never read or stored. Only relative displacement vectors `(dx, dy)` are converted to scalar distance.
3. **DPAPI Token Protection**: Stored authentication tokens are encrypted with the Windows user master key via DPAPI.
4. **Row-Level Security**: All data access is authenticated and partitioned by user UUID. Service role keys are never exposed.
