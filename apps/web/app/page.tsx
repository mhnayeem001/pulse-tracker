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
  Zap,
  Target,
  Compass,
  FileText,
  MousePointer,
  Flame,
  Award,
  Sparkles,
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

  const totalClicks = metrics.totalClicks;
  const totalKeys = metrics.totalKeyboard;
  const totalActive = metrics.activeSeconds;
  const totalInputs = totalClicks + totalKeys;
  const clickPercent = totalInputs > 0 ? ((totalClicks / totalInputs) * 100).toFixed(1) : "0";
  const keyPercent = totalInputs > 0 ? ((totalKeys / totalInputs) * 100).toFixed(1) : "0";

  // Productivity Persona & Archetype
  const keyToClickRatio = totalClicks > 0 ? totalKeys / totalClicks : totalKeys > 0 ? 5 : 1;
  let archetypeTitle = "Flow State Professional";
  let archetypeDesc = "Balanced mouse & keyboard cadence with fluid application navigation.";
  let archetypeIcon = Target;
  let archetypeColor = "text-sky-400 bg-sky-500/10 border-sky-500/20";

  if (keyToClickRatio >= 2.5) {
    archetypeTitle = "Deep Coder / Technical Writer";
    archetypeDesc = "Heavy keystroke-dominated flow with high syntactic typing density.";
    archetypeIcon = Zap;
    archetypeColor = "text-purple-400 bg-purple-500/10 border-purple-500/20";
  } else if (keyToClickRatio < 1.0) {
    archetypeTitle = "Visual Designer / Power Navigator";
    archetypeDesc = "Spatial UI-driven interaction with high cursor precision and click density.";
    archetypeIcon = Compass;
    archetypeColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  }
  const ArchetypeIconComponent = archetypeIcon;

  // Estimated Words (Standard 5 keystrokes per word)
  const estimatedWords = Math.round(totalKeys / 5);
  // Typing Cadence (Keys per active minute)
  const activeMinutes = Math.max(1, Math.round(totalActive / 60));
  const typingSpeedWpm = Math.round(estimatedWords / activeMinutes);
  const keysPerMin = Math.round(totalKeys / activeMinutes);

  // Mouse Physical Distance in Meters (approx. 96 DPI pixel to meter conversion)
  const distanceMeters = Math.round(metrics.mouseDistance * 0.0002645833 * 10) / 10;

  // Focus Score (0 - 100)
  const activeRatioFactor = metrics.activePercentage * 0.5;
  const volumeFactor = Math.min(50, (totalInputs / 200) * 5);
  const focusScore = Math.min(100, Math.round(activeRatioFactor + volumeFactor));

  // Longest Focus Streak calculation
  let longestStreakMinutes = 0;
  let currentStreak = 0;
  for (const s of summaries) {
    if ((s.active_seconds || 0) >= 20) {
      currentStreak++;
      if (currentStreak > longestStreakMinutes) longestStreakMinutes = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

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

      {/* Work Archetype & Productivity Persona Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-sm relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
            <ArchetypeIconComponent className="w-7 h-7 text-sky-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Work Personality Profile
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${archetypeColor}`}>
                {archetypeTitle}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1 leading-relaxed max-w-2xl">
              {archetypeDesc}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-slate-400">
              <span>Keystroke/Click Ratio: <strong className="text-white">{keyToClickRatio.toFixed(2)} : 1</strong></span>
              <span>•</span>
              <span>Input Distribution: <strong className="text-purple-400">{keyPercent}% Keyboard</strong> vs <strong className="text-sky-400">{clickPercent}% Mouse</strong></span>
            </div>
          </div>
        </div>

        {/* Productivity Score Badge */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 self-start lg:self-auto shrink-0">
          <Award className="w-8 h-8 text-amber-400" />
          <div>
            <div className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">
              Focus Score Today
            </div>
            <div className="text-2xl font-black text-white font-mono mt-0.5">
              {focusScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Productivity & Ergonomic Micro-Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Estimated Words */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1.5 text-purple-400">
              <FileText className="w-4 h-4" />
              Estimated Words
            </span>
            <span className="font-mono text-purple-400">Typing</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            ~{estimatedWords.toLocaleString()} <span className="text-xs font-normal text-slate-400">words</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Cadence: <strong>{keysPerMin} keys/min</strong> (~{typingSpeedWpm} WPM)
          </div>
        </div>

        {/* Deep Focus Streak */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1.5 text-emerald-400">
              <Flame className="w-4 h-4" />
              Longest Focus Streak
            </span>
            <span className="font-mono text-emerald-400">Deep Work</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {longestStreakMinutes > 0 ? `${longestStreakMinutes} mins` : `${Math.round(totalActive / 60)} mins`}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Continuous active work without idle pause
          </div>
        </div>

        {/* Mouse Physical Distance */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1.5 text-sky-400">
              <MousePointer className="w-4 h-4" />
              Cursor Travel Distance
            </span>
            <span className="font-mono text-sky-400">Physical</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {distanceMeters > 0 ? `${distanceMeters} m` : `${(metrics.mouseDistance / 1000).toFixed(1)}k px`}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {metrics.mouseDistance.toLocaleString()} pixels of motion
          </div>
        </div>

        {/* Click Specialization */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-4 h-4" />
              Click Balance
            </span>
            <span className="font-mono text-amber-400">Buttons</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {metrics.leftClicks.toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span> / {metrics.rightClicks.toLocaleString()} <span className="text-xs font-normal text-slate-400">R</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {metrics.middleClicks > 0 ? `${metrics.middleClicks} middle clicks` : "Dominant primary clicking"}
          </div>
        </div>
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
