"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface RatioItem {
  name: string;
  value: number;
  color: string;
}

interface RatioPieChartProps {
  data: RatioItem[];
  title?: string;
}

export function RatioPieChart({ data }: RatioPieChartProps) {
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
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
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
