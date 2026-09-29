import Image from 'next/image';
import { cn } from '@/lib/cn';
import { thumbUrl } from '@/lib/cloudinary-url';
import type { TeamRefDto } from '@/lib/types';

const SIZES = {
  sm: 32,
  md: 48,
  lg: 72,
} as const;

/**
 * Escudo do time. Sem imagem cadastrada, mostra a sigla num brasão com a cor
 * da vez — a maioria dos times de bairro não tem logo.
 */
export function TeamCrest({
  team,
  size = 'md',
  accent = 'green',
  className,
}: {
  team: TeamRefDto | null;
  size?: keyof typeof SIZES;
  accent?: 'green' | 'orange';
  className?: string;
}) {
  const px = SIZES[size];
  const ring = accent === 'green' ? 'border-primary/60' : 'border-accent/60';
  const glow =
    accent === 'green'
      ? 'shadow-[0_0_16px_rgba(22,201,86,0.2)]'
      : 'shadow-[0_0_16px_rgba(255,116,23,0.2)]';

  if (team?.crestUrl) {
    return (
      <span
        className={cn(
          'relative inline-block shrink-0 overflow-hidden rounded-full border-2 bg-elevated',
          ring,
          glow,
          className,
        )}
        style={{ width: px, height: px }}
      >
        <Image
          src={thumbUrl(team.crestUrl, px * 2)}
          alt=""
          fill
          sizes={`${px}px`}
          className="object-cover"
        />
      </span>
    );
  }

  const monogram = team ? team.shortName.slice(0, 3) : '?';

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border-2 bg-elevated',
        'font-display uppercase leading-none text-foreground',
        ring,
        glow,
        className,
      )}
      style={{ width: px, height: px, fontSize: px * 0.4 }}
    >
      {monogram}
    </span>
  );
}
