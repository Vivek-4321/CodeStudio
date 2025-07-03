import mongoose from 'mongoose';

const deploymentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  projectName: {
    type: String,
    required: true
  },
  subdomain: {
    type: String,
    required: true,
    unique: true
  },
  framework: {
    type: String,
    required: true
  },
  frameworkName: String,
  frameworkIcon: String,
  frameworkDescription: String,
  dockerImage: String,
  frameworkStatus: String,
  url: String,
  status: {
    type: String,
    enum: ['starting', 'ready', 'error', 'deleting'],
    default: 'starting'
  },
  resourceSize: {
    type: String,
    enum: ['small', 'medium', 'large'],
    default: 'medium'
  },
  projectId: {
    type: String,
    index: true,
    sparse: true
  },
  sessionId: String,
  activeSessions: [{
    sessionId: String,
    lastActivity: Date,
    websockets: { type: Number, default: 0 }
  }],
  isActive: { type: Boolean, default: false }
}, {
  timestamps: true
});

deploymentSchema.index({ id: 1 });
deploymentSchema.index({ subdomain: 1 });
deploymentSchema.index({ framework: 1 });
deploymentSchema.index({ status: 1 });
deploymentSchema.index({ userId: 1 });
deploymentSchema.index({ createdAt: -1 });

const Deployment = mongoose.model('Deployment', deploymentSchema);

export default Deployment;