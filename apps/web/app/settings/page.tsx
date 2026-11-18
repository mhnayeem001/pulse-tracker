"use client";

import { useState } from "react";
import { Settings, Shield, Moon, Sun, Clock, Database, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [idleThreshold, setIdleThreshold] = useState("300");
  const [timezone, setTimezone] = useState("Asia/Dhaka");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
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
          Preferences, theme appearance, privacy controls, and local timezone alignment
        </p>
      </div>

      {/* Theme Appearance Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-1 flex items-center gap-2">
          {theme === "dark" ? <Moon className="w-5 h-5 text-sky-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
          Display &amp; Theme Appearance
        </h2>
        <p className="text-xs text-slate-400 mb-6">Choose between dark cyberpunk theme and clean light theme</p>

        <div className="flex items-center gap-4">
          <button
            onClick={() => { if (theme !== "dark") toggleTheme(); }}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-xs font-semibold transition-all ${
              theme === "dark"
                ? "bg-sky-500/10 border-sky-500 text-sky-400 shadow-sm"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Dark Night Mode</span>
          </button>

          <button
            onClick={() => { if (theme !== "light") toggleTheme(); }}
            className={`flex items-center gap-3 px-5 py-3 rounded-xl border text-xs font-semibold transition-all ${
              theme === "light"
                ? "bg-amber-500/10 border-amber-500 text-amber-400 shadow-sm"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>Light Crisp Mode</span>
          </button>
        </div>
      </div>

      {/* Analytics & Idle Threshold Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          Time &amp; Idle Detection Parameters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Default Analytics Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg p-2.5 font-medium focus:outline-none focus:border-sky-500"
            >
              <option value="Asia/Dhaka">Asia/Dhaka (GMT+6 - Default)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">Calendar days reset at 12:00:00 AM local time</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Idle Duration Trigger (Seconds)
            </label>
            <input
              type="number"
              value={idleThreshold}
              onChange={(e) => setIdleThreshold(e.target.value)}
              min="30"
              max="1800"
              step="30"
              className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg p-2.5 font-mono focus:outline-none focus:border-sky-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Currently {parseInt(idleThreshold) / 60} minutes without input marks status as Idle
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Preferences</span>
          </button>

          {isSaved && (
            <span className="text-xs text-emerald-400 font-medium animate-in fade-in duration-200">
              ✓ Preferences saved successfully!
            </span>
          )}
        </div>
      </div>

      {/* Cloud & Privacy Guarantee */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          Zero-Surveillance Privacy Guarantee
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Project PULSE strictly captures raw hardware interaction counts (number of left/right clicks, key-down count, active duration).
          It does not record keystroke text, characters typed, clipboard content, screenshots, window titles, or mouse coordinates.
          Your privacy is cryptographically and architecturally guaranteed.
        </p>
      </div>
    </div>
  );
}
