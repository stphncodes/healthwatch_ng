// Module: Admin Panel — Data Sources Tab | Owner: Data Engineer
// Cards for each upstream feed, plus Admin CRUD (add/edit/delete via
// src/lib/adminContent.ts, Admin-gated by RLS) and the live-data refresh
// button that triggers the WHO/HDX ingest server-side.
"use client";

import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  Building2,
  Database,
  Globe,
  Pencil,
  Plus,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { DataSource, SourceStatus } from "@/types/health";
import { deleteDataSource, upsertDataSource } from "@/lib/adminContent";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SOURCE_STATUS_STYLES } from "@/lib/theme";
import { SourceStatusBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { fieldClasses } from "@/components/auth/fieldStyles";
import { formatNumber, timeAgo } from "@/lib/utils";
import { RefreshDataButton } from "./RefreshDataButton";

const SOURCE_ICONS: Record<string, LucideIcon> = {
  "DS-IDSR": Database,
  "DS-WHO": Globe,
  "DS-DHIS2": Building2,
};

const STATUSES = Object.keys(SOURCE_STATUS_STYLES) as SourceStatus[];

function emptySource(): DataSource {
  return {
    id: `DS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    name: "",
    description: "",
    status: "Connected",
    lastSync: new Date().toISOString(),
    recordCount: 0,
  };
}

export function DataSourcesTab({ sources: initial }: { sources: DataSource[] }) {
  const [sources, setSources] = useState<DataSource[]>(initial);
  const [editing, setEditing] = useState<DataSource | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(source: DataSource) {
    setError(null);
    const previous = sources;
    // Optimistic insert/replace, then persist; revert if the write fails.
    setSources((prev) => {
      const exists = prev.some((s) => s.id === source.id);
      return exists
        ? prev.map((s) => (s.id === source.id ? source : s))
        : [...prev, source];
    });
    setEditing(null);
    const result = await upsertDataSource(source);
    if (!result.ok) {
      setSources(previous);
      setError(`Could not save ${source.name}: ${result.error ?? "unknown error"}`);
    }
  }

  async function remove(source: DataSource) {
    if (!window.confirm(`Delete data source "${source.name}"?`)) return;
    setError(null);
    const previous = sources;
    setSources((prev) => prev.filter((s) => s.id !== source.id));
    const result = await deleteDataSource(source.id);
    if (!result.ok) {
      setSources(previous);
      setError(`Could not delete ${source.name}: ${result.error ?? "unknown error"}`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Upstream feeds powering the surveillance datasets.
        </p>
        {isSupabaseConfigured ? (
          <div className="flex gap-2">
            <RefreshDataButton />
            <button
              type="button"
              onClick={() => {
                setIsNew(true);
                setEditing(emptySource());
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add source
            </button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">
            Connect Supabase to manage content.
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {editing && (
        <SourceForm
          source={editing}
          isNew={isNew}
          onCancel={() => setEditing(null)}
          onSave={(source) => void save(source)}
        />
      )}

      {sources.length === 0 && !editing ? (
        <Card>
          <EmptyState
            icon={Database}
            title="No data sources registered"
            hint="Register upstream feeds (e.g. NCDC IDSR, DHIS2) to monitor their health here."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {sources.map((source) => {
            const Icon = SOURCE_ICONS[source.id] ?? Database;
            const dot = SOURCE_STATUS_STYLES[source.status].solid;
            return (
              <div
                key={source.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-brand">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isSupabaseConfigured && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setIsNew(false);
                            setEditing({ ...source });
                          }}
                          aria-label={`Edit ${source.name}`}
                          className="rounded-md p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(source)}
                          aria-label={`Delete ${source.name}`}
                          className="rounded-md p-1 text-slate-300 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <span className="relative ml-1 flex h-2.5 w-2.5">
                      <span
                        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                        style={{ backgroundColor: dot }}
                      />
                      <span
                        className="relative inline-flex h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: dot }}
                      />
                    </span>
                  </div>
                </div>

                <h3 className="mt-4 text-sm font-bold text-slate-900">
                  {source.name}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  {source.description}
                </p>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Connection</span>
                    <SourceStatusBadge status={source.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Last sync</span>
                    <span className="font-semibold text-slate-700">
                      {timeAgo(source.lastSync)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Records</span>
                    <span className="font-semibold tabular-nums text-slate-700">
                      {formatNumber(source.recordCount)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SourceForm({
  source: initial,
  isNew,
  onCancel,
  onSave,
}: {
  source: DataSource;
  isNew: boolean;
  onCancel: () => void;
  onSave: (source: DataSource) => void;
}) {
  const [source, setSource] = useState<DataSource>(initial);
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!source.name.trim()) {
      setFormError("Enter a name for the data source.");
      return;
    }
    onSave({
      ...source,
      name: source.name.trim(),
      description: source.description.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-slate-50 p-5"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">
          {isNew ? "Add data source" : `Edit ${source.id}`}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel editing"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {formError && <p className="mt-2 text-xs text-red-600">{formError}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-sm font-medium text-slate-700">
          Name
          <input
            type="text"
            value={source.name}
            onChange={(e) => setSource({ ...source, name: e.target.value })}
            placeholder="e.g. NCDC IDSR Feed"
            className={fieldClasses(false)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Connection status
          <select
            value={source.status}
            onChange={(e) =>
              setSource({ ...source, status: e.target.value as SourceStatus })
            }
            className={fieldClasses(false)}
          >
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Record count
          <input
            type="number"
            min={0}
            value={source.recordCount}
            onChange={(e) =>
              setSource({
                ...source,
                recordCount: Math.max(0, Number(e.target.value) || 0),
              })
            }
            className={fieldClasses(false)}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Description
        <textarea
          rows={2}
          value={source.description}
          onChange={(e) => setSource({ ...source, description: e.target.value })}
          placeholder="What this feed provides…"
          className={fieldClasses(false)}
        />
      </label>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          {isNew ? "Add source" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
