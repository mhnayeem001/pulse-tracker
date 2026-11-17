"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, Calendar, Laptop } from "lucide-react";
import { DEMO_DEVICES, formatDuration, generateDailyTrends } from "@/lib/analyticsService";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedDevice, setSelectedDevice] = useState<string>("all");

  const daysCount = reportType === "daily" ? 1 : reportType === "weekly" ? 7 : 30;
  const rows = generateDailyTrends(daysCount);

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

  // Generate downloadable JSON
  const handleExportJson = () => {
    const exportData = {
      project: "Project PULSE",
      exportedAt: new Date().toISOString(),
      timezone: "Asia/Dhaka",
      reportType,
      selectedDevice,
      records: rows,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
    const link = document.createElement("a");
    link.setAttribute("href", jsonString);
    link.setAttribute("download", `project-pulse-report-${reportType}-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
          Reports & Data Exports
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Export full high-precision activity summaries in Excel-compatible CSV and JSON formats
        </p>
      </div>

      {/* Configuration & Export Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Preset Buttons */}
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-lg">
            {(["daily", "weekly", "monthly"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  reportType === t ? "bg-sky-500 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t === "daily" ? "Today" : t === "weekly" ? "Last 7 Days" : "Last 30 Days"}
              </button>
            ))}
          </div>

          {/* Device Filter */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5" />
              Device:
            </span>
            <select
              value={selectedDevice}
              onChange={(e) => setSelectedDevice(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="all">All Registered Devices</option>
              <option value={DEMO_DEVICES[0].id}>Personal Laptop</option>
              <option value={DEMO_DEVICES[1].id}>Office PC</option>
            </select>
          </div>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Download CSV (Excel)
          </button>
          <button
            onClick={handleExportJson}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-all"
          >
            Download JSON
          </button>
        </div>
      </div>

      {/* Report Preview Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-400" />
            Report Data Preview ({rows.length} records)
          </h2>
          <span className="text-xs text-slate-400 font-mono">Timezone: Asia/Dhaka (UTC+6)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold text-right">Total Clicks</th>
                <th className="pb-3 font-semibold text-right">Laptop Clicks</th>
                <th className="pb-3 font-semibold text-right">Office Clicks</th>
                <th className="pb-3 font-semibold text-right">Total Keyboard</th>
                <th className="pb-3 font-semibold text-right">Active Duration</th>
                <th className="pb-3 font-semibold text-right">Idle Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {rows.map((row) => (
                <tr key={row.date} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 font-sans font-medium text-white">{row.formattedDate}</td>
                  <td className="py-3 text-right text-sky-400 font-bold">{row.totalClicks.toLocaleString()}</td>
                  <td className="py-3 text-right text-slate-400">{row.laptopClicks.toLocaleString()}</td>
                  <td className="py-3 text-right text-slate-400">{row.officeClicks.toLocaleString()}</td>
                  <td className="py-3 text-right text-purple-400 font-bold">{row.totalKeyboard.toLocaleString()}</td>
                  <td className="py-3 text-right text-emerald-400">{formatDuration(row.activeSeconds)}</td>
                  <td className="py-3 text-right text-amber-400">{formatDuration(row.idleSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
