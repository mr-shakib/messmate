import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';

// Interface for MessMember subdocument
interface IMessMember {
  userId: mongoose.Types.ObjectId;
  role: 'Owner' | 'Admin' | 'Member';
  joinedAt: Date;
}

// Interface for Mess document
export interface IMess extends Document {
  name: string;
  description?: string;
  memberLimit: number;
  inviteCode: string;
  members: IMessMember[];
  createdAt: Date;
  updatedAt: Date;
  generateUniqueInviteCode(): Promise<string>;
}

// MessMember subdocument schema
const MessMemberSchema = new Schema<IMessMember>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['Owner', 'Admin', 'Member'],
    required: true,
    default: 'Member',
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

// Mess schema
const MessSchema = new Schema<IMess>(
  {
    name: {
      type: String,
      required: [true, 'Mess name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    memberLimit: {
      type: Number,
      required: [true, 'Member limit is required'],
      min: [6, 'Member limit must be at least 6'],
      max: [20, 'Member limit cannot exceed 20'],
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    members: {
      type: [MessMemberSchema],
      default: [],
      validate: {
        validator: function (this: IMess, members: IMessMember[]) {
          return members.length <= this.memberLimit;
        },
        message: 'Number of members cannot exceed member limit',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
MessSchema.index({ inviteCode: 1 }, { unique: true });
MessSchema.index({ 'members.userId': 1 });

// Static method to generate unique invite code
MessSchema.methods.generateUniqueInviteCode = async function (): Promise<string> {
  const Mess = this.constructor as Model<IMess>;
  let inviteCode: string;
  let isUnique = false;

  while (!isUnique) {
    // Generate 8-character alphanumeric code
    inviteCode = crypto
      .randomBytes(4)
      .toString('hex')
      .toUpperCase()
      .substring(0, 8);

    // Check if code already exists
    const existingMess = await Mess.findOne({ inviteCode });
    if (!existingMess) {
      isUnique = true;
    }
  }

  return inviteCode!;
};

// Pre-validate hook to generate invite code if not provided
MessSchema.pre('validate', async function (next) {
  const mess = this as IMess;

  // Generate invite code if it's a new document and no code is provided
  if (mess.isNew && !mess.inviteCode) {
    try {
      mess.inviteCode = await mess.generateUniqueInviteCode();
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Create and export the Mess model
const Mess: Model<IMess> = mongoose.model<IMess>('Mess', MessSchema);

export default Mess;
