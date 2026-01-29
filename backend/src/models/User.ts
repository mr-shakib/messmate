import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcrypt';

// Interface for RefreshToken subdocument
interface IRefreshToken {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

// Interface for User document
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  refreshTokens: IRefreshToken[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  addRefreshToken(token: string, expiresAt: Date): Promise<void>;
  removeRefreshToken(token: string): Promise<void>;
  removeAllRefreshTokens(): Promise<void>;
}

// RefreshToken subdocument schema
const RefreshTokenSchema = new Schema<IRefreshToken>({
  token: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// User schema
const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    refreshTokens: {
      type: [RefreshTokenSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ 'refreshTokens.token': 1 });

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  const user = this as IUser;

  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }

  try {
    // Hash password with bcrypt cost factor of 10
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Method to add refresh token
UserSchema.methods.addRefreshToken = async function (
  token: string,
  expiresAt: Date
): Promise<void> {
  this.refreshTokens.push({
    token,
    expiresAt,
    createdAt: new Date(),
  });
  await this.save();
};

// Method to remove specific refresh token
UserSchema.methods.removeRefreshToken = async function (
  token: string
): Promise<void> {
  this.refreshTokens = this.refreshTokens.filter(
    (rt: IRefreshToken) => rt.token !== token
  );
  await this.save();
};

// Method to remove all refresh tokens
UserSchema.methods.removeAllRefreshTokens = async function (): Promise<void> {
  this.refreshTokens = [];
  await this.save();
};

// Create and export the User model
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;
