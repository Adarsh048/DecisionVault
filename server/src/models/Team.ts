import mongoose, { Schema, Document } from 'mongoose';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface ITeam extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  organizationId: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const teamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        delete obj.__v;
        return obj;
      },
    },
  }
);

// ─── Indexes ─────────────────────────────────────────────────────────────────

teamSchema.index({ organizationId: 1 });
teamSchema.index({ members: 1 });
teamSchema.index({ organizationId: 1, name: 1 }, { unique: true });

// ─── Model ───────────────────────────────────────────────────────────────────

export const Team = mongoose.model<ITeam>('Team', teamSchema);
