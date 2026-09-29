import { MatchesManager } from '@/features/admin/components/MatchesManager';
import { listGroupMatches } from '@/server/services/matches';
import { listGroups } from '@/server/services/groups';
import { listTeams } from '@/server/services/teams';

export const metadata = { title: 'Jogos' };

export default async function AdminMatchesPage() {
  const [matches, groups, teams] = await Promise.all([
    listGroupMatches(),
    listGroups(),
    listTeams(),
  ]);

  return <MatchesManager matches={matches} groups={groups} teams={teams} />;
}
