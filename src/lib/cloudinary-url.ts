/**
 * Monta URLs de entrega do Cloudinary injetando transformações na `secure_url`
 * salva no banco. Serve imagens no tamanho que a tela precisa, o que importa
 * num site consumido quase todo em 4G.
 */
const UPLOAD_SEGMENT = '/upload/';

function withTransform(url: string, transform: string): string {
  const index = url.indexOf(UPLOAD_SEGMENT);
  if (index === -1) return url;

  const head = url.slice(0, index + UPLOAD_SEGMENT.length);
  const tail = url.slice(index + UPLOAD_SEGMENT.length);
  return `${head}${transform}/${tail}`;
}

export function imageUrl(url: string, width: number): string {
  return withTransform(url, `f_auto,q_auto,w_${width},c_limit`);
}

/** Miniatura quadrada — usada no grid da galeria e nos escudos. */
export function thumbUrl(url: string, size: number): string {
  return withTransform(url, `f_auto,q_auto,w_${size},h_${size},c_fill,g_auto`);
}

/**
 * O Cloudinary gera o frame de um vídeo trocando a extensão do arquivo por
 * `.jpg`; `so_0` pega o primeiro quadro.
 */
export function videoThumbUrl(url: string, width: number): string {
  const jpg = url.replace(/\.[a-z0-9]+$/i, '.jpg');
  return withTransform(jpg, `f_auto,q_auto,w_${width},so_0`);
}
