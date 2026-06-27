// Module: Outbreak Alert Management — Filter Bar | Owner: Backend / Platform Engineer
"use client";

import { ListFilter, RotateCcw } from "lucide-react";

export interface AlertFilterState {
  disease: string;
  risk: string;
  state: string;
  status: string;
}

export const DEFAULT_FILTERS: AlertFilterState = {
  disease: "All",
  risk: "All",
  state: "All",
  status: "All",
};

interface AlertFiltersProps {
  filters: AlertFilterState;
  onChange: (next: AlertFilterState) => void;
  options: {
    diseases: string[];
    risks: string[];
    states: string[];
    statuses: string[];
  };
  resultCount: number;
}

function Select({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: string;
  values: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-medium text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      >
        <option value="All">All</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AlertFilters({
  filters,
  onChange,
  options,
  resultCount,
}: AlertFiltersProps) {
  const isFiltered =
    filters.disease !== "All" ||
    filters.risk !== "All" ||
    filters.state !== "All" ||
    filters.status !== "All";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
        <ListFilter className="h-4 w-4 text-brand" />
        Filter alerts
        <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {resultCount} result{resultCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          label="Disease"
          value={filters.disease}
          values={options.diseases}
          onChange={(disease) => onChange({ ...filters, disease })}
        />
        <Select
          label="Risk level"
          value={filters.risk}
          values={options.risks}
          onChange={(risk) => onChange({ ...filters, risk })}
        />
        <Select
          label="State"
          value={filters.state}
          values={options.states}
          onChange={(state) => onChange({ ...filters, state })}
        />
        <Select
          label="Status"
          value={filters.status}
          values={options.statuses}
          onChange={(status) => onChange({ ...filters, status })}
        />
      </div>
      {isFiltered && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset filters
        </button>
      )}
    </div>
  );
}
