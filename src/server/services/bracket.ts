import {
  KNOCKOUT_STAGES,
  STAGE_SLOTS,
  type KnockoutStage,
} from '@/lib/types';

export interface BracketPosition {
  stage: KnockoutStage;
  slot: number;
  /** Lado do confronto seguinte que o vencedor ocupa. */
  side: 'A' | 'B';
}

/**
 * Para onde vai o vencedor de um confronto. Dois jogos consecutivos alimentam o
 * mesmo jogo da rodada seguinte: o de slot ímpar entra como time A, o par como
 * time B. A final não tem destino.
 */
export function nextPosition(
  stage: KnockoutStage,
  slot: number,
): BracketPosition | null {
  const stageIndex = KNOCKOUT_STAGES.indexOf(stage);
  const nextStage = KNOCKOUT_STAGES[stageIndex + 1];
  if (!nextStage) return null;

  if (!Number.isInteger(slot) || slot < 1 || slot > STAGE_SLOTS[stage]) {
    return null;
  }

  return {
    stage: nextStage,
    slot: Math.ceil(slot / 2),
    side: slot % 2 === 1 ? 'A' : 'B',
  };
}

/** Rodadas de um chaveamento que começa em `entryStage`. */
export function stagesFrom(entryStage: KnockoutStage): KnockoutStage[] {
  return KNOCKOUT_STAGES.slice(KNOCKOUT_STAGES.indexOf(entryStage));
}

export interface FinishedKnockoutMatch {
  teamAId: string;
  teamBId: string;
  scoreA: number;
  scoreB: number;
}

/** Vencedor de um jogo encerrado. No 3x3 não existe empate. */
export function winnerOf(match: FinishedKnockoutMatch): string {
  return match.scoreA > match.scoreB ? match.teamAId : match.teamBId;
}
