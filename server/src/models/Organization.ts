import mongoose, { Schema, Document } from 'mongoose';
import type { Role } from '../config/constants';

// ─── Interfaces ──────────────────────────────────────────────────────────────

export interface IOrgMember {
  userId: mongoose.Types.ObjectId;
  role: Role;
  status: 'active' | 'pending';
  joinedAt: Date;
}

export interface IOrganization extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  members: IOrgMember[];
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const orgMemberSchema = new Schema<IOrgMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'viewer',
    },
    status: {
      type: String,
      enum: ['active', 'pending'],
      default: 'active',
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const organizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: {
      type: [orgMemberSchema],
      default: [],
    },
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

organizationSchema.index({ slug: 1 }, { unique: true });
organizationSchema.index({ 'members.userId': 1 });
organizationSchema.index({ owner: 1 });

// ─── Model ───────────────────────────────────────────────────────────────────

export const Organization = mongoose.model<IOrganization>(
  'Organization',
  organizationSchema
);
