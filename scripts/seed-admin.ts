/**
 * Cria (ou atualiza) o admin a partir do .env.local.
 * Uso: npm run seed:admin
 */
import { config } from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// `dotenv/config` só leria `.env` — as credenciais reais estão no `.env.local`.
config({ path: '.env.local' });

async function main() {
  const uri = process.env.MONGODB_URI;
  const email = process.env.ADMIN_EMAIL;
  const name = process.env.ADMIN_NAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!uri || !email || !name || !password) {
    throw new Error(
      'Defina MONGODB_URI, ADMIN_EMAIL, ADMIN_NAME e ADMIN_PASSWORD em .env.local',
    );
  }

  await mongoose.connect(uri);

  const { AdminUser } = await import('../src/server/models/admin-user');
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await AdminUser.findOneAndUpdate(
    { email: email.toLowerCase() },
    { name, email: email.toLowerCase(), passwordHash },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );

  console.log(`✓ Admin pronto: ${result.email}`);
  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('✗ Falha no seed do admin:', error);
  process.exit(1);
});
