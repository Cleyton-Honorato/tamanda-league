import { AdminUsersManager } from '@/features/admin/components/AdminUsersManager';
import { requireAdmin } from '@/server/auth/session';
import { listAdminUsers } from '@/server/services/admin-users';

export const metadata = { title: 'Administradores' };

export default async function AdminUsersPage() {
  const [admins, currentAdmin] = await Promise.all([listAdminUsers(), requireAdmin()]);
  return <AdminUsersManager admins={admins} currentAdminId={currentAdmin.userId} />;
}
