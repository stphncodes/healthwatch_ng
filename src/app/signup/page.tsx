// Module: Signup Route | Owner: Frontend Lead
// Public self-registration page — like /login, it sits outside the guarded
// (app) group.
import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create an account",
};

export default function SignupPage() {
  return <SignupForm />;
}
