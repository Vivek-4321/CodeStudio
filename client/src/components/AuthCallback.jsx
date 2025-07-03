import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { authService, setAuthState } = useAuth();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const url = window.location.href;
        const result = await authService.handleGoogleCallback(url);
        
        if (result.success && result.user) {
          setAuthState(result.user);
          setStatus('success');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1000);
        } else {
          setStatus('error');
          setError('Authentication failed');
        }
      } catch (error) {
        console.error('Google auth callback failed:', error);
        setStatus('error');
        setError(error.message || 'Authentication failed');
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [authService, setAuthState, navigate]);

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#0a0a0a',
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif'
    }} aria-live="polite">
      {status === 'processing' && (
        <div role="status" aria-label="Processing authentication" style={{ display: 'contents' }}>
          <Loader size={32} className="animate-spin" style={{ marginBottom: '16px' }} />
          <h2>Completing authentication...</h2>
          <p style={{ opacity: 0.7 }}>Please wait while we sign you in</p>
        </div>
      )}
      
      {status === 'success' && (
        <div role="status" aria-label="Authentication successful" style={{ display: 'contents' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: '#10b981', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '16px'
          }} aria-hidden="true">
            ✓
          </div>
          <h2>Authentication successful!</h2>
          <p style={{ opacity: 0.7 }}>Redirecting to dashboard...</p>
        </div>
      )}
      
      {status === 'error' && (
        <div role="status" aria-label="Authentication failed" style={{ display: 'contents' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '50%', 
            background: '#ef4444', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '16px'
          }} aria-hidden="true">
            ✗
          </div>
          <h2>Authentication failed</h2>
          <p style={{ opacity: 0.7, marginBottom: '16px' }}>{error}</p>
          <p style={{ opacity: 0.5, fontSize: '14px' }}>Redirecting to homepage...</p>
        </div>
      )}
    </main>
  );
};

export default AuthCallback;