import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';

// ─── Interface ───────────────────────────────────────────────────────────────

export interface IRefreshToken {
  token: string;       // Hashed refresh token
  expiresAt: Date;
  createdAt: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  organizations: mongoose.Types.ObjectId[];
  refreshTokens: IRefreshToken[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// ─── Schema ──────────────────────────────────────────────────────────────────

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must be at most 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
    },
    avatar: {
      type: String,
      default: undefined,
    },
    organizations: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
      },
    ],
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      select: false, // Never return refresh tokens by default
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Strip sensitive fields when converting to JSON
      transform(_doc, ret) {
        const obj = ret as Record<string, unknown>;
        delete obj.password;
        delete obj.refreshTokens;
        delete obj.passwordResetToken;
        delete obj.passwordResetExpires;
        delete obj.__v;
        return obj;
      },
    },
  }
);



// ─── Pre-save: Hash password ─────────────────────────────────────────────────

userSchema.pre('save', async function (next) {
  // Only hash if password was modified
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

// ─── Instance Methods ────────────────────────────────────────────────────────

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Model ───────────────────────────────────────────────────────────────────

export const User = mongoose.model<IUser>('User', userSchema);
