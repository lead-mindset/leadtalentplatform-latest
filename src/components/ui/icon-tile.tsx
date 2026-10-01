import { cn } from "cn";

export function IconTile({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-brand-purple-light", className)}>
      {children}
    </span>
  );
}