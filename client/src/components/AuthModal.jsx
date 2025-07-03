import React, { useState } from 'react';
import { X, Mail, Lock, User, Users, Loader } from 'lucide-react';
import authService from '../services/authService';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let result;
      if (isLogin) {
        result = await authService.login(formData.email, formData.password);
      } else {
        result = await authService.register(
          formData.email,
          formData.password,
          formData.firstName,
          formData.lastName
        );
      }

      onSuccess(result.user);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    authService.initiateGoogleAuth();
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && onClose()} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <section className="flowing-card modal-card auth-modal">
        <header className="modal-header">
          <div className="modal-title-section">
            <h3 id="auth-modal-title" className="modal-title">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h3>
          </div>
          <button className="btn modal-close" onClick={onClose} aria-label="Close authentication modal">
            <X size={18} />
          </button>
        </header>
        
        <div className="modal-content">
          {error && (
            <div className="auth-error-message" role="alert">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <fieldset className="form-section">
              <legend className="sr-only">{isLogin ? 'Login form' : 'Registration form'}</legend>
              {!isLogin && (
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">
                      <User size={14} aria-hidden="true" />
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      className="form-input"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="John"
                      required={!isLogin}
                      autoComplete="given-name"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">
                      <Users size={14} aria-hidden="true" />
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      className="form-input"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Doe"
                      required={!isLogin}
                      autoComplete="family-name"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  <Mail size={14} aria-hidden="true" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="your@email.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  <Lock size={14} aria-hidden="true" />
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  minLength="8"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                {!isLogin && (
                  <p className="form-hint" id="password-hint">
                    Password must be at least 8 characters long
                  </p>
                )}
              </div>
            </fieldset>
            
            <div className="modal-actions">
              <button 
                type="submit" 
                className="btn btn-primary auth-submit-button"
                disabled={loading}
                aria-label={isLogin ? 'Sign in to your account' : 'Create a new account'}
              >
                {loading ? (
                  <>
                    <Loader size={14} className="loading-spinner" aria-hidden="true" />
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="auth-divider" role="separator">
            <span>or</span>
          </div>

          <button 
            type="button" 
            className="google-auth-button"
            onClick={handleGoogleAuth}
            disabled={loading}
            aria-label="Continue with Google"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="auth-toggle">
            <span className="toggle-text">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </span>
            <button 
              type="button" 
              className="toggle-button" 
              onClick={toggleMode}
              disabled={loading}
              aria-label={isLogin ? 'Switch to sign up' : 'Switch to sign in'}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AuthModal;