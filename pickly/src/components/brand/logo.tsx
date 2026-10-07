import { cn } from "@/lib/cn";

/** Pickly mark: a rounded "pin" holding a check — a child safely handed over. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="10" className="fill-brand-600" />
      <path
        d="M16 7.5c-4.4 0-8 3.4-8 7.7 0 5.3 6.3 9.6 7.3 10.2.4.3 1 .3 1.4 0 1-.6 7.3-4.9 7.3-10.2 0-4.3-3.6-7.7-8-7.7Z"
        className="fill-white"
      />
      <path
        d="m12.6 15.4 2.4 2.4 4.6-4.8"
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-brand-600"
      />
    </svg>
  );
}

export function Logo({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-lg font-bold tracking-tight text-ink-950">{name}</span>
    </span>
  );
}
