import { Check } from "lucide-react";
import { cn } from "cn";

export function SidebarOption({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2.5 py-1 text-left text-xs font-medium transition-colors",
        active
          ? "bg-brand-purple/10 font-semibold text-brand-purple-light"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <span>{children}</span>
      {active && <Check className="size-3.5" aria-hidden="true" />}
    </button>
  );
}