const AUTH_API_BASE = import.meta.env.VITE_AUTH_API_BASE;

const CookieUtils = {
  setCookie(name, value, minutes) {
    const date = new Date();
    date.setTime(date.getTime() + (minutes * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
  },

  getCookie(name) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  },

  deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
  }
};

class AuthService {
  constructor() {
    this.token = CookieUtils.getCookie(import.meta.env.VITE_AUTH_TOKEN_NAME) || localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_NAME);
    const userFromCookie = CookieUtils.getCookie(import.meta.env.VITE_USER_DATA_NAME);
    const userFromStorage = localStorage.getItem(import.meta.env.VITE_USER_DATA_NAME);
    this.user = userFromCookie ? JSON.parse(userFromCookie) : JSON.parse(userFromStorage || 'null');
  }

  async register(email, password, firstName, lastName) {
    try {
      const response = await fetch(`${AUTH_API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      this.setAuth(data.tokens.accessToken, data.user);
      return data;
    } catch (error) {
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${AUTH_API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      this.setAuth(data.tokens.accessToken, data.user);
      return data;
    } catch (error) {
      throw error;
    }
  }

  initiateGoogleAuth() {
    window.location.href = `${AUTH_API_BASE}/google?mode=token&returnUrl=${encodeURIComponent(window.location.origin + '/auth/callback')}`;
  }

  async handleGoogleCallback(url) {
    try {
      const urlParams = new URLSearchParams(new URL(url).search);
      const accessToken = urlParams.get('accessToken');
      const refreshToken = urlParams.get('refreshToken');
      const error = urlParams.get('error');

      if (error) {
        throw new Error(error);
      }

      if (!accessToken) {
        throw new Error('No access token received');
      }

      this.token = accessToken;
      const user = await this.getCurrentUser();
      this.setAuth(accessToken, user, refreshToken);
      
      return { success: true, user };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser() {
    if (!this.token) {
      throw new Error('No authentication token');
    }

    try {
      const response = await fetch(`${AUTH_API_BASE}/profile`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user profile');
      }

      return data.user;
    } catch (error) {
      throw error;
    }
  }

  async refreshToken() {
    const refreshToken = CookieUtils.getCookie(import.meta.env.VITE_REFRESH_TOKEN_NAME) || localStorage.getItem(import.meta.env.VITE_REFRESH_TOKEN_NAME);
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch(`${AUTH_API_BASE}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Token refresh failed');
      }

      this.setAuth(data.accessToken, this.user);
      return data;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  setAuth(token, user, refreshToken = null) {
    this.token = token;
    this.user = user;
    
    CookieUtils.setCookie(import.meta.env.VITE_AUTH_TOKEN_NAME, token, 15);
    CookieUtils.setCookie(import.meta.env.VITE_USER_DATA_NAME, JSON.stringify(user), 15);
    
    if (refreshToken) {
      CookieUtils.setCookie(import.meta.env.VITE_REFRESH_TOKEN_NAME, refreshToken, 15);
    }
    
    localStorage.setItem(import.meta.env.VITE_AUTH_TOKEN_NAME, token);
    localStorage.setItem(import.meta.env.VITE_USER_DATA_NAME, JSON.stringify(user));
    if (refreshToken) {
      localStorage.setItem(import.meta.env.VITE_REFRESH_TOKEN_NAME, refreshToken);
    }
  }

  logout() {
    this.token = null;
    this.user = null;
    
    CookieUtils.deleteCookie(import.meta.env.VITE_AUTH_TOKEN_NAME);
    CookieUtils.deleteCookie(import.meta.env.VITE_REFRESH_TOKEN_NAME);
    CookieUtils.deleteCookie(import.meta.env.VITE_USER_DATA_NAME);
    
    localStorage.removeItem(import.meta.env.VITE_AUTH_TOKEN_NAME);
    localStorage.removeItem(import.meta.env.VITE_REFRESH_TOKEN_NAME);
    localStorage.removeItem(import.meta.env.VITE_USER_DATA_NAME);
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  async apiCall(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    } else {
      console.error('No authentication token available for API call:', endpoint);
      throw new Error('No authentication token available');
    }

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        console.log('Received 401, attempting token refresh...');
        try {
          await this.refreshToken();
          headers.Authorization = `Bearer ${this.token}`;
          return fetch(endpoint, { ...options, headers });
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          this.logout();
          throw new Error('Authentication required');
        }
      }

      return response;
    } catch (networkError) {
      console.error('Network error in API call:', networkError);
      throw networkError;
    }
  }
}

export default new AuthService();