import React from 'react';
import { Box, Typography, Avatar, Chip, Divider } from '@mui/material';
import {
  Assignment, CheckCircle, RateReview, Warning, Chat, AttachFile,
  NotificationsActive, HourglassEmpty, EmojiEvents
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';

const typeConfig = {
  task_assigned_to_assigner: { icon: Assignment,          color: '#d97706', bg: 'rgba(245,158,11,0.15)', label: 'Assigned to you' },
  task_assigned_to_writer:   { icon: Assignment,          color: '#7c3aed', bg: 'rgba(139,92,246,0.15)', label: 'Assigned to writer' },
  task_completed:            { icon: CheckCircle,         color: '#059669', bg: 'rgba(16,185,129,0.15)', label: 'Completed' },
  task_in_progress:          { icon: HourglassEmpty,      color: '#0369a1', bg: 'rgba(14,165,233,0.15)', label: 'In progress' },
  task_overdue:              { icon: Warning,             color: '#dc2626', bg: 'rgba(239,68,68,0.15)', label: 'Overdue' },
  feedback_received:         { icon: RateReview,          color: '#6366f1', bg: 'rgba(139,92,246,0.15)', label: 'Feedback received' },
  comment_added:             { icon: Chat,                color: '#0891b2', bg: 'rgba(6,182,212,0.12)', label: 'New comment' },
  file_uploaded:             { icon: AttachFile,          color: '#059669', bg: 'rgba(16,185,129,0.15)', label: 'File uploaded' },
  invite_sent:               { icon: NotificationsActive, color: '#7c3aed', bg: 'rgba(139,92,246,0.15)', label: 'Invitation' },
};

function timeAgo(date) {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ActivityFeed({ limit = 8, showTitle = true }) {
  const { allNotifications, markRead, unreadCount } = useNotifications();
  const recent = allNotifications.slice(0, limit);

  return (
    <Box>
      {showTitle && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary', fontSize: 14 }}>
              Live Activity
            </Typography>
            {unreadCount > 0 && (
              <Box sx={{
                width: 8, height: 8, borderRadius: '50%', bgcolor: '#6366f1',
                animation: 'livePulse 2s infinite',
                '@keyframes livePulse': {
                  '0%,100%': { opacity: 1, transform: 'scale(1)' },
                  '50%': { opacity: 0.4, transform: 'scale(1.6)' },
                }
              }} />
            )}
          </Box>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} new`} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.12)', color: '#6366f1', fontWeight: 700, fontSize: 10, height: 20 }} />
          )}
        </Box>
      )}

      {recent.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <EmojiEvents sx={{ fontSize: 36, color: 'divider', mb: 1 }} />
          <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 500 }}>No activity yet</Typography>
          <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Events will appear here in real time</Typography>
        </Box>
      ) : (
        <Box>
          {recent.map((n, i) => {
            const cfg = typeConfig[n.type] || typeConfig.task_in_progress;
            const Icon = cfg.icon;
            return (
              <Box
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                sx={{
                  display: 'flex', gap: 1.5, py: 1.5,
                  cursor: n.isRead ? 'default' : 'pointer',
                  borderRadius: 2,
                  px: 1,
                  bgcolor: n.isRead ? 'transparent' : `${cfg.color}08`,
                  transition: 'all 0.2s',
                  '&:hover': { bgcolor: 'background.default' },
                  // Slide-in animation for new items
                  animation: !n.isRead ? 'slideIn 0.4s ease-out' : 'none',
                  '@keyframes slideIn': {
                    '0%': { opacity: 0, transform: 'translateX(-12px)' },
                    '100%': { opacity: 1, transform: 'translateX(0)' },
                  },
                }}
              >
                {/* Timeline dot + line */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <Box sx={{
                    width: 30, height: 30, borderRadius: 2,
                    bgcolor: cfg.bg, color: cfg.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: n.isRead ? 'none' : `2px solid ${cfg.color}40`,
                  }}>
                    <Icon sx={{ fontSize: 14 }} />
                  </Box>
                  {i < recent.length - 1 && (
                    <Box sx={{ width: 2, flex: 1, bgcolor: 'action.hover', mt: 0.5, minHeight: 8 }} />
                  )}
                </Box>

                {/* Content */}
                <Box sx={{ flex: 1, pb: i < recent.length - 1 ? 1.5 : 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: n.isRead ? 500 : 700, color: 'text.primary', fontSize: 12.5, lineHeight: 1.4 }}>
                        {n.title}
                        {!n.isRead && (
                          <Box component="span" sx={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', bgcolor: cfg.color, ml: 0.8, mb: 0.2, verticalAlign: 'middle' }} />
                        )}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block', fontSize: 11.5 }}>
                        {n.message}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10, flexShrink: 0, ml: 1, mt: 0.2 }}>
                      {timeAgo(n.createdAt)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
