import mongoose from 'mongoose';

const terminalSchema = new mongoose.Schema({
  deploymentId: {
    type: String,
    required: true,
    unique: true,
    ref: 'Deployment'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  sessionIds: [{
    type: String
  }],
  history: {
    type: String,
    default: ''
  },
  pid: String,
  isActive: {
    type: Boolean,
    default: true
  },
  terminalConfig: {
    cols: { type: Number, default: 80 },
    rows: { type: Number, default: 24 }
  }
}, {
  timestamps: true
});

terminalSchema.index({ deploymentId: 1 });
terminalSchema.index({ lastActivity: -1 });
terminalSchema.index({ isActive: 1 });

const Terminal = mongoose.model('Terminal', terminalSchema);

export default Terminal;