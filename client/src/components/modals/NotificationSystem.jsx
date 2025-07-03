import React from 'react';
import { XCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const NotificationSystem = ({ 
  notifications = [],
  onRemoveNotification
}) => {
  const getIcon = (type) => {
    switch (type) {
      case 'error': return <XCircle size={16} />;
      case 'warning': return <AlertTriangle size={16} />;
      case 'success': return <CheckCircle size={16} />;
      case 'info': return <Info size={16} />;
      default: return <Info size={16} />;
    }
  };

  const handleNotificationClick = (notificationId) => {
    if (onRemoveNotification) {
      onRemoveNotification(notificationId);
    }
  };

  if (!notifications.length) return null;

  return (
    <div className="notifications-container">
      {notifications.map(notification => (
        <div 
          key={notification.id} 
          className={`notification notification-${notification.type}`}
          onClick={() => handleNotificationClick(notification.id)}
        >
          <div className="notification-content">
            {getIcon(notification.type)}
            <span>{notification.message}</span>
          </div>
          <button 
            className="notification-close"
            onClick={(e) => {
              e.stopPropagation();
              handleNotificationClick(notification.id);
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationSystem;