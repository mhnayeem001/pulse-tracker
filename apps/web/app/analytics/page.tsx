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
  DEMO_DEVICES,
} from "@/lib/analyticsService";
import { ActivitySummary, Device, DailyStat, HourlyStat } from "@/types";
import { RefreshCw, BarChart3, PieChart } from "lucide-react";

export default function ActivityAnalyticsPage() {
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const devList = await fetchDevices();
      setDevices(devList);
      const data = await fetchLiveSummaries("today");
      setSummaries(data);
    } catch (err) {
      console.warn("ActivityAnalytics load error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const metrics = calculateMetrics(summaries);
  const dailyData: DailyStat[] = generateDailyFromSummaries(summaries, devices, 7);
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

  return (
    <div className="space-y-8">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-sky-400" />
              Activity Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live Cloud Data
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time input telemetry, mouse vs keyboard ratios, and temporal workflow patterns
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
              {(totalKeys / (totalClicks || 1)).toFixed(2)} : 1
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

      {/* Dynamic Daily Trend */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-1">Timeline Progression</h2>
        <p className="text-xs text-slate-400 mb-6">
          Dynamic input actions growing naturally as you work each day
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
