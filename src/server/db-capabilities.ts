import 'server-only';
import { dbConnect } from '@/server/db';

/** Mongo standalone não aceita transações; replica sets e mongos aceitam. */
export async function databaseSupportsTransactions(): Promise<boolean> {
  const db = await dbConnect();
  const hello = await db.connection.db!.admin().command({ hello: 1 });
  return typeof hello.setName === 'string' || hello.msg === 'isdbgrid';
}
