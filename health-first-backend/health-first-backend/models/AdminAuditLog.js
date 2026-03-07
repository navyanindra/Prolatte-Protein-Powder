const mongoose = require("mongoose");

const adminAuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    actorEmail: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true
    },
    entity: {
      type: String,
      required: true
    },
    entityId: {
      type: String,
      default: ""
    },
    diff: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AdminAuditLog", adminAuditLogSchema);
