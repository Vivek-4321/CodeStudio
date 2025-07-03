import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  deploymentId: {
    type: String,
    required: true,
    ref: 'Deployment'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  websockets: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

sessionSchema.index({ sessionId: 1 });
sessionSchema.index({ deploymentId: 1 });
sessionSchema.index({ lastActivity: -1 });
sessionSchema.index({ isActive: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;