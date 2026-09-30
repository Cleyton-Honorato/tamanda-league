import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface AthleteDocument {
  _id: Types.ObjectId;
  name: string;
  nickname: string | null;
  level: number | null;
  teamId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const athleteSchema = new Schema<AthleteDocument>(
  {
    name: { type: String, required: true, trim: true },
    nickname: { type: String, trim: true, default: null },
    level: { type: Number, min: 1, max: 5, default: null },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
  },
  { timestamps: true },
);

athleteSchema.index({ name: 1 });
athleteSchema.index({ teamId: 1 });

const cachedAthlete = models.Athlete as Model<AthleteDocument> | undefined;
// O HMR mantém modelos compilados; inclua o novo campo sem exigir reiniciar o dev server.
if (cachedAthlete && !cachedAthlete.schema.path('level')) {
  cachedAthlete.schema.add({ level: { type: Number, min: 1, max: 5, default: null } });
}

export const Athlete: Model<AthleteDocument> = cachedAthlete ?? model<AthleteDocument>('Athlete', athleteSchema);
