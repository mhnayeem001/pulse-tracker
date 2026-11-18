"use client";

import { useState, useEffect } from "react";
import { Flame, RefreshCw, Calendar } from "lucide-react";
import { fetchLiveSummaries, generateHeatmapGrid } from "@/lib/analyticsService";
import { ActivitySummary } from "@/types";

type HeatmapMetric = "clicks" | "keyboard" | "actions" | "active";

export default function ActivityHeatmapPage() {
  const [metric, setMetric] = useState<HeatmapMetric>("actions");
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const data = await fetchLiveSummaries("7d");
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

  const cells = generateHeatmapGrid(metric, summaries);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Find max value to normalize color intensity
  const maxValue = Math.max(...cells.map((c) => c.value), 1);

  const getColorClass = (val: number) => {
    if (val === 0) return "bg-slate-900 border border-slate-800/60";
    const ratio = val / maxValue;
    if (ratio < 0.2) return "bg-sky-950/70 text-sky-300 border border-sky-900/40";
    if (ratio < 0.4) return "bg-sky-800/80 text-sky-200 border border-sky-700/50";
    if (ratio < 0.6) return "bg-sky-600 text-white border border-sky-500";
    if (ratio < 0.8) return "bg-emerald-600 text-white border border-emerald-500";
    return "bg-emerald-400 text-slate-950 font-bold border border-emerald-300";
  };

  return (
    <div className="space-y-8">
      {/* Title & Metric Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Flame className="w-7 h-7 text-amber-400" />
              Activity Heatmap
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live {summaries.length} Records
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            24-hour interaction density matrix dynamically populated from your recorded activity
          </p>
        </div>

        {/* Metric Selector Buttons & Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
            <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
          </button>

          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl">
            {[
              { id: "actions", label: "Total Inputs" },
              { id: "clicks", label: "Mouse Clicks" },
              { id: "keyboard", label: "Key Presses" },
              { id: "active", label: "Active Minutes" },
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

      {/* Heatmap Grid Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Hour Labels Header */}
          <div className="grid grid-cols-25 gap-1 mb-2 text-center">
            <div className="text-[11px] font-mono text-slate-500 text-left">Day</div>
            {hours.map((h) => (
              <div key={h} className="text-[10px] font-mono text-slate-400">
                {h % 3 === 0 ? `${h.toString().padStart(2, "0")}` : "·"}
              </div>
            ))}
          </div>

          {/* Day Rows */}
          <div className="space-y-1.5">
            {days.map((day, dIdx) => (
              <div key={day} className="grid grid-cols-25 gap-1 items-center">
                <div className="text-xs font-medium text-slate-400">{day}</div>
                {hours.map((hour) => {
                  const cell = cells.find((c) => c.dayIndex === dIdx && c.hour === hour);
                  const val = cell?.value || 0;
                  return (
                    <div
                      key={hour}
                      className={`h-7 rounded transition-colors flex items-center justify-center text-[9px] cursor-pointer group relative ${getColorClass(
                        val
                      )}`}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1.5 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-slate-950 text-white text-[11px] font-mono px-2.5 py-1 rounded-md border border-slate-800 shadow-xl whitespace-nowrap">
                          {day} at {hour.toString().padStart(2, "0")}:00 • {val.toLocaleString()} {metric}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Times rendered in Asia/Dhaka local timezone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-500">Less Active</span>
              <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800" />
              <div className="w-3.5 h-3.5 rounded bg-sky-950/70 border border-sky-900/40" />
              <div className="w-3.5 h-3.5 rounded bg-sky-800 border border-sky-700" />
              <div className="w-3.5 h-3.5 rounded bg-sky-600 border border-sky-500" />
              <div className="w-3.5 h-3.5 rounded bg-emerald-500 border border-emerald-400" />
              <span className="text-[11px] text-slate-500">More Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
