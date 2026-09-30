import { AthletesManager } from '@/features/admin/components/AthletesManager';
import { listAthletes } from '@/server/services/athletes';
import { listTeams } from '@/server/services/teams';

export const metadata = { title: 'Atletas' };

export default async function AdminAthletesPage() {
  const [athletes, teams] = await Promise.all([listAthletes(), listTeams()]);
  return <AthletesManager athletes={athletes} teams={teams} />;
}
