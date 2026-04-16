export function SystemStatus() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
      </span>
      <span>All Systems Operational</span>
      <span className="text-border">|</span>
      <span>Global Nodes: Active</span>
    </div>
  );
}
