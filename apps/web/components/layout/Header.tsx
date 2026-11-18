"use client";

import { useState, useEffect } from "react";
import { Clock, Globe, ShieldCheck } from "lucide-react";

export function Header() {
  const [dhakaTime, setDhakaTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDhakaTime(
        now.toLocaleTimeString("en-US", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
      {/* Left indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time Sync Active</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 text-xs text-slate-300">
          <Globe className="w-3.5 h-3.5 text-sky-400" />
          <span>Asia/Dhaka</span>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-4">
        {/* Live Clock */}
        <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>{dhakaTime || "--:--:-- --"}</span>
        </div>

        {/* Privacy Badge */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/40 px-2.5 py-1 rounded-md border border-slate-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Privacy Preserved</span>
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow">
            MN
          </div>
          <div className="hidden lg:block text-left text-xs">
            <div className="font-semibold text-slate-200">MH Nayeem</div>
            <div className="text-[11px] text-slate-500">Personal & Office</div>
          </div>
        </div>
      </div>
    </header>
  );
}
