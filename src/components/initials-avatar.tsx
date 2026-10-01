import { cn } from "cn";

const colorClasses: Record<string, string> = {
  "brand-red": "bg-brand-red text-primary-foreground",
  "brand-rose": "bg-brand-rose text-primary-foreground",
  "brand-purple": "bg-brand-purple text-primary-foreground",
  "brand-orange": "bg-brand-orange text-primary-foreground",
};

export function InitialsAvatar({
  initials,
  color,
  className,
}: {
  initials: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold",
        colorClasses[color] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {initials}
    </span>
  );
}
