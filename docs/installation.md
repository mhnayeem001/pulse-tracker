# Project PULSE — Installation & Deployment Guide

## 1. Prerequisites

- **Operating System**: Windows 11 (or Windows 10 x64 version 1809+)
- **Runtime**: .NET 8.0 Runtime (or self-contained binary)
- **Web Dashboard**: Node.js v18+ or Vercel hosting
- **Database**: Supabase free project

---

## 2. Deploying Supabase Database

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste the contents of `supabase/migrations/20261117000001_initial_schema.sql` and click **Run**.
4. In **Project Settings -> API**, copy:
   - `Project URL`
   - `anon / public key`

---

## 3. Installing on Computer 1 (Personal Laptop)

1. Copy the published folder `publish/Pulse.Agent` to `C:\Program Files\ProjectPulse` (or run from your user profile).
2. Launch `Pulse.Agent.exe`.
3. In the Desktop Agent window:
   - Switch to the **Device Pairing & Settings** tab.
   - Enter your **Supabase URL** and **Anon Key**.
   - Enter your account **Email** and **Password** (or sign up first).
   - Set device label to `Personal Laptop`.
   - Click **Sign In & Pair This Device**.
4. Ensure the green **TRACKING ACTIVE** badge appears.
5. Check the box **Start Project PULSE automatically on Windows login**.

---

## 4. Installing on Computer 2 (Office PC)

1. Copy `publish/Pulse.Agent` to your Office PC.
2. Launch `Pulse.Agent.exe`.
3. Switch to the **Device Pairing & Settings** tab.
4. Enter the same **Supabase URL** and **Anon Key**.
5. Enter the **same account Email and Password** used on your laptop.
6. Set device label to `Office PC`.
7. Click **Sign In & Pair This Device**.
8. Office PC will receive its own unique Device UUID and begin synchronizing its separate metrics into your account.

---

## 5. Running the Web Dashboard

### Local Development:
```bash
cd apps/web
npm install
npm run dev
```
Open `http://localhost:3000`.

### Vercel Production Deployment:
1. Connect the GitHub repository to Vercel.
2. In Vercel Project Settings, set Root Directory to `apps/web`.
3. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key
4. Deploy.
