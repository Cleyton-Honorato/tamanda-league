import { AthletesManager } from '@/features/admin/components/AthletesManager';
import { listAthletes } from '@/server/services/athletes';

export const metadata = { title: 'Atletas' };

export default async function AdminAthletesPage() {
  return <AthletesManager athletes={await listAthletes()} />;
}
