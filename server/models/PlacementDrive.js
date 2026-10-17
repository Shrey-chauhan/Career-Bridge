const mongoose = require('mongoose');

const placementDriveSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Placement drive name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
    },
    jobIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Job',
      },
    ],
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    location: {
      type: String,
      trim: true,
      default: 'College Campus',
    },
    status: {
      type: String,
      enum: {
        values: ['DRAFT', 'UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
        message: 'Invalid placement drive status',
      },
      default: 'DRAFT',
    },
    eligibleCourses: [
      {
        type: String,
        trim: true,
      },
    ],
    eligibleGraduationYears: [
      {
        type: Number,
      },
    ],
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

placementDriveSchema.pre('validate', function (next) {
  if (this.endDate && this.startDate && this.endDate <= this.startDate) {
    return next(new Error('endDate must be after startDate'));
  }
  next();
});

// Performance Indexes
placementDriveSchema.index({ companyId: 1 });
placementDriveSchema.index({ status: 1 });
placementDriveSchema.index({ startDate: 1 });

// Transform to JSON
placementDriveSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

const PlacementDrive = mongoose.model('PlacementDrive', placementDriveSchema);

module.exports = PlacementDrive;
