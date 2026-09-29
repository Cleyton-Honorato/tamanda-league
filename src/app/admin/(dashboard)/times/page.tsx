import { TeamsManager } from '@/features/admin/components/TeamsManager';
import { listGroups } from '@/server/services/groups';
import { listTeams } from '@/server/services/teams';

export const metadata = { title: 'Times' };

export default async function AdminTeamsPage() {
  const [teams, groups] = await Promise.all([listTeams(), listGroups()]);
  return <TeamsManager teams={teams} groups={groups} />;
}
