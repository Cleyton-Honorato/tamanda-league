export const COOKIES = {
  SESSION: 'tamanda_admin_session',
} as const;

export const ROUTES = {
  home: '/',
  campeonato: '/campeonato',
  jogos: '/campeonato',
  classificacao: '/campeonato',
  chaveamento: '/campeonato?fase=mata-mata',
  galeria: '/galeria',
  admin: '/admin',
  adminLogin: '/admin/login',
} as const;

/** Páginas públicas que mudam quando o admin mexe em jogos/times. */
export const PUBLIC_MATCH_PATHS = ['/', '/campeonato'] as const;

export const CLOUDINARY_FOLDER = 'tamanda-league';

/** Limite prático do plano gratuito do Cloudinary para vídeo. */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
