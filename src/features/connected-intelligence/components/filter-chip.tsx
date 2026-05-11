interface FilterChipProps {
  label: string;
  onRemove?: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-accent"
    >
      {label}
      <span className="ml-1 text-muted-foreground">×</span>
    </button>
  );
}
