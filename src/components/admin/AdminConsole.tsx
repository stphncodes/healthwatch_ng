// Module: Admin Console — Gate & Shell | Owner: System Admin / Platform Engineer
// The standalone /admin experience: its own sign-in screen (separate from the
// user-facing /login), a role check, and a minimal header around AdminTabs.
// Only ADMIN_ROLES get past the gate; admin accounts are provisioned by SQL
// (supabase/promote_admin.sql), never through any UI.
"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Loader2,
  LogIn,
  LogOut,
  ShieldCheck,
  ShieldX,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { fieldClasses } from "@/components/auth/fieldStyles";
import { ADMIN_ROLES } from "@/lib/roles";
import { BRAND } from "@/lib/theme";
import type { AuditEntry, DataSource, PlatformUser } from "@/types/health";
import { AdminTabs } from "./AdminTabs";
import { RoleBadge } from "./RoleBadge";

interface AdminConsoleProps {
  users: PlatformUser[];
  sources: DataSource[];
  auditLog: AuditEntry[];
}

export function AdminConsole({ users, sources, auditLog }: AdminConsoleProps) {
  const { status, user, logout } = useAuth();

  if (status === "loading") {
    return (
      <Centered>
        <span
          className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl"
          style={{ backgroundColor: BRAND.base }}
        >
          <ShieldCheck className="h-6 w-6 text-white" />
        </span>
        <p className="text-sm text-slate-300">Checking your session…</p>
      </Centered>
    );
  }

  if (status === "unauthenticated") {
    return <AdminLogin />;
  }

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <Centered>
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/15">
          <ShieldX className="h-6 w-6 text-red-400" />
        </span>
        <h1 className="text-lg font-bold text-white">No admin access</h1>
        <p className="max-w-sm text-center text-sm text-slate-300">
          {user?.email} is not an administrator account. Admin access is
          provisioned by the NCDC platform team.
        </p>
        <div className="mt-2 flex gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            style={{ backgroundColor: BRAND.base }}
          >
            Open the app
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </Centered>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-white sm:px-8"
        style={{ backgroundColor: BRAND.ink }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg shadow-inner"
            style={{ backgroundColor: BRAND.base }}
          >
            <ShieldCheck className="h-5 w-5 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold tracking-tight">
              HealthWatch NG · Admin Console
            </span>
            <span className="block text-[11px] font-medium text-emerald-200/80">
              Registrations, users, data sources and audit
            </span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-medium sm:block">
            {user.name}
          </span>
          <RoleBadge role={user.role} />
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
          >
            Open app
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-sm font-semibold text-slate-100 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        <AdminTabs users={users} sources={sources} auditLog={auditLog} />
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: BRAND.ink }}
    >
      <div className="flex flex-col items-center gap-3">{children}</div>
    </div>
  );
}

function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await login(email, password);
    if (!result.ok) {
      setError(result.message);
      setSubmitting(false);
    }
    // On success the auth store updates and AdminConsole re-renders past the gate.
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundColor: BRAND.ink }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-lg"
            style={{ backgroundColor: BRAND.base }}
          >
            <ShieldCheck className="h-5 w-5 text-white" />
          </span>
          <div className="leading-tight">
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Admin Console
            </h1>
            <p className="text-xs text-slate-500">HealthWatch NG</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Sign in with an administrator account. Admin access is provisioned by
          the NCDC platform team.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-sm font-medium text-slate-700"
            >
              Email address
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ncdc.gov.ng"
              className={fieldClasses(false)}
            />
          </div>
          <div>
            <label
              htmlFor="admin-password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={fieldClasses(false)}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ backgroundColor: BRAND.base }}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-400">
          Looking for the surveillance platform?{" "}
          <Link href="/login" className="font-semibold text-brand hover:underline">
            User sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
