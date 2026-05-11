import type { ReactNode } from 'react';

interface FilterSectionProps {
  title: string;
  children: ReactNode;
}

export function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <div className="space-y-2.5">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}
