import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/server/auth/session';
import { getMatch } from '@/server/services/matches';
import { readLiveGame } from '@/server/services/live-game';
import { Match } from '@/server/models/match';
import { dbConnect } from '@/server/db';
import { GameDesk } from '@/features/admin/components/GameDesk';

export const metadata = { title: 'Mesa de jogo' };
export default async function GameDeskPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();
  await dbConnect();
  if (!await Match.exists({ _id: id })) notFound();
  const match = await getMatch(id);
  if (!match.teamA || !match.teamB) return <div className="space-y-4"><h1 className="font-display text-3xl">Defina os dois times para abrir a mesa.</h1><Link href="/admin/jogos" className="text-primary underline">Voltar aos jogos</Link></div>;
  return <GameDesk match={match} initial={await readLiveGame(id)} />;
}
