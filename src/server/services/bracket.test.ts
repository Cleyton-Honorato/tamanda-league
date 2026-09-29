import { describe, expect, it } from 'vitest';
import { nextPosition, stagesFrom, winnerOf } from './bracket';

describe('nextPosition', () => {
  it('manda slots ímpares para o lado A e pares para o lado B', () => {
    expect(nextPosition('R16', 1)).toEqual({ stage: 'QF', slot: 1, side: 'A' });
    expect(nextPosition('R16', 2)).toEqual({ stage: 'QF', slot: 1, side: 'B' });
    expect(nextPosition('R16', 5)).toEqual({ stage: 'QF', slot: 3, side: 'A' });
    expect(nextPosition('R16', 8)).toEqual({ stage: 'QF', slot: 4, side: 'B' });
  });

  it('atravessa todas as rodadas até a final', () => {
    expect(nextPosition('QF', 3)).toEqual({ stage: 'SF', slot: 2, side: 'A' });
    expect(nextPosition('SF', 2)).toEqual({ stage: 'F', slot: 1, side: 'B' });
  });

  it('não tem destino depois da final', () => {
    expect(nextPosition('F', 1)).toBeNull();
  });

  it('rejeita slot fora da rodada', () => {
    expect(nextPosition('QF', 5)).toBeNull();
    expect(nextPosition('R16', 0)).toBeNull();
    expect(nextPosition('SF', 1.5)).toBeNull();
  });

  it('faz cada par de slots convergir para o mesmo jogo seguinte', () => {
    for (let slot = 1; slot <= 8; slot += 2) {
      const odd = nextPosition('R16', slot);
      const even = nextPosition('R16', slot + 1);
      expect(odd?.slot).toBe(even?.slot);
      expect(odd?.side).toBe('A');
      expect(even?.side).toBe('B');
    }
  });
});

describe('stagesFrom', () => {
  it('lista as rodadas a partir da entrada', () => {
    expect(stagesFrom('R16')).toEqual(['R16', 'QF', 'SF', 'F']);
    expect(stagesFrom('QF')).toEqual(['QF', 'SF', 'F']);
    expect(stagesFrom('F')).toEqual(['F']);
  });
});

describe('winnerOf', () => {
  it('devolve o time de maior placar', () => {
    const base = { teamAId: 'a', teamBId: 'b' };
    expect(winnerOf({ ...base, scoreA: 21, scoreB: 18 })).toBe('a');
    expect(winnerOf({ ...base, scoreA: 12, scoreB: 21 })).toBe('b');
  });
});
