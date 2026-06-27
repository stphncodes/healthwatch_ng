// Module: Public Health Officer Portal — High-Risk LGAs | Owner: ML Engineer / Data Scientist

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { HIGH_RISK_LGAS } from "@/lib/mockData";
import { formatNumber } from "@/lib/utils";

export function HighRiskLGATable() {
  return (
    <div className="overflow-x-auto scrollbar-thin">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-5 py-3 font-semibold">#</th>
            <th className="px-5 py-3 font-semibold">LGA</th>
            <th className="px-5 py-3 font-semibold">State</th>
            <th className="px-5 py-3 font-semibold">Disease</th>
            <th className="px-5 py-3 text-right font-semibold">Predicted</th>
            <th className="px-5 py-3 text-right font-semibold">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {HIGH_RISK_LGAS.map((lga, i) => {
            const up = lga.trend === "up";
            const Arrow = up ? ArrowUpRight : ArrowDownRight;
            const color = up ? "#B91C1C" : "#047857";
            return (
              <tr key={lga.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-semibold text-slate-400">
                  {i + 1}
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">
                  {lga.lga}
                </td>
                <td className="px-5 py-3.5 text-slate-600">{lga.state}</td>
                <td className="px-5 py-3.5 text-slate-600">{lga.disease}</td>
                <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-slate-800">
                  {formatNumber(lga.predictedCases)}
                </td>
                <td className="px-5 py-3.5">
                  <div
                    className="flex items-center justify-end gap-1 font-semibold tabular-nums"
                    style={{ color }}
                  >
                    <Arrow className="h-4 w-4" />
                    {up ? "+" : ""}
                    {lga.changePct}%
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
