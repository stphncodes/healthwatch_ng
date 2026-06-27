// Module: Disease Surveillance Dashboard — Case Trend Chart | Owner: ML Engineer / Data Scientist
"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { WEEKLY_CASE_TRENDS } from "@/lib/mockData";
import { DISEASE_COLORS } from "@/lib/theme";

const SERIES = [
  { key: "lassaFever", name: "Lassa Fever", color: DISEASE_COLORS["Lassa Fever"] },
  { key: "cholera", name: "Cholera", color: DISEASE_COLORS.Cholera },
  {
    key: "meningitis",
    name: "Meningitis",
    color: DISEASE_COLORS["Cerebrospinal Meningitis"],
  },
] as const;

export function CaseTrendChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={WEEKLY_CASE_TRENDS}
          margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
            }}
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
