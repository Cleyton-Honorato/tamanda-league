import 'server-only';
import mongoose from 'mongoose';

/**
 * Conexão única por processo. O cache vive em `globalThis` porque o HMR do dev
 * reavalia este módulo a cada edição — sem ele, cada salvamento abriria uma
 * conexão nova até estourar o pool do Mongo.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

const cache: MongooseCache = (globalForMongoose.__mongooseCache ??= {
  conn: null,
  promise: null,
});

export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI não configurada — defina em .env.local');
  }

  cache.promise ??= mongoose.connect(uri, { bufferCommands: false });

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    // Sem isso, uma falha de conexão ficaria memoizada e toda tentativa
    // seguinte rejeitaria com o mesmo erro, mesmo com o banco já no ar.
    cache.promise = null;
    throw error;
  }

  return cache.conn;
}
