"use server";

import { redirect } from "next/navigation";
import { defaultLocale, isLocale } from "@/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInState = { error: "invalid" | "generic" | null; email: string };

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const rawLocale = String(formData.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password || email.length > 320 || password.length > 200) {
    return { error: "invalid", email };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Do not reveal whether the account exists.
    return { error: error.status === 400 ? "invalid" : "generic", email };
  }

  redirect(`/${locale}`);
}

export async function signOut(formData: FormData) {
  const rawLocale = String(formData.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : defaultLocale;
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect(`/${locale}/sign-in`);
}
