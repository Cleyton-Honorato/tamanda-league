import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface AthleteDocument {
  _id: Types.ObjectId;
  name: string;
  nickname: string | null;
  teamId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const athleteSchema = new Schema<AthleteDocument>(
  {
    name: { type: String, required: true, trim: true },
    nickname: { type: String, trim: true, default: null },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
  },
  { timestamps: true },
);

athleteSchema.index({ name: 1 });
athleteSchema.index({ teamId: 1 });

export const Athlete: Model<AthleteDocument> =
  (models.Athlete as Model<AthleteDocument>) ?? model<AthleteDocument>('Athlete', athleteSchema);
