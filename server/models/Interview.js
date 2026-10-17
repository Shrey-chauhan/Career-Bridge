const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Application ID is required'],
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    roundNumber: {
      type: Number,
      default: 1,
      min: [1, 'Round number must be at least 1'],
    },
    roundName: {
      type: String,
      default: 'Technical Interview',
      trim: true,
    },
    scheduledAt: {
      type: Date,
      required: [true, 'Scheduled date and time is required'],
    },
    duration: {
      type: Number,
      required: [true, 'Interview duration is required'],
      min: [15, 'Minimum duration is 15 minutes'],
      max: [240, 'Maximum duration is 240 minutes'],
    },
    interviewType: {
      type: String,
      enum: {
        values: ['ONLINE', 'OFFLINE', 'PHONE'],
        message: 'Invalid interview type',
      },
      required: [true, 'Interview type is required'],
    },
    meetingLink: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          return this.interviewType !== 'ONLINE' || (v && v.trim().length > 0);
        },
        message: 'Meeting link is required for online interviews',
      },
    },
    location: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: function (v) {
          return this.interviewType !== 'OFFLINE' || (v && v.trim().length > 0);
        },
        message: 'Location is required for offline interviews',
      },
    },
    interviewerName: {
      type: String,
      required: [true, 'Interviewer name is required'],
      trim: true,
    },
    interviewerEmail: {
      type: String,
      required: [true, 'Interviewer email is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
        message: 'Invalid interview status',
      },
      default: 'SCHEDULED',
    },
    result: {
      type: String,
      enum: {
        values: ['PENDING', 'PASSED', 'FAILED', 'NEXT_ROUND'],
        message: 'Invalid interview result',
      },
      default: 'PENDING',
    },
    feedback: {
      type: String,
      default: '',
      trim: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created By User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Performance & Integrity Indexes
interviewSchema.index({ applicationId: 1, roundNumber: 1 }, { unique: true });
interviewSchema.index({ applicationId: 1 });
interviewSchema.index({ studentId: 1, scheduledAt: 1 });
interviewSchema.index({ companyId: 1, scheduledAt: 1 });
interviewSchema.index({ status: 1, scheduledAt: 1 });

// Transform to JSON
interviewSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview;
