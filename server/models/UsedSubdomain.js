import mongoose from 'mongoose';

const usedSubdomainSchema = new mongoose.Schema({
  subdomain: {
    type: String,
    required: true,
    unique: true
  },
  deploymentId: {
    type: String,
    required: true,
    ref: 'Deployment'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

usedSubdomainSchema.index({ subdomain: 1 });
usedSubdomainSchema.index({ deploymentId: 1 });
usedSubdomainSchema.index({ isActive: 1 });

const UsedSubdomain = mongoose.model('UsedSubdomain', usedSubdomainSchema);

export default UsedSubdomain;