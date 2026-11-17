"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Laptop,
  BarChart3,
  Flame,
  ArrowLeftRight,
  FileSpreadsheet,
  Cpu,
  Settings,
  Activity,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Device Analytics", href: "/devices", icon: Laptop },
  { name: "Activity Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Activity Heatmap", href: "/heatmap", icon: Flame },
  { name: "Device Comparison", href: "/comparison", icon: ArrowLeftRight },
  { name: "Reports & Exports", href: "/reports", icon: FileSpreadsheet },
  { name: "Device Management", href: "/management", icon: Cpu },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-bold text-base tracking-wide text-white">PROJECT PULSE</span>
          <span className="block text-[10px] text-sky-400 font-mono tracking-wider uppercase">Cross-Device</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sky-500/10 text-sky-400 font-semibold border-l-2 border-sky-400 pl-3"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-sky-400" : "text-slate-400"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer Device Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>Active Devices</span>
          <span className="text-emerald-400 font-medium">2 / 2 Online</span>
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Personal Laptop
            </span>
            <span className="text-slate-500 text-[10px]">Just now</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Office PC
            </span>
            <span className="text-slate-500 text-[10px]">15m ago</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
