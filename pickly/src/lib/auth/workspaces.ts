import type { Enums } from "@/lib/supabase/database.types";

export type MemberRole = Enums<"member_role">;

/** A workspace is one role-specific area of the app. */
export const WORKSPACES = ["platform", "admin", "teacher", "gate", "parent"] as const;
export type Workspace = (typeof WORKSPACES)[number];

/** Which staff role unlocks each school-scoped workspace. */
export const WORKSPACE_ROLE: Record<Exclude<Workspace, "platform" | "parent">, MemberRole> = {
  admin: "school_admin",
  teacher: "teacher",
  gate: "gate_staff",
};

export function workspacePath(locale: string, workspace: Workspace) {
  return `/${locale}/${workspace}`;
}
