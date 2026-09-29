import 'server-only';
import type { Types } from 'mongoose';
import type {
  GroupDto,
  MatchDto,
  MediaDto,
  Stage,
  MatchStatus,
  MediaType,
  TeamDto,
  TeamRefDto,
} from '@/lib/types';

type ObjectIdLike = Types.ObjectId | string;

export function toId(value: ObjectIdLike): string {
  return typeof value === 'string' ? value : value.toString();
}

export function toOptionalId(value: ObjectIdLike | null | undefined): string | null {
  return value ? toId(value) : null;
}

export function toIso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Documentos vindos de `.lean()` — o Mongoose devolve ObjectId e Date crus, que
 * não podem cruzar a fronteira para os Client Components.
 */
interface LeanGroup {
  _id: ObjectIdLike;
  name: string;
  order: number;
}

interface LeanTeam {
  _id: ObjectIdLike;
  name: string;
  shortName: string;
  groupId?: ObjectIdLike | null;
  crestUrl?: string | null;
  crestPublicId?: string | null;
}

interface LeanMatch {
  _id: ObjectIdLike;
  stage: Stage;
  groupId?: ObjectIdLike | null;
  slot?: number | null;
  teamAId?: ObjectIdLike | null;
  teamBId?: ObjectIdLike | null;
  scheduledAt?: Date | null;
  status: MatchStatus;
  scoreA?: number | null;
  scoreB?: number | null;
}

interface LeanMedia {
  _id: ObjectIdLike;
  publicId: string;
  url: string;
  type: MediaType;
  caption?: string | null;
  width?: number | null;
  height?: number | null;
  createdAt: Date;
}

export function toGroupDto(group: LeanGroup): GroupDto {
  return { id: toId(group._id), name: group.name, order: group.order };
}

export function toTeamRefDto(team: LeanTeam): TeamRefDto {
  return {
    id: toId(team._id),
    name: team.name,
    shortName: team.shortName,
    crestUrl: team.crestUrl ?? null,
  };
}

export function toTeamDto(team: LeanTeam): TeamDto {
  return {
    ...toTeamRefDto(team),
    groupId: toOptionalId(team.groupId),
    crestPublicId: team.crestPublicId ?? null,
  };
}

/**
 * Os times entram por um índice montado uma vez pelo chamador — resolver time a
 * time geraria uma consulta por jogo.
 */
export function toMatchDto(
  match: LeanMatch,
  teamsById: Map<string, TeamRefDto>,
): MatchDto {
  const resolve = (id: ObjectIdLike | null | undefined): TeamRefDto | null => {
    const key = toOptionalId(id);
    return key ? (teamsById.get(key) ?? null) : null;
  };

  return {
    id: toId(match._id),
    stage: match.stage,
    groupId: toOptionalId(match.groupId),
    slot: match.slot ?? null,
    teamA: resolve(match.teamAId),
    teamB: resolve(match.teamBId),
    scheduledAt: toIso(match.scheduledAt),
    status: match.status,
    scoreA: match.scoreA ?? null,
    scoreB: match.scoreB ?? null,
  };
}

export function toMediaDto(media: LeanMedia): MediaDto {
  return {
    id: toId(media._id),
    publicId: media.publicId,
    url: media.url,
    type: media.type,
    caption: media.caption ?? null,
    width: media.width ?? null,
    height: media.height ?? null,
    createdAt: media.createdAt.toISOString(),
  };
}
