import { describe, expect, it } from 'vitest';
import type { MatchDto } from '@/lib/types';
import { pickFeaturedMatch } from './featured-match';

const NOW = new Date('2026-10-04T14:00:00');

function makeMatch(overrides: Partial<MatchDto> & { id: string }): MatchDto {
  return {
    stage: 'GROUP',
    groupId: null,
    slot: null,
    teamA: null,
    teamB: null,
    scheduledAt: null,
    status: 'SCHEDULED',
    scoreA: null,
    scoreB: null,
    ...overrides,
  };
}

describe('pickFeaturedMatch', () => {
  it('prefere o primeiro jogo ainda por jogar hoje', () => {
    const matches = [
      makeMatch({ id: 'amanha', scheduledAt: '2026-10-05T10:00:00' }),
      makeMatch({ id: 'hoje-tarde', scheduledAt: '2026-10-04T19:00:00' }),
      makeMatch({ id: 'hoje-cedo', scheduledAt: '2026-10-04T16:00:00' }),
    ];

    expect(pickFeaturedMatch(matches, NOW)?.id).toBe('hoje-cedo');
  });

  it('considera jogo de hoje que já começou, desde que não tenha sido encerrado', () => {
    const matches = [
      makeMatch({ id: 'manha', scheduledAt: '2026-10-04T09:00:00' }),
      makeMatch({ id: 'noite', scheduledAt: '2026-10-04T20:00:00' }),
    ];

    expect(pickFeaturedMatch(matches, NOW)?.id).toBe('manha');
  });

  it('cai para o próximo jogo futuro quando hoje não tem nada em aberto', () => {
    const matches = [
      makeMatch({
        id: 'hoje-encerrado',
        scheduledAt: '2026-10-04T10:00:00',
        status: 'FINISHED',
        scoreA: 21,
        scoreB: 14,
      }),
      makeMatch({ id: 'sabado', scheduledAt: '2026-10-10T15:00:00' }),
      makeMatch({ id: 'domingo', scheduledAt: '2026-10-11T15:00:00' }),
    ];

    expect(pickFeaturedMatch(matches, NOW)?.id).toBe('sabado');
  });

  it('mostra o último resultado quando não há mais jogos marcados', () => {
    const matches = [
      makeMatch({
        id: 'antigo',
        scheduledAt: '2026-09-20T15:00:00',
        status: 'FINISHED',
      }),
      makeMatch({
        id: 'recente',
        scheduledAt: '2026-10-01T15:00:00',
        status: 'FINISHED',
      }),
    ];

    expect(pickFeaturedMatch(matches, NOW)?.id).toBe('recente');
  });

  it('ignora jogos sem data', () => {
    const matches = [
      makeMatch({ id: 'sem-data' }),
      makeMatch({ id: 'com-data', scheduledAt: '2026-10-04T18:00:00' }),
    ];

    expect(pickFeaturedMatch(matches, NOW)?.id).toBe('com-data');
  });

  it('devolve null quando não há nada para destacar', () => {
    expect(pickFeaturedMatch([], NOW)).toBeNull();
    expect(pickFeaturedMatch([makeMatch({ id: 'x' })], NOW)).toBeNull();
  });
});
