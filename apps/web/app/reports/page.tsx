"use client";

import { useState, useEffect } from "react";
import { Download, FileSpreadsheet, Calendar, Laptop, RefreshCw } from "lucide-react";
import {
  fetchDevices,
  fetchLiveSummaries,
  generateDailyFromSummaries,
  formatDuration,
  DEMO_DEVICES,
} from "@/lib/analyticsService";
import { ActivitySummary, Device, DailyStat } from "@/types";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [devices, setDevices] = useState<Device[]>(DEMO_DEVICES);
  const [summaries, setSummaries] = useState<ActivitySummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    try {
      const devList = await fetchDevices();
      setDevices(devList);

      const range = reportType === "daily" ? "today" : reportType === "weekly" ? "7d" : "30d";
      const data = await fetchLiveSummaries(range, selectedDevice);
      setSummaries(data);
    } catch (err) {
      console.warn("Reports load error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [reportType, selectedDevice]);

  const maxDays = reportType === "daily" ? 1 : reportType === "weekly" ? 7 : 30;
  const rows: DailyStat[] = generateDailyFromSummaries(summaries, devices, maxDays);

  // Generate downloadable CSV
  const handleExportCsv = () => {
    const headers = [
      "Date",
      "Device Filter",
      "Total Clicks",
      "Personal Laptop Clicks",
      "Office PC Clicks",
      "Total Keyboard",
      "Personal Laptop Keys",
      "Office PC Keys",
      "Active Seconds",
      "Active Duration",
      "Idle Seconds",
      "Idle Duration",
      "Timezone",
    ];

    const csvRows = [headers.join(",")];

    for (const r of rows) {
      csvRows.push(
        [
          r.date,
          selectedDevice === "all" ? "All Devices" : selectedDevice,
          r.totalClicks,
          r.laptopClicks,
          r.officeClicks,
          r.totalKeyboard,
          r.laptopKeyboard,
          r.officeKeyboard,
          r.activeSeconds,
          `"${formatDuration(r.activeSeconds)}"`,
          r.idleSeconds,
          `"${formatDuration(r.idleSeconds)}"`,
          "Asia/Dhaka",
        ].join(",")
      );
    }

    const csvContent = "\uFEFF" + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `project-pulse-report-${reportType}-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
              Reports &amp; Data Exports
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              Live Data
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Generate and export actual aggregate activity summaries for Personal Laptop and Office PC
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel / CSV</span>
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg">
            {(["daily", "weekly", "monthly"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  reportType === t
                    ? "bg-sky-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "daily" ? "Daily (Today)" : t === "weekly" ? "Weekly (7d)" : "Monthly (30d)"}
              </button>
            ))}
          </div>

          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-2 font-medium focus:outline-none focus:border-sky-500"
          >
            <option value="all">All Devices (Combined)</option>
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.device_name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-950 border border-slate-800 rounded-lg hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
          <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white">Aggregated Activity Logs</h2>
          <span className="text-xs text-slate-400 font-mono">
            {rows.length} Active Day(s) Recorded
          </span>
        </div>

        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="text-slate-400 border-b border-slate-800 font-mono">
            <tr>
              <th className="pb-3 font-semibold">Date</th>
              <th className="pb-3 font-semibold">Total Clicks</th>
              <th className="pb-3 font-semibold">Total Key Presses</th>
              <th className="pb-3 font-semibold">Active Duration</th>
              <th className="pb-3 font-semibold">Idle Duration</th>
              <th className="pb-3 font-semibold">Active Ratio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {rows.map((row) => {
              const totalSec = row.activeSeconds + row.idleSeconds;
              const ratio = totalSec > 0 ? ((row.activeSeconds / totalSec) * 100).toFixed(0) : "0";
              return (
                <tr key={row.date} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-medium text-white">{row.formattedDate}</td>
                  <td className="py-3 font-mono text-sky-400 font-semibold">{row.totalClicks.toLocaleString()}</td>
                  <td className="py-3 font-mono text-purple-400 font-semibold">{row.totalKeyboard.toLocaleString()}</td>
                  <td className="py-3 font-mono text-emerald-400">{formatDuration(row.activeSeconds)}</td>
                  <td className="py-3 font-mono text-slate-400">{formatDuration(row.idleSeconds)}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {ratio}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
