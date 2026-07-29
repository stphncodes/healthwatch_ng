// Module: Role Groupings | Owner: Frontend Lead
// Single source of truth for which roles unlock what. The self-registration
// list is mirrored by the handle_new_user() trigger in supabase/schema.sql,
// which clamps client-supplied roles server-side — keep the two in sync.

import type { UserRole } from "@/types/health";

/** Roles with access to the /admin panel. */
export const ADMIN_ROLES: UserRole[] = ["Super Admin", "System Admin"];

/** Roles that may review (approve/reject) new registrations. */
export const APPROVER_ROLES: UserRole[] = ["Super Admin"];

/** Roles a visitor may pick at self-registration (admin roles are provisioned centrally). */
export const SELF_REGISTER_ROLES: UserRole[] = [
  "Data Engineer",
  "Data Scientist",
  "Health Officer",
  "State Coordinator",
];
