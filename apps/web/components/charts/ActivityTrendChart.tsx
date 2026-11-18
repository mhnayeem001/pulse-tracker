"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { DailyStat } from "@/types";

interface ActivityTrendChartProps {
  data: DailyStat[];
}

export function ActivityTrendChart({ data }: ActivityTrendChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="laptopGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="officeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
          <XAxis dataKey="formattedDate" stroke="#94a3b8" fontSize={12} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              borderColor: "#334155",
              borderRadius: "0.5rem",
              color: "#f8fafc",
              fontSize: "12px",
            }}
          />
          <Legend
            verticalAlign="top"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
          />
          <Area
            type="monotone"
            dataKey="laptopClicks"
            name="Personal Laptop (Clicks)"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#0ea5e9" }}
            activeDot={{ r: 6, fill: "#38bdf8" }}
            fillOpacity={1}
            fill="url(#laptopGrad)"
          />
          <Area
            type="monotone"
            dataKey="officeClicks"
            name="Office PC (Clicks)"
            stroke="#10b981"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#10b981" }}
            activeDot={{ r: 6, fill: "#34d399" }}
            fillOpacity={1}
            fill="url(#officeGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
