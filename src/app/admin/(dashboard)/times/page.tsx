import { TeamsManager } from '@/features/admin/components/TeamsManager';
import { listGroups } from '@/server/services/groups';
import { listTeams } from '@/server/services/teams';
import { listAthletes } from '@/server/services/athletes';

export const metadata = { title: 'Times' };

export default async function AdminTeamsPage() {
  const [teams, groups, athletes] = await Promise.all([listTeams(), listGroups(), listAthletes()]);
  return <TeamsManager teams={teams} groups={groups} athletes={athletes} />;
}
