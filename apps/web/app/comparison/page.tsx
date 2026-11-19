"use client";

import { useState, useEffect } from "react";
import { Laptop, Monitor, ArrowLeftRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { ActivityTrendChart } from "@/components/charts/ActivityTrendChart";
import { RatioPieChart } from "@/components/charts/RatioPieChart";
import {
  fetchDevices,
  fetchLiveSummaries,
  getDeviceContributions,
  generateDailyFromSummaries,
  formatDuration,
  DEMO_DEVICES,
} from "@/lib/analyticsService";
import { ActivitySummary, Device, DailyStat } from "@/types";

export default function DeviceComparisonPage() {
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
      console.warn("Comparison load error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const contributions = getDeviceContributions(summaries, devices);
  const dailyData: DailyStat[] = generateDailyFromSummaries(
    trendSummaries.length > 0 ? trendSummaries : summaries,
    devices,
    7
  );

  const laptop = contributions.laptop;
  const office = contributions.office;

  const clickContribution = [
    { name: laptop.device?.device_name || "Personal Laptop", value: laptop.clicks, color: "#0ea5e9" },
    { name: office.device?.device_name || "Office pc", value: office.clicks, color: "#10b981" },
  ];

  const keyContribution = [
    { name: laptop.device?.device_name || "Personal Laptop", value: laptop.keys, color: "#0ea5e9" },
    { name: office.device?.device_name || "Office pc", value: office.keys, color: "#10b981" },
  ];

  const totalClicks = contributions.totalClicks || 1;
  const totalKeys = contributions.totalKeys || 1;

  return (
    <div className="space-y-8">
      {/* Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <ArrowLeftRight className="w-7 h-7 text-sky-400" />
              Device Comparison
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live Cloud Sync
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Objective interaction analysis between Personal Laptop and Office PC
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

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Laptop Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                <Laptop className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {laptop.device?.device_name || "Personal Laptop"}
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {laptop.device?.hostname || "Personal Workstation"}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              {laptop.device?.is_active ? "● Online" : "Ready"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/60">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Clicks</div>
              <div className="text-xl font-bold text-white mt-1">{laptop.clicks.toLocaleString()}</div>
              <div className="text-[11px] text-sky-400 mt-0.5 font-medium">
                {((laptop.clicks / totalClicks) * 100).toFixed(0)}% Share
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Key Presses</div>
              <div className="text-xl font-bold text-white mt-1">{laptop.keys.toLocaleString()}</div>
              <div className="text-[11px] text-sky-400 mt-0.5 font-medium">
                {((laptop.keys / totalKeys) * 100).toFixed(0)}% Share
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Active Time</div>
              <div className="text-base font-bold text-white mt-1">{formatDuration(laptop.activeSeconds)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Engaged</div>
            </div>
          </div>
        </div>

        {/* Office PC Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {office.device?.device_name || "Office pc"}
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {office.device?.hostname || "Office Workstation"}
                </span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              {office.device?.is_active ? "● Online" : "Ready"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/60">
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Clicks</div>
              <div className="text-xl font-bold text-white mt-1">{office.clicks.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
                {((office.clicks / totalClicks) * 100).toFixed(0)}% Share
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Key Presses</div>
              <div className="text-xl font-bold text-white mt-1">{office.keys.toLocaleString()}</div>
              <div className="text-[11px] text-emerald-400 mt-0.5 font-medium">
                {((office.keys / totalKeys) * 100).toFixed(0)}% Share
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Active Time</div>
              <div className="text-base font-bold text-white mt-1">{formatDuration(office.activeSeconds)}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Engaged</div>
            </div>
          </div>
        </div>
      </div>

      {/* Work Share Donuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-white mb-1">Click Contribution Ratio</h2>
          <p className="text-xs text-slate-400 mb-4">Proportion of mouse interactions across workstations</p>
          <RatioPieChart data={clickContribution} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-white mb-1">Typing Contribution Ratio</h2>
          <p className="text-xs text-slate-400 mb-4">Proportion of keyboard inputs across workstations</p>
          <RatioPieChart data={keyContribution} />
        </div>
      </div>

      {/* Daily Device Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-1">Combined Daily Trend</h2>
        <p className="text-xs text-slate-400 mb-6">
          Daily comparative click volume (Sky: Personal Laptop vs Green: Office PC)
        </p>
        <ActivityTrendChart data={dailyData} />
      </div>
    </div>
  );
}
