import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "brand" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

const variants: Record<Variant, string> = {
  primary: "bg-ink-950 text-white hover:bg-ink-800 active:bg-ink-900 shadow-sm",
  brand: "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 shadow-sm",
  secondary: "bg-surface text-ink-900 ring-1 ring-inset ring-ink-200 hover:bg-ink-50 active:bg-ink-100",
  ghost: "text-ink-700 hover:bg-ink-100 active:bg-ink-200",
  danger: "bg-danger-600 text-white hover:bg-danger-700 shadow-sm",
};

// Touch targets: md ≥ 44px (WCAG), lg/xl for tablets at the gate and one-handed parent use.
const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl gap-1.5",
  md: "h-11 px-5 text-[15px] rounded-xl gap-2",
  lg: "h-14 px-6 text-base rounded-2xl gap-2.5",
  xl: "h-16 px-7 text-lg rounded-2xl gap-3",
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading = false, block = false, className, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center font-semibold whitespace-nowrap",
        "transition-[background-color,box-shadow,transform] duration-150 active:scale-[0.985]",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      {...props}
    >
      {loading && <Loader2 aria-hidden className="size-[1.1em] animate-spin" />}
      {children}
    </button>
  );
});
