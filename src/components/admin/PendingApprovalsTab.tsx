// Module: Admin Panel — Pending Approvals Tab | Owner: Platform Engineer
// Admin review queue for new registrations. Fetches client-side via
// src/lib/approvals.ts — a documented exception to the server-component data
// flow, because identity documents are Admin-gated by RLS and the server
// fetch path only carries the anon key.
"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  RefreshCw,
  UserCheck,
  X,
} from "lucide-react";
import type { PendingApproval } from "@/types/health";
import { getPendingApprovals, reviewUser } from "@/lib/approvals";
import { timeAgo } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoleBadge } from "./RoleBadge";

type LoadState = "loading" | "error" | "ready";

export function PendingApprovalsTab() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [actionError, setActionError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getPendingApprovals()
      .then((data) => {
        if (cancelled) return;
        setApprovals(data);
        setLoadState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error("[admin] failed to load pending approvals:", err);
        setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  function retry() {
    setLoadState("loading");
    setReloadKey((key) => key + 1);
  }

  async function review(
    approval: PendingApproval,
    decision: "approved" | "rejected",
  ) {
    if (
      decision === "rejected" &&
      !window.confirm(
        `Reject the registration for ${approval.user.name}? They will not be able to sign in.`,
      )
    ) {
      return;
    }
    setActionError(null);
    // Optimistic removal, then persist; restore the card if the write fails.
    setApprovals((prev) => prev.filter((a) => a.user.id !== approval.user.id));
    const result = await reviewUser(approval.user.id, decision);
    if (!result.ok) {
      setApprovals((prev) => [approval, ...prev]);
      setActionError(
        `Could not ${decision === "approved" ? "approve" : "reject"} ${approval.user.name}: ${result.error ?? "unknown error"}`,
      );
    }
  }

  if (loadState === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading pending registrations…
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <AlertCircle className="h-6 w-6 text-red-500" />
        <p className="text-sm text-slate-600">
          Could not load pending registrations.
        </p>
        <button
          type="button"
          onClick={retry}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (approvals.length === 0) {
    return (
      <EmptyState
        icon={UserCheck}
        title="No pending registrations"
        hint="New signups awaiting approval will appear here."
      />
    );
  }

  return (
    <div className="space-y-4 p-5">
      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {approvals.map((approval) => (
        <div
          key={approval.user.id}
          className="rounded-xl border border-slate-200 p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-slate-800">
                  {approval.user.name}
                </p>
                <RoleBadge role={approval.user.role} />
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {approval.user.email}
                {approval.user.phone ? ` · ${approval.user.phone}` : ""}
                {approval.user.state ? ` · ${approval.user.state}` : ""}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                NIN:{" "}
                <span className="font-mono text-sm font-semibold text-slate-700">
                  {approval.nin || "not provided"}
                </span>
                <span className="ml-3 text-slate-400">
                  Submitted {timeAgo(approval.submittedAt)}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => void review(approval, "approved")}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
              <button
                type="button"
                onClick={() => void review(approval, "rejected")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>

          <div className="mt-4">
            <DocumentThumb label="Government ID" url={approval.idPhotoUrl} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DocumentThumb({ label, url }: { label: string; url: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 block overflow-hidden rounded-lg border border-slate-200 hover:opacity-90"
          title={`Open ${label} full size`}
        >
          {/* Signed/data URLs are short-lived or in-memory; next/image adds nothing. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={`${label} document`}
            className="h-40 w-full bg-slate-50 object-contain"
          />
        </a>
      ) : (
        <div className="mt-1.5 flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400">
          Document missing
        </div>
      )}
    </div>
  );
}
