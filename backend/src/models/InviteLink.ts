import mongoose, { Schema, Document, Model } from 'mongoose';

// Interface for InviteLink document
export interface IInviteLink extends Document {
  messId: mongoose.Types.ObjectId;
  token: string;
  createdBy: mongoose.Types.ObjectId;
  expiresAt: Date;
  createdAt: Date;
}

// InviteLink schema
const InviteLinkSchema = new Schema<IInviteLink>(
  {
    messId: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: [true, 'Mess ID is required'],
    },
    token: {
      type: String,
      required: [true, 'Token is required'],
      unique: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required'],
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // We're managing createdAt manually
  }
);

// Unique index on token
InviteLinkSchema.index({ token: 1 }, { unique: true });

// TTL index on expiresAt field for automatic cleanup of expired links
InviteLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Validation: Ensure expiresAt is in the future
InviteLinkSchema.pre('save', function (next) {
  const inviteLink = this as IInviteLink;

  if (inviteLink.isNew && inviteLink.expiresAt <= new Date()) {
    return next(new Error('Expiration date must be in the future'));
  }

  next();
});

// Create and export the InviteLink model
const InviteLink: Model<IInviteLink> = mongoose.model<IInviteLink>(
  'InviteLink',
  InviteLinkSchema
);

export default InviteLink;
