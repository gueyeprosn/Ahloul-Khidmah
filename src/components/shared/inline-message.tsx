import { cn } from "@/lib/utils"

export function InlineMessage({
  message,
  variant = "error",
  className,
}: {
  message: string
  variant?: "error" | "success"
  className?: string
}) {
  return (
    <p
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm",
        variant === "error"
          ? "border-destructive/25 bg-destructive/10 text-destructive"
          : "border-[var(--ak-emerald-deep)]/20 bg-[#E7F0EA] text-[var(--ak-emerald-deep)]",
        className
      )}
    >
      {message}
    </p>
  )
}
