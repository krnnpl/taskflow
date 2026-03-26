import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { notificationAPI } from '../utils/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [allNotifications, setAllNotifications] = useState([]);
  const [bellPulse, setBellPulse] = useState(false);
  const prevIdsRef = useRef(new Set());
  const isFirstPoll = useRef(true);

  // Add a toast manually (used by other components if needed)
  const addToast = useCallback((notification) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { ...notification, toastId: id }]); // max 5 toasts
    setTimeout(() => removeToast(id), 5500);
  }, []);

  const removeToast = useCallback((toastId) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  // Poll for notifications every 5 seconds
  const poll = useCallback(async () => {
    if (!user) return;
    try {
      const [notifRes, countRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount(),
      ]);
      const incoming = notifRes.data;
      const newCount = countRes.data.count;

      setAllNotifications(incoming);

      // Detect brand-new notifications (not seen before)
      if (!isFirstPoll.current) {
        const newOnes = incoming.filter(n => !prevIdsRef.current.has(n.id) && !n.isRead);
        newOnes.forEach(n => addToast(n));
        if (newOnes.length > 0) {
          setBellPulse(true);
          setTimeout(() => setBellPulse(false), 2000);
        }
      }

      // Update known IDs
      prevIdsRef.current = new Set(incoming.map(n => n.id));
      setUnreadCount(newCount);
      isFirstPoll.current = false;
    } catch {}
  }, [user, addToast]);

  useEffect(() => {
    if (!user) return;
    isFirstPoll.current = true;
    prevIdsRef.current = new Set();
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [user, poll]);

  const markRead = async (id) => {
    await notificationAPI.markRead(id).catch(() => {});
    setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead().catch(() => {});
    setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ toasts, removeToast, unreadCount, allNotifications, markRead, markAllRead, bellPulse, addToast }}>
      {children}
    </NotificationContext.Provider>
  );
}
