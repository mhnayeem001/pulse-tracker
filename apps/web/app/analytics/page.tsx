"use client";

import { ActivityTrendChart } from "@/components/charts/ActivityTrendChart";
import { HourlyBarChart } from "@/components/charts/HourlyBarChart";
import { RatioPieChart } from "@/components/charts/RatioPieChart";
import { generateDailyTrends, generateHourlyDistribution } from "@/lib/analyticsService";

export default function ActivityAnalyticsPage() {
  const dailyData = generateDailyTrends(14);
  const hourlyData = generateHourlyDistribution("today");

  const totalClicks = dailyData.reduce((acc, curr) => acc + curr.totalClicks, 0);
  const totalKeys = dailyData.reduce((acc, curr) => acc + curr.totalKeyboard, 0);
  const totalActive = dailyData.reduce((acc, curr) => acc + curr.activeSeconds, 0);
  const totalIdle = dailyData.reduce((acc, curr) => acc + curr.idleSeconds, 0);

  const inputRatioData = [
    { name: "Mouse Clicks", value: totalClicks, color: "#38bdf8" },
    { name: "Keyboard Presses", value: totalKeys, color: "#a855f7" },
  ];

  const timeRatioData = [
    { name: "Active Time", value: Math.round(totalActive / 60), color: "#10b981" },
    { name: "Idle Time", value: Math.round(totalIdle / 60), color: "#f59e0b" },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
          Activity Analytics
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          In-depth comparative analysis, input ratios, and temporal workflow patterns
        </p>
      </div>

      {/* Donut Ratio Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mouse vs Keyboard */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold text-white">Mouse vs. Keyboard Ratio</h2>
              <p className="text-xs text-slate-400 mt-0.5">Input balance distribution over the past 14 days</p>
            </div>
            <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20">
              {(totalKeys / (totalClicks || 1)).toFixed(2)} : 1
            </span>
          </div>
          <RatioPieChart data={inputRatioData} />
          <div className="mt-4 text-center text-xs text-slate-400">
            {((totalClicks / (totalClicks + totalKeys)) * 100).toFixed(1)}% Mouse vs{" "}
            {((totalKeys / (totalClicks + totalKeys)) * 100).toFixed(1)}% Keyboard
          </div>
        </div>

        {/* Active vs Idle Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-semibold text-white">Active vs. Idle Time Ratio</h2>
              <p className="text-xs text-slate-400 mt-0.5">Focus time compared to away durations</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
              {((totalActive / (totalActive + totalIdle || 1)) * 100).toFixed(1)}% Active
            </span>
          </div>
          <RatioPieChart data={timeRatioData} />
          <div className="mt-4 text-center text-xs text-slate-400">
            {Math.round(totalActive / 3600)} hrs active vs {Math.round(totalIdle / 3600)} hrs idle recorded
          </div>
        </div>
      </div>

      {/* 14-day Trend Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">14-Day Cross-Device Activity History</h2>
            <p className="text-xs text-slate-400 mt-0.5">Total daily input volume by computer</p>
          </div>
        </div>
        <ActivityTrendChart data={dailyData} />
      </div>

      {/* Weekday & Hourly Patterns */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Hourly Engagement Profile</h2>
            <p className="text-xs text-slate-400 mt-0.5">Input density throughout the 24-hour cycle</p>
          </div>
        </div>
        <HourlyBarChart data={hourlyData} />
      </div>
    </div>
  );
}
