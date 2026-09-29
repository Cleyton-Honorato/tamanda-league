import { describe, expect, it } from 'vitest';
import { computeStandings, type StandingsMatchInput } from './standings';

const match = (
  teamAId: string,
  scoreA: number,
  teamBId: string,
  scoreB: number,
): StandingsMatchInput => ({ teamAId, scoreA, teamBId, scoreB });

describe('computeStandings', () => {
  it('soma 2 pontos por vitória e 1 por derrota', () => {
    const rows = computeStandings(['a', 'b'], [match('a', 21, 'b', 15)]);

    expect(rows[0]).toMatchObject({
      teamId: 'a',
      position: 1,
      played: 1,
      wins: 1,
      losses: 0,
      points: 2,
      scoreFor: 21,
      scoreAgainst: 15,
      scoreDiff: 6,
    });
    expect(rows[1]).toMatchObject({
      teamId: 'b',
      position: 2,
      wins: 0,
      losses: 1,
      points: 1,
      scoreDiff: -6,
    });
  });

  it('lista times sem jogos zerados no fim da tabela', () => {
    const rows = computeStandings(['a', 'b', 'c'], [match('a', 21, 'b', 10)]);

    expect(rows.map((row) => row.teamId)).toEqual(['a', 'b', 'c']);
    expect(rows[2]).toMatchObject({ teamId: 'c', played: 0, points: 0 });
  });

  it('desempata dois times pelo confronto direto, mesmo com saldo pior', () => {
    // "a" e "b" fecham com 1 vitória e 1 derrota (3 pontos cada). "b" tem saldo
    // bem melhor, mas perdeu o confronto direto — quem manda é o confronto.
    const rows = computeStandings(
      ['a', 'b', 'c', 'd'],
      [
        match('a', 21, 'b', 20),
        match('c', 21, 'a', 10),
        match('b', 21, 'd', 5),
      ],
    );

    expect(rows.map((row) => row.teamId)).toEqual(['a', 'b', 'c', 'd']);
    expect(rows[0].points).toBe(rows[1].points);
    expect(rows[1].scoreDiff).toBeGreaterThan(rows[0].scoreDiff);
  });

  it('desempata três ou mais times pelo saldo, ignorando confronto direto', () => {
    // Triângulo: cada um vence uma e perde uma, todos com 3 pontos.
    const rows = computeStandings(
      ['a', 'b', 'c'],
      [match('a', 21, 'b', 20), match('b', 21, 'c', 10), match('c', 21, 'a', 19)],
    );

    expect(rows.every((row) => row.points === 3)).toBe(true);
    expect(rows.map((row) => row.teamId)).toEqual(['b', 'a', 'c']);
    expect(rows.map((row) => row.scoreDiff)).toEqual([10, -1, -9]);
  });

  it('usa pontos marcados quando o saldo também empata', () => {
    const rows = computeStandings(
      ['a', 'b', 'c', 'd'],
      [match('a', 21, 'b', 11), match('c', 15, 'd', 5)],
    );

    // "a" e "c" venceram com saldo +10; "a" marcou mais.
    expect(rows.slice(0, 2).map((row) => row.teamId)).toEqual(['a', 'c']);
  });

  it('ignora jogos de times fora do grupo', () => {
    const rows = computeStandings(
      ['a', 'b'],
      [match('a', 21, 'b', 15), match('a', 21, 'estranho', 1)],
    );

    expect(rows[0].played).toBe(1);
    expect(rows).toHaveLength(2);
  });

  it('mantém ordem estável quando tudo empata', () => {
    const rows = computeStandings(['z', 'm', 'a'], []);
    expect(rows.map((row) => row.teamId)).toEqual(['a', 'm', 'z']);
  });
});
