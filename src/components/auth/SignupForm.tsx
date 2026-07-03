// Module: Auth — Signup Form | Owner: Frontend Lead
// Self-registration: name, role, state of origin, email, phone and password.
// In Supabase mode this calls supabase.auth.signUp (and shows a check-your-
// email notice when confirmation is enabled); in local mode the account is
// stored in the browser and signed in immediately.
"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  UserPlus,
} from "lucide-react";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { NIGERIAN_STATES } from "@/lib/states";
import { BRAND, ROLE_STYLES } from "@/lib/theme";
import type { UserRole } from "@/types/health";
import { AuthScreen } from "./AuthScreen";
import { useAuth } from "./AuthProvider";
import { fieldClasses } from "./fieldStyles";

// Roles a visitor may self-register with — admin accounts are provisioned
// centrally, so "System Admin" is deliberately excluded.
const ROLE_OPTIONS = (Object.keys(ROLE_STYLES) as UserRole[]).filter(
  (role) => role !== "System Admin",
);

// Nigerian mobile numbers: +234 or 0 prefix, then 70x/80x/81x/90x/91x ranges.
const NG_PHONE_PATTERN = /^(?:\+234|0)[7-9][01]\d{8}$/;

interface FieldErrors {
  name?: string;
  role?: string;
  state?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

interface FormValues {
  name: string;
  role: string;
  state: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

function validate(values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) {
    errors.name = "Full name is required.";
  } else if (values.name.trim().length < 3) {
    errors.name = "Enter your full name.";
  }
  if (!values.role) {
    errors.role = "Select your role.";
  }
  if (!values.state) {
    errors.state = "Select your state of origin.";
  }
  if (!values.email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  const phone = values.phone.replace(/[\s-]/g, "");
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else if (!NG_PHONE_PATTERN.test(phone)) {
    errors.phone =
      "Enter a valid Nigerian phone number, e.g. 0803 123 4567 or +234 803 123 4567.";
  }
  if (!values.password) {
    errors.password = "Password is required.";
  } else if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
}

export function SignupForm() {
  const { status, register } = useAuth();
  const router = useRouter();

  const [values, setValues] = useState<FormValues>({
    name: "",
    role: "",
    state: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  // Already signed in (or registration just completed): into the app.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  function setValue<K extends keyof FormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(values);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setSubmitting(true);
    setAuthError(null);
    const result = await register({
      name: values.name,
      role: values.role as UserRole,
      state: values.state,
      email: values.email,
      phone: values.phone,
      password: values.password,
    });
    if (!result.ok) {
      setAuthError(result.message);
      setSubmitting(false);
      return;
    }
    if (result.needsEmailConfirmation) {
      // Supabase sent a confirmation link; there is no session yet.
      setAwaitingConfirmation(true);
      setSubmitting(false);
    }
    // Otherwise the status effect above redirects once the session lands.
  }

  if (awaitingConfirmation) {
    return (
      <AuthScreen>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <MailCheck className="h-7 w-7 text-emerald-600" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Confirm your email
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-slate-700">
                {values.email.trim()}
              </span>
              . Click it to activate your account, then sign in.
            </p>
          </div>
          <Link
            href="/login"
            className="mt-2 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            style={{ backgroundColor: BRAND.base }}
          >
            Go to sign in
          </Link>
        </div>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Create an account
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Register for access to the surveillance platform.
      </p>

      {authError && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-slate-700"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => setValue("name", e.target.value)}
            aria-invalid={Boolean(fieldErrors.name)}
            placeholder="Dr. Amina Bello"
            className={fieldClasses(Boolean(fieldErrors.name))}
          />
          {fieldErrors.name && (
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-slate-700"
            >
              Role
            </label>
            <select
              id="role"
              value={values.role}
              onChange={(e) => setValue("role", e.target.value)}
              aria-invalid={Boolean(fieldErrors.role)}
              className={fieldClasses(
                Boolean(fieldErrors.role),
                values.role ? "" : "text-slate-400",
              )}
            >
              <option value="" disabled>
                Select your role
              </option>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {fieldErrors.role ? (
              <p className="mt-1.5 text-xs text-red-600">{fieldErrors.role}</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">
                Admin accounts are provisioned by NCDC.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="state"
              className="block text-sm font-medium text-slate-700"
            >
              State of origin
            </label>
            <select
              id="state"
              value={values.state}
              onChange={(e) => setValue("state", e.target.value)}
              aria-invalid={Boolean(fieldErrors.state)}
              className={fieldClasses(
                Boolean(fieldErrors.state),
                values.state ? "" : "text-slate-400",
              )}
            >
              <option value="" disabled>
                Select a state
              </option>
              {NIGERIAN_STATES.map((state) => (
                <option key={state.code} value={state.name}>
                  {state.name}
                </option>
              ))}
            </select>
            {fieldErrors.state && (
              <p className="mt-1.5 text-xs text-red-600">
                {fieldErrors.state}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(e) => setValue("email", e.target.value)}
            aria-invalid={Boolean(fieldErrors.email)}
            placeholder="you@ncdc.gov.ng"
            className={fieldClasses(Boolean(fieldErrors.email))}
          />
          {fieldErrors.email && (
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700"
          >
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => setValue("phone", e.target.value)}
            aria-invalid={Boolean(fieldErrors.phone)}
            placeholder="0803 123 4567"
            className={fieldClasses(Boolean(fieldErrors.phone))}
          />
          {fieldErrors.phone && (
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.phone}</p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={values.password}
                onChange={(e) => setValue("password", e.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                placeholder="••••••••"
                className={fieldClasses(
                  Boolean(fieldErrors.password),
                  "mt-0 pr-11",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="mt-1.5 text-xs text-red-600">
                {fieldErrors.password}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-400">
                At least {MIN_PASSWORD_LENGTH} characters.
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={(e) => setValue("confirmPassword", e.target.value)}
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              placeholder="••••••••"
              className={fieldClasses(Boolean(fieldErrors.confirmPassword))}
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1.5 text-xs text-red-600">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
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
              Creating account…
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Create account
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </AuthScreen>
  );
}
