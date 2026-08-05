// Module: Auth — Signup Form | Owner: Frontend Lead
// Public self-registration: name, state of origin, email, phone, NIN, one
// government ID photo and password. Every signup becomes a Member and is held
// for Admin review; in Supabase mode this calls supabase.auth.signUp (and
// shows a check-your-email notice when confirmation is enabled) after
// uploading the document.
"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  MailCheck,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth";
import { compressImage, type CompressedImage } from "@/lib/images";
import { NIGERIAN_STATES } from "@/lib/states";
import { BRAND } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { AuthScreen } from "./AuthScreen";
import { useAuth } from "./AuthProvider";
import { fieldClasses } from "./fieldStyles";

// Nigerian mobile numbers: +234 or 0 prefix, then 70x/80x/81x/90x/91x ranges.
const NG_PHONE_PATTERN = /^(?:\+234|0)[7-9][01]\d{8}$/;

// National Identification Number: exactly 11 digits.
const NIN_PATTERN = /^\d{11}$/;

interface FieldErrors {
  name?: string;
  state?: string;
  email?: string;
  phone?: string;
  nin?: string;
  idPhoto?: string;
  password?: string;
  confirmPassword?: string;
}

interface FormValues {
  name: string;
  state: string;
  email: string;
  phone: string;
  nin: string;
  password: string;
  confirmPassword: string;
}

function validate(
  values: FormValues,
  idPhoto: CompressedImage | null,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.name.trim()) {
    errors.name = "Full name is required.";
  } else if (values.name.trim().length < 3) {
    errors.name = "Enter your full name.";
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
  const nin = values.nin.replace(/\s/g, "");
  if (!nin) {
    errors.nin = "Your NIN is required.";
  } else if (!NIN_PATTERN.test(nin)) {
    errors.nin = "Enter your 11-digit National Identification Number.";
  }
  if (!idPhoto) {
    errors.idPhoto = "Upload a photo of a valid government ID.";
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
    state: "",
    email: "",
    phone: "",
    nin: "",
    password: "",
    confirmPassword: "",
  });
  const [idPhoto, setIdPhoto] = useState<CompressedImage | null>(null);
  const [processingDoc, setProcessingDoc] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMode, setSuccessMode] = useState<
    "confirm-email" | "awaiting-approval" | null
  >(null);

  // Already signed in (or registration just completed): into the app.
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  function setValue<K extends keyof FormValues>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleDocumentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow re-selecting the same file after a "Replace".
    event.target.value = "";
    if (!file) return;
    setProcessingDoc(true);
    setFieldErrors((prev) => ({ ...prev, idPhoto: undefined }));
    try {
      const image = await compressImage(file);
      setIdPhoto(image);
    } catch (err) {
      setIdPhoto(null);
      setFieldErrors((prev) => ({
        ...prev,
        idPhoto:
          err instanceof Error
            ? err.message
            : "Could not read that image — choose a JPEG or PNG photo.",
      }));
    } finally {
      setProcessingDoc(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validate(values, idPhoto);
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;
    if (!idPhoto) return;

    setSubmitting(true);
    setAuthError(null);
    const result = await register({
      name: values.name,
      state: values.state,
      email: values.email,
      phone: values.phone,
      nin: values.nin.replace(/\s/g, ""),
      idPhoto,
      password: values.password,
    });
    if (!result.ok) {
      setAuthError(result.message);
      setSubmitting(false);
      return;
    }
    if (result.needsEmailConfirmation) {
      // Supabase sent a confirmation link; there is no session yet.
      setSuccessMode("confirm-email");
      setSubmitting(false);
    } else if (result.pendingApproval) {
      // Account created but locked until the Admin approves it.
      setSuccessMode("awaiting-approval");
      setSubmitting(false);
    }
    // Otherwise the status effect above redirects once the session lands.
  }

  if (successMode) {
    const confirmEmail = successMode === "confirm-email";
    return (
      <AuthScreen>
        <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
          <span
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full",
              confirmEmail ? "bg-emerald-50" : "bg-amber-50",
            )}
          >
            {confirmEmail ? (
              <MailCheck className="h-7 w-7 text-emerald-600" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-amber-600" />
            )}
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {confirmEmail ? "Confirm your email" : "Registration submitted"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {confirmEmail ? (
                <>
                  We sent a confirmation link to{" "}
                  <span className="font-semibold text-slate-700">
                    {values.email.trim()}
                  </span>
                  . Click it to verify your email. Your account will then be
                  reviewed by an administrator before you can sign in.
                </>
              ) : (
                <>
                  Your account is awaiting administrator approval. We&apos;ll
                  verify your NIN and ID document — you&apos;ll be able to sign
                  in once your registration has been reviewed.
                </>
              )}
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
        Anyone can register as a member — access is granted after NCDC reviews
        your identity documents.
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
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.state}</p>
          )}
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

        <div>
          <label
            htmlFor="nin"
            className="block text-sm font-medium text-slate-700"
          >
            National Identification Number (NIN)
          </label>
          <input
            id="nin"
            type="text"
            inputMode="numeric"
            maxLength={11}
            autoComplete="off"
            value={values.nin}
            onChange={(e) => setValue("nin", e.target.value)}
            aria-invalid={Boolean(fieldErrors.nin)}
            placeholder="12345678901"
            className={fieldClasses(Boolean(fieldErrors.nin))}
          />
          {fieldErrors.nin ? (
            <p className="mt-1.5 text-xs text-red-600">{fieldErrors.nin}</p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-400">
              Used by NCDC to verify your identity before approval.
            </p>
          )}
        </div>

        <DocumentPicker
          id="idPhoto"
          label="Government ID photo"
          hint="NIN slip, national ID card, driver's licence, passport or voter's card."
          image={idPhoto}
          processing={processingDoc}
          error={fieldErrors.idPhoto}
          onChange={handleDocumentChange}
        />

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

interface DocumentPickerProps {
  id: string;
  label: string;
  hint: string;
  image: CompressedImage | null;
  processing: boolean;
  error?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

function DocumentPicker({
  id,
  label,
  hint,
  image,
  processing,
  error,
  onChange,
}: DocumentPickerProps) {
  return (
    <div>
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <label
        htmlFor={id}
        className={cn(
          "mt-1.5 flex cursor-pointer items-center gap-3 rounded-lg border border-dashed px-3.5 py-3 transition-colors",
          error
            ? "border-red-300 bg-red-50/50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400",
        )}
      >
        {image ? (
          // Previews come from in-memory data URLs; next/image adds nothing here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.dataUrl}
            alt={`${label} preview`}
            className="h-12 w-16 shrink-0 rounded-md border border-slate-200 object-cover"
          />
        ) : (
          <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-white">
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <ImagePlus className="h-4 w-4 text-slate-400" />
            )}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-slate-600">
            {processing ? "Processing…" : image ? "Replace photo" : "Upload photo"}
          </span>
          <span className="block text-xs text-slate-400">{hint}</span>
        </span>
      </label>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={onChange}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
