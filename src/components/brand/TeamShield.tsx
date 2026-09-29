import Image from 'next/image';
import { cn } from '@/lib/cn';
import { thumbUrl } from '@/lib/cloudinary-url';
import type { TeamRefDto } from '@/lib/types';

const SHIELDS = {
  green: '/brand/escudo-verde.png',
  orange: '/brand/escudo-laranja.png',
} as const;

/**
 * Escudo oficial do campeonato (verde para um lado, laranja para o outro),
 * com a identificação do time no centro: o escudo próprio, quando cadastrado,
 * ou a sigla.
 */
export function TeamShield({
  team,
  side,
  className,
}: {
  team: TeamRefDto | null;
  side: 'green' | 'orange';
  className?: string;
}) {
  return (
    <div className={cn('relative aspect-[560/537] shrink-0', className)}>
      <Image
        src={SHIELDS[side]}
        alt=""
        fill
        sizes="(max-width: 640px) 40vw, 160px"
        className="object-contain drop-shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
      />

      {/* O miolo do escudo é a faixa central escura; o conteúdo fica nela. */}
      <div className="absolute inset-x-[30%] inset-y-[28%] flex items-center justify-center">
        {team?.crestUrl ? (
          <span className="relative block h-full w-full">
            <Image
              src={thumbUrl(team.crestUrl, 240)}
              alt={team.name}
              fill
              sizes="80px"
              className="object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
            />
          </span>
        ) : (
          <span className="font-display text-xl uppercase leading-none text-foreground drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] sm:text-2xl lg:text-3xl">
            {team ? team.shortName.slice(0, 3) : '?'}
          </span>
        )}
      </div>
    </div>
  );
}
