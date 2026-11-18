"use client";

import { useState, useEffect, useCallback } from "react";
import {
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
import { ActivityTrendChart } from "@/components/charts/ActivityTrendChart";
import { HourlyBarChart } from "@/components/charts/HourlyBarChart";
import {
  DEMO_DEVICES,
  fetchDevices,
  fetchLiveSummaries,
  calculateMetrics,
  generateHourlyFromSummaries,
  generateDailyFromSummaries,
  formatDuration,
} from "@/lib/analyticsService";
import { TimeRange, Device, ActivitySummary } from "@/types";

export default function OverviewPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    try {
      const devList = await fetchDevices();
      setDevices(devList);

      const realSummaries = await fetchLiveSummaries(timeRange, selectedDevice);
      setSummaries(realSummaries);
      setLastRefreshed(new Date().toLocaleTimeString("en-US", { hour12: true }));
    } catch (err) {
      console.error("Error loading live dashboard data:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeRange, selectedDevice]);

  useEffect(() => {
    loadData();
    // Auto-poll live summaries every 30 seconds
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Calculate live metrics
  const metrics = calculateMetrics(summaries);
  const hourlyData = generateHourlyFromSummaries(summaries);
  const dailyData = generateDailyFromSummaries(summaries, devices, timeRange === "30d" ? 30 : 7);

  return (
    <div className="space-y-8">
      {/* Page Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Activity Overview
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Supabase Cloud
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time input telemetry aggregated across Personal Laptop and Office PC
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          {/* Device Selector */}
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Devices ({devices.length} Registered)</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.device_name}
              </option>
            ))}
          </select>

          {/* Time Range Filter Buttons */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
            {(["today", "yesterday", "7d", "30d"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeRange === r
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r === "today"
                  ? "Today"
                  : r === "yesterday"
                  ? "Yesterday"
                  : r === "7d"
                  ? "7 Days"
                  : "30 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            Connected to Supabase Project •{" "}
            {devices.filter((d) => d.is_active).length} Active Device(s) •{" "}
            {summaries.length} Records ingested
          </span>
        </div>
        {lastRefreshed && (
          <span className="text-[11px] text-slate-500 font-mono">
            Last checked: {lastRefreshed}
          </span>
        )}
      </div>

      {/* Metric Cards Grid (6 primary metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Mouse Clicks"
          value={metrics.totalClicks.toLocaleString()}
          subtitle="Left, Right, Middle, X1/X2"
          icon={MousePointerClick}
          color="sky"
        />
        <MetricCard
          title="Key Presses"
          value={metrics.totalKeyboard.toLocaleString()}
          subtitle="Key-down press count"
          icon={Keyboard}
          color="purple"
        />
        <MetricCard
          title="Active Time"
          value={formatDuration(metrics.activeSeconds)}
          subtitle="User actively working"
          icon={Clock}
          color="emerald"
        />
        <MetricCard
          title="Idle Time"
          value={formatDuration(metrics.idleSeconds)}
          subtitle="Away (&gt;5 min inactive)"
          icon={Coffee}
          color="amber"
        />
        <MetricCard
          title="Scroll Activity"
          value={metrics.verticalScroll.toLocaleString()}
          subtitle="Vertical &amp; horiz delta"
          icon={Scroll}
          color="rose"
        />
        <MetricCard
          title="Movement"
          value={`${(metrics.mouseDistance / 1000).toFixed(1)}k px`}
          subtitle="Relative distance"
          icon={Navigation}
          color="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityTrendChart
            data={dailyData}
          />
        </div>
        <div>
          <HourlyBarChart
            data={hourlyData}
          />
        </div>
      </div>
    </div>
  );
}
