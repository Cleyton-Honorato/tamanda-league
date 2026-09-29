/**
 * DTOs — o formato em que os dados atravessam a fronteira servidor → client.
 * Nada de ObjectId ou Date aqui: ids são strings e datas são ISO, senão o React
 * recusa a serialização dos props.
 */

export const STAGES = ['GROUP', 'R16', 'QF', 'SF', 'F'] as const;
export type Stage = (typeof STAGES)[number];

export const KNOCKOUT_STAGES = ['R16', 'QF', 'SF', 'F'] as const;
export type KnockoutStage = (typeof KNOCKOUT_STAGES)[number];

export const MATCH_STATUSES = ['SCHEDULED', 'FINISHED'] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const MEDIA_TYPES = ['image', 'video'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Quantos confrontos existem em cada rodada do mata-mata. */
export const STAGE_SLOTS: Record<KnockoutStage, number> = {
  R16: 8,
  QF: 4,
  SF: 2,
  F: 1,
};

export const STAGE_LABELS: Record<Stage, string> = {
  GROUP: 'Fase de grupos',
  R16: 'Oitavas',
  QF: 'Quartas',
  SF: 'Semifinal',
  F: 'Final',
};

export interface GroupDto {
  id: string;
  name: string;
  order: number;
}

/** Versão enxuta do time, embutida no jogo para evitar buscas extras na UI. */
export interface TeamRefDto {
  id: string;
  name: string;
  shortName: string;
  crestUrl: string | null;
}

export interface TeamDto extends TeamRefDto {
  groupId: string | null;
  crestPublicId: string | null;
}

export interface MatchDto {
  id: string;
  stage: Stage;
  groupId: string | null;
  slot: number | null;
  teamA: TeamRefDto | null;
  teamB: TeamRefDto | null;
  /** ISO 8601, ou null quando o jogo ainda não tem data. */
  scheduledAt: string | null;
  status: MatchStatus;
  scoreA: number | null;
  scoreB: number | null;
}

export interface StandingRow {
  teamId: string;
  position: number;
  played: number;
  wins: number;
  losses: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDiff: number;
}

export interface MediaDto {
  id: string;
  publicId: string;
  url: string;
  type: MediaType;
  caption: string | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

export function isKnockoutStage(stage: Stage): stage is KnockoutStage {
  return stage !== 'GROUP';
}
