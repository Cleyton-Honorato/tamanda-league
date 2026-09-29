import { Container } from '@/components/layout/Container';
import { EmptyState } from '@/components/ui/EmptyState';
import { Gallery } from '@/features/public/components/Gallery';
import { listMedia } from '@/server/services/media';

export const revalidate = 60;
export const metadata = { title: 'Galeria' };

export default async function GaleriaPage() {
  const items = await listMedia();

  return (
    <Container className="flex flex-col gap-5 py-5">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-wide">Galeria</h1>
        <p className="text-sm text-muted-foreground">
          Fotos e vídeos dos jogos.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Galeria vazia"
          description="As fotos e vídeos do campeonato aparecem aqui."
        />
      ) : (
        <Gallery items={items} />
      )}
    </Container>
  );
}
