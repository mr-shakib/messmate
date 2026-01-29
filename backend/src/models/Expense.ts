import mongoose, { Schema, Document, Model } from 'mongoose';

// Valid expense categories
export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Utilities',
  'Rent',
  'Gas',
  'Internet',
  'Cleaning',
  'Food',
  'Entertainment',
  'Other',
] as const;

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number];

// Valid split methods
export const SPLIT_METHODS = ['equal', 'custom', 'exclude'] as const;
export type SplitMethod = typeof SPLIT_METHODS[number];

// Interface for ExpenseSplit subdocument
interface IExpenseSplit {
  memberId: mongoose.Types.ObjectId;
  percentage: number; // Percentage of total expense
  amount: number; // Calculated amount based on percentage
}

// Interface for Expense document
export interface IExpense extends Document {
  messId: mongoose.Types.ObjectId;
  amount: number;
  description: string;
  category: ExpenseCategory;
  date: Date;
  paidBy: mongoose.Types.ObjectId; // Who paid from their pocket (needs reimbursement)
  splitMethod: SplitMethod;
  splits: IExpenseSplit[];
  receipt?: string; // Optional receipt photo/file URL
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

// ExpenseSplit subdocument schema
const ExpenseSplitSchema = new Schema<IExpenseSplit>({
  memberId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
    min: [0, 'Percentage must be non-negative'],
    max: [100, 'Percentage cannot exceed 100'],
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Split amount must be non-negative'],
  },
});

// Expense schema
const ExpenseSchema = new Schema<IExpense>(
  {
    messId: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: [true, 'Mess ID is required'],
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
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payer is required'],
      index: true,
    },
    splitMethod: {
      type: String,
      required: [true, 'Split method is required'],
      enum: {
        values: SPLIT_METHODS,
        message: '{VALUE} is not a valid split method',
      },
    },
    splits: {
      type: [ExpenseSplitSchema],
      required: true,
      validate: {
        validator: function (splits: IExpenseSplit[]) {
          return splits.length > 0;
        },
        message: 'At least one split is required',
      },
    },
    receipt: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
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
    timestamps: true,
  }
);

// Compound indexes for common query patterns
ExpenseSchema.index({ messId: 1, date: -1 });
ExpenseSchema.index({ messId: 1, paidBy: 1 });
ExpenseSchema.index({ messId: 1, isDeleted: 1 });

// Validation: Ensure splits sum to total amount (with small tolerance for rounding)
ExpenseSchema.pre('save', function (next) {
  const expense = this as IExpense;

  if (expense.splits && expense.splits.length > 0) {
    const totalSplits = expense.splits.reduce((sum, split) => sum + split.amount, 0);
    const difference = Math.abs(totalSplits - expense.amount);

    // Allow small rounding differences (up to 0.02 per split)
    const tolerance = expense.splits.length * 0.02;

    if (difference > tolerance) {
      return next(
        new Error(
          `Sum of splits (${totalSplits.toFixed(2)}) must equal total amount (${expense.amount.toFixed(2)})`
        )
      );
    }
  }

  next();
});

// Validation: For custom split, ensure percentages sum to 100
ExpenseSchema.pre('save', function (next) {
  const expense = this as IExpense;

  if (expense.splitMethod === 'custom' && expense.splits) {
    const totalPercentage = expense.splits.reduce(
      (sum, split) => sum + (split.percentage || 0),
      0
    );

    // Allow small tolerance for rounding
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return next(
        new Error(
          `For custom split, percentages must sum to 100% (current: ${totalPercentage}%)`
        )
      );
    }
  }

  next();
});

// Create and export the Expense model
const Expense: Model<IExpense> = mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;
