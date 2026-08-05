// Module: Role Groupings | Owner: Frontend Lead
// Single source of truth for the two-role model. The one Admin account is
// seeded by SQL (supabase/seed_admin.sql) — there is no UI path to it, and
// the handle_new_user() trigger in supabase/schema.sql hard-assigns Member
// to every self-registered account.

import type { UserRole } from "@/types/health";

/** The single administrator role — unlocks /admin, approvals and content editing. */
export const ADMIN_ROLE: UserRole = "Admin";

/** The role every self-registered account receives. */
export const MEMBER_ROLE: UserRole = "Member";

/** Whether a role carries administrator privileges. */
export function isAdmin(role: UserRole): boolean {
  return role === ADMIN_ROLE;
}
