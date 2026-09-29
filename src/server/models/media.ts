import { Schema, model, models, type Model, type Types } from 'mongoose';
import { MEDIA_TYPES, type MediaType } from '@/lib/types';

export interface MediaDocument {
  _id: Types.ObjectId;
  /** Identificador no Cloudinary — necessário para apagar o arquivo de lá. */
  publicId: string;
  url: string;
  type: MediaType;
  caption: string | null;
  width: number | null;
  height: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<MediaDocument>(
  {
    publicId: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    type: { type: String, required: true, enum: MEDIA_TYPES },
    caption: { type: String, default: null, trim: true },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
  },
  { timestamps: true },
);

mediaSchema.index({ createdAt: -1 });

export const Media: Model<MediaDocument> =
  (models.Media as Model<MediaDocument>) ??
  model<MediaDocument>('Media', mediaSchema);
