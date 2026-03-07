'use client';

import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Portfolio Update',
    description: 'Your investment portfolio has grown by 2.3% this month',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: '2',
    title: 'Goal Progress',
    description: 'You are 75% towards your retirement goal',
    timestamp: '5 hours ago',
    read: false,
  },
  {
    id: '3',
    title: 'Market Alert',
    description: 'Technology sector shows strong performance',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '4',
    title: 'Security Update',
    description: 'Your account security settings have been updated',
    timestamp: '3 days ago',
    read: true,
  },
];

export function NotificationMenu() {
  const [notifications, setNotifications] = useState<Notification[]>(DEFAULT_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="relative">
      <Button
        size="icon"
        variant="ghost"
        className="text-muted-foreground hover:text-foreground relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary"
                onClick={handleMarkAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-border hover:bg-secondary/5 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-secondary/10' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${!notification.read ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{notification.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{notification.timestamp}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveNotification(notification.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-border text-center">
            <Button variant="ghost" size="sm" className="text-xs text-primary hover:text-primary">
              View all notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
