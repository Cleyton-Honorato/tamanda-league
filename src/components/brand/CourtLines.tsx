import { cn } from '@/lib/cn';

/**
 * Meia quadra de basquete vista de cima, em traço fino — a marca d'água que
 * ancora o site no esporte sem competir com o conteúdo. Herda a cor via
 * `currentColor`; controle a intensidade pela classe de texto/opacidade.
 */
export function CourtLines({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 460"
      fill="none"
      className={cn('pointer-events-none select-none', className)}
    >
      <g stroke="currentColor" strokeWidth="2">
        {/* linha de fundo e laterais */}
        <path d="M20 440 H580" />
        <path d="M20 440 V200" />
        <path d="M580 440 V200" />
        {/* arco de três pontos */}
        <path d="M55 440 V330 A 245 245 0 0 1 545 330 V440" />
        {/* garrafão e lance livre */}
        <path d="M225 440 V290 H375 V440" />
        <path d="M225 290 A 75 75 0 0 1 375 290" />
        <path d="M240 290 A 60 60 0 0 0 360 290" strokeDasharray="10 10" />
        {/* tabela e aro */}
        <path d="M255 418 H345" strokeWidth="4" />
        <circle cx="300" cy="404" r="11" />
        {/* círculo central tocando o topo */}
        <path d="M195 40 A 105 105 0 0 0 405 40" />
      </g>
    </svg>
  );
}
