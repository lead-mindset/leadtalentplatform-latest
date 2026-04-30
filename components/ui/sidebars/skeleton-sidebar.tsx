export function SkeletonSidebar() {
  return (
    <div className="w-64 border-r border-border/60 bg-muted/40 animate-pulse">
      <div className="p-4 space-y-4">
        <div className="h-8 bg-muted-foreground/20 rounded" />
        <div className="h-6 bg-muted-foreground/20 rounded w-3/4" />
        <div className="space-y-2 pt-4">
          <div className="h-10 bg-muted-foreground/20 rounded" />
          <div className="h-10 bg-muted-foreground/20 rounded" />
          <div className="h-10 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    </div>
  )
}
