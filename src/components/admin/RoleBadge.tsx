// Module: Admin Panel — Role Badge | Owner: Platform Engineer
// Shared pill badge for a user's role, coloured from the ROLE_STYLES map.

import type { PlatformUser } from "@/types/health";
import { ROLE_STYLES } from "@/lib/theme";

export function RoleBadge({ role }: { role: PlatformUser["role"] }) {
  const s = ROLE_STYLES[role];
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      {role}
    </span>
  );
}
