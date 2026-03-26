import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Avatar, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Rating, TextField, Switch, FormControlLabel, Alert, IconButton, Tooltip, LinearProgress
} from '@mui/material';
import { RateReview, Edit, Delete, Star, Warning, Refresh } from '@mui/icons-material';
import { taskAPI, feedbackAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = { completed: '#059669', overdue: '#ef4444', in_progress: '#0ea5e9' };

function FeedbackForm({ task, existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    feedbackText: existing?.feedbackText || '',
    rating: existing?.rating || 4,
    isComplaint: existing?.isComplaint || false,
    correctionRequested: existing?.correctionRequested || false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      if (existing) await feedbackAPI.update(existing.id, form);
      else          await feedbackAPI.create({ taskId: task.id, ...form });
      onSaved();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>Star Rating</Typography>
        <Rating value={form.rating} onChange={(_, v) => setForm(p => ({ ...p, rating: v }))} size="large" />
      </Box>
      <TextField label="Feedback" multiline rows={3} fullWidth
        value={form.feedbackText} onChange={e => setForm(p => ({ ...p, feedbackText: e.target.value }))}
        placeholder="Describe the quality, what was good, what needs improvement..."
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
      <Box sx={{ display: 'flex', gap: 3 }}>
        <FormControlLabel
          control={<Switch checked={form.isComplaint} onChange={e => setForm(p => ({ ...p, isComplaint: e.target.checked }))} color="error" size="small" />}
          label={<Typography variant="body2" sx={{ fontSize: 13 }}>⚠️ Flag as complaint</Typography>} />
        <FormControlLabel
          control={<Switch checked={form.correctionRequested} onChange={e => setForm(p => ({ ...p, correctionRequested: e.target.checked }))} color="warning" size="small" />}
          label={<Typography variant="body2" sx={{ fontSize: 13 }}>🔄 Request correction</Typography>} />
      </Box>
      {form.isComplaint         && <Alert severity="error"   sx={{ borderRadius: 2, py: 0.5 }}>Adds a complaint penalty (−5 pts) to writer score</Alert>}
      {form.correctionRequested && <Alert severity="warning" sx={{ borderRadius: 2, py: 0.5 }}>Adds a correction penalty (−3 pts) to writer score</Alert>}
      <Button variant="contained" onClick={handleSave} disabled={saving}
        sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 700 }}>
        {saving ? 'Saving...' : existing ? 'Update Feedback' : 'Submit Feedback'}
      </Button>
    </Box>
  );
}

export default function PMFeedback() {
  const { user }    = useAuth();
  const [tasks, setTasks]         = useState([]);
  const [feedbacks, setFeedbacks] = useState({});
  const [dialogTask, setDialogTask] = useState(null);
  const [editFb, setEditFb]       = useState(null);

  const load = async () => {
    const r = await taskAPI.getAll();
    const completed = r.data.filter(t => t.status === 'completed');
    setTasks(completed);
    // Load feedback for each completed task
    const fbs = {};
    await Promise.all(completed.map(async t => {
      try {
        const fr = await feedbackAPI.getForTask(t.id);
        fbs[t.id] = fr.data;
      } catch {}
    }));
    setFeedbacks(fbs);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (fbId, taskId) => {
    if (!window.confirm('Remove this feedback? Scores will be recalculated.')) return;
    try {
      await feedbackAPI.delete(fbId);
      await load();
    } catch {}
  };

  const openFeedback = (task, existingFb = null) => {
    setDialogTask(task);
    setEditFb(existingFb);
  };

  const myFeedbackForTask = (taskId) => feedbacks[taskId]?.find(f => f.giverId === user?.id);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Give Feedback</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Rate writers on completed tasks · Feedback can be edited or removed · Scores update in real-time
        </Typography>
      </Box>

      {tasks.length === 0 ? (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 6, textAlign: 'center' }}>
          <Star sx={{ fontSize: 48, color: 'divider', mb: 1.5 }} />
          <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>No completed tasks yet</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Feedback can be given once writers complete their tasks</Typography>
        </Card>
      ) : (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                {['Task','Writer','Your Feedback','Score Preview','Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map(t => {
                const myFb      = myFeedbackForTask(t.id);
                const allFbs    = feedbacks[t.id] || [];
                const avgRating = allFbs.length ? (allFbs.filter(f=>f.rating).reduce((a,b) => a + b.rating, 0) / allFbs.filter(f=>f.rating).length).toFixed(1) : null;
                return (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{t.title}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {allFbs.length} feedback total
                        {t.isOverdue && ' · Was overdue'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {t.writer ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, bgcolor: '#0ea5e9', fontSize: 11, fontWeight: 700 }}>
                            {t.writer.username[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{t.writer.username}</Typography>
                        </Box>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      {myFb ? (
                        <Box>
                          <Rating value={myFb.rating} readOnly size="small" />
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3, flexWrap: 'wrap' }}>
                            {myFb.isComplaint         && <Chip label="⚠️ Complaint" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 10, height: 18 }} />}
                            {myFb.correctionRequested && <Chip label="🔄 Correction" size="small" sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706', fontSize: 10, height: 18 }} />}
                          </Box>
                          {myFb.feedbackText && <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, display: 'block', mt: 0.3, fontStyle: 'italic' }}>"{myFb.feedbackText.slice(0, 60)}{myFb.feedbackText.length > 60 ? '...' : ''}"</Typography>}
                        </Box>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Not given yet</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {avgRating ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography sx={{ fontSize: 18, fontWeight: 800, color: '#6366f1' }}>{avgRating}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>/5 avg</Typography>
                        </Box>
                      ) : <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {myFb ? (
                          <>
                            <Tooltip title="Edit feedback">
                              <IconButton size="small" onClick={() => openFeedback(t, myFb)}
                                sx={{ color: '#6366f1', p: 0.5, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(99,102,241,0.12)' } }}>
                                <Edit sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Remove feedback">
                              <IconButton size="small" onClick={() => handleDelete(myFb.id, t.id)}
                                sx={{ color: 'text.disabled', p: 0.5, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444' } }}>
                                <Delete sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <Button size="small" startIcon={<RateReview sx={{ fontSize: 13 }} />}
                            onClick={() => openFeedback(t, null)}
                            sx={{ textTransform: 'none', fontSize: 12, color: '#6366f1', bgcolor: 'rgba(99,102,241,0.12)',
                              px: 1.5, borderRadius: 2, fontWeight: 600, '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}>
                            Give Feedback
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!dialogTask} onClose={() => { setDialogTask(null); setEditFb(null); }}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16, pb: 0 }}>
          {editFb ? 'Edit Feedback' : 'Give Feedback'} — {dialogTask?.title}
        </DialogTitle>
        <DialogContent>
          {dialogTask && (
            <FeedbackForm
              task={dialogTask}
              existing={editFb}
              onClose={() => { setDialogTask(null); setEditFb(null); }}
              onSaved={() => { setDialogTask(null); setEditFb(null); load(); }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => { setDialogTask(null); setEditFb(null); }} sx={{ color: 'text.secondary', textTransform: 'none' }}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
