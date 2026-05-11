import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/** Subtle RGB fringe like the reference (cyan / warm offset). */
const chromaticText =
  '[text-shadow:0.4px_0_0_rgba(34,211,238,0.45),-0.4px_0_0_rgba(248,113,113,0.4)]';

type AcceptingClientsPillProps = {
  className?: string;
  /** If set, renders as a link (e.g. mailto: or contact page). */
  href?: string;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
  /** Main line (reference uses all lowercase). */
  label?: string;
};

/**
 * Pill CTA matching the dark “NOW · accepting new client projects →” reference.
 */
export function AcceptingClientsPill({
  className,
  href,
  target,
  rel,
  label = 'accepting new client projects',
}: AcceptingClientsPillProps) {
  const shellClass = cn(
    'inline-flex max-w-full items-center gap-3 rounded-full border border-zinc-600/90',
    'bg-[#0a0a0a] px-3 py-2 pl-2.5 pr-2.5 shadow-sm',
    'transition-colors',
    href &&
      'cursor-pointer hover:border-zinc-500 hover:bg-[#0c0c0c] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/50'
  );

  const content = (
    <>
      <span
        className="flex shrink-0 items-center justify-center rounded border border-zinc-500/95 px-2 py-1"
        aria-hidden
      >
        <span
          className={cn(
            'text-[11px] font-bold uppercase leading-none tracking-wide text-white',
            chromaticText
          )}
        >
          NOW
        </span>
      </span>

      <span
        className={cn(
          'min-w-0 text-sm font-normal lowercase leading-snug tracking-normal text-white',
          chromaticText
        )}
      >
        {label}
      </span>

      <span className="ml-0.5 flex shrink-0 items-center gap-2">
        <span className="h-4 w-px bg-zinc-500/90" aria-hidden />
        <ArrowRight className="size-4 text-white" strokeWidth={2} aria-hidden />
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        className={cn(shellClass, className)}
        aria-label={`${label} — open link`}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={cn(shellClass, className)} role="status" aria-label={label}>
      {content}
    </div>
  );
}
