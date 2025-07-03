import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Redis from 'ioredis';
import crypto from 'crypto';

const AUTH_API_BASE = 'https://auth.aethercure.site/api/auth';

// Redis connection for token caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

const TOKEN_CACHE_TTL = 300; // 5 minutes in seconds

const verifyToken = async (token) => {
  try {
    // Create cache key from token hash for security
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const cacheKey = `auth_token:${tokenHash}`;
    
    // Check cache first
    const cachedResult = await redis.get(cacheKey);
    if (cachedResult) {
      console.log('🔍 AUTH: Token verification from cache');
      return JSON.parse(cachedResult);
    }

    console.log('🔍 AUTH: Verifying token with external auth service...');
    const response = await fetch(`${AUTH_API_BASE}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('🔍 AUTH: Auth service response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔍 AUTH: Auth service error:', errorText);
      throw new Error('Token verification failed');
    }

    const data = await response.json();
    console.log('🔍 AUTH: Token verification successful');
    
    // Cache the successful result
    await redis.setex(cacheKey, TOKEN_CACHE_TTL, JSON.stringify(data));
    
    return data;
  } catch (error) {
    console.error('🔍 AUTH: Auth verification error:', error.message);
    throw new Error('Invalid token');
  }
};

export const authenticate = async (req, res, next) => {
  try {
    console.log('🔐 AUTH: Request to', req.method, req.url);
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('🔐 AUTH: No Bearer token found');
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('🔐 AUTH: Token found, verifying...');
    
    try {
      const verificationResult = await verifyToken(token);
      
      if (!verificationResult.valid) {
        console.log('🔐 AUTH: Token invalid');
        return res.status(401).json({ 
          error: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      req.user = {
        userId: verificationResult.userId,
        email: verificationResult.email,
        roles: verificationResult.roles || ['user'],
        authMethods: verificationResult.authMethods || []
      };
      
      console.log('🔐 AUTH: User authenticated:', verificationResult.email);
      next();
    } catch (error) {
      console.log('🔐 AUTH: Token verification failed:', error.message);
      return res.status(401).json({ 
        error: 'Token verification failed',
        code: 'VERIFICATION_FAILED'
      });
    }
  } catch (error) {
    console.error('🔐 AUTH: Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      const verificationResult = await verifyToken(token);
      
      if (verificationResult.valid) {
        req.user = {
          userId: verificationResult.userId,
          email: verificationResult.email,
          roles: verificationResult.roles || ['user'],
          authMethods: verificationResult.authMethods || []
        };
      } else {
        req.user = null;
      }
    } catch (error) {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

export const authorizeRole = (roles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'NOT_AUTHENTICATED'
        });
      }
      
      const userRoles = req.user.roles || [];
      const hasRequiredRole = roles.some(role => userRoles.includes(role));
      
      if (!hasRequiredRole) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          required: roles,
          current: userRoles,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      
      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

export const getUserFromAuth = async (userId) => {
  try {
    let user = await User.findOne({ _id: userId });
    
    if (!user) {
      const response = await fetch(`${AUTH_API_BASE}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const authUser = await response.json();
        user = new User({
          _id: userId,
          email: authUser.user.email,
          firstName: authUser.user.firstName,
          lastName: authUser.user.lastName,
          verified: authUser.user.verified,
          roles: authUser.user.roles || ['user'],
          authenticationMethods: authUser.user.authenticationMethods || [],
          googleId: authUser.user.googleId,
          githubId: authUser.user.githubId,
          profilePicture: authUser.user.profilePicture,
          primaryAuthMethod: authUser.user.primaryAuthMethod
        });
        await user.save();
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error fetching user from auth:', error);
    return null;
  }
};