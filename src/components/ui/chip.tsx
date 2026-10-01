import { cn } from "cn";

const tones = {
  brand: "bg-brand-purple/15 font-medium text-brand-purple-light",
  muted: "bg-muted font-medium text-muted-foreground",
  outline: "border border-border/60 font-medium text-muted-foreground",
};

export function Chip({
  tone = "muted",
  className,
  children,
}: {
  tone?: keyof typeof tones;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs", tones[tone], className)}>
      {children}
    </span>
  );
}