// Module: Login Route | Owner: Frontend Lead
// Public sign-in page — the only route outside the guarded (app) group.
import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  // Suspense boundary required because LoginForm reads useSearchParams().
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
