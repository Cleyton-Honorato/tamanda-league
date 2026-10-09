import { GroupsManager } from '@/features/admin/components/GroupsManager';
import { listGroups } from '@/server/services/groups';
import { listTeams } from '@/server/services/teams';

export const metadata = { title: 'Grupos' };

export default async function AdminGroupsPage() {
  const [groups, teams] = await Promise.all([listGroups(), listTeams()]);

  return <GroupsManager groups={groups} teams={teams} />;
}
