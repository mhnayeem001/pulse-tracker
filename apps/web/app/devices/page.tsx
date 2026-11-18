"use client";

import { useState, useEffect } from "react";
import {
  Laptop,
  Monitor,
  MousePointerClick,
  Keyboard,
  Clock,
  Coffee,
  Scroll,
  Navigation,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { HourlyBarChart } from "@/components/charts/HourlyBarChart";
import {
  DEMO_DEVICES,
  fetchDevices,
  fetchLiveSummaries,
  calculateMetrics,
  generateHourlyFromSummaries,
  formatDuration,
  toDhakaTimeString,
} from "@/lib/analyticsService";
import { Device, ActivitySummary } from "@/types";

export default function DeviceAnalyticsPage() {
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [selectedId, setSelectedId] = useState<string>("");
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDevices = async () => {
    const list = await fetchDevices();
    setDevices(list);
    if (list.length > 0) {
      setSelectedId((prev) => (list.find((d) => d.id === prev) ? prev : list[0].id));
    }
  };

  const loadSummaries = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    if (selectedId) {
      const res = await fetchLiveSummaries("today", selectedId);
      setSummaries(res);
    }
    if (refresh) setIsRefreshing(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadSummaries();
      const interval = setInterval(() => loadSummaries(), 30000);
      return () => clearInterval(interval);
    }
  }, [selectedId]);

  const currentDevice = devices.find((d) => d.id === selectedId) || devices[0];
  const isLaptop =
    currentDevice?.device_type === "laptop" ||
    currentDevice?.device_name?.toLowerCase().includes("laptop");

  const metrics = calculateMetrics(summaries);
  const hourlyData = generateHourlyFromSummaries(summaries);

  return (
    <div className="space-y-8">
      {/* Header & Device Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Device Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live Cloud Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Deep performance and interaction metrics for each registered workstation
          </p>
        </div>

        {/* Switch Device Tabs & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadSummaries(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {devices.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                  selectedId === d.id
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {d.device_type === "laptop" || d.device_name?.toLowerCase().includes("laptop") ? (
                  <Laptop className="w-3.5 h-3.5" />
                ) : (
                  <Monitor className="w-3.5 h-3.5" />
                )}
                <span>{d.device_name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Device Info Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            {isLaptop ? <Laptop className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white">{currentDevice?.device_name}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  currentDevice?.is_active
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                }`}
              >
                {currentDevice?.is_active ? "● Online / Active" : "Inactive"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Host: {currentDevice?.hostname || "Workstation"} • OS: {currentDevice?.os_version || "Windows 11"} • Agent v{currentDevice?.agent_version || "1.0.0"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6 text-xs text-slate-400 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Last Sync</div>
            <div className="text-slate-200 font-mono font-medium mt-0.5">
              {currentDevice?.last_sync_at ? toDhakaTimeString(currentDevice.last_sync_at) : "Recently"}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Registered At</div>
            <div className="text-slate-200 font-mono font-medium mt-0.5">
              {currentDevice?.registered_at ? toDhakaTimeString(currentDevice.registered_at) : "Today"}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Mouse Clicks"
          value={metrics.totalClicks.toLocaleString()}
          subtitle="All buttons combined"
          icon={MousePointerClick}
          color="sky"
        />
        <MetricCard
          title="Key Presses"
          value={metrics.totalKeyboard.toLocaleString()}
          subtitle="Typing input volume"
          icon={Keyboard}
          color="purple"
        />
        <MetricCard
          title="Active Time"
          value={formatDuration(metrics.activeSeconds)}
          subtitle="Engaged in computer work"
          icon={Clock}
          color="emerald"
        />
        <MetricCard
          title="Idle Time"
          value={formatDuration(metrics.idleSeconds)}
          subtitle="Logged in but away"
          icon={Coffee}
          color="amber"
        />
      </div>

      {/* Device Hourly Chart */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-base font-semibold text-white mb-1">
          {currentDevice?.device_name} — Today&apos;s Hourly Activity Pattern
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Click and keyboard actions distributed by hour (Asia/Dhaka time)
        </p>
        <HourlyBarChart data={hourlyData} />
      </div>
    </div>
  );
}
