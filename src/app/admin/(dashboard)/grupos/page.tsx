import { GroupsManager } from '@/features/admin/components/GroupsManager';
import { listGroups } from '@/server/services/groups';
import { listTeams } from '@/server/services/teams';

export const metadata = { title: 'Grupos' };

export default async function AdminGroupsPage() {
  const [groups, teams] = await Promise.all([listGroups(), listTeams()]);

  const teamCounts = teams.reduce<Record<string, number>>((acc, team) => {
    if (team.groupId) acc[team.groupId] = (acc[team.groupId] ?? 0) + 1;
    return acc;
  }, {});

  return <GroupsManager groups={groups} teamCounts={teamCounts} />;
}
