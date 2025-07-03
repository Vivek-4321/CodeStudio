import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

const StoreInitializer = ({ children }) => {
  const initializeAuth = useAuthStore(state => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return children;
};

export default StoreInitializer;