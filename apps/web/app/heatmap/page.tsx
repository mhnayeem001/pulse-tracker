"use client";

import { useState } from "react";
import { Flame } from "lucide-react";
import { generateHeatmapGrid } from "@/lib/analyticsService";

type HeatmapMetric = "clicks" | "keyboard" | "actions" | "active";

export default function ActivityHeatmapPage() {
  const [metric, setMetric] = useState<HeatmapMetric>("actions");

  const cells = generateHeatmapGrid(metric);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Find max value to normalize color intensity
  const maxValue = Math.max(...cells.map((c) => c.value), 1);

  const getColorClass = (val: number) => {
    if (val === 0) return "bg-slate-900 border border-slate-800/60";
    const ratio = val / maxValue;
    if (ratio < 0.2) return "bg-sky-950/60 text-sky-300 border border-sky-900/40";
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
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Flame className="w-7 h-7 text-amber-400" />
            Activity Heatmap
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            7-day by 24-hour interaction density matrix across all active devices
          </p>
        </div>

        {/* Metric Selector Buttons */}
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
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
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

      {/* Heatmap Grid Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Hour labels on top */}
          <div className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 mb-2 text-center text-[10px] text-slate-400 font-mono">
            <div></div>
            {hours.map((h) => (
              <div key={h} className="truncate">
                {h.toString().padStart(2, "0")}
              </div>
            ))}
          </div>

          {/* Heatmap rows (Monday to Sunday) */}
          <div className="space-y-1.5">
            {days.map((day, dayIndex) => {
              const rowCells = cells.filter((c) => c.dayIndex === dayIndex);
              return (
                <div key={day} className="grid grid-cols-[60px_repeat(24,1fr)] gap-1 items-center">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider">
                    {day}
                  </span>
                  {rowCells.map((cell) => (
                    <div
                      key={cell.hour}
                      title={`${day} at ${cell.hour.toString().padStart(2, "0")}:00 — ${cell.value.toLocaleString()} ${metric}`}
                      className={`h-9 rounded-md flex items-center justify-center text-[10px] transition-transform hover:scale-110 cursor-pointer ${getColorClass(
                        cell.value
                      )}`}
                    >
                      {cell.value > 0 ? (
                        <span className="font-mono">{cell.value > 999 ? `${(cell.value / 1000).toFixed(1)}k` : cell.value}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Scale Legend */}
          <div className="mt-8 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800">
            <span>Peak Activity: <strong className="text-white">Tuesday & Thursday (11:00 - 16:00)</strong></span>
            <div className="flex items-center gap-2">
              <span className="text-[11px]">Less active</span>
              <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800" />
              <div className="w-3.5 h-3.5 rounded bg-sky-950 border border-sky-900" />
              <div className="w-3.5 h-3.5 rounded bg-sky-800 border border-sky-700" />
              <div className="w-3.5 h-3.5 rounded bg-sky-600 border border-sky-500" />
              <div className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-500" />
              <div className="w-3.5 h-3.5 rounded bg-emerald-400 border border-emerald-300" />
              <span className="text-[11px]">More active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
