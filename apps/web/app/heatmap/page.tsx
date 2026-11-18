"use client";

import { useState, useEffect } from "react";
import {
  Flame,
  RefreshCw,
  Zap,
  TrendingUp,
  Clock,
  Calendar,
  Keyboard as KeyboardIcon,
  Target,
  Compass,
  FileText,
  MousePointer,
  Award,
  Sparkles,
} from "lucide-react";
import {
  fetchLiveSummaries,
  fetchDevices,
  calculateMetrics,
  formatDuration,
  aggregateKeyCounts,
  DEMO_DEVICES,
} from "@/lib/analyticsService";
import { ActivitySummary, Device, TimeRange } from "@/types";
import { KeyboardHeatmap } from "@/components/charts/KeyboardHeatmap";

type HeatmapMetric = "actions" | "clicks" | "keyboard" | "active";
type HeatmapTab = "keyboard" | "timeline";

export default function ActivityHeatmapPage() {
  const [activeTab, setActiveTab] = useState<HeatmapTab>("keyboard");
  const [metric, setMetric] = useState<HeatmapMetric>("actions");
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("all");
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const devList = await fetchDevices();
      setDevices(devList);
      const data = await fetchLiveSummaries(timeRange, selectedDeviceId);
      setSummaries(data);
    } catch (err) {
      console.warn("Heatmap load error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, [timeRange, selectedDeviceId]);

  // Compute 24 hours stats for Today in Asia/Dhaka time
  const hourlyStats = Array.from({ length: 24 }, (_, hour) => {
    const hourSummaries = summaries.filter((s) => {
      const d = new Date(s.bucket_start);
      const dhakaHour =
        parseInt(
          d.toLocaleTimeString("en-US", {
            timeZone: "Asia/Dhaka",
            hour: "2-digit",
            hour12: false,
          }),
          10
        ) % 24;
      return dhakaHour === hour;
    });

    let clicks = 0;
    let keys = 0;
    let activeSec = 0;

    for (const s of hourSummaries) {
      clicks +=
        (s.left_clicks || 0) +
        (s.right_clicks || 0) +
        (s.middle_clicks || 0) +
        (s.x1_clicks || 0) +
        (s.x2_clicks || 0);
      keys += s.keyboard_presses || 0;
      activeSec += s.active_seconds || 0;
    }

    const actions = clicks + keys;
    const activeMins = Math.round(activeSec / 60);

    return {
      hour,
      hourLabel: `${hour.toString().padStart(2, "0")}:00`,
      clicks,
      keys,
      actions,
      activeMins,
      activeSec,
      recordsCount: hourSummaries.length,
    };
  });

  // Calculate maximum values for relative bar height / color intensity
  const maxActions = Math.max(...hourlyStats.map((h) => h.actions), 1);
  const maxClicks = Math.max(...hourlyStats.map((h) => h.clicks), 1);
  const maxKeys = Math.max(...hourlyStats.map((h) => h.keys), 1);
  const maxActive = Math.max(...hourlyStats.map((h) => h.activeMins), 1);

  const getMetricValue = (item: (typeof hourlyStats)[0]) => {
    if (metric === "clicks") return item.clicks;
    if (metric === "keyboard") return item.keys;
    if (metric === "active") return item.activeMins;
    return item.actions;
  };

  const getMetricMax = () => {
    if (metric === "clicks") return maxClicks;
    if (metric === "keyboard") return maxKeys;
    if (metric === "active") return maxActive;
    return maxActions;
  };

  const currentDhakaHour =
    parseInt(
      new Date().toLocaleTimeString("en-US", {
        timeZone: "Asia/Dhaka",
        hour: "2-digit",
        hour12: false,
      }),
      10
    ) % 24;

  const totalMetrics = calculateMetrics(summaries);

  // Peak activity hour
  const peakHour = [...hourlyStats].sort((a, b) => b.actions - a.actions)[0];

  const selectedHourData =
    selectedHour !== null
      ? hourlyStats[selectedHour]
      : hourlyStats[currentDhakaHour];

  const selectedDeviceName =
    selectedDeviceId === "all"
      ? "All Paired Devices"
      : devices.find((d) => d.id === selectedDeviceId)?.device_name || "Active Device";

  // --- WORK PERSONALITY & PRODUCTIVITY CARD METRICS (1st Image) ---
  const totalClicks = totalMetrics.totalClicks;
  const totalKeys = totalMetrics.totalKeyboard;
  const totalActive = totalMetrics.activeSeconds;
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
  const clicksPerMin = Math.round(totalClicks / activeMinutes);

  // Mouse Physical Distance in Meters (approx. 96 DPI pixel to meter conversion)
  const distanceMeters = Math.round(totalMetrics.mouseDistance * 0.0002645833 * 10) / 10;

  // Focus Score (0 - 100)
  const activeRatioFactor = totalMetrics.activePercentage * 0.5;
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

  // Real Hardware Key Counts (from desktop agent vkey telemetry)
  const realKeyCounts = aggregateKeyCounts(summaries);

  return (
    <div className="space-y-8">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Flame className="w-7 h-7 text-amber-400" />
              Activity &amp; Keyboard Heatmaps
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live Cloud Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Visual keyboard button heatmap, productivity profiling, and 24-hour interaction rhythms
          </p>
        </div>

        {/* Global Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          {/* Device Selector */}
          <select
            value={selectedDeviceId}
            onChange={(e) => setSelectedDeviceId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Devices ({devices.length} Paired)</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.device_name}
              </option>
            ))}
          </select>

          {/* Time Range Filter */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
            {(["today", "7d", "30d"] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  timeRange === r
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {r === "today" ? "Today" : r === "7d" ? "7 Days" : "30 Days"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 1ST IMAGE: WORK PERSONALITY PROFILE BANNER & FOCUS SCORE */}
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

      {/* 1ST IMAGE: 4 PRODUCTIVITY & ERGONOMIC CARDS */}
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
            {distanceMeters > 0 ? `${distanceMeters} m` : `${(totalMetrics.mouseDistance / 1000).toFixed(1)}k px`}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {totalMetrics.mouseDistance.toLocaleString()} pixels of motion
          </div>
        </div>

        {/* Click Balance */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-medium flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-4 h-4" />
              Click Balance
            </span>
            <span className="font-mono text-amber-400">Buttons</span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {totalMetrics.leftClicks.toLocaleString()} <span className="text-xs font-normal text-slate-400">L</span> / {totalMetrics.rightClicks.toLocaleString()} <span className="text-xs font-normal text-slate-400">R</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Speed: <strong>{clicksPerMin} clicks/min</strong> active
          </div>
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-xl max-w-md shadow-sm">
        <button
          onClick={() => setActiveTab("keyboard")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "keyboard"
              ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <KeyboardIcon className="w-4 h-4" />
          <span>Keyboard Button Heatmap</span>
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg transition-all ${
            activeTab === "timeline"
              ? "bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>24-Hour Rhythm Timeline</span>
        </button>
      </div>

      {/* TAB 1: KEYBOARD BUTTON HEATMAP */}
      {activeTab === "keyboard" && (
        <KeyboardHeatmap
          totalKeystrokes={totalMetrics.totalKeyboard}
          deviceName={selectedDeviceName}
          timeRangeLabel={timeRange === "today" ? "Today" : timeRange === "7d" ? "Past 7 Days" : "Past 30 Days"}
          realKeyCounts={realKeyCounts}
        />
      )}

      {/* TAB 2: 24-HOUR RHYTHM TIMELINE */}
      {activeTab === "timeline" && (
        <div className="space-y-8">
          {/* Timeline Metric Selector Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-mono text-slate-400">
              Select metric to visualize on timeline bars:
            </span>
            <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-lg">
              {[
                { id: "actions", label: "Total Inputs" },
                { id: "clicks", label: "Mouse Clicks" },
                { id: "keyboard", label: "Key Presses" },
                { id: "active", label: "Active Time" },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id as HeatmapMetric)}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    metric === m.id
                      ? "bg-sky-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3 Executive Insight Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Peak Hour Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4" /> Peak Flow Window
                </span>
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  {peakHour ? `${peakHour.hour}-${peakHour.hour + 1}` : "—"}
                </span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {peakHour?.actions > 0 ? `${peakHour.actions.toLocaleString()} inputs` : "0 inputs"}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Highest concentration of clicks &amp; keystrokes
              </p>
            </div>

            {/* Total Today Activity */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Active Working Time
                </span>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Today
                </span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {formatDuration(totalMetrics.activeSeconds)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {totalMetrics.activePercentage}% of tracked time spent active
              </p>
            </div>

            {/* Current Realtime Hour */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-900 border border-sky-500/20 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> Current Hour
                </span>
                <span className="text-xs font-mono text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded">
                  {`${currentDhakaHour}-${currentDhakaHour + 1}`}
                </span>
              </div>
              <div className="text-2xl font-bold text-white font-mono">
                {hourlyStats[currentDhakaHour]?.actions.toLocaleString()} inputs
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Live activity accumulating this hour
              </p>
            </div>
          </div>

          {/* 24-Hour Rhythm Timeline Grid */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-sky-400" />
                  Today&apos;s 24-Hour Rhythm Timeline
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click on any hour bar below to inspect granular input telemetry
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Active Time
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Current Hour ({currentDhakaHour}:00)
                </span>
              </div>
            </div>

            {/* 24 Hour Interactive Cards */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {hourlyStats.map((item) => {
                const val = getMetricValue(item);
                const max = getMetricMax();
                const ratio = val > 0 ? Math.min(1, Math.max(0.12, val / max)) : 0;
                const isCurrent = item.hour === currentDhakaHour;
                const isSelected = selectedHour === item.hour;

                return (
                  <button
                    key={item.hour}
                    onClick={() => setSelectedHour(item.hour)}
                    className={`group relative flex flex-col items-center justify-between h-36 p-2 rounded-xl border transition-all select-none ${
                      isSelected
                        ? "bg-sky-500/10 border-sky-400 ring-2 ring-sky-400/40"
                        : isCurrent
                        ? "bg-slate-950/80 border-sky-500/50 ring-1 ring-sky-500/30"
                        : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Top indicator dot */}
                    <div className="w-full flex justify-center">
                      {isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
                      ) : val > 0 ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                      ) : (
                        <span className="w-1.5 h-1.5" />
                      )}
                    </div>

                    {/* Bar visualizer inside column */}
                    <div className="w-full flex-1 flex items-end justify-center py-2">
                      {val > 0 ? (
                        <div
                          className="w-full rounded-lg bg-gradient-to-t from-emerald-500 to-emerald-400 transition-all duration-500 shadow-sm shadow-emerald-500/20 group-hover:from-emerald-400 group-hover:to-teal-300"
                          style={{ height: `${Math.round(ratio * 100)}%` }}
                        />
                      ) : (
                        <div className="w-full h-1 rounded bg-slate-800/50" />
                      )}
                    </div>

                    {/* Bottom hour and value */}
                    <div className="w-full text-center">
                      <div
                        className={`text-xs font-mono font-bold leading-tight ${
                          isCurrent
                            ? "text-sky-400"
                            : val > 0
                            ? "text-slate-200"
                            : "text-slate-400"
                        }`}
                      >
                        {`${item.hour}-${item.hour + 1}`}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                        {val > 0 ? val.toLocaleString() : "—"}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Granular Inspection Card */}
          {selectedHourData && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Hourly Telemetry Breakdown: {selectedHourData.hour}:00 – {selectedHourData.hour + 1}:00
                    </h3>
                    <p className="text-xs text-slate-400">
                      Granular 60-second summary aggregations
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-800 text-slate-300">
                    {selectedHourData.recordsCount} minute record(s)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Total Inputs</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {selectedHourData.actions.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">Clicks + Key presses</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Mouse Clicks</span>
                  <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                    {selectedHourData.clicks.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">Left, Right &amp; Middle</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Key Presses</span>
                  <div className="text-xl font-bold font-mono text-purple-400 mt-1">
                    {selectedHourData.keys.toLocaleString()}
                  </div>
                  <span className="text-[11px] text-slate-500">Total KeyDown events</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-xs text-slate-400">Active Duration</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {formatDuration(selectedHourData.activeSec)}
                  </div>
                  <span className="text-[11px] text-slate-500">{selectedHourData.activeMins} active minutes</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
