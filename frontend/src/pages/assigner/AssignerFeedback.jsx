import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, Button, Rating, Chip } from '@mui/material';
import { RateReview, CheckCircle } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import FeedbackModal from '../../components/shared/FeedbackModal';
import { taskAPI } from '../../utils/api';

export default function AssignerFeedback() {
  const [tasks, setTasks] = useState([]);
  const [feedbackTask, setFeedbackTask] = useState(null);
  const load = () => taskAPI.getAll().then(r => setTasks(r.data));
  useEffect(() => { load(); }, []);

  const completedTasks = tasks.filter(t => t.status === 'completed' && t.assignedTo);

  return (
    <PageShell title="Give Feedback" subtitle="Rate writers on completed tasks — affects their performance score">
      {completedTasks.length === 0 ? (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 8, textAlign: 'center' }}>
          <RateReview sx={{ fontSize: 52, color: '#cbd5e1', mb: 2 }} />
          <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>No completed tasks to review yet</Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>Tasks will appear here once writers mark them complete</Typography>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {completedTasks.map(task => {
            const myFeedback = task.Feedbacks?.find(f => f.giverId === task.assignedBy);
            return (
              <Grid item xs={12} md={6} lg={4} key={task.id}>
                <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${myFeedback ? '#bbf7d0' : '#e2e8f0'}`, transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' } }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>{task.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                      <Avatar sx={{ width: 22, height: 22, bgcolor: '#0ea5e9', fontSize: 10 }}>{task.writer?.username?.[0]?.toUpperCase()}</Avatar>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{task.writer?.username}</Typography>
                      <Chip label={`Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : 'N/A'}`} size="small" sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontSize: 10, ml: 'auto' }} />
                    </Box>
                    {myFeedback ? (
                      <Box sx={{ p: 1.5, bgcolor: 'rgba(16,185,129,0.1)', borderRadius: 2, border: '1px solid rgba(16,185,129,0.3)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <CheckCircle sx={{ fontSize: 14, color: '#059669' }} />
                          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>Feedback Submitted</Typography>
                        </Box>
                        <Rating value={myFeedback.rating} readOnly size="small" />
                        {myFeedback.isComplaint && <Chip label="Complaint Filed" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#dc2626', fontWeight: 600, fontSize: 10, mt: 0.5, display: 'flex', width: 'fit-content' }} />}
                      </Box>
                    ) : (
                      <Button fullWidth variant="contained" startIcon={<RateReview />} onClick={() => setFeedbackTask(task)}
                        sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600 }}>
                        Rate This Writer
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
      {feedbackTask && (
        <FeedbackModal open task={feedbackTask} onClose={() => setFeedbackTask(null)} onSuccess={() => { setFeedbackTask(null); load(); }} />
      )}
    </PageShell>
  );
}
