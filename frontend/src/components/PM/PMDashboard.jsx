import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Button, Card, CardContent, Tab, Tabs, Chip } from '@mui/material';
import { Assignment, CheckCircle, HourglassEmpty, Add, PersonAdd, RateReview, Warning } from '@mui/icons-material';
import StatCard from '../shared/StatCard';
import TaskTable from '../shared/TaskTable';
import TaskFormModal from '../shared/TaskFormModal';
import FeedbackModal from '../shared/FeedbackModal';
import ActivityFeed from '../shared/ActivityFeed';
import InviteModal from '../shared/InviteModal';
import { taskAPI, userAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function PMDashboard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({});
  const [writers, setWriters] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [feedbackTask, setFeedbackTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = () => {
    taskAPI.getAll().then(r => setTasks(r.data));
    taskAPI.getStats().then(r => setStats(r.data));
    userAPI.getWriters().then(r => setWriters(r.data));
  };
  useEffect(() => { load(); }, []);

  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Project Manager</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Create tasks and assign to your team</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" startIcon={<PersonAdd />} onClick={() => setInviteOpen(true)}
            sx={{ borderRadius: 2, borderColor: 'divider', color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>Invite</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/pm/create-task')}
            sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, textTransform: 'none' }}>New Task</Button>
        </Box>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard title="Total Tasks"  value={stats.total || 0}     icon={<Assignment />}     color="#6366f1" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Completed"    value={stats.completed || 0} icon={<CheckCircle />}    color="#059669" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="In Progress"  value={stats.inProgress || 0}icon={<HourglassEmpty />} color="#d97706" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Overdue"      value={stats.overdue || 0}   icon={<Warning />}        color="#ef4444" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 3 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}>
                <Tab label={`All Tasks (${tasks.length})`} />
                <Tab label={`Needs Feedback (${completedTasks.length})`} />
              </Tabs>
              {tab === 0 && <TaskTable tasks={tasks} onRefresh={load} showAssign={false} onEdit={t => { setEditTask(t); setCreateOpen(true); }} onFeedback={t => setFeedbackTask(t)} />}
              {tab === 1 && (
                completedTasks.length === 0
                  ? <Box sx={{ textAlign: 'center', py: 5 }}><RateReview sx={{ fontSize: 44, color: 'divider', mb: 1 }} /><Typography variant="body2" sx={{ color: 'text.disabled' }}>No completed tasks awaiting feedback</Typography></Box>
                  : <TaskTable tasks={completedTasks} onRefresh={load} onFeedback={t => setFeedbackTask(t)} />
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 2.5 }}>
            <ActivityFeed limit={10} />
          </Card>
        </Grid>
      </Grid>

      <TaskFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={load} editTask={editTask} />
      {feedbackTask && <FeedbackModal open task={feedbackTask} onClose={() => setFeedbackTask(null)} onSuccess={load} />}
      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </Box>
  );
}