import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Button, Card, CardContent, Avatar, Chip, LinearProgress } from '@mui/material';
import { Assignment, CheckCircle, HourglassEmpty, PendingActions, Warning, OpenInNew } from '@mui/icons-material';
import StatCard from '../shared/StatCard';
import ActivityFeed from '../shared/ActivityFeed';
import InviteModal from '../shared/InviteModal';
import TaskDetailModal from '../shared/TaskDetailModal';
import { taskAPI, userAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function AssignerDashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [writers, setWriters] = useState([]);
  const [detailTask, setDetailTask] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = () => {
    taskAPI.getAll().then(r => setTasks(r.data));
    taskAPI.getStats().then(r => setStats(r.data));
    userAPI.getWriters().then(r => setWriters(r.data));
  };
  useEffect(() => { load(); }, []);

  const unassigned = tasks.filter(t => t.status === 'assigned_to_assigner');
  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const overdue    = tasks.filter(t => t.isOverdue);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Assigner Dashboard</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Distribute tasks to writers and track progress</Typography>
        </Box>
        <Button variant="contained" onClick={() => navigate('/assigner/tasks')}
          sx={{ borderRadius: 2, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, fontWeight: 600, textTransform: 'none' }}>
          Open Task Board
        </Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard title="To Assign"   value={stats.assignedToAssigner || 0} icon={<PendingActions />} color="#d97706" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="With Writer" value={stats.assignedToWriter || 0}   icon={<Assignment />}     color="#7c3aed" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="In Progress" value={stats.inProgress || 0}          icon={<HourglassEmpty />} color="#0369a1" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Overdue"     value={stats.overdue || 0}             icon={<Warning />}        color="#ef4444" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Left: action items */}
        <Grid item xs={12} lg={8}>

          {/* Needs assignment */}
          {unassigned.length > 0 && (
            <Card elevation={0} sx={{ borderRadius: 3, border: '2px solid rgba(245,158,11,0.4)', bgcolor: 'rgba(245,158,11,0.08)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PendingActions sx={{ color: '#d97706' }} />
                    <Typography variant="body1" sx={{ fontWeight: 700, color: 'warning.main' }}>Needs Assignment</Typography>
                    <Chip label={unassigned.length} size="small" sx={{ bgcolor: '#d97706', color: 'white', fontWeight: 700, height: 20, fontSize: 11 }} />
                  </Box>
                  <Button size="small" onClick={() => navigate('/assigner/tasks')} sx={{ textTransform: 'none', color: '#d97706', fontWeight: 600 }}>Assign All →</Button>
                </Box>
                {unassigned.slice(0, 4).map(t => (
                  <Box key={t.id} onClick={() => setDetailTask(t)} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'background.paper', borderRadius: 2, mb: 1, border: '1px solid rgba(245,158,11,0.3)', cursor: 'pointer', '&:hover': { bgcolor: 'rgba(245,158,11,0.12)' } }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 13 }}>{t.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>from {t.creator?.username} · due {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'no date'}</Typography>
                    </Box>
                    <Chip label={t.priority} size="small" sx={{ bgcolor: t.priority === 'high' ? '#fee2e2' : t.priority === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: t.priority === 'high' ? '#dc2626' : t.priority === 'medium' ? '#d97706' : '#059669', fontWeight: 600, fontSize: 10, textTransform: 'capitalize' }} />
                  </Box>
                ))}
                {unassigned.length > 4 && <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 600, pl: 1 }}>+{unassigned.length - 4} more tasks waiting</Typography>}
              </CardContent>
            </Card>
          )}

          {/* Overdue alert */}
          {overdue.length > 0 && (
            <Card elevation={0} sx={{ borderRadius: 3, border: '2px solid #fecaca', bgcolor: 'rgba(239,68,68,0.1)', mb: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Warning sx={{ color: '#dc2626' }} />
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#991b1b' }}>Overdue Tasks</Typography>
                  <Chip label={overdue.length} size="small" sx={{ bgcolor: '#dc2626', color: 'white', fontWeight: 700, height: 20, fontSize: 11 }} />
                </Box>
                {overdue.slice(0, 3).map(t => (
                  <Box key={t.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'background.paper', borderRadius: 2, mb: 1, border: '1px solid rgba(239,68,68,0.3)' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 13 }}>{t.title}</Typography>
                      <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>Due {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'} · {t.writer?.username || 'unassigned'}</Typography>
                    </Box>
                    <Button size="small" startIcon={<OpenInNew sx={{ fontSize: 12 }} />} onClick={() => setDetailTask(t)} sx={{ textTransform: 'none', color: '#dc2626', fontWeight: 600, fontSize: 11 }}>View</Button>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Writers workload summary */}
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>Writer Workload</Typography>
              {writers.length === 0
                ? <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>No writers yet</Typography>
                : writers.map(w => {
                  const active = tasks.filter(t => t.assignedTo === w.id && t.status !== 'completed').length;
                  const score  = w.Performance?.performanceScore || 0;
                  const loadColor = active > 5 ? '#ef4444' : active > 3 ? '#d97706' : '#059669';
                  return (
                    <Box key={w.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#0ea5e9', fontSize: 12, fontWeight: 700 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{w.username}</Typography>
                          <Typography variant="caption" sx={{ color: loadColor, fontWeight: 700 }}>{active} active · {score}% score</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={Math.min(active * 15, 100)} sx={{ height: 5, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: loadColor } }} />
                      </Box>
                    </Box>
                  );
                })
              }
            </CardContent>
          </Card>
        </Grid>

        {/* Right: Activity feed */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 2.5 }}>
            <ActivityFeed limit={10} />
          </Card>
        </Grid>
      </Grid>

      {detailTask && <TaskDetailModal open task={detailTask} onClose={() => setDetailTask(null)} onUpdate={load} />}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Box>
  );
}
