const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient User ID is required'],
    },
    type: {
      type: String,
      enum: {
        values: [
          'APPLICATION_SUBMITTED',
          'APPLICATION_SHORTLISTED',
          'APPLICATION_REJECTED',
          'APPLICATION_WITHDRAWN',
          'JOB_PUBLISHED',
          'INTERVIEW_SCHEDULED',
          'INTERVIEW_RESCHEDULED',
          'INTERVIEW_CANCELLED',
          'INTERVIEW_CONFIRMED',
          'INTERVIEW_COMPLETED',
        ],
        message: 'Invalid notification type',
      },
      required: [true, 'Notification type is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    entityType: {
      type: String,
      enum: {
        values: ['Application', 'Job', 'Interview'],
        message: 'Invalid entity type',
      },
      required: [true, 'Entity type is required'],
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
      refPath: 'entityType',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Performance & Expiry Indexes
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
notificationSchema.index({ recipientId: 1 });
notificationSchema.index({ recipientId: 1, isRead: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

// Transform to JSON
notificationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
