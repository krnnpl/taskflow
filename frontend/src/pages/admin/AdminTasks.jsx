import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Button, TextField, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, Tooltip, Avatar, Dialog,
  DialogTitle, DialogContent, DialogActions, Rating, Alert, Switch,
  FormControlLabel, LinearProgress
} from '@mui/material';
import {
  Search, Visibility, RateReview, Delete, FilterList,
  CheckCircle, Warning, HourglassEmpty, Assignment, Edit, Star
} from '@mui/icons-material';
import { taskAPI, feedbackAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import TaskDetailModal from '../../components/shared/TaskDetailModal';

const STATUS_CONFIG = {
  pending:               { label: 'Pending',            color: 'text.disabled', bg: 'rgba(100,116,139,0.15)' },
  assigned_to_assigner:  { label: 'Assigned (Assigner)', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  assigned_to_writer:    { label: 'Assigned (Writer)',   color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  in_progress:           { label: 'In Progress',        color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)' },
  completed:             { label: 'Completed',           color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  overdue:               { label: 'Overdue',             color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  rejected:              { label: 'Rejected',            color: '#6b7280', bg: '#f9fafb' },
};
const PRIORITY_CONFIG = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  medium: { color: '#d97706', bg: 'rgba(245,158,11,0.15)' },
  low:    { color: 'text.secondary', bg: 'rgba(100,116,139,0.15)' },
};

// ── Feedback Modal ────────────────────────────────────────────────────────
function FeedbackModal({ task, open, onClose, onSaved }) {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks]   = useState([]);
  const [mode, setMode]             = useState('list'); // 'list' | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ feedbackText: '', rating: 4, isComplaint: false, correctionRequested: false });
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  const loadFeedbacks = async () => {
    try {
      const r = await feedbackAPI.getForTask(task.id);
      setFeedbacks(r.data);
    } catch {}
  };

  useEffect(() => { if (open && task) { loadFeedbacks(); setMode('list'); } }, [open, task]);

  const resetForm = () => setForm({ feedbackText: '', rating: 4, isComplaint: false, correctionRequested: false });

  const handleSave = async () => {
    setError(''); setSaving(true);
    try {
      if (mode === 'create') {
        await feedbackAPI.create({ taskId: task.id, ...form });
      } else if (mode === 'edit' && editTarget) {
        await feedbackAPI.update(editTarget.id, form);
      }
      await loadFeedbacks();
      setMode('list'); resetForm();
      onSaved?.();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this feedback? Scores will be recalculated.')) return;
    try { await feedbackAPI.delete(id); await loadFeedbacks(); onSaved?.(); }
    catch (e) { setError(e.response?.data?.message || 'Failed'); }
  };

  const startEdit = (fb) => {
    setEditTarget(fb);
    setForm({ feedbackText: fb.feedbackText || '', rating: fb.rating || 4, isComplaint: fb.isComplaint, correctionRequested: fb.correctionRequested || false });
    setMode('edit');
  };

  const myFeedback = feedbacks.find(f => f.giverId === user?.id);
  const canCreate  = task?.status === 'completed' && !myFeedback;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 16, pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <RateReview sx={{ color: '#6366f1', fontSize: 20 }} />
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 15 }}>Feedback — {task?.title}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {feedbacks.length} feedback · {task?.status}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {/* List mode */}
        {mode === 'list' && (
          <Box>
            {feedbacks.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Star sx={{ fontSize: 40, color: 'divider', mb: 1 }} />
                <Typography variant="body2" sx={{ color: 'text.disabled' }}>No feedback yet</Typography>
              </Box>
            )}
            {feedbacks.map(fb => (
              <Box key={fb.id} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar sx={{ width: 26, height: 26, bgcolor: '#6366f1', fontSize: 11, fontWeight: 700 }}>
                      {fb.giver?.username?.[0]?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{fb.giver?.username}</Typography>
                    <Chip label={fb.giver?.role} size="small" sx={{ height: 16, fontSize: 9, textTransform: 'capitalize', bgcolor: 'rgba(99,102,241,0.12)', color: '#6366f1', '& .MuiChip-label': { px: 0.8 } }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {fb.isComplaint && <Chip label="⚠️ Complaint" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: 10, height: 18 }} />}
                    {fb.correctionRequested && <Chip label="🔄 Correction" size="small" sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706', fontSize: 10, height: 18 }} />}
                  </Box>
                </Box>
                {fb.rating && <Rating value={fb.rating} readOnly size="small" sx={{ mb: 0.5 }} />}
                {fb.feedbackText && <Typography variant="body2" sx={{ color: 'text.primary', mt: 0.5 }}>{fb.feedbackText}</Typography>}
                {(fb.giverId === user?.id || ['superadmin','admin'].includes(user?.role)) && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                    <Button size="small" startIcon={<Edit sx={{ fontSize: 12 }} />} onClick={() => startEdit(fb)}
                      sx={{ textTransform: 'none', fontSize: 11, color: '#6366f1', bgcolor: 'rgba(99,102,241,0.12)', px: 1.5, borderRadius: 2, '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' } }}>
                      Edit
                    </Button>
                    <Button size="small" startIcon={<Delete sx={{ fontSize: 12 }} />} onClick={() => handleDelete(fb.id)}
                      sx={{ textTransform: 'none', fontSize: 11, color: '#ef4444', bgcolor: 'rgba(239,68,68,0.15)', px: 1.5, borderRadius: 2, '&:hover': { bgcolor: '#fecaca' } }}>
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>
            ))}
            {canCreate && (
              <Button fullWidth variant="outlined" startIcon={<RateReview />}
                onClick={() => { resetForm(); setMode('create'); }}
                sx={{ borderRadius: 2, borderColor: 'divider', color: '#6366f1', mt: 1, textTransform: 'none', fontWeight: 600 }}>
                Give Feedback
              </Button>
            )}
          </Box>
        )}

        {/* Create / Edit form */}
        {(mode === 'create' || mode === 'edit') && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>Rating</Typography>
              <Rating value={form.rating} onChange={(_, v) => setForm(p => ({ ...p, rating: v }))} size="large" />
            </Box>
            <TextField label="Feedback" multiline rows={3} fullWidth
              value={form.feedbackText} onChange={e => setForm(p => ({ ...p, feedbackText: e.target.value }))}
              placeholder="Describe the quality of work..."
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControlLabel control={<Switch checked={form.isComplaint} onChange={e => setForm(p => ({ ...p, isComplaint: e.target.checked }))} color="error" size="small" />}
                label={<Typography variant="body2" sx={{ fontSize: 13 }}>Flag as complaint</Typography>} />
              <FormControlLabel control={<Switch checked={form.correctionRequested} onChange={e => setForm(p => ({ ...p, correctionRequested: e.target.checked }))} color="warning" size="small" />}
                label={<Typography variant="body2" sx={{ fontSize: 13 }}>Request correction</Typography>} />
            </Box>
            {form.isComplaint && <Alert severity="error" sx={{ borderRadius: 2, py: 0.5 }}>This will add a complaint penalty to the writer's score</Alert>}
            {form.correctionRequested && <Alert severity="warning" sx={{ borderRadius: 2, py: 0.5 }}>A correction will reduce the writer's score by 3 points</Alert>}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9' }}>
        {mode === 'list' ? (
          <Button onClick={onClose} sx={{ color: 'text.secondary', textTransform: 'none' }}>Close</Button>
        ) : (
          <>
            <Button onClick={() => setMode('list')} sx={{ color: 'text.secondary', textTransform: 'none' }}>Back</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}
              sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 700 }}>
              {saving ? 'Saving...' : mode === 'edit' ? 'Update Feedback' : 'Submit Feedback'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ── Main AdminTasks ───────────────────────────────────────────────────────
export default function AdminTasks() {
  const [tasks, setTasks]           = useState([]);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [detailTask, setDetailTask] = useState(null);
  const [feedbackTask, setFeedbackTask] = useState(null);

  const load = () => taskAPI.getAll().then(r => setTasks(r.data));
  useEffect(() => { load(); }, []);

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.writer?.username?.toLowerCase().includes(search.toLowerCase()) ||
      t.creator?.username?.toLowerCase().includes(search.toLowerCase());
    const matchStatus   = statusFilter   === 'all' || t.status   === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const stats = {
    total:     tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue:   tasks.filter(t => t.status === 'overdue').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>All Tasks</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>View, filter and give feedback on all tasks</Typography>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',       value: stats.total,      color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Completed',   value: stats.completed,  color: '#059669', bg: 'rgba(16,185,129,0.15)' },
          { label: 'In Progress', value: stats.inProgress, color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)' },
          { label: 'Overdue',     value: stats.overdue,    color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
        ].map(s => (
          <Box key={s.label} sx={{ px: 2.5, py: 1.5, borderRadius: 2.5, bgcolor: s.bg, minWidth: 90 }}>
            <Typography sx={{ fontSize: 24, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
            <Typography variant="caption" sx={{ color: s.color, fontWeight: 600, opacity: 0.8 }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField placeholder="Search tasks, writers..." value={search} onChange={e => setSearch(e.target.value)}
          size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ width: 260, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="all">All Statuses</MenuItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Priority</InputLabel>
          <Select value={priorityFilter} label="Priority" onChange={e => setPriorityFilter(e.target.value)} sx={{ borderRadius: 2 }}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="high">High</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="low">Low</MenuItem>
          </Select>
        </FormControl>
        <Typography variant="caption" sx={{ color: 'text.secondary', ml: 'auto' }}>
          {filtered.length} of {tasks.length} tasks
        </Typography>
      </Box>

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['Task','Writer','Status','Priority','Due','Progress','Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(t => {
                const sc = STATUS_CONFIG[t.status]   || STATUS_CONFIG.pending;
                const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                const isOverdue = t.status === 'overdue';
                const pct = t.estimatedMinutes && t.loggedMinutes
                  ? Math.min(Math.round((t.loggedMinutes / t.estimatedMinutes) * 100), 100) : 0;
                return (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isOverdue && <Warning sx={{ fontSize: 14, color: '#ef4444' }} />}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
                            by {t.creator?.username}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {t.writer ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, bgcolor: '#0ea5e9', fontSize: 10, fontWeight: 700 }}>
                            {t.writer.username[0].toUpperCase()}
                          </Avatar>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>{t.writer.username}</Typography>
                        </Box>
                      ) : <Typography variant="caption" sx={{ color: 'text.secondary' }}>Unassigned</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: 11, height: 22 }} />
                    </TableCell>
                    <TableCell>
                      <Chip label={t.priority} size="small" sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 600, fontSize: 11, height: 22, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: isOverdue ? '#ef4444' : 'text.secondary', fontWeight: isOverdue ? 700 : 400 }}>
                        {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 100 }}>
                      {t.estimatedMinutes ? (
                        <Box>
                          <LinearProgress variant="determinate" value={pct}
                            sx={{ height: 5, borderRadius: 3, bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': { bgcolor: pct > 90 ? '#ef4444' : '#6366f1', borderRadius: 3 } }} />
                          <Typography variant="caption" sx={{ fontSize: 10, color: 'text.secondary' }}>
                            {Math.round((t.loggedMinutes || 0) / 60 * 10) / 10}h / {Math.round(t.estimatedMinutes / 60 * 10) / 10}h
                          </Typography>
                        </Box>
                      ) : <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View details">
                          <IconButton size="small" onClick={() => setDetailTask(t)}
                            sx={{ color: '#6366f1', p: 0.5, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(99,102,241,0.12)' } }}>
                            <Visibility sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        {t.status === 'completed' && (
                          <Tooltip title="Feedback">
                            <IconButton size="small" onClick={() => setFeedbackTask(t)}
                              sx={{ color: '#d97706', p: 0.5, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(245,158,11,0.15)' } }}>
                              <RateReview sx={{ fontSize: 15 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        {filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Assignment sx={{ fontSize: 40, color: 'divider', mb: 1 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>No tasks match your filters</Typography>
          </Box>
        )}
      </Card>

      {detailTask  && <TaskDetailModal open task={detailTask} onClose={() => setDetailTask(null)} onUpdate={load} />}
      {feedbackTask && <FeedbackModal open task={feedbackTask} onClose={() => setFeedbackTask(null)} onSaved={load} />}
    </Box>
  );
}
