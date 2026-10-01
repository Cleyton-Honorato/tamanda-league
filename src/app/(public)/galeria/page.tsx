import { Gallery } from '@/features/public/components/Gallery';
import { GalleryTeaser } from '@/features/public/components/GalleryTeaser';
import { listMedia } from '@/server/services/media';

export const revalidate = 60;
export const metadata = { title: 'Galeria' };

export default async function GaleriaPage() {
  const items = await listMedia();

  if (items.length === 0) return <GalleryTeaser page />;

  return (
    <section className="flex min-h-[70svh] w-full flex-col justify-center gap-5 bg-surface py-12">
      <div className="px-5 sm:px-8">
        <h1 className="font-display text-3xl uppercase tracking-wide">Galeria</h1>
        <p className="text-sm text-muted-foreground">
          Fotos e vídeos dos jogos.
        </p>
      </div>

      <Gallery items={items} />
    </section>
  );
}
