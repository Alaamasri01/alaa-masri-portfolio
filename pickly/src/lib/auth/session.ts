import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/supabase/database.types";
import { WORKSPACES, WORKSPACE_ROLE, workspacePath, type MemberRole, type Workspace } from "./workspaces";

export const ACTIVE_SCHOOL_COOKIE = "pickly_school";

export type SchoolSummary = { id: string; slug: string; name_ar: string; name_en: string };

export type SchoolAccess = SchoolSummary & {
  roles: MemberRole[];
  isParent: boolean;
};

export type SessionContext = {
  userId: string;
  email: string | null;
  fullName: string;
  preferredLocale: Enums<"app_locale">;
  isPlatformOwner: boolean;
  schools: SchoolAccess[];
  workspaces: Workspace[];
};

/**
 * Resolves the signed-in user and everything they can access. Memoized per
 * request. Uses the user's own RLS-scoped client, so a deactivated school or a
 * removed membership disappears here automatically.
 *
 * This is the app's Data Access Layer entry point for identity. It decides what
 * to RENDER; the database still decides what data is returned or changed.
 */
export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createSupabaseServerClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  if (!userId) return null;

  const [profileRes, ownerRes, membersRes, parentsRes] = await Promise.all([
    supabase.from("profiles").select("full_name, preferred_locale").eq("id", userId).maybeSingle(),
    supabase.from("platform_owners").select("profile_id").eq("profile_id", userId).maybeSingle(),
    supabase
      .from("school_members")
      .select("role, school:schools!inner(id, slug, name_ar, name_en)")
      .eq("profile_id", userId)
      .eq("is_active", true),
    supabase
      .from("parents")
      .select("school:schools!inner(id, slug, name_ar, name_en)")
      .eq("profile_id", userId)
      .eq("is_active", true),
  ]);

  const schools = new Map<string, SchoolAccess>();
  const access = (school: SchoolSummary) => {
    let entry = schools.get(school.id);
    if (!entry) {
      entry = { ...school, roles: [], isParent: false };
      schools.set(school.id, entry);
    }
    return entry;
  };
  for (const row of membersRes.data ?? []) {
    if (row.school) access(row.school).roles.push(row.role);
  }
  for (const row of parentsRes.data ?? []) {
    if (row.school) access(row.school).isParent = true;
  }

  const schoolList = [...schools.values()];
  const isPlatformOwner = !!ownerRes.data;
  const workspaces = WORKSPACES.filter((ws) => {
    if (ws === "platform") return isPlatformOwner;
    if (ws === "parent") return schoolList.some((s) => s.isParent);
    return schoolList.some((s) => s.roles.includes(WORKSPACE_ROLE[ws]));
  });

  return {
    userId,
    email: typeof claims?.email === "string" ? claims.email : null,
    fullName: profileRes.data?.full_name ?? "",
    preferredLocale: profileRes.data?.preferred_locale ?? "ar",
    isPlatformOwner,
    schools: schoolList,
    workspaces,
  };
});

/** Schools in which the user may use a given workspace. */
export function schoolsForWorkspace(ctx: SessionContext, workspace: Workspace): SchoolAccess[] {
  if (workspace === "platform") return [];
  if (workspace === "parent") return ctx.schools.filter((s) => s.isParent);
  return ctx.schools.filter((s) => s.roles.includes(WORKSPACE_ROLE[workspace]));
}

/** Where a signed-in user should land. */
export function homePath(locale: string, ctx: SessionContext) {
  const first = ctx.workspaces[0];
  return first ? workspacePath(locale, first) : `/${locale}/no-access`;
}

/**
 * Guard for workspace layouts/pages. Redirects anonymous users to sign-in and
 * users without the workspace to their own home. Returns the session and the
 * active school (staff workspaces are always scoped to exactly one school).
 */
export async function requireWorkspace(locale: string, workspace: Workspace) {
  const ctx = await getSessionContext();
  if (!ctx) redirect(`/${locale}/sign-in`);
  if (!ctx.workspaces.includes(workspace)) redirect(homePath(locale, ctx));

  const candidates = schoolsForWorkspace(ctx, workspace);
  const preferred = (await cookies()).get(ACTIVE_SCHOOL_COOKIE)?.value;
  const activeSchool = candidates.find((s) => s.id === preferred) ?? candidates[0] ?? null;

  return { ctx, activeSchool, schools: candidates };
}
