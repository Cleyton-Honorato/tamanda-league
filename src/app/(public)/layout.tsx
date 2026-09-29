import { BottomNav } from '@/components/layout/BottomNav';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { Container } from '@/components/layout/Container';

export default function PublicLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader />

      {/* Sem limite de largura aqui: cada página decide o que ocupa a tela
          inteira e o que fica dentro do container. */}
      <main className="pb-nav flex-1 lg:pb-10">{children}</main>

      <footer className="pb-nav border-t border-border py-6 lg:pb-6">
        <Container className="text-center">
          <p className="font-display text-sm uppercase tracking-[0.25em] text-muted-foreground">
            <span className="text-primary">Basquete</span> · Respeito ·{' '}
            <span className="text-accent">Comunidade</span>
          </p>
        </Container>
      </footer>

      <BottomNav variant="bar" />
    </div>
  );
}
