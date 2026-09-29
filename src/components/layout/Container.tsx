import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Faixa de conteúdo centralizada. O `main` público não limita a largura, para
 * que seções como o hero ocupem a tela inteira — quem precisa de margem usa
 * este container.
 *
 * `wide` é o alinhamento do cabeçalho e do hero: quase toda a largura da tela,
 * para o texto não nascer no meio dela em monitores grandes. O padrão é a
 * faixa mais estreita, melhor para ler listas e tabelas.
 */
export function Container({
  wide,
  className,
  children,
}: {
  wide?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        wide
          ? 'max-w-[1700px] px-5 sm:px-10 lg:px-16'
          : 'max-w-6xl px-5 sm:px-8',
        className,
      )}
    >
      {children}
    </div>
  );
}
