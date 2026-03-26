import React, { useState } from 'react';
import {
  IconButton, Badge, Popover, Box, Typography, Button, Divider, Chip, Avatar
} from '@mui/material';
import {
  Notifications, NotificationsNone, DoneAll,
  Assignment, CheckCircle, RateReview, Warning, Chat, AttachFile, NotificationsActive
} from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';

const typeConfig = {
  task_assigned_to_assigner: { icon: <Assignment sx={{ fontSize: 15 }} />,          color: '#d97706', bg: 'rgba(245,158,11,0.15)' },
  task_assigned_to_writer:   { icon: <Assignment sx={{ fontSize: 15 }} />,          color: '#7c3aed', bg: 'rgba(139,92,246,0.15)' },
  task_completed:            { icon: <CheckCircle sx={{ fontSize: 15 }} />,         color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  task_in_progress:          { icon: <Assignment sx={{ fontSize: 15 }} />,          color: '#0369a1', bg: 'rgba(14,165,233,0.15)' },
  task_overdue:              { icon: <Warning sx={{ fontSize: 15 }} />,             color: '#dc2626', bg: 'rgba(239,68,68,0.15)' },
  feedback_received:         { icon: <RateReview sx={{ fontSize: 15 }} />,          color: '#6366f1', bg: 'rgba(139,92,246,0.15)' },
  comment_added:             { icon: <Chat sx={{ fontSize: 15 }} />,                color: '#0891b2', bg: 'rgba(6,182,212,0.12)' },
  file_uploaded:             { icon: <AttachFile sx={{ fontSize: 15 }} />,          color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  invite_sent:               { icon: <NotificationsActive sx={{ fontSize: 15 }} />, color: '#7c3aed', bg: 'rgba(139,92,246,0.15)' },
};

function timeAgo(date) {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function NotificationBell() {
  const { unreadCount, allNotifications, markRead, markAllRead, bellPulse } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <IconButton
        onClick={e => setAnchorEl(e.currentTarget)}
        sx={{
          color: 'text.secondary',
          animation: bellPulse ? 'bellShake 0.5s ease-in-out' : 'none',
          '@keyframes bellShake': {
            '0%,100%': { transform: 'rotate(0deg) scale(1)' },
            '20%':     { transform: 'rotate(-15deg) scale(1.2)' },
            '40%':     { transform: 'rotate(15deg) scale(1.2)' },
            '60%':     { transform: 'rotate(-10deg) scale(1.1)' },
            '80%':     { transform: 'rotate(10deg) scale(1.1)' },
          },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          color="error"
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              animation: unreadCount > 0 ? 'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)' : 'none',
              '@keyframes badgePop': {
                '0%': { transform: 'scale(0)' },
                '100%': { transform: 'scale(1)' },
              },
            },
          }}
        >
          {unreadCount > 0 ? <Notifications /> : <NotificationsNone />}
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: 400, borderRadius: 3, boxShadow: '0 12px 48px rgba(0,0,0,0.16)', mt: 1 } }}
      >
        {/* Header */}
        <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontWeight: 800, color: 'text.primary', fontSize: 15 }}>Notifications</Typography>
            {unreadCount > 0 && (
              <Chip label={`${unreadCount} new`} size="small" sx={{ bgcolor: '#6366f1', color: 'white', fontWeight: 700, height: 20, fontSize: 10 }} />
            )}
          </Box>
          {unreadCount > 0 && (
            <Button size="small" startIcon={<DoneAll sx={{ fontSize: 13 }} />} onClick={markAllRead}
              sx={{ fontSize: 11, color: '#6366f1', fontWeight: 600, textTransform: 'none', borderRadius: 2 }}>
              Mark all read
            </Button>
          )}
        </Box>

        {/* Notification list */}
        <Box sx={{ maxHeight: 480, overflowY: 'auto' }}>
          {allNotifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <NotificationsNone sx={{ fontSize: 44, color: 'divider', mb: 1.5 }} />
              <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 500 }}>You're all caught up!</Typography>
              <Typography variant="caption" sx={{ color: '#cbd5e1' }}>No notifications yet</Typography>
            </Box>
          ) : (
            allNotifications.map((n, i) => {
              const tc = typeConfig[n.type] || typeConfig.task_in_progress;
              return (
                <React.Fragment key={n.id}>
                  <Box
                    onClick={() => !n.isRead && markRead(n.id)}
                    sx={{
                      px: 2.5, py: 1.8,
                      display: 'flex', gap: 1.5, alignItems: 'flex-start',
                      bgcolor: n.isRead ? 'transparent' : '#fafbff',
                      cursor: n.isRead ? 'default' : 'pointer',
                      transition: 'background 0.15s',
                      '&:hover': { bgcolor: 'background.default' },
                      borderLeft: n.isRead ? '3px solid transparent' : `3px solid ${tc.color}`,
                    }}
                  >
                    {/* Icon badge */}
                    <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.2 }}>
                      {tc.icon}
                    </Box>

                    {/* Text */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                        <Typography variant="body2" sx={{ fontWeight: n.isRead ? 500 : 800, color: 'text.primary', fontSize: 13, lineHeight: 1.3 }}>
                          {n.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11, flexShrink: 0, ml: 1 }}>
                          {timeAgo(n.createdAt)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block' }}>
                        {n.message}
                      </Typography>
                    </Box>

                    {/* Unread dot */}
                    {!n.isRead && (
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tc.color, flexShrink: 0, mt: 0.8 }} />
                    )}
                  </Box>
                  {i < allNotifications.length - 1 && <Divider sx={{ mx: 2.5, opacity: 0.5 }} />}
                </React.Fragment>
              );
            })
          )}
        </Box>

        {/* Footer */}
        {allNotifications.length > 0 && (
          <Box sx={{ px: 2.5, py: 1.5, borderTop: '1px solid #f1f5f9', bgcolor: 'background.paper', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
              Updates every 5 seconds · {allNotifications.length} total notifications
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
}
