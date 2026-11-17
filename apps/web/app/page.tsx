"use client";

import { useState } from "react";
import {
  MousePointerClick,
  Keyboard,
  Clock,
  Coffee,
  Scroll,
  Navigation,
  Laptop,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityTrendChart } from "@/components/charts/ActivityTrendChart";
import { HourlyBarChart } from "@/components/charts/HourlyBarChart";
import {
  DEMO_DEVICES,
  formatDuration,
  generateDailyTrends,
  generateHourlyDistribution,
  toDhakaTimeString,
} from "@/lib/analyticsService";
import { TimeRange } from "@/types";

export default function OverviewPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [selectedDevice, setSelectedDevice] = useState<string>("all");

  const dailyData = generateDailyTrends(timeRange === "30d" ? 30 : 7);
  const hourlyData = generateHourlyDistribution(timeRange, selectedDevice === "all" ? undefined : selectedDevice);

  // Aggregate stats based on time range
  const totalClicks = dailyData.reduce((acc, curr) => acc + curr.totalClicks, 0);
  const totalKeyboard = dailyData.reduce((acc, curr) => acc + curr.totalKeyboard, 0);
  const activeSec = dailyData.reduce((acc, curr) => acc + curr.activeSeconds, 0);
  const idleSec = dailyData.reduce((acc, curr) => acc + curr.idleSeconds, 0);

  return (
    <div className="space-y-8">
      {/* Page Title & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Activity Overview
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Aggregated cross-device input metrics across Personal Laptop and Office PC
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Device Selector */}
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Devices (Combined)</option>
            <option value={DEMO_DEVICES[0].id}>Personal Laptop</option>
            <option value={DEMO_DEVICES[1].id}>Office PC</option>
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

      {/* Metric Cards Grid (6 primary metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Mouse Clicks"
          value={totalClicks.toLocaleString()}
          subtitle="Left, Right, Middle, X1/X2"
          icon={MousePointerClick}
          color="sky"
        />
        <MetricCard
          title="Key Presses"
          value={totalKeyboard.toLocaleString()}
          subtitle="Key-down press count"
          icon={Keyboard}
          color="purple"
        />
        <MetricCard
          title="Active Time"
          value={formatDuration(activeSec)}
          subtitle="User actively working"
          icon={Clock}
          color="emerald"
        />
        <MetricCard
          title="Idle Time"
          value={formatDuration(idleSec)}
          subtitle="Away (>5 min inactive)"
          icon={Coffee}
          color="amber"
        />
        <MetricCard
          title="Scroll Activity"
          value={(totalClicks * 3.4).toFixed(0)}
          subtitle="Vertical & horiz delta"
          icon={Scroll}
          color="rose"
        />
        <MetricCard
          title="Movement"
          value={`${((totalClicks * 18.2) / 1000).toFixed(1)}k px`}
          subtitle="Relative distance"
          icon={Navigation}
          color="sky"
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Activity Trends (Area Chart) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Daily Activity Trends</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparison of input actions across registered devices
              </p>
            </div>
            <span className="text-xs text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-md border border-sky-500/20 font-medium">
              Daily aggregates
            </span>
          </div>
          <ActivityTrendChart data={dailyData} />
        </div>

        {/* Hourly Distribution (Bar Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Hourly Pattern</h2>
              <p className="text-xs text-slate-400 mt-0.5">24-hour distribution today</p>
            </div>
            <span className="text-xs text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md border border-purple-500/20 font-medium">
              00:00 - 23:00
            </span>
          </div>
          <HourlyBarChart data={hourlyData} />
        </div>
      </div>

      {/* Device Sync Status & Recent Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Synchronization Status Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Device Synchronization Status</h2>
              <p className="text-xs text-slate-400 mt-0.5">Live heartbeat and last sync timestamps</p>
            </div>
            <RefreshCw className="w-4 h-4 text-slate-400 cursor-pointer hover:text-white" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3 font-semibold">Device</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Last Seen</th>
                  <th className="pb-3 font-semibold">Last Cloud Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {DEMO_DEVICES.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-medium flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-sky-400 shrink-0" />
                      <div>
                        <div className="text-white font-semibold">{d.device_name}</div>
                        <div className="text-[10px] text-slate-500">{d.hostname}</div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Synchronized
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-400">
                      {toDhakaTimeString(d.last_seen_at)}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-400">
                      {d.last_sync_at ? toDhakaTimeString(d.last_sync_at) : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Aggregation Insights */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-white mb-1">Activity Highlights</h2>
          <p className="text-xs text-slate-400 mb-4">Summary of today's key digital interactions</p>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="text-slate-300">Active vs Idle Ratio</span>
              <span className="font-semibold text-emerald-400 font-mono">
                {((activeSec / (activeSec + idleSec || 1)) * 100).toFixed(1)}% Active
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="text-slate-300">Keyboard to Mouse Ratio</span>
              <span className="font-semibold text-purple-400 font-mono">
                {(totalKeyboard / (totalClicks || 1)).toFixed(2)} : 1
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="text-slate-300">Average Actions per Active Hour</span>
              <span className="font-semibold text-sky-400 font-mono">
                {Math.round((totalClicks + totalKeyboard) / Math.max(1, activeSec / 3600)).toLocaleString()} / hr
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/50 border border-slate-800/80">
              <span className="text-slate-300">Current Synchronization Status</span>
              <span className="font-semibold text-emerald-400">0 pending records (All synced)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
