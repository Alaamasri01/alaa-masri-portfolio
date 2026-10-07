"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined;

/** Singleton Supabase client for Client Components (auth + realtime subscriptions). */
export function getSupabaseBrowserClient() {
  browserClient ??= createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
  );
  return browserClient;
}
