/** Migração inicial do campeonato: troca a demo por atletas reais e duas conferências. */
import { config } from 'dotenv';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import mongoose from 'mongoose';

config({ path: '.env.local', quiet: true });

const DEMO_TEAMS = [
  'Feras do Bairro', 'Tamanduás', 'Vila Nova', 'Cestinhas FC',
  'Raptors da Quadra', 'Furacão 3x3', 'Alto da Serra', 'Meninos da Praça',
  'Trovão Azul', 'Estrela Norte', 'Galera do Poste', 'União Central',
  'Dragões do Asfalto', 'Baixada Team', 'Rocket Ball', 'Zona Sul Ballers',
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI ausente.');

  let raw = '';
  for await (const chunk of process.stdin) raw += chunk.toString();
  const athletes = JSON.parse(raw) as { name: string; nickname: string | null }[];
  if (!Array.isArray(athletes) || athletes.length !== 45 ||
    athletes.some((athlete) => typeof athlete.name !== 'string' || !athlete.name.trim())) {
    throw new Error('A fonte precisa conter os 45 atletas com nome.');
  }

  await mongoose.connect(uri);
  try {
    const db = mongoose.connection.db!;
    const [teams, groups, matches, existingAthletes] = await Promise.all([
      db.collection('teams').find().toArray(),
      db.collection('groups').find().toArray(),
      db.collection('matches').find().toArray(),
      db.collection('athletes').countDocuments(),
    ]);

    const isDemo = teams.length === DEMO_TEAMS.length && matches.length === 24 &&
      groups.length === 4 && existingAthletes === 0 &&
      teams.every((team) => DEMO_TEAMS.includes(team.name) && !team.crestPublicId) &&
      groups.every((group) => ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D'].includes(group.name));
    if (!isDemo) throw new Error('O banco não corresponde à demo esperada; nenhuma alteração foi feita.');

    const backup = join('/tmp', `tamanda-season-before-athletes-${Date.now()}.json`);
    await writeFile(backup, JSON.stringify({ teams, groups, matches }), { mode: 0o600, flag: 'wx' });

    await db.collection('matches').deleteMany({});
    await db.collection('teams').deleteMany({});
    await db.collection('groups').deleteMany({});
    await db.collection('groups').insertMany([
      { name: 'Conferência Verde', order: 0, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Conferência Laranja', order: 1, createdAt: new Date(), updatedAt: new Date() },
    ]);
    await db.collection('athletes').insertMany(athletes.map((athlete) => ({
      name: athlete.name.trim(), nickname: athlete.nickname?.trim() || null,
      teamId: null, createdAt: new Date(), updatedAt: new Date(),
    })));

    console.log(JSON.stringify({ athletes: 45, groups: 2, teams: 0, matches: 0, backup }));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
