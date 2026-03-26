import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import { Close, Assignment, CheckCircle, RateReview, Warning, Chat, AttachFile, NotificationsActive } from '@mui/icons-material';
import { useNotifications } from '../../context/NotificationContext';

const typeConfig = {
  task_assigned_to_assigner: { icon: Assignment,          color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b', label: 'Task Assigned' },
  task_assigned_to_writer:   { icon: Assignment,          color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', dot: '#8b5cf6', label: 'Task Assigned' },
  task_completed:            { icon: CheckCircle,         color: '#059669', bg: 'rgba(16,185,129,0.1)', border: '#bbf7d0', dot: '#10b981', label: 'Completed' },
  task_in_progress:          { icon: Assignment,          color: '#0369a1', bg: 'rgba(14,165,233,0.15)', border: '#bae6fd', dot: '#0ea5e9', label: 'In Progress' },
  task_overdue:              { icon: Warning,             color: '#dc2626', bg: '#fff1f2', border: '#fecdd3', dot: '#ef4444', label: 'Overdue' },
  feedback_received:         { icon: RateReview,          color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: '#c7d2fe', dot: '#6366f1', label: 'Feedback' },
  comment_added:             { icon: Chat,                color: '#0891b2', bg: 'rgba(6,182,212,0.12)', border: '#a5f3fc', dot: '#06b6d4', label: 'Comment' },
  file_uploaded:             { icon: AttachFile,          color: '#059669', bg: 'rgba(16,185,129,0.1)', border: '#bbf7d0', dot: '#10b981', label: 'File Uploaded' },
  invite_sent:               { icon: NotificationsActive, color: '#7c3aed', bg: '#faf5ff', border: '#ddd6fe', dot: '#8b5cf6', label: 'Invited' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useNotifications();

  return (
    <Box sx={{
      position: 'fixed', top: 72, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 1.5,
      pointerEvents: 'none',
    }}>
      {toasts.map((toast) => (
        <Toast key={toast.toastId} toast={toast} onClose={() => removeToast(toast.toastId)} />
      ))}
    </Box>
  );
}

function Toast({ toast, onClose }) {
  const cfg = typeConfig[toast.type] || typeConfig.task_in_progress;
  const Icon = cfg.icon;
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger enter animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <Box
      onClick={handleClose}
      sx={{
        pointerEvents: 'all',
        width: 340,
        bgcolor: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderRadius: 3,
        p: 2,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex',
        gap: 1.5,
        alignItems: 'flex-start',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: visible ? 'translateX(0) scale(1)' : 'translateX(380px) scale(0.85)',
        opacity: visible ? 1 : 0,
        '&:hover': { transform: 'translateX(-4px) scale(1.01)', boxShadow: '0 12px 40px rgba(0,0,0,0.16)' },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0, top: 0, bottom: 0,
          width: 4,
          bgcolor: cfg.dot,
          borderRadius: '12px 0 0 12px',
        }
      }}
    >
      {/* Icon */}
      <Box sx={{
        width: 36, height: 36, borderRadius: 2,
        bgcolor: `${cfg.dot}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon sx={{ fontSize: 18, color: cfg.color }} />
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.3 }}>
          <Typography variant="body2" sx={{ fontWeight: 800, color: cfg.color, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 }}>
            {cfg.label}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10, mt: 0.1 }}>now</Typography>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 13, lineHeight: 1.4, mb: 0.3 }}>
          {toast.title}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5, display: 'block', fontSize: 12 }}>
          {toast.message}
        </Typography>
      </Box>

      {/* Close */}
      <IconButton
        size="small"
        onClick={e => { e.stopPropagation(); handleClose(); }}
        sx={{ color: 'text.disabled', p: 0.3, flexShrink: 0, '&:hover': { color: cfg.color } }}
      >
        <Close sx={{ fontSize: 14 }} />
      </IconButton>

      {/* Progress bar */}
      <ProgressBar color={cfg.dot} />
    </Box>
  );
}

function ProgressBar({ color }) {
  const [width, setWidth] = React.useState(100);
  React.useEffect(() => {
    const t = setTimeout(() => setWidth(0), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <Box sx={{
      position: 'absolute', bottom: 0, left: 0,
      height: 3, bgcolor: color, borderRadius: '0 0 12px 12px',
      width: `${width}%`,
      transition: 'width 5.2s linear',
      opacity: 0.5,
    }} />
  );
}
