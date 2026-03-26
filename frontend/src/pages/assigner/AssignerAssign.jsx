import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Alert, LinearProgress } from '@mui/material';
import { ArrowForward, PersonAdd } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import { taskAPI, userAPI, authAPI } from '../../utils/api';

const levelConfig = {
  beginner: { color: 'text.secondary', bg: 'rgba(100,116,139,0.15)', emoji: '🌱' },
  intermediate: { color: '#d97706', bg: 'rgba(245,158,11,0.15)', emoji: '⭐' },
  expert: { color: '#059669', bg: 'rgba(16,185,129,0.15)', emoji: '🏆' },
};

export default function AssignerAssign() {
  const [tasks, setTasks] = useState([]);
  const [writers, setWriters] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedWriter, setSelectedWriter] = useState('');
  const [msg, setMsg] = useState({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMsg, setInviteMsg] = useState({});
  const [availability, setAvailability] = useState([]);

  const load = () => {
    taskAPI.getAll().then(r => setTasks(r.data));
    userAPI.getWriters().then(r => setWriters(r.data));
    userAPI.getAvailability().then(r => setAvailability(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const unassigned = tasks.filter(t => t.status === 'assigned_to_assigner');

  const handleAssign = async () => {
    if (!selectedWriter) return setMsg({ type: 'error', text: 'Select a writer' });
    try {
      await taskAPI.assignToWriter(selectedTask.id, { assignedTo: selectedWriter });
      setAssignOpen(false);
      load();
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
  };

  const handleInvite = async () => {
    setInviteMsg({});
    try {
      await authAPI.invite({ email: inviteEmail, role: 'writer' });
      setInviteMsg({ type: 'success', text: `Writer invitation sent to ${inviteEmail}` });
      setInviteEmail('');
    } catch (err) { setInviteMsg({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
  };

  return (
    <PageShell title="Assign Writers" subtitle="Match tasks from PM to the best available writers"
      action={<Button variant="outlined" startIcon={<PersonAdd />} onClick={() => setInviteOpen(true)} sx={{ borderRadius: 2, borderColor: 'divider', color: 'text.secondary' }}>Invite Writer</Button>}>

      {unassigned.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
            Tasks Waiting for Assignment
            <Chip label={unassigned.length} size="small" sx={{ ml: 1, bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706', fontWeight: 700 }} />
          </Typography>
          <Grid container spacing={2}>
            {unassigned.map(task => (
              <Grid item xs={12} md={6} key={task.id}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '2px solid #fbbf24', bgcolor: 'rgba(245,158,11,0.08)' }}>
                  <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{task.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'warning.main' }}>Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}</Typography>
                      <Box sx={{ mt: 0.5 }}><Chip label={task.priority} size="small" sx={{ bgcolor: task.priority === 'high' ? '#fee2e2' : 'rgba(245,158,11,0.15)', color: task.priority === 'high' ? '#dc2626' : '#d97706', fontWeight: 600, fontSize: 10, textTransform: 'capitalize' }} /></Box>
                    </Box>
                    <Button variant="contained" endIcon={<ArrowForward />} onClick={() => { setSelectedTask(task); setSelectedWriter(''); setMsg({}); setAssignOpen(true); }}
                      sx={{ borderRadius: 2, bgcolor: '#d97706', '&:hover': { bgcolor: 'warning.main' }, whiteSpace: 'nowrap', ml: 2 }}>
                      Assign
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>
        Available Writers
        <Chip label={writers.length} size="small" sx={{ ml: 1, bgcolor: 'rgba(14,165,233,0.15)', color: '#0369a1', fontWeight: 700 }} />
      </Typography>
      <Grid container spacing={2}>
        {writers.map(w => {
          const lc = levelConfig[w.Performance?.level] || levelConfig.beginner;
          const activeTasks = tasks.filter(t => t.assignedTo === w.id && t.status !== 'completed').length;
          return (
            <Grid item xs={12} sm={6} md={4} key={w.id}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }, transition: 'all 0.2s' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: '#0ea5e9', fontWeight: 700, width: 44, height: 44 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{w.username}</Typography>
                      <Chip label={`${lc.emoji} ${w.Performance?.level || 'beginner'}`} size="small" sx={{ bgcolor: lc.bg, color: lc.color, fontWeight: 600, fontSize: 10, mt: 0.3, textTransform: 'capitalize' }} />
                    </Box>
                  </Box>
                  {w.Performance && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Performance</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#6366f1' }}>{w.Performance.performanceScore}%</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={w.Performance.performanceScore} sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: '#6366f1' } }} />
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={`${activeTasks} active`} size="small" sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 600, fontSize: 10 }} />
                    <Chip label={`${w.Performance?.completedTasks || 0} done`} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#059669', fontWeight: 600, fontSize: 10 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign Task to Writer</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedTask && <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mb: 2, border: '1px solid' }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTask.title}</Typography></Box>}
          {msg.text && <Alert severity={msg.type} sx={{ mb: 2, borderRadius: 2 }}>{msg.text}</Alert>}
          <FormControl fullWidth>
            <InputLabel>Select Writer</InputLabel>
            <Select value={selectedWriter} label="Select Writer" onChange={e => setSelectedWriter(e.target.value)} sx={{ borderRadius: 2 }}>
              {writers.map(w => (
                <MenuItem key={w.id} value={w.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 26, height: 26, bgcolor: '#0ea5e9', fontSize: 11 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
                    <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{w.username}</Typography>
                    {w.Performance && <Typography variant="caption" sx={{ color: 'text.disabled' }}>Score: {w.Performance.performanceScore}% · {w.Performance.completedTasks} done</Typography>}</Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAssignOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} sx={{ borderRadius: 2, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>Assign Writer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Invite New Writer</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {inviteMsg.text && <Alert severity={inviteMsg.type} sx={{ borderRadius: 2 }}>{inviteMsg.text}</Alert>}
          <input type="email" placeholder="writer@email.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
            style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setInviteOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleInvite} sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>Send Invite</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
