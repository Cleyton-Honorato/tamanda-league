import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface GroupDocument {
  _id: Types.ObjectId;
  name: string;
  /** Ordem de exibição das abas de grupo. */
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const groupSchema = new Schema<GroupDocument>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    order: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

groupSchema.index({ order: 1 });

export const Group: Model<GroupDocument> =
  (models.Group as Model<GroupDocument>) ??
  model<GroupDocument>('Group', groupSchema);
