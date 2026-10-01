import { BottomNav } from '@/components/layout/BottomNav';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { PublicFooter } from '@/components/layout/PublicFooter';

export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      {/* Sem limite de largura aqui: cada página decide o que ocupa a tela
          inteira e o que fica dentro do container. */}
      <main className="flex-1">{children}</main>

      <PublicFooter />

      <BottomNav variant="bar" />
    </div>
  );
}
