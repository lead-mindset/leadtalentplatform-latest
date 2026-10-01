import { Check } from "lucide-react";
import { cn } from "cn";

export function FilterChip({
  active,
  onClick,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "bg-brand-purple/15 font-semibold text-brand-purple-light"
          : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        className
      )}
    >
      {active && <Check className="size-3.5" aria-hidden="true" />}
      {children}
    </button>
  );
}