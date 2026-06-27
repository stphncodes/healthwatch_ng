// Module: Public Health Officer Portal — Forecast Chart | Owner: ML Engineer / Data Scientist
// 4-week national cholera forecast rendered as an area chart with a shaded
// 90% confidence band around the predicted mean.
"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHOLERA_FORECAST } from "@/lib/mockData";
import { BRAND } from "@/lib/theme";

// Recharts renders a band when a datum's value is a [min, max] tuple.
const DATA = CHOLERA_FORECAST.map((p) => ({
  week: p.week,
  actual: p.actual,
  predicted: p.predicted,
  band: [p.lower, p.upper] as [number, number],
}));

export function ForecastChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={DATA}
          margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
        >
          <defs>
            <linearGradient id="ciBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BRAND.base} stopOpacity={0.22} />
              <stop offset="100%" stopColor={BRAND.base} stopOpacity={0.04} />
            </linearGradient>
          </defs>

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
            formatter={(value) =>
              Array.isArray(value)
                ? `${value[0]} – ${value[1]} cases`
                : `${value} cases`
            }
          />
          <Legend
            iconType="plainline"
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />

          <Area
            type="monotone"
            dataKey="band"
            name="90% confidence"
            stroke="none"
            fill="url(#ciBand)"
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            name="Forecast (mean)"
            stroke={BRAND.base}
            strokeWidth={2.5}
            strokeDasharray="5 4"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            name="Observed"
            stroke={BRAND.ink}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
