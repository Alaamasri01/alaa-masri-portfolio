"use client";

import { useActionState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Alert } from "@/components/ui/alert";
import { useI18n } from "@/i18n/client";
import { signIn, type SignInState } from "@/lib/auth/actions";

export type DemoAccount = { email: string; role: string; name: string };

export function SignInForm({ demoAccounts, demoPassword }: { demoAccounts: DemoAccount[]; demoPassword?: string }) {
  const { locale, t } = useI18n();
  const [state, action, pending] = useActionState<SignInState, FormData>(signIn, { error: null, email: "" });
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  function fillDemo(email: string) {
    if (emailRef.current) emailRef.current.value = email;
    if (passwordRef.current && demoPassword) passwordRef.current.value = demoPassword;
    passwordRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-8">
      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="locale" value={locale} />
        {state.error && <Alert tone="danger">{t.auth[state.error === "invalid" ? "invalidCredentials" : "genericError"]}</Alert>}
        <TextField
          ref={emailRef}
          label={t.auth.email}
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email}
          className="text-start"
        />
        <TextField
          ref={passwordRef}
          label={t.auth.password}
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          className="text-start"
        />
        <Button type="submit" size="lg" block loading={pending}>
          {pending ? t.auth.submitting : t.auth.submit}
        </Button>
      </form>

      {demoAccounts.length > 0 && (
        <section aria-labelledby="demo-accounts" className="rounded-3xl bg-sand-100/70 p-4 ring-1 ring-sand-200">
          <h2 id="demo-accounts" className="text-sm font-semibold text-ink-800">
            {t.auth.demoTitle}
          </h2>
          <p className="mt-1 text-xs text-ink-500">
            {t.auth.demoHint}
            <code dir="ltr" className="rounded bg-surface px-1.5 py-0.5 font-mono text-[11px] text-ink-700">
              {demoPassword}
            </code>
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {demoAccounts.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => fillDemo(account.email)}
                  className="flex w-full flex-col items-start rounded-2xl bg-surface px-3.5 py-2.5 text-start ring-1 ring-ink-200/70 transition hover:ring-brand-300"
                >
                  <span className="text-sm font-semibold text-ink-900">{account.role}</span>
                  <span className="text-xs text-ink-500">{account.name}</span>
                  <span dir="ltr" className="text-[11px] text-ink-400">
                    {account.email}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
