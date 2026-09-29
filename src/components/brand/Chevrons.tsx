import { cn } from '@/lib/cn';

/**
 * As setas duplas que emolduram os títulos nas artes do campeonato.
 * Cada seta é um pouco mais opaca que a anterior, criando o avanço.
 */
export function Chevrons({
  direction = 'right',
  tone = 'mixed',
  className,
}: {
  direction?: 'right' | 'left';
  tone?: 'mixed' | 'green' | 'orange';
  className?: string;
}) {
  const colors =
    tone === 'green'
      ? ['text-primary/40', 'text-primary/70', 'text-primary']
      : tone === 'orange'
        ? ['text-accent/40', 'text-accent/70', 'text-accent']
        : ['text-primary-muted', 'text-primary', 'text-accent'];

  const ordered = direction === 'right' ? colors : [...colors].reverse();

  return (
    <span
      aria-hidden
      className={cn('inline-flex items-center gap-0.5 leading-none', className)}
    >
      {ordered.map((color, index) => (
        <svg
          key={index}
          viewBox="0 0 8 14"
          className={cn('h-3 w-2 fill-current', color)}
          style={direction === 'left' ? { transform: 'scaleX(-1)' } : undefined}
        >
          <path d="M0 0 L7 7 L0 14 L2.5 14 L8 7 L2.5 0 Z" />
        </svg>
      ))}
    </span>
  );
}
