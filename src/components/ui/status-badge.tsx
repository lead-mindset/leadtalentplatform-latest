import { cn } from "cn";

const tones = {
  info: "bg-brand-purple/15 font-medium text-brand-purple-light",
  success: "bg-success/15 font-medium text-success",
  destructive: "bg-destructive/15 font-medium text-destructive-light",
  muted: "bg-muted font-medium text-muted-foreground",
};

export function StatusBadge({
  tone = "info",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs", tones[tone], className)}>
      {children}
    </span>
  );
}