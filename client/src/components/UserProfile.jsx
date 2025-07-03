import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './UserProfile.css';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const getInitials = (firstName = '', lastName = '') => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  const getDisplayName = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  };

  return (
    <div className="user-profile">
      <div 
        className="user-avatar"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {user.profilePicture ? (
          <img src={user.profilePicture} alt="Profile" />
        ) : (
          <div className="avatar-initials">
            {getInitials(user.firstName, user.lastName)}
          </div>
        )}
      </div>

      {showDropdown && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-name">{getDisplayName()}</div>
            <div className="user-email">{user.email}</div>
            {user.authenticationMethods && (
              <div className="auth-methods">
                {user.authenticationMethods.map(method => (
                  <span key={method} className={`auth-badge ${method}`}>
                    {method === 'google' ? '🔗 Google' : method === 'local' ? '📧 Email' : method}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="dropdown-divider"></div>
          <button className="logout-button" onClick={logout}>
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;