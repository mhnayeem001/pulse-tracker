"use client";

import { useState, useEffect } from "react";
import { ActivityTrendChart } from "@/components/charts/ActivityTrendChart";
import { HourlyBarChart } from "@/components/charts/HourlyBarChart";
import { RatioPieChart } from "@/components/charts/RatioPieChart";
import {
  fetchDevices,
  fetchLiveSummaries,
  calculateMetrics,
  generateDailyFromSummaries,
  generateHourlyFromSummaries,
  formatDuration,
  DEMO_DEVICES,
} from "@/lib/analyticsService";
import { ActivitySummary, Device, DailyStat, HourlyStat } from "@/types";
import {
  RefreshCw,
  BarChart3,
  Sparkles,
  Zap,
  Target,
  Compass,
  FileText,
  MousePointer,
  Flame,
  Award,
  ShieldCheck,
} from "lucide-react";

export default function ActivityAnalyticsPage() {
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [trendSummaries, setTrendSummaries] = useState<ActivitySummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const devList = await fetchDevices();
      setDevices(devList);
      const [todayData, trendData] = await Promise.all([
        fetchLiveSummaries("today"),
        fetchLiveSummaries("7d"),
      ]);
      setSummaries(todayData);
      setTrendSummaries(trendData);
    } catch (err) {
      console.warn("ActivityAnalytics load error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const metrics = calculateMetrics(summaries);
  const dailyData: DailyStat[] = generateDailyFromSummaries(
    trendSummaries.length > 0 ? trendSummaries : summaries,
    devices,
    7
  );
  const hourlyData: HourlyStat[] = generateHourlyFromSummaries(summaries);

  const totalClicks = metrics.totalClicks;
  const totalKeys = metrics.totalKeyboard;
  const totalActive = metrics.activeSeconds;
  const totalIdle = metrics.idleSeconds;

  const inputRatioData = [
    { name: "Mouse Clicks", value: totalClicks || 0, color: "#38bdf8" },
    { name: "Keyboard Presses", value: totalKeys || 0, color: "#a855f7" },
  ];

  const timeRatioData = [
    { name: "Active Time", value: Math.round(totalActive / 60) || 0, color: "#10b981" },
    { name: "Idle Time", value: Math.round(totalIdle / 60) || 0, color: "#f59e0b" },
  ];

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
  const distanceMeters = Math.round(metrics.mouseDistance * 0.0002645833 * 10) / 10;
  // Estimated Pages Scrolled (approx. 360 delta per scroll wheel step)
  const estimatedPagesScrolled = Math.round(metrics.verticalScroll / 360);

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
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-sky-400" />
              Activity &amp; Productivity Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live Cloud Insights
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Work personality profiling, keystroke efficiency, focus scoring, and physical ergonomic telemetry
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
          <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
        </button>
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

      {/* 4 Productivity & Ergonomic Metric Cards */}
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
            {metrics.leftClicks.toLocaleString()}{" "}
            <span className="text-xs font-normal text-slate-400">L / {metrics.rightClicks.toLocaleString()} R</span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Speed: <strong>{clicksPerMin} clicks/min</strong> active
          </div>
        </div>
      </div>

      {/* Donut Ratio Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mouse vs Keyboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold text-white">Mouse vs. Keyboard Ratio</h2>
              <p className="text-xs text-slate-400 mt-0.5">Real input balance distribution recorded today</p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
              {keyToClickRatio.toFixed(2)} : 1
            </span>
          </div>
          <RatioPieChart data={inputRatioData} />
          <div className="mt-4 text-center text-xs text-slate-400">
            {clickPercent}% Mouse ({totalClicks.toLocaleString()}) vs{" "}
            {keyPercent}% Keyboard ({totalKeys.toLocaleString()})
          </div>
        </div>

        {/* Active vs Idle Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold text-white">Active vs. Idle Time</h2>
              <p className="text-xs text-slate-400 mt-0.5">Productive engagement vs idle computer time today</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              {metrics.activePercentage}% Active
            </span>
          </div>
          <RatioPieChart data={timeRatioData} />
          <div className="mt-4 text-center text-xs text-slate-400">
            {Math.round(totalActive / 60)} min Active vs {Math.round(totalIdle / 60)} min Idle
          </div>
        </div>
      </div>

      {/* Continuous 7-Day Rolling Wave Trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-1">Timeline Progression</h2>
        <p className="text-xs text-slate-400 mb-6">
          Continuous 7-day rolling wave curve across Personal Laptop and Office PC
        </p>
        <ActivityTrendChart data={dailyData} />
      </div>

      {/* Hourly Bar Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-1">Today&apos;s Hourly Rhythm</h2>
        <p className="text-xs text-slate-400 mb-6">24-hour distribution across Asia/Dhaka local time</p>
        <HourlyBarChart data={hourlyData} />
      </div>
    </div>
  );
}
