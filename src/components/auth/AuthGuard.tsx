// Module: Auth — Route Guard | Owner: Frontend Lead
// Blocks the dashboard route group for signed-out visitors: shows a splash
// while the session is restored, then either renders the app or bounces to
// /login carrying the intended destination in ?next=.
"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity } from "lucide-react";
import { BRAND } from "@/lib/theme";
import { useAuth } from "./AuthProvider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <span
            className="flex h-12 w-12 animate-pulse items-center justify-center rounded-xl"
            style={{ backgroundColor: BRAND.base }}
          >
            <Activity className="h-6 w-6 text-white" />
          </span>
          <p className="text-sm text-slate-500">Checking your session…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
