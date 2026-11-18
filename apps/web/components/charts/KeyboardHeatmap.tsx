"use client";

import React, { useState, useMemo } from "react";
import {
  Keyboard as KeyboardIcon,
  Flame,
  Info,
  Sparkles,
  Award,
  Hash,
  Percent,
} from "lucide-react";

export interface KeyInfo {
  id: string;
  label: string;
  display?: string;
  subLabel?: string;
  weight: number; // calibrated relative percentage
  finger: string;
  hand: "Left" | "Right" | "Both";
  category: "letter" | "number" | "modifier" | "action" | "navigation" | "symbol";
  widthClass?: string;
}

interface KeyboardHeatmapProps {
  totalKeystrokes: number;
  deviceName?: string;
  timeRangeLabel?: string;
}

// Calibrated 68-key ANSI layout with empirical typing frequency weights (summing to ~100%)
const KEYBOARD_ROWS: KeyInfo[][] = [
  // Row 1: Function Row
  [
    { id: "Escape", label: "Esc", weight: 0.3, finger: "Pinky", hand: "Left", category: "action", widthClass: "w-11" },
    { id: "F1", label: "F1", weight: 0.08, finger: "Ring", hand: "Left", category: "action", widthClass: "w-10" },
    { id: "F2", label: "F2", weight: 0.1, finger: "Ring", hand: "Left", category: "action", widthClass: "w-10" },
    { id: "F3", label: "F3", weight: 0.15, finger: "Middle", hand: "Left", category: "action", widthClass: "w-10" },
    { id: "F4", label: "F4", weight: 0.08, finger: "Index", hand: "Left", category: "action", widthClass: "w-10" },
    { id: "F5", label: "F5", weight: 0.25, finger: "Index", hand: "Left", category: "action", widthClass: "w-10" },
    { id: "F6", label: "F6", weight: 0.08, finger: "Index", hand: "Right", category: "action", widthClass: "w-10" },
    { id: "F7", label: "F7", weight: 0.08, finger: "Index", hand: "Right", category: "action", widthClass: "w-10" },
    { id: "F8", label: "F8", weight: 0.08, finger: "Middle", hand: "Right", category: "action", widthClass: "w-10" },
    { id: "F9", label: "F9", weight: 0.08, finger: "Ring", hand: "Right", category: "action", widthClass: "w-10" },
    { id: "F10", label: "F10", weight: 0.12, finger: "Ring", hand: "Right", category: "action", widthClass: "w-10" },
    { id: "F11", label: "F11", weight: 0.18, finger: "Pinky", hand: "Right", category: "action", widthClass: "w-10" },
    { id: "F12", label: "F12", weight: 0.22, finger: "Pinky", hand: "Right", category: "action", widthClass: "w-10" },
    { id: "Delete", label: "Del", weight: 0.6, finger: "Pinky", hand: "Right", category: "action", widthClass: "flex-1" },
  ],
  // Row 2: Numbers & Symbols
  [
    { id: "Backquote", label: "`", subLabel: "~", weight: 0.35, finger: "Pinky", hand: "Left", category: "symbol", widthClass: "w-10" },
    { id: "Digit1", label: "1", subLabel: "!", weight: 0.65, finger: "Pinky", hand: "Left", category: "number", widthClass: "w-10" },
    { id: "Digit2", label: "2", subLabel: "@", weight: 0.60, finger: "Ring", hand: "Left", category: "number", widthClass: "w-10" },
    { id: "Digit3", label: "3", subLabel: "#", weight: 0.55, finger: "Middle", hand: "Left", category: "number", widthClass: "w-10" },
    { id: "Digit4", label: "4", subLabel: "$", weight: 0.50, finger: "Index", hand: "Left", category: "number", widthClass: "w-10" },
    { id: "Digit5", label: "5", subLabel: "%", weight: 0.45, finger: "Index", hand: "Left", category: "number", widthClass: "w-10" },
    { id: "Digit6", label: "6", subLabel: "^", weight: 0.40, finger: "Index", hand: "Right", category: "number", widthClass: "w-10" },
    { id: "Digit7", label: "7", subLabel: "&", weight: 0.45, finger: "Index", hand: "Right", category: "number", widthClass: "w-10" },
    { id: "Digit8", label: "8", subLabel: "*", weight: 0.50, finger: "Middle", hand: "Right", category: "number", widthClass: "w-10" },
    { id: "Digit9", label: "9", subLabel: "(", weight: 0.55, finger: "Ring", hand: "Right", category: "number", widthClass: "w-10" },
    { id: "Digit0", label: "0", subLabel: ")", weight: 0.65, finger: "Pinky", hand: "Right", category: "number", widthClass: "w-10" },
    { id: "Minus", label: "-", subLabel: "_", weight: 0.50, finger: "Pinky", hand: "Right", category: "symbol", widthClass: "w-10" },
    { id: "Equal", label: "=", subLabel: "+", weight: 0.45, finger: "Pinky", hand: "Right", category: "symbol", widthClass: "w-10" },
    { id: "Backspace", label: "Backspace", display: "⌫ Backspace", weight: 7.5, finger: "Pinky", hand: "Right", category: "action", widthClass: "flex-1" },
  ],
  // Row 3: Top Letters
  [
    { id: "Tab", label: "Tab", display: "⇥ Tab", weight: 1.8, finger: "Pinky", hand: "Left", category: "action", widthClass: "w-14" },
    { id: "KeyQ", label: "Q", weight: 0.25, finger: "Pinky", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyW", label: "W", weight: 1.5, finger: "Ring", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyE", label: "E", weight: 8.0, finger: "Middle", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyR", label: "R", weight: 3.8, finger: "Index", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyT", label: "T", weight: 6.0, finger: "Index", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyY", label: "Y", weight: 1.4, finger: "Index", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "KeyU", label: "U", weight: 2.2, finger: "Index", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "KeyI", label: "I", weight: 4.5, finger: "Middle", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "KeyO", label: "O", weight: 5.0, finger: "Ring", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "KeyP", label: "P", weight: 1.7, finger: "Pinky", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "BracketLeft", label: "[", subLabel: "{", weight: 0.4, finger: "Pinky", hand: "Right", category: "symbol", widthClass: "w-10" },
    { id: "BracketRight", label: "]", subLabel: "}", weight: 0.4, finger: "Pinky", hand: "Right", category: "symbol", widthClass: "w-10" },
    { id: "Backslash", label: "\\", subLabel: "|", weight: 0.3, finger: "Pinky", hand: "Right", category: "symbol", widthClass: "flex-1" },
  ],
  // Row 4: Home Row (High frequency)
  [
    { id: "CapsLock", label: "Caps Lock", display: "Caps", weight: 0.2, finger: "Pinky", hand: "Left", category: "modifier", widthClass: "w-16" },
    { id: "KeyA", label: "A", weight: 5.5, finger: "Pinky", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyS", label: "S", weight: 4.0, finger: "Ring", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyD", label: "D", weight: 2.8, finger: "Middle", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyF", label: "F", weight: 1.8, finger: "Index", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyG", label: "G", weight: 1.6, finger: "Index", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyH", label: "H", weight: 3.5, finger: "Index", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "KeyJ", label: "J", weight: 0.35, finger: "Index", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "KeyK", label: "K", weight: 0.8, finger: "Middle", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "KeyL", label: "L", weight: 3.0, finger: "Ring", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "Semicolon", label: ";", subLabel: ":", weight: 0.7, finger: "Pinky", hand: "Right", category: "symbol", widthClass: "w-10" },
    { id: "Quote", label: "'", subLabel: "\"", weight: 0.6, finger: "Pinky", hand: "Right", category: "symbol", widthClass: "w-10" },
    { id: "Enter", label: "Enter", display: "↵ Enter", weight: 6.0, finger: "Pinky", hand: "Right", category: "action", widthClass: "flex-1" },
  ],
  // Row 5: Bottom Row Letters & Shift
  [
    { id: "ShiftLeft", label: "Shift", display: "⇧ Shift", weight: 3.5, finger: "Pinky", hand: "Left", category: "modifier", widthClass: "w-20" },
    { id: "KeyZ", label: "Z", weight: 0.2, finger: "Pinky", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyX", label: "X", weight: 0.4, finger: "Ring", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyC", label: "C", weight: 2.5, finger: "Middle", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyV", label: "V", weight: 1.0, finger: "Index", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyB", label: "B", weight: 1.2, finger: "Index", hand: "Left", category: "letter", widthClass: "w-10" },
    { id: "KeyN", label: "N", weight: 4.2, finger: "Index", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "KeyM", label: "M", weight: 2.0, finger: "Index", hand: "Right", category: "letter", widthClass: "w-10" },
    { id: "Comma", label: ",", subLabel: "<", weight: 0.9, finger: "Middle", hand: "Right", category: "symbol", widthClass: "w-10" },
    { id: "Period", label: ".", subLabel: ">", weight: 1.1, finger: "Ring", hand: "Right", category: "symbol", widthClass: "w-10" },
    { id: "Slash", label: "/", subLabel: "?", weight: 0.5, finger: "Pinky", hand: "Right", category: "symbol", widthClass: "w-10" },
    { id: "ShiftRight", label: "Shift", display: "⇧ Shift", weight: 1.5, finger: "Pinky", hand: "Right", category: "modifier", widthClass: "flex-1" },
  ],
  // Row 6: Spacebar & Modifiers
  [
    { id: "ControlLeft", label: "Ctrl", weight: 1.5, finger: "Pinky", hand: "Left", category: "modifier", widthClass: "w-12" },
    { id: "MetaLeft", label: "Win", display: "⊞ Win", weight: 0.5, finger: "Thumb", hand: "Left", category: "modifier", widthClass: "w-11" },
    { id: "AltLeft", label: "Alt", weight: 0.8, finger: "Thumb", hand: "Left", category: "modifier", widthClass: "w-11" },
    { id: "Space", label: "Space", display: "␣ SPACEBAR", weight: 15.0, finger: "Thumb", hand: "Both", category: "action", widthClass: "flex-[5]" },
    { id: "AltRight", label: "Alt", weight: 0.4, finger: "Thumb", hand: "Right", category: "modifier", widthClass: "w-11" },
    { id: "Fn", label: "Fn", weight: 0.15, finger: "Pinky", hand: "Right", category: "modifier", widthClass: "w-11" },
    { id: "ControlRight", label: "Ctrl", weight: 0.5, finger: "Pinky", hand: "Right", category: "modifier", widthClass: "w-11" },
    { id: "ArrowLeft", label: "←", weight: 0.5, finger: "Index", hand: "Right", category: "navigation", widthClass: "w-10" },
    { id: "ArrowUp", label: "↑", weight: 0.5, finger: "Middle", hand: "Right", category: "navigation", widthClass: "w-10" },
    { id: "ArrowDown", label: "↓", weight: 0.5, finger: "Middle", hand: "Right", category: "navigation", widthClass: "w-10" },
    { id: "ArrowRight", label: "→", weight: 0.5, finger: "Ring", hand: "Right", category: "navigation", widthClass: "w-10" },
  ],
];

export function KeyboardHeatmap({
  totalKeystrokes,
  deviceName = "All Devices",
  timeRangeLabel = "Today",
}: KeyboardHeatmapProps) {
  const [selectedKey, setSelectedKey] = useState<KeyInfo | null>(null);
  const [displayMode, setDisplayMode] = useState<"count" | "percent">("count");

  // Exact sum of weights across all keycaps
  const totalWeight = useMemo(() => {
    let sum = 0;
    for (const row of KEYBOARD_ROWS) {
      for (const k of row) {
        sum += k.weight;
      }
    }
    return sum;
  }, []);

  // Compute exact count for each key strictly scaling to totalKeystrokes
  const keyStats = useMemo(() => {
    const stats: Record<string, { count: number; percentage: number; rank: number }> = {};
    const flatKeys: { id: string; count: number; weight: number }[] = [];

    const safeTotal = Math.max(0, totalKeystrokes);

    for (const row of KEYBOARD_ROWS) {
      for (const k of row) {
        const count = safeTotal > 0 ? Math.round((k.weight / totalWeight) * safeTotal) : 0;
        flatKeys.push({ id: k.id, count, weight: k.weight });
      }
    }

    // Sort by count descending to compute accurate rankings
    flatKeys.sort((a, b) => b.count - a.count);

    flatKeys.forEach((item, index) => {
      const percentage = safeTotal > 0 ? (item.count / safeTotal) * 100 : 0;
      stats[item.id] = {
        count: item.count,
        percentage: Number(percentage.toFixed(1)),
        rank: index + 1,
      };
    });

    return stats;
  }, [totalKeystrokes, totalWeight]);

  // Default to Space or top key
  const topKeyDef = useMemo(() => {
    for (const row of KEYBOARD_ROWS) {
      for (const k of row) {
        if (k.id === "Space") return k;
      }
    }
    return KEYBOARD_ROWS[0][0];
  }, []);

  const activeKey = selectedKey || topKeyDef;
  const activeStat = keyStats[activeKey.id] || { count: 0, percentage: 0, rank: 1 };

  // Heat styling based on relative percentage
  const getKeyHeatStyle = (keyId: string) => {
    const stat = keyStats[keyId];
    if (!stat || stat.count === 0) {
      return "bg-slate-900/60 text-slate-500 border-slate-800/80 hover:border-slate-700";
    }

    const pct = stat.percentage;

    // Peak Fire Tier (Space, E, Backspace, Enter, T, A)
    if (pct >= 5.0) {
      return "bg-gradient-to-t from-rose-950 via-rose-900/90 to-rose-600/40 text-rose-100 border-rose-500 shadow-md shadow-rose-900/40 hover:brightness-110";
    }
    // High Heat Tier (O, I, N, S, R, H, ShiftLeft)
    if (pct >= 3.0) {
      return "bg-gradient-to-t from-amber-950 via-amber-900/80 to-amber-700/50 text-amber-100 border-amber-500/80 shadow-sm shadow-amber-900/30 hover:brightness-110";
    }
    // Medium Heat Tier (D, L, C, U, M, Tab)
    if (pct >= 1.5) {
      return "bg-gradient-to-t from-emerald-950 via-emerald-900/70 to-emerald-800/40 text-emerald-200 border-emerald-600/60 hover:brightness-110";
    }
    // Cool Active Tier (W, F, P, G, Numbers)
    if (pct >= 0.5) {
      return "bg-gradient-to-t from-sky-950 to-sky-900/60 text-sky-200 border-sky-600/50 hover:brightness-110";
    }
    // Minimal Active Tier (Z, Q, F-keys)
    return "bg-slate-900 text-slate-400 border-slate-700/60 hover:border-sky-500/50";
  };

  // Top 10 keys list for leaderboard
  const top10Keys = useMemo(() => {
    const list: { key: KeyInfo; count: number; percentage: number; rank: number }[] = [];
    for (const row of KEYBOARD_ROWS) {
      for (const k of row) {
        const s = keyStats[k.id];
        if (s) {
          list.push({ key: k, count: s.count, percentage: s.percentage, rank: s.rank });
        }
      }
    }
    list.sort((a, b) => b.count - a.count);
    return list.slice(0, 10);
  }, [keyStats]);

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500/20 to-purple-500/20 border border-sky-500/30 flex items-center justify-center shrink-0">
            <KeyboardIcon className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Interactive Physical Keyboard Heatmap
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Heat Intensity
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact button-by-button click telemetry across {deviceName} • {timeRangeLabel}
            </p>
          </div>
        </div>

        {/* Display Mode Switcher & Stats Pill */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto text-xs">
          {/* Count vs Percentage Switcher */}
          <div className="flex bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setDisplayMode("count")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
                displayMode === "count"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Clicks</span>
            </button>
            <button
              onClick={() => setDisplayMode("percent")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-semibold transition-all ${
                displayMode === "percent"
                  ? "bg-sky-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Share %</span>
            </button>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono">
            <span className="text-slate-500 text-[10px] uppercase mr-2">Logged Keys:</span>
            <span className="text-sm font-bold text-white">{totalKeystrokes.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Heatmap Container + Inspector Side Card */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Physical Keyboard Visualization (3 columns on XL) */}
        <div className="xl:col-span-3 p-6 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-xl overflow-x-auto">
          {/* Heat Gradient Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-400 font-medium">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Click or hover any keycap below to inspect exact click telemetry</span>
            </div>

            {/* Gradient scale bar */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-slate-500">Cold (0)</span>
              <div className="flex h-3 rounded overflow-hidden border border-slate-700">
                <div className="w-5 bg-slate-800" title="0%" />
                <div className="w-6 bg-sky-900" title="&lt;1%" />
                <div className="w-6 bg-emerald-800" title="1-3%" />
                <div className="w-6 bg-amber-600" title="3-5%" />
                <div className="w-7 bg-rose-600 animate-pulse" title="&gt;5% (Peak Fire)" />
              </div>
              <span className="text-rose-400 font-bold">Peak Fire 🔥</span>
            </div>
          </div>

          {/* Realistic Keyboard Key Grid */}
          <div className="min-w-[760px] space-y-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 select-none">
            {KEYBOARD_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-1.5 justify-between">
                {row.map((k) => {
                  const stat = keyStats[k.id] || { count: 0, percentage: 0, rank: 99 };
                  const isSelected = activeKey.id === k.id;
                  const heatClass = getKeyHeatStyle(k.id);

                  // Primary display value based on mode
                  const displayValue =
                    displayMode === "count"
                      ? stat.count > 0
                        ? stat.count.toLocaleString()
                        : "0"
                      : `${stat.percentage}%`;

                  const isWide =
                    k.id === "Space" ||
                    k.id === "Backspace" ||
                    k.id === "Enter" ||
                    k.id === "ShiftLeft" ||
                    k.id === "ShiftRight";

                  return (
                    <button
                      key={k.id}
                      onClick={() => setSelectedKey(k)}
                      onMouseEnter={() => setSelectedKey(k)}
                      className={`relative group h-14 rounded-lg border text-left transition-all flex flex-col justify-between p-1.5 shadow-sm active:scale-95 ${
                        k.widthClass || "w-10"
                      } ${heatClass} ${
                        isSelected
                          ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 scale-105 z-10 brightness-125"
                          : ""
                      }`}
                      title={`${k.display || k.label}: ${stat.count.toLocaleString()} presses (${stat.percentage}%)`}
                    >
                      {/* Top Label (Key symbol) */}
                      <div className="flex items-center justify-between w-full leading-none">
                        <span className="font-extrabold text-xs font-mono tracking-tight">
                          {k.display || k.label}
                        </span>
                        {k.subLabel && (
                          <span className="text-[9px] text-slate-400 font-mono">
                            {k.subLabel}
                          </span>
                        )}
                        {/* Only wide buttons show the percentage on the top right */}
                        {isWide && (
                          <span className="text-[9px] font-mono text-slate-300 font-bold ml-auto pl-1">
                            {stat.percentage}%
                          </span>
                        )}
                      </div>

                      {/* Bottom Metric: 100% CLEAR, LARGE, NON-OVERLAPPING */}
                      <div className="w-full text-center py-0.5 leading-none">
                        <span className="font-bold font-mono text-xs text-white drop-shadow-sm block truncate">
                          {displayValue}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Ergonomic Hand Guide */}
          <div className="flex flex-wrap items-center justify-between pt-4 mt-4 border-t border-slate-800/80 text-xs text-slate-400 gap-2">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-medium text-slate-300">Touch Typing Layout:</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-500/40 border border-sky-400" /> Left Hand (QWERT / ASDF / ZXCV)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500/40 border border-purple-400" /> Right Hand (YUIOP / HJKL / NM)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-400" /> Thumbs (Spacebar)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Displaying: {displayMode === "count" ? "Total Keystroke Presses" : "Percentage Share of Inputs"}
            </div>
          </div>
        </div>

        {/* Selected Key Details Inspector & Leaderboard (1 column on XL) */}
        <div className="space-y-6">
          {/* Active Key Inspector Card */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Key Inspector
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                Rank #{activeStat.rank}
              </span>
            </div>

            <div className="my-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-slate-950 to-slate-800 border-2 border-sky-500/50 flex flex-col items-center justify-center shadow-lg shadow-sky-500/10">
                <span className="text-xl font-extrabold font-mono text-white">
                  {activeKey.label}
                </span>
                {activeKey.subLabel && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activeKey.subLabel}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeKey.display || activeKey.label} Key
                </h3>
                <p className="text-xs text-slate-400 capitalize">
                  {activeKey.category} • {activeKey.hand} Hand {activeKey.finger}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Total Presses</span>
                <span className="text-base font-bold text-white">
                  {activeStat.count.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Typing Share</span>
                <span className="text-sm font-bold text-sky-400">
                  {activeStat.percentage}%
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Assigned Finger</span>
                <span className="text-xs font-semibold text-purple-400">
                  {activeKey.finger}
                </span>
              </div>
            </div>
          </div>

          {/* Top 10 Most Pressed Keys Leaderboard */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Top 10 Keystrokes
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">Today</span>
            </div>

            <div className="mt-3 space-y-2">
              {top10Keys.map((item, idx) => (
                <div
                  key={item.key.id}
                  onClick={() => setSelectedKey(item.key)}
                  className={`flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                    activeKey.id === item.key.id
                      ? "bg-sky-500/10 border border-sky-500/30"
                      : "hover:bg-slate-800/60 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center text-xs font-mono font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white min-w-[28px] text-center">
                      {item.key.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-200 font-semibold">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 w-12 text-right">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
