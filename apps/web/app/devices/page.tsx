"use client";

import { useState } from "react";
import {
  Laptop,
  Monitor,
  MousePointerClick,
  Keyboard,
  Clock,
  Coffee,
  Scroll,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HourlyBarChart } from "@/components/charts/HourlyBarChart";
import { DEMO_DEVICES, formatDuration, generateHourlyDistribution, toDhakaTimeString } from "@/lib/analyticsService";

export default function DeviceAnalyticsPage() {
  const [selectedId, setSelectedId] = useState<string>(DEMO_DEVICES[0].id);

  const currentDevice = DEMO_DEVICES.find((d) => d.id === selectedId) || DEMO_DEVICES[0];
  const isLaptop = currentDevice.device_type === "laptop";

  // Device-specific stats
  const clicks = isLaptop ? 1845 : 3420;
  const keys = isLaptop ? 3820 : 8140;
  const activeSec = isLaptop ? 4 * 3600 + 18 * 60 : 7 * 3600 + 45 * 60;
  const idleSec = isLaptop ? 2 * 3600 + 10 * 60 : 1 * 3600 + 30 * 60;

  const hourlyData = generateHourlyDistribution("today", currentDevice.id);

  return (
    <div className="space-y-8">
      {/* Header & Device Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Device Analytics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deep performance and interaction metrics for each registered workstation
          </p>
        </div>

        {/* Switch Device Tabs */}
        <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
          {DEMO_DEVICES.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedId(d.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                selectedId === d.id
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {d.device_type === "laptop" ? <Laptop className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              {d.device_name}
            </button>
          ))}
        </div>
      </div>

      {/* Device Specification Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            {isLaptop ? <Laptop className="w-6 h-6 text-sky-400" /> : <Monitor className="w-6 h-6 text-emerald-400" />}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-white">{currentDevice.device_name}</h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Active & Synced
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-slate-400 font-mono">
              <span>Host: <strong className="text-slate-200 font-sans">{currentDevice.hostname}</strong></span>
              <span>OS: <strong className="text-slate-200 font-sans">{currentDevice.os_version}</strong></span>
              <span>Agent: <strong className="text-slate-200 font-sans">v{currentDevice.agent_version}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex flex-col text-xs text-slate-400 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 space-y-1 font-mono">
          <div>Last Seen: <span className="text-slate-200">{toDhakaTimeString(currentDevice.last_seen_at)}</span></div>
          <div>Last Sync: <span className="text-slate-200">{toDhakaTimeString(currentDevice.last_sync_at || "")}</span></div>
          <div>Registered: <span className="text-slate-200">{toDhakaTimeString(currentDevice.registered_at)}</span></div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Clicks"
          value={clicks.toLocaleString()}
          subtitle="Total mouse presses"
          icon={MousePointerClick}
          color="sky"
        />
        <MetricCard
          title="Key Presses"
          value={keys.toLocaleString()}
          subtitle="Total key-downs"
          icon={Keyboard}
          color="purple"
        />
        <MetricCard
          title="Active Time"
          value={formatDuration(activeSec)}
          subtitle="Engagement duration"
          icon={Clock}
          color="emerald"
        />
        <MetricCard
          title="Idle Time"
          value={formatDuration(idleSec)}
          subtitle="Away duration"
          icon={Coffee}
          color="amber"
        />
        <MetricCard
          title="Scroll Amount"
          value={(clicks * 3.8).toFixed(0)}
          subtitle="Wheel delta"
          icon={Scroll}
          color="rose"
        />
        <MetricCard
          title="Mouse Distance"
          value={`${((clicks * 22.4) / 1000).toFixed(1)}k px`}
          subtitle="Pixel displacement"
          icon={Navigation}
          color="sky"
        />
      </div>

      {/* Device Hourly Chart & Button Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">
                {currentDevice.device_name} — Today's Hourly Breakdown
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Distribution of clicks and keyboard activity by hour</p>
            </div>
          </div>
          <HourlyBarChart data={hourlyData} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white mb-1">Click Breakdown</h2>
            <p className="text-xs text-slate-400 mb-4">Distribution by mouse button</p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-300">Left Clicks</span>
                <span className="font-mono font-bold text-sky-400">{(clicks * 0.72).toFixed(0)} (72%)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-300">Right Clicks</span>
                <span className="font-mono font-bold text-indigo-400">{(clicks * 0.18).toFixed(0)} (18%)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-300">Middle Clicks</span>
                <span className="font-mono font-bold text-emerald-400">{(clicks * 0.07).toFixed(0)} (7%)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-300">X1 / X2 Clicks</span>
                <span className="font-mono font-bold text-amber-400">{(clicks * 0.03).toFixed(0)} (3%)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-xs text-slate-300">
            <strong className="text-sky-400 block mb-0.5">Privacy Notice:</strong>
            All inputs are collected via raw hardware counters. Zero keystrokes, characters, or coordinates are stored.
          </div>
        </div>
      </div>
    </div>
  );
}
