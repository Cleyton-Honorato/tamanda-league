import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/constants';

export default async function CampeonatoPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  redirect(params.fase === 'mata-mata' ? ROUTES.chaveamento : ROUTES.campeonato);
}
