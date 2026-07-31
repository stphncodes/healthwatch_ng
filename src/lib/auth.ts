// Module: Auth Service | Owner: Frontend Lead / Backend Lead
// Dual-mode authentication:
//  - Supabase mode (NEXT_PUBLIC_SUPABASE_* set): real email/password auth via
//    supabase.auth. Signup uploads the applicant's government ID photo to the
//    private `identity-documents` bucket, then carries profile fields (name,
//    state, phone, nin, document path) in user metadata, mirrored to the
//    `profiles` + `identity_documents` tables by a DB trigger
//    (see supabase/schema.sql). Every self-registered account is a Member;
//    the single Admin is seeded by SQL (supabase/seed_admin.sql).
//  - Local mode (no Supabase env): accounts self-registered on /signup are
//    kept in localStorage with SHA-256 password hashes, so the flow behaves
//    the same without a backend. Local signups are auto-approved: the Admin
//    account exists only in Supabase, so without a backend there is nobody
//    to review a pending registration.
// In Supabase mode new registrations are `pending` until the Admin approves
// them; no session is established for pending/rejected accounts.
// Both modes surface the session through the same subscribe/snapshot pair,
// consumed by AuthProvider via useSyncExternalStore.

import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { CompressedImage } from "@/lib/images";
import type { PlatformUser, UserRole } from "@/types/health";

const SESSION_KEY = "healthwatch.session.v2";
const ACCOUNTS_KEY = "healthwatch.accounts.v2";

/** Private storage bucket holding signup identity documents. */
export const DOCUMENTS_BUCKET = "identity-documents";

/** Matches Supabase's default minimum password length. */
export const MIN_PASSWORD_LENGTH = 6;

/** Simulated latency for local mode so loading states stay visible. */
const LOCAL_LATENCY_MS = 500;

const PENDING_MESSAGE =
  "Your account is awaiting administrator approval. You'll be able to sign in once your registration has been reviewed.";
const REJECTED_MESSAGE =
  "Your registration was not approved. Contact the NCDC platform team if you believe this is an error.";
const DEACTIVATED_MESSAGE =
  "This account has been deactivated. Contact the NCDC platform team to restore access.";

export type LoginResult = { ok: true } | { ok: false; message: string };

export type RegisterResult =
  | { ok: true; needsEmailConfirmation: boolean; pendingApproval: boolean }
  | { ok: false; message: string };

const USER_ROLES: UserRole[] = ["Admin", "Member"];

export interface RegistrationInput {
  name: string;
  /** State of origin — one of the 36 states or the FCT. */
  state: string;
  email: string;
  phone: string;
  /** Typed 11-digit National Identification Number. */
  nin: string;
  /** Photo of any valid government ID — NIN slip, national ID card,
   * driver's licence, passport, or voter's card. */
  idPhoto: CompressedImage;
  password: string;
}

/* -------------------------------------------------------------------------- */
/* Session store (subscribe + snapshots for useSyncExternalStore)             */
/* -------------------------------------------------------------------------- */

type Listener = () => void;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  if (isSupabaseConfigured) startSupabaseSession();
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** Current signed-in user, or null. Stable references between changes. */
export function getSessionUser(): PlatformUser | null {
  if (typeof window === "undefined") return null;
  return isSupabaseConfigured ? supabaseUser : loadLocalSession();
}

/**
 * False until the initial session restore has completed (always false during
 * SSR/hydration) — lets the route guard distinguish "still checking" from
 * "signed out".
 */
export function isSessionReady(): boolean {
  if (typeof window === "undefined") return false;
  return isSupabaseConfigured ? supabaseReady : true;
}

/* -------------------------------------------------------------------------- */
/* Supabase mode                                                              */
/* -------------------------------------------------------------------------- */

let supabaseUser: PlatformUser | null = null;
let supabaseReady = false;
let supabaseStarted = false;

/** Discards stale async profile lookups when sessions change quickly. */
let gateSeq = 0;

// Approved users are cached per id so TOKEN_REFRESHED events don't re-fetch
// the profile. Only positive verdicts are cached: a pending user who gets
// approved must be re-checked on their next sign-in.
const approvedCache = new Map<string, PlatformUser>();

interface ProfileRow {
  name: string | null;
  role: string | null;
  state: string | null;
  phone: string | null;
  active: boolean | null;
  approval_status: string | null;
  last_active: string | null;
}

function startSupabaseSession(): void {
  if (supabaseStarted) return;
  supabaseStarted = true;
  const supabase = getSupabase();
  supabase.auth.getSession().then(({ data }) => {
    void applySession(data.session);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    void applySession(session);
  });
}

/**
 * Session gate: resolves the profile row (source of truth for role, active
 * and approval status — user metadata is client-controlled) before exposing
 * the session. Pending/rejected/deactivated users are signed out and never
 * surface as authenticated, including restored sessions and the auto-login
 * after email confirmation.
 */
async function applySession(session: Session | null): Promise<void> {
  const seq = ++gateSeq;
  const authUser = session?.user;
  if (!authUser) {
    supabaseUser = null;
    supabaseReady = true;
    emit();
    return;
  }

  const cached = approvedCache.get(authUser.id);
  if (cached) {
    supabaseUser = cached;
    supabaseReady = true;
    emit();
    return;
  }

  const { data } = await getSupabase()
    .from("profiles")
    .select("name, role, state, phone, active, approval_status, last_active")
    .eq("id", authUser.id)
    .maybeSingle<ProfileRow>();
  if (seq !== gateSeq) return;

  const user = mapProfileRow(authUser, data);
  if (!user) {
    supabaseUser = null;
    supabaseReady = true;
    emit();
    // supabase-js can deadlock when auth methods are called synchronously
    // inside an onAuthStateChange callback — defer the sign-out.
    setTimeout(() => {
      void getSupabase().auth.signOut();
    }, 0);
    return;
  }

  approvedCache.set(authUser.id, user);
  supabaseUser = user;
  supabaseReady = true;
  emit();
}

/** Null unless the profile exists, is approved and is active. */
function mapProfileRow(authUser: User, row: ProfileRow | null): PlatformUser | null {
  if (!row) return null;
  if (row.approval_status !== "approved" || row.active === false) return null;
  const role = USER_ROLES.find((r) => r === row.role) ?? "Member";
  return {
    id: authUser.id,
    name: row.name || (authUser.email ?? "User"),
    email: authUser.email ?? "",
    role,
    state: row.state ?? "",
    phone: row.phone ?? undefined,
    active: true,
    approvalStatus: "approved",
    lastActive: row.last_active ?? new Date().toISOString(),
  };
}

async function supabaseLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    const message =
      error.message === "Invalid login credentials"
        ? "Incorrect email or password."
        : error.message;
    return { ok: false, message };
  }

  // The credentials were right, but only approved + active accounts may hold
  // a session. (The session gate above also enforces this; checking here too
  // produces the specific error message on the login form.)
  const { data: prof } = await supabase
    .from("profiles")
    .select("approval_status, active")
    .eq("id", data.session?.user.id ?? "")
    .maybeSingle<{ approval_status: string | null; active: boolean | null }>();
  const blockedMessage =
    !prof || prof.approval_status === "pending"
      ? PENDING_MESSAGE
      : prof.approval_status === "rejected"
        ? REJECTED_MESSAGE
        : prof.active === false
          ? DEACTIVATED_MESSAGE
          : null;
  if (blockedMessage) {
    await supabase.auth.signOut();
    return { ok: false, message: blockedMessage };
  }
  return { ok: true };
}

async function supabaseRegister(
  input: RegistrationInput,
): Promise<RegisterResult> {
  const supabase = getSupabase();

  // The document is uploaded BEFORE signUp: with email confirmation enabled
  // signUp returns no session, so this is the only moment the browser can
  // write it (the bucket's insert policy covers the anon role).
  const folder = crypto.randomUUID();
  const idPhotoPath = `signup/${folder}/id-photo.jpg`;
  const upload = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(idPhotoPath, input.idPhoto.blob, { contentType: "image/jpeg" });
  if (upload.error) {
    return {
      ok: false,
      message:
        "Could not upload your ID document — check your connection and try again.",
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      // Send the confirmation link back to the origin the user signed up
      // from (deployed URL or localhost) instead of the project's Site URL.
      // The origin must be in the Supabase dashboard's Redirect URLs list.
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        name: input.name.trim(),
        state: input.state,
        phone: normalizePhone(input.phone),
        nin: input.nin.trim(),
        id_photo_path: idPhotoPath,
      },
    },
  });
  if (error) return { ok: false, message: error.message };
  // With email confirmation enabled, signUp returns a user but no session.
  // If a session IS returned, the session gate signs it out again because the
  // new profile is pending — the account stays locked until it is approved.
  return {
    ok: true,
    needsEmailConfirmation: !data.session,
    pendingApproval: true,
  };
}

/* -------------------------------------------------------------------------- */
/* Local mode (no Supabase configured)                                        */
/* -------------------------------------------------------------------------- */

interface LocalAccount extends PlatformUser {
  passwordHash: string;
  /** Identity evidence; absent on accounts created before the approval flow. */
  nin?: string;
  idPhotoDataUrl?: string;
}

// Parsed accounts are cached against the raw localStorage string so session
// snapshots keep stable object references between writes.
let accountsCache: { raw: string | null; accounts: LocalAccount[] } = {
  raw: null,
  accounts: [],
};

function loadAccounts(): LocalAccount[] {
  const raw = window.localStorage.getItem(ACCOUNTS_KEY);
  if (raw === accountsCache.raw) return accountsCache.accounts;
  let accounts: LocalAccount[] = [];
  try {
    accounts = raw ? (JSON.parse(raw) as LocalAccount[]) : [];
  } catch {
    accounts = [];
  }
  // Accounts stored before the approval flow have no approvalStatus — they
  // were usable then, so they remain approved. Accounts stored before the
  // two-role model carry retired role strings — they become Members.
  for (const account of accounts) {
    if (!account.approvalStatus) account.approvalStatus = "approved";
    if (!USER_ROLES.includes(account.role)) account.role = "Member";
  }
  accountsCache = { raw, accounts };
  return accounts;
}

function loadLocalSession(): PlatformUser | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { userId?: string };
    const account = loadAccounts().find((a) => a.id === stored.userId);
    return account && account.active && account.approvalStatus === "approved"
      ? account
      : null;
  } catch {
    return null;
  }
}

function persistLocalSession(userId: string): void {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
  emit();
}

async function hashPassword(password: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const delay = () => new Promise((r) => setTimeout(r, LOCAL_LATENCY_MS));

async function localLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  await delay();
  const account = loadAccounts().find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!account) {
    return {
      ok: false,
      message: "No account found for that email — create one on the signup page.",
    };
  }
  if (account.passwordHash !== (await hashPassword(password))) {
    return { ok: false, message: "Incorrect email or password." };
  }
  if (account.approvalStatus === "pending") {
    return { ok: false, message: PENDING_MESSAGE };
  }
  if (account.approvalStatus === "rejected") {
    return { ok: false, message: REJECTED_MESSAGE };
  }
  if (!account.active) {
    return { ok: false, message: DEACTIVATED_MESSAGE };
  }
  persistLocalSession(account.id);
  return { ok: true };
}

async function localRegister(
  input: RegistrationInput,
): Promise<RegisterResult> {
  await delay();
  const email = input.email.trim();
  const accounts = loadAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
    return {
      ok: false,
      message: "An account with that email already exists. Try signing in instead.",
    };
  }
  // Auto-approved: no admin exists in local mode to review a pending signup
  // (the Admin account is seeded by SQL only, which needs Supabase).
  const account: LocalAccount = {
    id: `U-${Date.now().toString(36).toUpperCase()}`,
    name: input.name.trim(),
    email,
    role: "Member",
    state: input.state,
    phone: normalizePhone(input.phone),
    active: true,
    approvalStatus: "approved",
    lastActive: new Date().toISOString(),
    passwordHash: await hashPassword(input.password),
    nin: input.nin.trim(),
    idPhotoDataUrl: input.idPhoto.dataUrl,
  };
  try {
    window.localStorage.setItem(
      ACCOUNTS_KEY,
      JSON.stringify([...accounts, account]),
    );
  } catch {
    return {
      ok: false,
      message:
        "Could not save your registration in this browser — storage is full. Remove other demo accounts and try again.",
    };
  }
  persistLocalSession(account.id);
  return { ok: true, needsEmailConfirmation: false, pendingApproval: false };
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

function normalizePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

export function login(email: string, password: string): Promise<LoginResult> {
  return isSupabaseConfigured
    ? supabaseLogin(email, password)
    : localLogin(email, password);
}

export function register(input: RegistrationInput): Promise<RegisterResult> {
  return isSupabaseConfigured ? supabaseRegister(input) : localRegister(input);
}

export async function logout(): Promise<void> {
  if (isSupabaseConfigured) {
    await getSupabase().auth.signOut();
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
  emit();
}
