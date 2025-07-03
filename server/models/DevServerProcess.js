import mongoose from 'mongoose';

const devServerProcessSchema = new mongoose.Schema({
  deploymentId: {
    type: String,
    required: true,
    unique: true,
    ref: 'Deployment'
  },
  status: {
    type: String,
    enum: ['stopped', 'starting', 'running', 'error'],
    default: 'stopped'
  },
  pid: String,
  processInfo: String,
  lastStarted: Date,
  lastStopped: Date
}, {
  timestamps: true
});

devServerProcessSchema.index({ deploymentId: 1 });
devServerProcessSchema.index({ status: 1 });

const DevServerProcess = mongoose.model('DevServerProcess', devServerProcessSchema);

export default DevServerProcess;