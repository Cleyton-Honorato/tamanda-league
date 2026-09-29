import Image from 'next/image';
import { cn } from '@/lib/cn';

/**
 * Símbolo da marca: recorte central da arte oficial do logo.
 * O `scale` descarta as bordas do arquivo e enquadra a bola + lettering.
 */
export function LogoMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'relative inline-block shrink-0 overflow-hidden rounded-[28%] border border-border/60',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/logo.jpg"
        alt="Tamanda League 3X3"
        fill
        sizes={`${size * 2}px`}
        className="scale-[1.32] object-cover"
      />
    </span>
  );
}

/** Marca dos cabeçalhos: símbolo + nome em uma linha. */
export function LogoInline({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={36} />
      <span
        className="font-display text-xl uppercase tracking-wide leading-none"
        aria-hidden
      >
        <span className="text-primary">Tamanda</span>{' '}
        <span className="text-accent">League</span>{' '}
        <span className="text-foreground">3X3</span>
      </span>
    </span>
  );
}
