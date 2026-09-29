/**
 * Popula o campeonato com dados de exemplo para desenvolvimento.
 * Apaga grupos, times, jogos e mídias — o admin é preservado.
 *
 * Uso: npm run seed:demo
 */
import { config } from 'dotenv';
import mongoose from 'mongoose';

config({ path: '.env.local' });

const GROUPS = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D'];

const TEAMS = [
  ['Feras do Bairro', 'FER'],
  ['Tamanduás', 'TAM'],
  ['Vila Nova', 'VIL'],
  ['Cestinhas FC', 'CES'],
  ['Raptors da Quadra', 'RAP'],
  ['Furacão 3x3', 'FUR'],
  ['Alto da Serra', 'ALT'],
  ['Meninos da Praça', 'PRA'],
  ['Trovão Azul', 'TRO'],
  ['Estrela Norte', 'EST'],
  ['Galera do Poste', 'GAL'],
  ['União Central', 'UNI'],
  ['Dragões do Asfalto', 'DRA'],
  ['Baixada Team', 'BAI'],
  ['Rocket Ball', 'ROC'],
  ['Zona Sul Ballers', 'ZSB'],
];

function at(daysFromNow: number, hour: number, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Defina MONGODB_URI em .env.local');

  await mongoose.connect(uri);

  const { Group } = await import('../src/server/models/group');
  const { Team } = await import('../src/server/models/team');
  const { Match } = await import('../src/server/models/match');

  await Promise.all([
    Group.deleteMany({}),
    Team.deleteMany({}),
    Match.deleteMany({}),
  ]);

  const groups = await Group.create(
    GROUPS.map((name, index) => ({ name, order: index })),
  );

  const teams = await Team.create(
    TEAMS.map(([name, shortName], index) => ({
      name,
      shortName,
      // Quatro times por grupo, na ordem da lista.
      groupId: groups[Math.floor(index / 4)]._id,
      crestPublicId: null,
      crestUrl: null,
    })),
  );

  // Todos contra todos dentro do grupo: 6 jogos por grupo, 24 no total.
  const PLAYED = 10; // já disputados
  const matches: Record<string, unknown>[] = [];

  for (const [groupIndex, group] of groups.entries()) {
    const groupTeams = teams.filter(
      (team) => team.groupId?.toString() === group._id.toString(),
    );

    for (let i = 0; i < groupTeams.length; i += 1) {
      for (let j = i + 1; j < groupTeams.length; j += 1) {
        const index = matches.length;
        const isPast = index < PLAYED;

        // Rodadas passadas em dias anteriores; a próxima hoje à noite, para a
        // home ter um "jogo do dia"; o resto nos fins de semana seguintes.
        const scheduledAt = isPast
          ? at(-7 + Math.floor(index / 3), 9 + (index % 3) * 3)
          : index === PLAYED
            ? at(0, 19)
            : at(Math.ceil((index - PLAYED) / 3), 9 + ((index - PLAYED) % 3) * 3);

        const scoreA = isPast ? 15 + ((i + j + groupIndex) % 7) : null;
        const rawScoreB = isPast ? 10 + ((i * 2 + j) % 9) : null;

        matches.push({
          stage: 'GROUP',
          groupId: group._id,
          slot: null,
          teamAId: groupTeams[i]._id,
          teamBId: groupTeams[j]._id,
          scheduledAt,
          status: isPast ? 'FINISHED' : 'SCHEDULED',
          scoreA,
          // Empate não existe no 3x3 — desempata tirando 1 do time B.
          scoreB:
            isPast && scoreA === rawScoreB ? (rawScoreB ?? 0) - 1 : rawScoreB,
        });
      }
    }
  }

  await Match.insertMany(matches);

  console.log(
    `✓ Demo criada: ${groups.length} grupos, ${teams.length} times, ${matches.length} jogos`,
  );
  console.log('  (chaveamento fica vazio — gere pelo painel em /admin/chaveamento)');

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('✗ Falha no seed demo:', error);
  process.exit(1);
});
