const mongoose = require('mongoose');

const applicationActivitySchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Application ID is required'],
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor User ID is required'],
    },
    action: {
      type: String,
      enum: {
        values: [
          'APPLICATION_SUBMITTED',
          'APPLICATION_SHORTLISTED',
          'APPLICATION_REJECTED',
          'APPLICATION_WITHDRAWN',
          'INTERVIEW_SCHEDULED',
          'INTERVIEW_RESCHEDULED',
          'INTERVIEW_CONFIRMED',
          'INTERVIEW_CANCELLED',
          'INTERVIEW_COMPLETED',
          'INTERVIEW_RESULT_UPDATED',
        ],
        message: 'Invalid activity action',
      },
      required: [true, 'Activity action is required'],
    },
    description: {
      type: String,
      required: [true, 'Activity description is required'],
      trim: true,
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

// Performance Index
applicationActivitySchema.index({ applicationId: 1, createdAt: 1 });

// Transform to JSON
applicationActivitySchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

const ApplicationActivity = mongoose.model('ApplicationActivity', applicationActivitySchema);

module.exports = ApplicationActivity;
