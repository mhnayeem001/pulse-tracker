"use client";

import { Laptop, Monitor, ArrowLeftRight } from "lucide-react";
import { ActivityTrendChart } from "@/components/charts/ActivityTrendChart";
import { RatioPieChart } from "@/components/charts/RatioPieChart";
import { DEMO_DEVICES, formatDuration, generateDailyTrends } from "@/lib/analyticsService";

export default function DeviceComparisonPage() {
  const dailyData = generateDailyTrends(7);

  const laptopClicks = dailyData.reduce((acc, curr) => acc + curr.laptopClicks, 0);
  const officeClicks = dailyData.reduce((acc, curr) => acc + curr.officeClicks, 0);
  const totalClicks = laptopClicks + officeClicks;

  const laptopKeys = dailyData.reduce((acc, curr) => acc + curr.laptopKeyboard, 0);
  const officeKeys = dailyData.reduce((acc, curr) => acc + curr.officeKeyboard, 0);
  const totalKeys = laptopKeys + officeKeys;

  const laptopActiveSec = 22 * 3600 + 40 * 60;
  const officeActiveSec = 38 * 3600 + 15 * 60;
  const totalActiveSec = laptopActiveSec + officeActiveSec;

  const clickContribution = [
    { name: "Personal Laptop", value: laptopClicks, color: "#0ea5e9" },
    { name: "Office PC", value: officeClicks, color: "#10b981" },
  ];

  const keyContribution = [
    { name: "Personal Laptop", value: laptopKeys, color: "#0ea5e9" },
    { name: "Office PC", value: officeKeys, color: "#10b981" },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <ArrowLeftRight className="w-7 h-7 text-sky-400" />
          Device Comparison
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Objective interaction analysis between Personal Laptop and Office PC
        </p>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Laptop Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-sky-500" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <Laptop className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{DEMO_DEVICES[0].device_name}</h2>
              <span className="text-xs text-slate-400 font-mono">{DEMO_DEVICES[0].hostname}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Mouse Clicks</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {laptopClicks.toLocaleString()}
              </div>
              <div className="text-[11px] text-sky-400 mt-1">
                {((laptopClicks / totalClicks) * 100).toFixed(1)}% of total clicks
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Key Presses</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {laptopKeys.toLocaleString()}
              </div>
              <div className="text-[11px] text-sky-400 mt-1">
                {((laptopKeys / totalKeys) * 100).toFixed(1)}% of total keys
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Recorded Active Time</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {formatDuration(laptopActiveSec)}
              </div>
              <div className="text-[11px] text-sky-400 mt-1">
                {((laptopActiveSec / totalActiveSec) * 100).toFixed(1)}% of total active time
              </div>
            </div>
          </div>
        </div>

        {/* Office PC Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{DEMO_DEVICES[1].device_name}</h2>
              <span className="text-xs text-slate-400 font-mono">{DEMO_DEVICES[1].hostname}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Mouse Clicks</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {officeClicks.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                {((officeClicks / totalClicks) * 100).toFixed(1)}% of total clicks
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Total Key Presses</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {officeKeys.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                {((officeKeys / totalKeys) * 100).toFixed(1)}% of total keys
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-xs text-slate-400">Recorded Active Time</div>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {formatDuration(officeActiveSec)}
              </div>
              <div className="text-[11px] text-emerald-400 mt-1">
                {((officeActiveSec / totalActiveSec) * 100).toFixed(1)}% of total active time
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Percentage Contribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-white mb-1">Click Contribution Split</h2>
          <p className="text-xs text-slate-400 mb-4">Percentage contribution per device</p>
          <RatioPieChart data={clickContribution} />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-white mb-1">Keyboard Contribution Split</h2>
          <p className="text-xs text-slate-400 mb-4">Percentage contribution per device</p>
          <RatioPieChart data={keyContribution} />
        </div>
      </div>

      {/* Daily Trends Comparison */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-white mb-1">Daily Workload Distribution (Past 7 Days)</h2>
        <p className="text-xs text-slate-400 mb-4">Track which computer was primary on each weekday vs weekend</p>
        <ActivityTrendChart data={dailyData} />
      </div>
    </div>
  );
}
