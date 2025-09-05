'use client';

import React, { useEffect, useState } from 'react';
import { X, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: string;
}

interface NotificationToastProps {
  userId?: string;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  autoHideDuration?: number;
  maxToasts?: number;
}

export function NotificationToast({
  userId,
  position = 'top-right',
  autoHideDuration = 5000,
  maxToasts = 3
}: NotificationToastProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const { notifications, markAsRead } = useNotifications(userId);

  // Listen for new notifications and show as toasts
  useEffect(() => {
    if (notifications.length === 0) return;

    const latestNotification = notifications[0];
    if (!latestNotification.read) {
      const toast: ToastNotification = {
        id: latestNotification.id,
        title: latestNotification.title,
        message: latestNotification.message,
        type: latestNotification.type,
        timestamp: latestNotification.createdAt
      };

      setToasts(prev => {
        // Check if toast already exists
        if (prev.some(t => t.id === toast.id)) {
          return prev;
        }
        
        // Add new toast and limit to maxToasts
        return [toast, ...prev.slice(0, maxToasts - 1)];
      });

      // Auto-hide toast
      if (autoHideDuration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, autoHideDuration);
      }
    }
  }, [notifications, maxToasts, autoHideDuration]);

  const dismissToast = (toastId: string) => {
    setToasts(prev => prev.filter(t => t.id !== toastId));
    markAsRead(toastId);
  };

  const handleToastClick = (toast: ToastNotification) => {
    markAsRead(toast.id);
    dismissToast(toast.id);
    // You could add navigation logic here based on notification type
  };

  if (toasts.length === 0) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  return (
    <div className={cn(
      'fixed z-50 flex flex-col gap-2 pointer-events-none',
      positionClasses[position]
    )}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'pointer-events-auto max-w-sm w-full bg-background border rounded-lg shadow-lg',
            'animate-in slide-in-from-top-5 duration-300',
            'hover:shadow-xl transition-shadow cursor-pointer'
          )}
          onClick={() => handleToastClick(toast)}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <NotificationTypeIcon type={toast.type} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-foreground mb-1">
                  {toast.title}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {toast.message}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 opacity-60 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  dismissToast(toast.id);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Progress bar for auto-hide */}
          {autoHideDuration > 0 && (
            <div className="h-1 bg-muted rounded-b-lg overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-linear"
                style={{
                  animation: `shrink ${autoHideDuration}ms linear forwards`
                }}
              />
            </div>
          )}
        </div>
      ))}

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}

function NotificationTypeIcon({ type, size = 'sm' }: { type: string; size?: 'sm' | 'md' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6'
  };

  const iconClass = cn('flex-shrink-0', sizeClasses[size]);

  switch (type) {
    case 'achievement_unlocked':
      return (
        <div className={cn(iconClass, 'text-yellow-500 flex items-center justify-center')}>
          🏆
        </div>
      );
    case 'spark_update':
      return (
        <div className={cn(iconClass, 'text-green-500 flex items-center justify-center')}>
          ✨
        </div>
      );
    case 'collaboration_invite':
      return (
        <div className={cn(iconClass, 'text-blue-500 flex items-center justify-center')}>
          🤝
        </div>
      );
    case 'collaboration_action':
      return (
        <div className={cn(iconClass, 'text-purple-500 flex items-center justify-center')}>
          👥
        </div>
      );
    case 'system':
      return (
        <div className={cn(iconClass, 'text-gray-500 flex items-center justify-center')}>
          ℹ️
        </div>
      );
    default:
      return <Bell className={cn(iconClass, 'text-muted-foreground')} />;
  }
}