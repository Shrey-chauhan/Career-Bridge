const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: [true, 'Student ID is required'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
    },
    originalFileName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
    },
    fileType: {
      type: String,
      required: [true, 'File MIME type is required'],
      trim: true,
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required'],
      min: [1, 'File size must be greater than 0'],
    },
    storageProvider: {
      type: String,
      enum: {
        values: ['CLOUDINARY', 'LOCAL', 'MEMORY'],
        message: 'Invalid storage provider',
      },
      default: 'CLOUDINARY',
    },
    publicId: {
      type: String,
      trim: true,
      default: '',
    },
    secureUrl: {
      type: String,
      required: [true, 'Secure document URL is required'],
      trim: true,
    },
    version: {
      type: Number,
      default: 1,
      min: [1, 'Version number must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Performance & Query Indexes
resumeSchema.index({ studentId: 1 });
resumeSchema.index({ studentId: 1, isActive: 1 });
resumeSchema.index({ studentId: 1, version: -1 });

// Transform to JSON
resumeSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

const Resume = mongoose.model('Resume', resumeSchema);

module.exports = Resume;
