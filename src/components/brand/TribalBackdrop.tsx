import Image from 'next/image';

/** Arte decorativa atrás dos dados do confronto, otimizada pelo Next.js. */
export function TribalBackdrop() {
  return (
    <div aria-hidden="true" className="featured-backdrop">
      <Image
        src="/brand/jogo-do-dia-background.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div className="featured-backdrop__veil" />
    </div>
  );
}
