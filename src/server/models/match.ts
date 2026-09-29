import { Schema, model, models, type Model, type Types } from 'mongoose';
import { MATCH_STATUSES, STAGES, type MatchStatus, type Stage } from '@/lib/types';

export interface MatchDocument {
  _id: Types.ObjectId;
  stage: Stage;
  /** Só existe na fase de grupos. */
  groupId: Types.ObjectId | null;
  /** Posição no chaveamento (1..8 nas oitavas, 1 na final). Null nos grupos. */
  slot: number | null;
  teamAId: Types.ObjectId | null;
  teamBId: Types.ObjectId | null;
  scheduledAt: Date | null;
  status: MatchStatus;
  scoreA: number | null;
  scoreB: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<MatchDocument>(
  {
    stage: { type: String, required: true, enum: STAGES },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    slot: { type: Number, default: null },
    teamAId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    teamBId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
    scheduledAt: { type: Date, default: null },
    status: {
      type: String,
      required: true,
      enum: MATCH_STATUSES,
      default: 'SCHEDULED',
    },
    scoreA: { type: Number, default: null },
    scoreB: { type: Number, default: null },
  },
  { timestamps: true },
);

// Cada posição do chaveamento existe uma única vez. O filtro parcial deixa os
// jogos de grupo (slot null) de fora da restrição.
matchSchema.index(
  { stage: 1, slot: 1 },
  { unique: true, partialFilterExpression: { slot: { $type: 'number' } } },
);
matchSchema.index({ groupId: 1, scheduledAt: 1 });
matchSchema.index({ scheduledAt: 1 });

export const Match: Model<MatchDocument> =
  (models.Match as Model<MatchDocument>) ??
  model<MatchDocument>('Match', matchSchema);
