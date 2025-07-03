import mongoose from 'mongoose';

const dataSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'completed', 'archived'],
    default: 'active',
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  dueDate: {
    type: Date,
  },
  completedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create text index for search functionality
dataSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
});

// Create compound indexes for common queries
dataSchema.index({ category: 1, status: 1, createdAt: -1 });
dataSchema.index({ userId: 1, status: 1, createdAt: -1 });

// Update the updatedAt field before saving
dataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Update the updatedAt field before updating
dataSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Virtual for age of the document
dataSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Instance method to mark as completed
dataSchema.methods.markCompleted = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Instance method to archive
dataSchema.methods.archive = function() {
  this.status = 'archived';
  return this.save();
};

// Static method to find by category and status
dataSchema.statics.findByCategoryAndStatus = function(category, status) {
  return this.find({ category, status }).sort({ createdAt: -1 });
};

// Static method to search
dataSchema.statics.search = function(searchTerm, options = {}) {
  const { category, status, limit = 10, skip = 0 } = options;
  
  const query = { $text: { $search: searchTerm } };
  
  if (category) query.category = category;
  if (status) query.status = status;
  
  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

const Data = mongoose.model('Data', dataSchema);

export default Data;