import React, { useState, useEffect } from 'react';
import { Box, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip,
  Typography, Select, MenuItem, Checkbox, Button, IconButton, Tooltip, Avatar, LinearProgress } from '@mui/material';
import { OpenInNew, PlayArrow, Stop, Warning, Schedule } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import TaskDetailModal from '../../components/shared/TaskDetailModal';
import { taskAPI } from '../../utils/api';

const statusConfig = {
  assigned_to_writer: { label: 'New',        color: '#7c3aed', bg: 'rgba(139,92,246,0.15)' },
  in_progress:        { label: 'In Progress', color: '#0369a1', bg: 'rgba(14,165,233,0.15)' },
  completed:          { label: 'Completed',   color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  overdue:            { label: 'Overdue',     color: '#dc2626', bg: 'rgba(239,68,68,0.15)' },
};

function formatTime(mins) {
  if (!mins) return '—';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function WriterTasks() {
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState([]);
  const [detailTask, setDetailTask] = useState(null);
  const [timerTask, setTimerTask] = useState(null);

  const load = () => taskAPI.getAll().then(r => setTasks(r.data));
  useEffect(() => { load(); }, []);

  const [statusError, setStatusError] = useState('');

  const handleStatus = async (task, status) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t));
    try {
      await taskAPI.update(task.id, { status });
      load();
    } catch (err) {
      // Revert on error
      load();
      setStatusError(err.response?.data?.message || 'Cannot change status');
      setTimeout(() => setStatusError(''), 4000);
    }
  };

  const handleTimer = async (task) => {
    if (task.timerStartedAt) {
      await taskAPI.stopTimer(task.id);
      setTimerTask(null);
    } else {
      await taskAPI.startTimer(task.id);
      setTimerTask(task.id);
    }
    load();
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(selected.length === tasks.length ? [] : tasks.map(t => t.id));

  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const TaskRow = ({ task }) => {
    const sc = statusConfig[task.status] || { label: task.status, color: 'text.secondary', bg: 'rgba(100,116,139,0.15)' };
    const isOverdue = task.isOverdue || task.status === 'overdue';
    const isTimerOn = !!task.timerStartedAt;
    const progress = task.estimatedMinutes ? Math.min(Math.round(((task.loggedMinutes || 0) / task.estimatedMinutes) * 100), 100) : 0;
    return (
      <TableRow hover sx={{ bgcolor: isOverdue ? '#fff8f8' : 'white', '&:hover': { bgcolor: isOverdue ? '#fff1f1' : '#f8fafc' } }}>
        <TableCell padding="checkbox"><Checkbox checked={selected.includes(task.id)} onChange={() => toggleSelect(task.id)} size="small" /></TableCell>
        <TableCell sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            {isOverdue && <Warning sx={{ fontSize: 15, color: '#dc2626', mt: 0.2, flexShrink: 0 }} />}
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.2, lineHeight: 1.4 }}>{task.title}</Typography>
              {task.description && <Typography variant="caption" sx={{ color: 'text.disabled' }}>{task.description.slice(0, 60)}{task.description.length > 60 ? '...' : ''}</Typography>}
              {task.estimatedMinutes > 0 && (
                <Box sx={{ mt: 0.8, maxWidth: 180 }}>
                  <LinearProgress variant="determinate" value={progress} sx={{ height: 4, borderRadius: 2, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: progress > 90 ? '#ef4444' : '#6366f1' } }} />
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>{formatTime(task.loggedMinutes)} / {formatTime(task.estimatedMinutes)}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </TableCell>
        <TableCell>
          <Chip label={task.priority} size="small" sx={{ bgcolor: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#d97706' : '#059669', fontWeight: 600, fontSize: 11, textTransform: 'capitalize' }} />
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Schedule sx={{ fontSize: 13, color: isOverdue ? '#dc2626' : '#94a3b8' }} />
            <Typography variant="caption" sx={{ fontWeight: isOverdue ? 700 : 400, color: isOverdue ? '#dc2626' : '#64748b' }}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          {task.assigner && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Avatar sx={{ width: 20, height: 20, bgcolor: '#059669', fontSize: 9 }}>{task.assigner.username?.[0]?.toUpperCase()}</Avatar><Typography variant="caption" sx={{ color: 'text.secondary' }}>{task.assigner.username}</Typography></Box>}
        </TableCell>
        <TableCell><Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: 11 }} /></TableCell>
        <TableCell>
          {task.status === 'completed' ? (
            <Button size="small" variant="outlined" onClick={() => handleStatus(task, 'in_progress')}
              sx={{ fontSize: 11, textTransform: 'none', borderRadius: 2, borderColor: '#d97706', color: '#d97706',
                px: 1.5, py: 0.3, '&:hover': { bgcolor: 'rgba(245,158,11,0.15)', borderColor: '#d97706' } }}>
              🔄 Reopen
            </Button>
          ) : (
            <Select size="small" value={task.status} onChange={e => handleStatus(task, e.target.value)}
              sx={{ fontSize: 12, minWidth: 130, borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}>
              <MenuItem value="assigned_to_writer">Not Started</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="completed">✓ Complete</MenuItem>
            </Select>
          )}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {task.status !== 'completed' && (
              <Tooltip title={task.timerStartedAt ? 'Stop timer' : 'Start timer'}>
                <IconButton size="small" onClick={() => handleTimer(task)}
                  sx={{ bgcolor: task.timerStartedAt ? '#fee2e2' : 'rgba(16,185,129,0.15)', color: task.timerStartedAt ? '#dc2626' : '#059669', '&:hover': { opacity: 0.8 } }}>
                  {task.timerStartedAt ? <Stop sx={{ fontSize: 14 }} /> : <PlayArrow sx={{ fontSize: 14 }} />}
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="View details, comments & files">
              <IconButton size="small" onClick={() => setDetailTask(task)} sx={{ color: '#6366f1', '&:hover': { bgcolor: 'rgba(139,92,246,0.15)' } }}>
                <OpenInNew sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <PageShell title="My Tasks" subtitle="All tasks assigned to you — click 📂 to view details, comments and upload your work"
      action={selected.length > 0 && (
        <Button variant="outlined" size="small" onClick={() => { selected.forEach(id => handleStatus({ id }, 'in_progress')); setSelected([]); }}
          sx={{ borderRadius: 2, borderColor: 'divider', color: 'text.secondary', fontWeight: 600, mr: 1, textTransform: 'none' }}>
          Mark {selected.length} as In Progress
        </Button>
      )}>
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"><Checkbox checked={tasks.length > 0 && selected.length === tasks.length} indeterminate={selected.length > 0 && selected.length < tasks.length} onChange={toggleAll} size="small" /></TableCell>
                {['Task','Priority','Due Date','Assigned By','Status','Update Status','Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {activeTasks.map(t => <TaskRow key={t.id} task={t} />)}
              {completedTasks.length > 0 && activeTasks.length > 0 && (
                <TableRow><TableCell colSpan={8} sx={{ bgcolor: 'background.default', py: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>Completed ({completedTasks.length})</Typography>
                </TableCell></TableRow>
              )}
              {completedTasks.map(t => <TaskRow key={t.id} task={t} />)}
              {tasks.length === 0 && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}><Typography variant="body2" sx={{ color: 'text.disabled' }}>No tasks assigned yet</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {detailTask && <TaskDetailModal open task={detailTask} onClose={() => setDetailTask(null)} onUpdate={() => { load(); setDetailTask(null); }} />}
    </PageShell>
  );
}
