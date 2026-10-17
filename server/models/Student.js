const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  technologies: [
    {
      type: String,
      trim: true,
    },
  ],
  projectUrl: {
    type: String,
    trim: true,
  },
  githubUrl: {
    type: String,
    trim: true,
  },
});

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Certification name is required'],
    trim: true,
  },
  issuer: {
    type: String,
    trim: true,
  },
  issueDate: {
    type: Date,
  },
  credentialUrl: {
    type: String,
    trim: true,
  },
});

const experienceSchema = new mongoose.Schema({
  company: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
  },
  position: {
    type: String,
    required: [true, 'Position/Role is required'],
    trim: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  description: {
    type: String,
    trim: true,
  },
});

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    college: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
    },
    degree: {
      type: String,
      required: [true, 'Degree is required'],
      trim: true,
    },
    branch: {
      type: String,
      required: [true, 'Branch/Specialization is required'],
      trim: true,
    },
    graduationYear: {
      type: Number,
      required: [true, 'Graduation year is required'],
      min: [2000, 'Graduation year must be 2000 or later'],
      max: [2100, 'Graduation year must be valid'],
    },
    cgpa: {
      type: Number,
      required: [true, 'CGPA is required'],
      min: [0, 'CGPA cannot be negative'],
      max: [10, 'CGPA cannot exceed 10.0'],
    },
    backlogs: {
      type: Number,
      default: 0,
      min: [0, 'Backlogs cannot be negative'],
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    projects: [projectSchema],
    certifications: [certificationSchema],
    experience: [experienceSchema],

    location: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    linkedin: {
      type: String,
      trim: true,
    },
    github: {
      type: String,
      trim: true,
    },
    portfolio: {
      type: String,
      trim: true,
    },
    profileCompletion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    placementStatus: {
      type: String,
      enum: {
        values: ['NOT_PLACED', 'PLACED', 'NOT_INTERESTED'],
        message: 'Invalid placement status',
      },
      default: 'NOT_PLACED',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
studentSchema.index({ branch: 1, graduationYear: 1 });
studentSchema.index({ placementStatus: 1, branch: 1 });

// Transform to JSON
studentSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
