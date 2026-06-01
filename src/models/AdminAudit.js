const mongoose = require('mongoose');

const adminAuditSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true, trim: true },
    payload: { type: Object, default: {} },
    ip: { type: String, default: '' },
    ua: { type: String, default: '' },
    ts: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.model('AdminAudit', adminAuditSchema);
