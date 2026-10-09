import 'server-only';
import { dbConnect } from '@/server/db';
import { hashPassword } from '@/server/auth/password';
import { DomainError } from '@/server/errors';
import { AdminUser } from '@/server/models/admin-user';

export interface AdminUserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export async function listAdminUsers(): Promise<AdminUserDto[]> {
  await dbConnect();
  const admins = await AdminUser.find().sort({ name: 1, email: 1 }).lean();

  return admins.map((admin) => ({
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
    createdAt: admin.createdAt.toISOString(),
  }));
}

export async function createAdminUser(input: { name: string; email: string; password: string }): Promise<string> {
  await dbConnect();
  const email = input.email.toLowerCase();

  if (await AdminUser.exists({ email })) {
    throw new DomainError('Já existe um administrador com esse e-mail.', 'email');
  }

  const passwordHash = await hashPassword(input.password);

  try {
    const admin = await AdminUser.create({
      name: input.name,
      email,
      passwordHash,
    });
    return admin._id.toString();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      throw new DomainError('Já existe um administrador com esse e-mail.', 'email');
    }
    throw error;
  }
}
