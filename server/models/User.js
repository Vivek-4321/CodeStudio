import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    minlength: 8,
  },
  firstName: {
    type: String,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  refreshToken: String,
  roles: {
    type: [String],
    default: ['user'],
  },
  applications: [{
    appId: {
      type: String,
      required: true,
    },
    permissions: {
      type: [String],
      default: [],
    },
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  
  authenticationMethods: {
    type: [String],
    enum: ['local', 'google', 'github'],
    default: []
  },
  
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  githubId: {
    type: String,
    sparse: true,
    unique: true
  },
  githubUsername: {
    type: String,
    sparse: true
  },
  profilePicture: String,
  
  githubAccessToken: {
    type: String,
    select: false
  },
  githubData: {
    login: String,
    name: String,
    company: String,
    blog: String,
    location: String,
    bio: String,
    publicRepos: Number,
    privateRepos: Number,
    followers: Number,
    following: Number,
    createdAt: Date,
    updatedAt: Date
  },
  
  primaryAuthMethod: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  
  passwordLastSet: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

userSchema.methods.hasRole = function(role) {
  return this.roles.includes(role);
};

userSchema.methods.hasAppPermission = function(appId, permission) {
  const app = this.applications.find(app => app.appId === appId);
  if (!app) return false;
  if (!permission) return true;
  return app.permissions.includes(permission);
};

userSchema.methods.canUseAuthMethod = function(method) {
  return this.authenticationMethods.includes(method);
};

userSchema.methods.addAuthMethod = function(method) {
  if (!this.authenticationMethods.includes(method)) {
    this.authenticationMethods.push(method);
    
    if (this.authenticationMethods.length === 1) {
      this.primaryAuthMethod = method;
    }
  }
};

userSchema.methods.getGithubAccessToken = async function() {
  if (!this.canUseAuthMethod('github') || !this.githubAccessToken) {
    return null;
  }
  return this.githubAccessToken;
};

userSchema.methods.getAuthSummary = function() {
  return {
    methods: this.authenticationMethods,
    primaryMethod: this.primaryAuthMethod,
    hasPassword: !!this.password,
    hasGoogle: !!this.googleId,
    hasGithub: !!this.githubId,
    passwordLastSet: this.passwordLastSet,
    canUseLocal: this.canUseAuthMethod('local'),
    canUseGoogle: this.canUseAuthMethod('google'),
    canUseGithub: this.canUseAuthMethod('github')
  };
};

const User = mongoose.model('User', userSchema);

export default User;