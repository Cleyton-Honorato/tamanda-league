import { BracketManager } from '@/features/admin/components/BracketManager';
import {
  getBracketEntryStage,
  listKnockoutMatches,
} from '@/server/services/matches';
import { listTeams } from '@/server/services/teams';

export const metadata = { title: 'Chaveamento' };

export default async function AdminBracketPage() {
  const [matches, teams, entryStage] = await Promise.all([
    listKnockoutMatches(),
    listTeams(),
    getBracketEntryStage(),
  ]);

  return (
    <BracketManager matches={matches} teams={teams} entryStage={entryStage} />
  );
}
