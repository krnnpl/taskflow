import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, Select, FormControl, InputLabel, Alert, Box, Typography } from '@mui/material';
import { taskAPI, userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function TaskFormModal({ open, onClose, onSuccess, editTask }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', description: '', assignedToAssigner: '', dueDate: '', priority: 'medium' });
  const [assigners, setAssigners] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      userAPI.getAssigners().then(res => setAssigners(res.data)).catch(() => {});
      if (editTask) {
        setForm({
          title: editTask.title || '',
          description: editTask.description || '',
          assignedToAssigner: editTask.assignedToAssigner || '',
          dueDate: editTask.dueDate ? editTask.dueDate.split('T')[0] : '',
          priority: editTask.priority || 'medium',
        });
      } else {
        setForm({ title: '', description: '', assignedToAssigner: '', dueDate: '', priority: 'medium' });
      }
    }
  }, [open, editTask]);

  const handleSubmit = async () => {
    setError('');
    if (!form.title) return setError('Title is required');
    setLoading(true);
    try {
      if (editTask) { await taskAPI.update(editTask.id, form); }
      else { await taskAPI.create(form); }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1, fontWeight: 700, color: 'text.primary' }}>{editTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        <TextField label="Task Title" fullWidth required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <TextField label="Description" fullWidth multiline rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <FormControl fullWidth>
          <InputLabel>Assign to Assigner</InputLabel>
          <Select value={form.assignedToAssigner} label="Assign to Assigner" onChange={e => setForm({ ...form, assignedToAssigner: e.target.value })} sx={{ borderRadius: 2 }}>
            <MenuItem value="">— Unassigned —</MenuItem>
            {assigners.map(a => <MenuItem key={a.id} value={a.id}>{a.username}</MenuItem>)}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select value={form.priority} label="Priority" onChange={e => setForm({ ...form, priority: e.target.value })} sx={{ borderRadius: 2 }}>
              <MenuItem value="low">🟢 Low</MenuItem>
              <MenuItem value="medium">🟡 Medium</MenuItem>
              <MenuItem value="high">🔴 High</MenuItem>
            </Select>
          </FormControl>
          <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
          {editTask ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
