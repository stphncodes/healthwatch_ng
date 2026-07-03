// Module: Auth Service | Owner: Frontend Lead / Backend Lead
// Dual-mode authentication:
//  - Supabase mode (NEXT_PUBLIC_SUPABASE_* set): real email/password auth via
//    supabase.auth, with profile fields (name, role, state, phone) carried in
//    user metadata and mirrored to the `profiles` table by a DB trigger
//    (see supabase/schema.sql).
//  - Local mode (no Supabase env): accounts self-registered on /signup are
//    kept in localStorage with SHA-256 password hashes, so the flow behaves
//    the same without a backend. There are no seeded demo accounts.
// Both modes surface the session through the same subscribe/snapshot pair,
// consumed by AuthProvider via useSyncExternalStore.

import type { Session } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { PlatformUser, UserRole } from "@/types/health";

const SESSION_KEY = "healthwatch.session.v2";
const ACCOUNTS_KEY = "healthwatch.accounts.v2";

/** Matches Supabase's default minimum password length. */
export const MIN_PASSWORD_LENGTH = 6;

/** Simulated latency for local mode so loading states stay visible. */
const LOCAL_LATENCY_MS = 500;

export type LoginResult = { ok: true } | { ok: false; message: string };

export type RegisterResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | { ok: false; message: string };

const USER_ROLES: UserRole[] = [
  "System Admin",
  "Data Engineer",
  "Data Scientist",
  "Health Officer",
  "State Coordinator",
];

export interface RegistrationInput {
  name: string;
  role: UserRole;
  /** State of origin — one of the 36 states or the FCT. */
  state: string;
  email: string;
  phone: string;
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

function mapSupabaseSession(session: Session | null): PlatformUser | null {
  const u = session?.user;
  if (!u) return null;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;
  const role = USER_ROLES.find((r) => r === meta.role) ?? "Health Officer";
  return {
    id: u.id,
    name: typeof meta.name === "string" && meta.name ? meta.name : (u.email ?? "User"),
    email: u.email ?? "",
    role,
    state: typeof meta.state === "string" ? meta.state : "",
    phone: typeof meta.phone === "string" ? meta.phone : undefined,
    active: true,
    lastActive: new Date().toISOString(),
  };
}

function startSupabaseSession(): void {
  if (supabaseStarted) return;
  supabaseStarted = true;
  const supabase = getSupabase();
  supabase.auth.getSession().then(({ data }) => {
    supabaseUser = mapSupabaseSession(data.session);
    supabaseReady = true;
    emit();
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    supabaseUser = mapSupabaseSession(session);
    supabaseReady = true;
    emit();
  });
}

async function supabaseLogin(
  email: string,
  password: string,
): Promise<LoginResult> {
  const { error } = await getSupabase().auth.signInWithPassword({
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
  return { ok: true };
}

async function supabaseRegister(
  input: RegistrationInput,
): Promise<RegisterResult> {
  const { data, error } = await getSupabase().auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        role: input.role,
        state: input.state,
        phone: normalizePhone(input.phone),
      },
    },
  });
  if (error) return { ok: false, message: error.message };
  // With email confirmation enabled, signUp returns a user but no session.
  return { ok: true, needsEmailConfirmation: !data.session };
}

/* -------------------------------------------------------------------------- */
/* Local mode (no Supabase configured)                                        */
/* -------------------------------------------------------------------------- */

interface LocalAccount extends PlatformUser {
  passwordHash: string;
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
  accountsCache = { raw, accounts };
  return accounts;
}

function loadLocalSession(): PlatformUser | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { userId?: string };
    const account = loadAccounts().find((a) => a.id === stored.userId);
    return account && account.active ? account : null;
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
  persistLocalSession(account.id);
  return { ok: true };
}

async function localRegister(
  input: RegistrationInput,
): Promise<RegisterResult> {
  await delay();
  const email = input.email.trim();
  if (
    loadAccounts().some((a) => a.email.toLowerCase() === email.toLowerCase())
  ) {
    return {
      ok: false,
      message: "An account with that email already exists. Try signing in instead.",
    };
  }
  const account: LocalAccount = {
    id: `U-${Date.now().toString(36).toUpperCase()}`,
    name: input.name.trim(),
    email,
    role: input.role,
    state: input.state,
    phone: normalizePhone(input.phone),
    active: true,
    lastActive: new Date().toISOString(),
    passwordHash: await hashPassword(input.password),
  };
  window.localStorage.setItem(
    ACCOUNTS_KEY,
    JSON.stringify([...loadAccounts(), account]),
  );
  persistLocalSession(account.id);
  return { ok: true, needsEmailConfirmation: false };
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
