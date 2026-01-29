import mongoose, { Schema, Document, Model } from 'mongoose';

// Settlement types
export const SETTLEMENT_TYPES = ['contribution', 'refund'] as const;
export type SettlementType = typeof SETTLEMENT_TYPES[number];

// Interface for Settlement document
export interface ISettlement extends Document {
  messId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId; // Member involved in settlement
  amount: number;
  type: SettlementType; // 'contribution' = member paying to mess, 'refund' = mess refunding member
  description?: string;
  date: Date;
  recordedBy: mongoose.Types.ObjectId; // Who recorded this settlement
  createdAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

// Settlement schema
const SettlementSchema = new Schema<ISettlement>(
  {
    messId: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: [true, 'Mess ID is required'],
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Member ID is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive'],
      validate: {
        validator: function (value: number) {
          // Ensure amount has at most 2 decimal places
          return Number.isFinite(value) && /^\d+(\.\d{1,2})?$/.test(value.toString());
        },
        message: 'Amount must have at most 2 decimal places',
      },
    },
    type: {
      type: String,
      required: [true, 'Settlement type is required'],
      enum: {
        values: SETTLEMENT_TYPES,
        message: '{VALUE} is not a valid settlement type',
      },
    },
    description: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recorder is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // Make createdAt immutable after creation
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: false, // Disable automatic timestamps since we're managing createdAt manually
  }
);

// Compound indexes for common query patterns
SettlementSchema.index({ messId: 1, memberId: 1 });
SettlementSchema.index({ messId: 1, date: -1 });
SettlementSchema.index({ messId: 1, type: 1 });
SettlementSchema.index({ messId: 1, isDeleted: 1 });

// Prevent modification of createdAt after initial save
SettlementSchema.pre('save', function (next) {
  const settlement = this as ISettlement;

  // If document is not new and createdAt is being modified, prevent it
  if (!settlement.isNew && settlement.isModified('createdAt')) {
    return next(new Error('createdAt field is immutable and cannot be modified'));
  }

  next();
});

// Create and export the Settlement model
const Settlement: Model<ISettlement> = mongoose.model<ISettlement>(
  'Settlement',
  SettlementSchema
);

export default Settlement;
