import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Button, Card, CardContent, Chip, Avatar, LinearProgress } from '@mui/material';
import { Assignment, CheckCircle, HourglassEmpty, Warning, PlayArrow, Star, EmojiEvents } from '@mui/icons-material';
import StatCard from '../shared/StatCard';
import ActivityFeed from '../shared/ActivityFeed';
import TaskDetailModal from '../shared/TaskDetailModal';
import { taskAPI, userAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  assigned_to_writer: { color: '#7c3aed', bg: 'rgba(139,92,246,0.15)', label: 'New' },
  in_progress:        { color: '#0369a1', bg: 'rgba(14,165,233,0.15)', label: 'In Progress' },
  completed:          { color: '#059669', bg: 'rgba(16,185,129,0.15)', label: 'Done' },
  overdue:            { color: '#dc2626', bg: 'rgba(239,68,68,0.15)', label: 'Overdue' },
};

export default function WriterDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [perf, setPerf] = useState(null);
  const [detailTask, setDetailTask] = useState(null);

  const load = () => {
    taskAPI.getAll().then(r => setTasks(r.data));
    taskAPI.getStats().then(r => setStats(r.data));
    userAPI.getMyPerformance().then(r => setPerf(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const newTasks     = tasks.filter(t => t.status === 'assigned_to_writer');
  const activeTasks  = tasks.filter(t => t.status === 'in_progress');
  const overdueTasks = tasks.filter(t => t.isOverdue || t.status === 'overdue');

  const levelConfig = { beginner: { color: 'text.secondary', emoji: '🌱' }, intermediate: { color: '#d97706', emoji: '⭐' }, expert: { color: '#059669', emoji: '🏆' } };
  const lc = levelConfig[perf?.level] || levelConfig.beginner;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>My Dashboard</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Your tasks, performance and latest activity</Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/writer/tasks')}
          sx={{ borderRadius: 2, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' }, fontWeight: 600, textTransform: 'none' }}>
          View All Tasks
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard title="New Tasks"  value={stats.assignedToWriter || 0} icon={<Assignment />}      color="#7c3aed" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="In Progress"value={stats.inProgress || 0}       icon={<HourglassEmpty />}  color="#0369a1" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Completed"  value={stats.completed || 0}        icon={<CheckCircle />}     color="#059669" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Overdue"    value={stats.overdue || 0}          icon={<Warning />}         color="#ef4444" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left column */}
        <Grid item xs={12} lg={8}>

          {/* New tasks alert */}
          {newTasks.length > 0 && (
            <Card elevation={0} sx={{ borderRadius: 3, border: '2px solid #ddd6fe', bgcolor: '#faf5ff', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PlayArrow sx={{ color: '#7c3aed' }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: '#581c87' }}>New Tasks Ready to Start</Typography>
                    <Chip label={newTasks.length} size="small" sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 700, height: 20, fontSize: 11 }} />
                  </Box>
                  <Button size="small" onClick={() => navigate('/writer/tasks')} sx={{ textTransform: 'none', color: '#7c3aed', fontWeight: 600 }}>Start Working →</Button>
                </Box>
                {newTasks.slice(0, 3).map(t => (
                  <Box key={t.id} onClick={() => setDetailTask(t)} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'background.paper', borderRadius: 2, mb: 1, border: '1px solid rgba(139,92,246,0.3)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(139,92,246,0.12)' } }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 13 }}>{t.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>from {t.assigner?.username || t.assignerUser?.username || 'Assigner'} · due {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'no date'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Chip label={t.priority} size="small" sx={{ bgcolor: t.priority === 'high' ? '#fee2e2' : 'rgba(245,158,11,0.15)', color: t.priority === 'high' ? '#dc2626' : '#d97706', fontWeight: 600, fontSize: 10, textTransform: 'capitalize' }} />
                      {t.TaskAttachments?.length > 0 && <Chip label={`📎 ${t.TaskAttachments.length}`} size="small" sx={{ bgcolor: 'rgba(14,165,233,0.15)', color: '#0369a1', fontSize: 10, fontWeight: 600 }} />}
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Overdue warning */}
          {overdueTasks.length > 0 && (
            <Card elevation={0} sx={{ borderRadius: 3, border: '2px solid #fecaca', bgcolor: 'rgba(239,68,68,0.1)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Warning sx={{ color: '#dc2626' }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#991b1b' }}>Overdue — Action Needed</Typography>
                  <Chip label={overdueTasks.length} size="small" sx={{ bgcolor: '#dc2626', color: 'white', fontWeight: 700, height: 20 }} />
                </Box>
                {overdueTasks.map(t => (
                  <Box key={t.id} onClick={() => setDetailTask(t)} sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: 'background.paper', borderRadius: 2, mb: 1, border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#dc2626' }}>{t.title}</Typography>
                    <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>Due {new Date(t.dueDate).toLocaleDateString()}</Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Performance card */}
          {perf && (
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>My Performance</Typography>
                  <Button size="small" onClick={() => navigate('/writer/performance')} sx={{ textTransform: 'none', color: '#6366f1', fontWeight: 600, fontSize: 12 }}>Full Report →</Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 44, fontWeight: 900, color: lc.color, lineHeight: 1 }}>{Math.round(perf.performanceScore)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>Score</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Chip label={`${lc.emoji} ${perf.level}`} sx={{ bgcolor: `${lc.color}15`, color: lc.color, fontWeight: 700, textTransform: 'capitalize', mb: 1 }} />
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>✅ {perf.completedTasks} completed</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>⭐ {perf.avgRating}/5 rating</Typography>
                      {perf.complaints > 0 && <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {perf.complaints} complaint{perf.complaints > 1 ? 's' : ''}</Typography>}
                      {perf.totalCorrections > 0 && <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600 }}>🔄 {perf.totalCorrections} correction{perf.totalCorrections > 1 ? 's' : ''}</Typography>}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right: Activity Feed */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 2.5 }}>
            <ActivityFeed limit={12} />
          </Card>
        </Grid>
      </Grid>

      {detailTask && <TaskDetailModal open task={detailTask} onClose={() => setDetailTask(null)} onUpdate={load} />}
    </Box>
  );
}
