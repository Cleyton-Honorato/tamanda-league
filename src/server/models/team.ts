import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface TeamDocument {
  _id: Types.ObjectId;
  name: string;
  /** Sigla curta — é o que cabe nos cards do chaveamento e nos placares. */
  shortName: string;
  groupId: Types.ObjectId | null;
  crestPublicId: string | null;
  crestUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<TeamDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    shortName: { type: String, required: true, trim: true, uppercase: true },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', default: null },
    crestPublicId: { type: String, default: null },
    crestUrl: { type: String, default: null },
  },
  { timestamps: true },
);

teamSchema.index({ groupId: 1, name: 1 });

export const Team: Model<TeamDocument> =
  (models.Team as Model<TeamDocument>) ??
  model<TeamDocument>('Team', teamSchema);
