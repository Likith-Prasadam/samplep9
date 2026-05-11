import { Checkbox } from '@/components/ui/checkbox';

interface FilterCheckboxProps {
  label: string;
  count?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function FilterCheckbox({
  label,
  count,
  checked,
  onCheckedChange,
}: FilterCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-transparent px-2.5 py-1.5 transition-colors hover:border-border/70 hover:bg-muted/40">
      <span className="flex items-center gap-2">
        <Checkbox
          checked={checked}
          onCheckedChange={(nextChecked) => onCheckedChange?.(!!nextChecked)}
        />
        <span className="text-sm text-foreground">{label}</span>
      </span>
      {count && <span className="text-xs text-muted-foreground">{count}</span>}
    </label>
  );
}
