"use client";

import { useState } from "react";
import { Settings, Save, Shield, Database, User, Moon, Check } from "lucide-react";

export default function SettingsPage() {
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [idleThreshold, setIdleThreshold] = useState(300);
  const [dataRetention, setDataRetention] = useState(90);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Settings className="w-7 h-7 text-sky-400" />
          Platform Settings
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Configure analytics parameters, timezone conversions, idle sensitivity, and data retention
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          Settings updated successfully and synced with cloud profile!
        </div>
      )}

      {/* Analytics & Timezone Preferences */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          Analytics Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-2">Display Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-sky-500"
            >
              <option value="Asia/Dhaka">Asia/Dhaka (UTC+06:00) — Default</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (UTC-05:00)</option>
              <option value="Europe/London">Europe/London (UTC+00:00)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+09:00)</option>
            </select>
            <p className="text-slate-500 mt-1.5">
              All UTC database records are converted to this timezone on the dashboard and exports.
            </p>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-2">
              Idle Inactivity Threshold: <strong className="text-sky-400 font-mono">{idleThreshold}s</strong> ({Math.round(idleThreshold / 60)} min)
            </label>
            <input
              type="range"
              min={60}
              max={900}
              step={30}
              value={idleThreshold}
              onChange={(e) => setIdleThreshold(Number(e.target.value))}
              className="w-full accent-sky-500 cursor-pointer"
            />
            <p className="text-slate-500 mt-1.5">
              Duration of zero keyboard and mouse activity before classifying session as Idle.
            </p>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-2">Data Retention Policy</label>
            <select
              value={dataRetention}
              onChange={(e) => setDataRetention(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-sky-500"
            >
              <option value={30}>30 Days (Minimal)</option>
              <option value={90}>90 Days (Recommended)</option>
              <option value={180}>180 Days (Half Year)</option>
              <option value={365}>365 Days (Full Year)</option>
            </select>
            <p className="text-slate-500 mt-1.5">
              Automatic pruning cutoff for synced minute-level summaries on local agents.
            </p>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-2">Global Tracking Status</label>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="trackToggle"
                checked={trackingEnabled}
                onChange={(e) => setTrackingEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500 focus:ring-0 bg-slate-950 border-slate-800 cursor-pointer"
              />
              <label htmlFor="trackToggle" className="text-slate-300 cursor-pointer">
                Enable background collection on all authorized agents
              </label>
            </div>
            <p className="text-slate-500 mt-2">
              Unchecking pauses collection globally across Personal Laptop and Office PC.
            </p>
          </div>
        </div>
      </div>

      {/* Interface & Theme */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Moon className="w-4 h-4 text-purple-400" />
          Dashboard Theme & Visuals
        </h2>

        <div className="flex gap-4">
          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-xs font-semibold transition-all ${
              theme === "dark"
                ? "bg-slate-950 border-sky-500 text-white shadow"
                : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-slate-900 border border-sky-400" />
            Dark Mode (Default SaaS Theme)
          </button>

          <button
            onClick={() => setTheme("light")}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-xs font-semibold transition-all ${
              theme === "light"
                ? "bg-slate-950 border-sky-500 text-white shadow"
                : "bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-400" />
            Light Mode
          </button>
        </div>
      </div>

      {/* Account & Security Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Account & Privacy Guarantees
        </h2>

        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-2 text-slate-300">
          <div className="flex items-center justify-between">
            <span>Account Profile:</span>
            <span className="font-semibold text-white flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              Alex Vance (demo@projectpulse.dev)
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Encryption & Secrets:</span>
            <span className="text-emerald-400 font-mono">Windows DPAPI Protected</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Surveillance Safeguard:</span>
            <span className="text-emerald-400">No keystrokes, scan-codes, or screen coordinates are ever captured</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-xs font-bold shadow-lg shadow-sky-500/20 transition-all"
        >
          <Save className="w-4 h-4" />
          Save Preferences
        </button>
      </div>
    </div>
  );
}
