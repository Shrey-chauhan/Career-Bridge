const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Actor User ID is required'],
    },
    actorRole: {
      type: String,
      required: [true, 'Actor role is required'],
    },
    action: {
      type: String,
      required: [true, 'Audit action is required'],
      trim: true,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: {
        values: ['COMPANY', 'STUDENT', 'JOB', 'APPLICATION', 'INTERVIEW', 'DRIVE', 'USER'],
        message: 'Invalid audit entity type',
      },
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
    },
    description: {
      type: String,
      required: [true, 'Audit log description is required'],
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

// Performance Indexes
adminAuditLogSchema.index({ actorId: 1 });
adminAuditLogSchema.index({ action: 1 });
adminAuditLogSchema.index({ createdAt: -1 });

// Transform to JSON
adminAuditLogSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj._id;
  delete obj.__v;
  return obj;
};

const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);

module.exports = AdminAuditLog;
