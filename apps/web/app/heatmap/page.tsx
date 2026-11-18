"use client";

import { useState, useEffect } from "react";
import { Flame, RefreshCw, Zap, TrendingUp, Clock, Calendar, Laptop, Monitor } from "lucide-react";
import { fetchLiveSummaries, calculateMetrics, formatDuration } from "@/lib/analyticsService";
import { ActivitySummary } from "@/types";

type HeatmapMetric = "actions" | "clicks" | "keyboard" | "active";

export default function ActivityHeatmapPage() {
  const [metric, setMetric] = useState<HeatmapMetric>("actions");
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const data = await fetchLiveSummaries("today");
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
  }, []);

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

  const getMetricValue = (item: typeof hourlyStats[0]) => {
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

  // Find peak hour
  const peakHour = [...hourlyStats].sort((a, b) => b.actions - a.actions)[0];
  const totalMetrics = calculateMetrics(summaries);
  const activeHoursCount = hourlyStats.filter((h) => h.actions > 0).length;

  const currentSelected =
    selectedHour !== null
      ? hourlyStats[selectedHour]
      : peakHour.actions > 0
      ? peakHour
      : hourlyStats[currentDhakaHour];

  return (
    <div className="space-y-8">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Flame className="w-7 h-7 text-amber-400" />
              Activity Intensity Map
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live Hourly Telemetry
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Visual 24-hour interaction rhythm, intensity hotspots, and peak productivity windows
          </p>
        </div>

        {/* Metric Selector Buttons & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {[
              { id: "actions", label: "Total Inputs" },
              { id: "clicks", label: "Mouse Clicks" },
              { id: "keyboard", label: "Key Presses" },
              { id: "active", label: "Active Time" },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id as HeatmapMetric)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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
      </div>

      {/* 3 Executive Insight Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Peak Hour Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Peak Productivity Hour
            </span>
            <span className="text-[11px] font-mono text-slate-400">Asia/Dhaka</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {peakHour.actions > 0 ? `${peakHour.hourLabel}` : "Analyzing..."}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {peakHour.actions > 0
              ? `${peakHour.actions.toLocaleString()} actions recorded (${peakHour.clicks} clicks, ${peakHour.keys} keys)`
              : "Keep typing & clicking to determine peak window"}
          </div>
        </div>

        {/* Active Work Windows */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-900 border border-sky-500/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-400" />
              Active Work Hours
            </span>
            <span className="text-[11px] font-mono text-emerald-400">Today</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {activeHoursCount} {activeHoursCount === 1 ? "Hour" : "Hours"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Total active engagement: {formatDuration(totalMetrics.activeSeconds)}
          </div>
        </div>

        {/* Input Velocity */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Input Rhythm Velocity
            </span>
            <span className="text-[11px] font-mono text-emerald-400">Real-Time</span>
          </div>
          <div className="text-2xl font-bold text-white mt-1">
            {Math.round(totalMetrics.activeSeconds / 60) > 0
              ? Math.round(totalMetrics.totalActions / (totalMetrics.activeSeconds / 60))
              : totalMetrics.totalActions}{" "}
            <span className="text-sm font-normal text-slate-400">actions / min</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Across {summaries.length} minute-buckets ingested today
          </div>
        </div>
      </div>

      {/* Modern 24-Hour Interactive Visual Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" />
              Today&apos;s 24-Hour Rhythm Timeline
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click on any hour bar below to inspect granular input telemetry
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Active Time
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
              Current Hour ({currentDhakaHour.toString().padStart(2, "0")}:00)
            </span>
          </div>
        </div>

        {/* 24-Hour Equal Columns Visualization */}
        <div className="grid grid-cols-12 md:grid-cols-24 gap-1.5 pt-4">
          {hourlyStats.map((item) => {
            const val = getMetricValue(item);
            const maxVal = getMetricMax();
            const ratio = val > 0 ? Math.max(0.15, val / maxVal) : 0;
            const isCurrent = item.hour === currentDhakaHour;
            const isSelected = selectedHour === item.hour;
            const hasActivity = item.actions > 0;

            return (
              <div
                key={item.hour}
                onClick={() => setSelectedHour(item.hour)}
                className={`group flex flex-col items-center cursor-pointer p-2 rounded-xl border transition-all ${
                  isSelected
                    ? "bg-sky-500/20 border-sky-400 shadow-md ring-1 ring-sky-400"
                    : isCurrent
                    ? "bg-slate-800/80 border-sky-500/50"
                    : hasActivity
                    ? "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600"
                    : "bg-slate-950/40 border-slate-800/40 hover:bg-slate-900"
                }`}
              >
                {/* Visual Bar Height */}
                <div className="w-full h-28 bg-slate-950/80 rounded-lg flex items-end p-1 relative overflow-hidden">
                  {/* Glowing Fill */}
                  <div
                    style={{ height: `${ratio * 100}%` }}
                    className={`w-full rounded-md transition-all duration-300 ${
                      isSelected
                        ? "bg-gradient-to-t from-sky-500 to-indigo-400"
                        : hasActivity
                        ? "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-sm"
                        : "bg-transparent"
                    }`}
                  />
                  {isCurrent && (
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                  )}
                </div>

                {/* Hour Label */}
                <div className="mt-2 text-center w-full">
                  <div
                    className={`text-[10px] font-mono tracking-tighter font-semibold ${
                      isSelected
                        ? "text-sky-300 font-bold"
                        : isCurrent
                        ? "text-sky-400 font-bold"
                        : hasActivity
                        ? "text-slate-200"
                        : "text-slate-500"
                    }`}
                  >
                    {item.hour}-{((item.hour + 1) % 24)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    {hasActivity ? val.toLocaleString() : "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Hour Granular Inspection Card */}
        {currentSelected && (
          <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold font-mono text-base">
                {currentSelected.hourLabel.split(":")[0]}h
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">
                    Hour Window: {currentSelected.hourLabel} - {((currentSelected.hour + 1) % 24).toString().padStart(2, "0")}:00
                  </h3>
                  {currentSelected.hour === currentDhakaHour && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 rounded-full">
                      Current Window
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {currentSelected.actions > 0
                    ? `Recorded ${currentSelected.recordsCount} minute batches during this hour in Asia/Dhaka time`
                    : "No hardware input events recorded during this hour"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 text-left border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Mouse Clicks</div>
                <div className="text-lg font-bold text-sky-400 font-mono mt-0.5">
                  {currentSelected.clicks.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Key Presses</div>
                <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">
                  {currentSelected.keys.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 font-medium">Active Engagement</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                  {currentSelected.activeMins} mins
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Week-in-Review Day Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Weekly Cadence</h2>
            <p className="text-xs text-slate-400 mt-0.5">Day-by-day active work tracking</p>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            Day 1 Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {[
            { day: "Mon", active: false, label: "Mon" },
            { day: "Tue", active: false, label: "Tue" },
            { day: "Wed", active: true, label: "Today (Wed)" },
            { day: "Thu", active: false, label: "Thu" },
            { day: "Fri", active: false, label: "Fri" },
            { day: "Sat", active: false, label: "Sat" },
            { day: "Sun", active: false, label: "Sun" },
          ].map((item) => (
            <div
              key={item.day}
              className={`p-4 rounded-xl border text-center transition-all ${
                item.active
                  ? "bg-gradient-to-b from-emerald-500/20 to-slate-900 border-emerald-500/40 shadow-sm"
                  : "bg-slate-950/40 border-slate-800/40 opacity-60"
              }`}
            >
              <div className={`text-xs font-bold ${item.active ? "text-emerald-400" : "text-slate-400"}`}>
                {item.label}
              </div>
              <div className="text-lg font-bold text-white mt-1">
                {item.active ? totalMetrics.totalClicks.toLocaleString() : "—"}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {item.active ? "clicks today" : "Upcoming"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
