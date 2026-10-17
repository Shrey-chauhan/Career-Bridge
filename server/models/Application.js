const mongoose = require('mongoose');

const resumeSnapshotSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      default: '',
      trim: true,
    },
    fileName: {
      type: String,
      default: '',
      trim: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    resumeSnapshot: {
      type: resumeSnapshotSchema,
      default: () => ({ url: '', fileName: '' }),
    },
    coverLetter: {
      type: String,
      trim: true,
      default: '',
      maxlength: [3000, 'Cover letter cannot exceed 3000 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['APPLIED', 'SHORTLISTED', 'REJECTED', 'WITHDRAWN'],
        message: 'Invalid application status',
      },
      default: 'APPLIED',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
    },
    companyNotes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'Company notes cannot exceed 2000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound Partial Unique Index to prevent duplicate active applications while allowing re-applying after withdrawal
applicationSchema.index(
  { studentId: 1, jobId: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['APPLIED', 'SHORTLISTED', 'REJECTED'] } } }
);

// Query & Performance Indexes
applicationSchema.index({ companyId: 1, status: 1 });
applicationSchema.index({ studentId: 1 });
applicationSchema.index({ jobId: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ appliedAt: -1 });

// Transform to JSON
applicationSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
