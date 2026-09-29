import { Schema, model, models, type Model, type Types } from 'mongoose';

export interface AdminUserDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const adminUserSchema = new Schema<AdminUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true },
);

// O HMR reavalia este módulo a cada edição; sem reaproveitar o model já
// registrado, o Mongoose lança OverwriteModelError.
export const AdminUser: Model<AdminUserDocument> =
  (models.AdminUser as Model<AdminUserDocument>) ??
  model<AdminUserDocument>('AdminUser', adminUserSchema);
