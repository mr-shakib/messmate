import mongoose, { Schema, Document, Model } from 'mongoose';

// Valid activity types
export const ACTIVITY_TYPES = ['expense', 'settlement', 'member'] as const;
export type ActivityType = typeof ACTIVITY_TYPES[number];

// Valid actions
export const ACTIVITY_ACTIONS = [
  'created',
  'updated',
  'deleted',
  'joined',
  'left',
  'role_changed',
] as const;
export type ActivityAction = typeof ACTIVITY_ACTIONS[number];

// Interface for ActivityLog document
export interface IActivityLog extends Document {
  messId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  action: ActivityAction;
  activityType: ActivityType;
  resourceId?: mongoose.Types.ObjectId;
  details: Record<string, any>;
  timestamp: Date;
  expiresAt: Date;
}

// ActivityLog schema
const ActivityLogSchema = new Schema<IActivityLog>(
  {
    messId: {
      type: Schema.Types.ObjectId,
      ref: 'Mess',
      required: [true, 'Mess ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: {
        values: ACTIVITY_ACTIONS,
        message: '{VALUE} is not a valid action',
      },
    },
    activityType: {
      type: String,
      required: [true, 'Activity type is required'],
      enum: {
        values: ACTIVITY_TYPES,
        message: '{VALUE} is not a valid activity type',
      },
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      // Reference can be to Expense, Settlement, or User depending on activityType
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: false, // We're managing timestamp manually
  }
);

// Compound indexes for common query patterns
ActivityLogSchema.index({ messId: 1, timestamp: -1 });
ActivityLogSchema.index({ messId: 1, activityType: 1, timestamp: -1 });

// TTL index on expiresAt field for automatic deletion after 90 days
ActivityLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-validate hook to set expiresAt if not provided (90 days from timestamp)
ActivityLogSchema.pre('validate', function (next) {
  const activityLog = this as IActivityLog;

  // Set expiresAt to 90 days from timestamp if not already set
  if (!activityLog.expiresAt) {
    const expirationDate = new Date(activityLog.timestamp);
    expirationDate.setDate(expirationDate.getDate() + 90);
    activityLog.expiresAt = expirationDate;
  }

  next();
});

// Create and export the ActivityLog model
const ActivityLog: Model<IActivityLog> = mongoose.model<IActivityLog>(
  'ActivityLog',
  ActivityLogSchema
);

export default ActivityLog;
