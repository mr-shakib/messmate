import mongoose, { Schema, Document } from 'mongoose';

export interface IMoneyCollection extends Document {
  messId: mongoose.Types.ObjectId;
  memberId: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  description: string;
  collectedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MoneyCollectionSchema = new Schema<IMoneyCollection>(
  {
    messId: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: true,
      index: true,
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive'],
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    description: {
      type: String,
      default: 'Monthly contribution',
      trim: true,
    },
    collectedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
MoneyCollectionSchema.index({ messId: 1, date: -1 });
MoneyCollectionSchema.index({ messId: 1, memberId: 1 });
MoneyCollectionSchema.index({ messId: 1, memberId: 1, date: -1 });

export const MoneyCollection = mongoose.model<IMoneyCollection>(
  'MoneyCollection',
  MoneyCollectionSchema
);
