"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { HourlyStat } from "@/types";

interface HourlyBarChartProps {
  data: HourlyStat[];
}

export function HourlyBarChart({ data }: HourlyBarChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
          <XAxis dataKey="hour" stroke="#94a3b8" fontSize={11} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              borderColor: "#334155",
              borderRadius: "0.5rem",
              color: "#f8fafc",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="clicks" name="Clicks" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="keyboard" name="Keys" fill="#a855f7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
