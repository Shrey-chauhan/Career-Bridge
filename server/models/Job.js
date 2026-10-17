const mongoose = require('mongoose');

const salarySchema = new mongoose.Schema({
  min: {
    type: Number,
    min: [0, 'Minimum salary cannot be negative'],
    default: 0,
  },
  max: {
    type: Number,
    min: [0, 'Maximum salary cannot be negative'],
    default: 0,
  },
  currency: {
    type: String,
    default: 'INR',
    trim: true,
  },
  period: {
    type: String,
    enum: {
      values: ['YEARLY', 'MONTHLY', 'HOURLY'],
      message: 'Invalid salary period',
    },
    default: 'YEARLY',
  },
});

salarySchema.pre('validate', function (next) {
  if (this.max > 0 && this.min > 0 && this.max < this.min) {
    return next(new Error('Salary max cannot be less than salary min'));
  }
  next();
});

const experienceSchema = new mongoose.Schema({
  minYears: {
    type: Number,
    min: [0, 'Minimum experience cannot be negative'],
    default: 0,
  },
  maxYears: {
    type: Number,
    min: [0, 'Maximum experience cannot be negative'],
    default: 0,
  },
});

const eligibilityRulesSchema = new mongoose.Schema({
  minimumCgpa: {
    type: Number,
    min: [0, 'Minimum CGPA cannot be negative'],
    max: [10, 'Minimum CGPA cannot exceed 10.0'],
    default: 0,
  },
  maximumBacklogs: {
    type: Number,
    min: [0, 'Maximum backlogs cannot be negative'],
    default: 0,
  },
  allowedBranches: [
    {
      type: String,
      trim: true,
    },
  ],
  graduationYears: [
    {
      type: Number,
    },
  ],
  requiredSkills: [
    {
      type: String,
      trim: true,
    },
  ],
});

const jobSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    jobType: {
      type: String,
      enum: {
        values: ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'],
        message: 'Invalid job type',
      },
      required: [true, 'Job type is required'],
    },
    workMode: {
      type: String,
      enum: {
        values: ['ONSITE', 'REMOTE', 'HYBRID'],
        message: 'Invalid work mode',
      },
      required: [true, 'Work mode is required'],
    },
    location: {
      type: String,
      trim: true,
    },
    salary: salarySchema,
    experienceRequired: experienceSchema,
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    eligibility: eligibilityRulesSchema,
    applicationDeadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    openings: {
      type: Number,
      required: [true, 'Number of openings is required'],
      min: [1, 'Number of openings must be at least 1'],
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'PUBLISHED', 'CLOSED'],
        message: 'Invalid job status',
      },
      default: 'DRAFT',
    },
    publishedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
jobSchema.index({ status: 1 });
jobSchema.index({ companyId: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ workMode: 1 });
jobSchema.index({ skills: 1 });
jobSchema.index({ applicationDeadline: 1 });
jobSchema.index({ status: 1, applicationDeadline: 1 });
jobSchema.index({ companyId: 1, status: 1 });

// Transform to JSON
jobSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
