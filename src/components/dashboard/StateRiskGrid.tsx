// Module: Disease Surveillance Dashboard — State Risk Grid | Owner: ML Engineer / Data Scientist
// Heat-map style grid of all 36 states + FCT, coloured by current risk level.

import { STATE_RISKS } from "@/lib/mockData";
import { RISK_ORDER, RISK_STYLES } from "@/lib/theme";
import { formatNumber } from "@/lib/utils";

export function StateRiskGrid() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
        {STATE_RISKS.map((state) => {
          const s = RISK_STYLES[state.risk];
          return (
            <div
              key={state.id}
              title={`${state.name} — ${state.risk} risk · ${formatNumber(
                state.activeCases,
              )} active cases · ${state.dominantDisease}`}
              className="flex flex-col rounded-lg px-2.5 py-2 text-white shadow-sm transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: s.solid }}
            >
              <span className="text-sm font-bold leading-none">
                {state.code}
              </span>
              <span className="mt-1 truncate text-[10px] font-medium opacity-90">
                {state.name}
              </span>
              <span className="mt-1.5 text-xs font-semibold tabular-nums">
                {formatNumber(state.activeCases)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
        {RISK_ORDER.map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: RISK_STYLES[level].solid }}
            />
            <span className="text-xs font-medium text-slate-600">{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
