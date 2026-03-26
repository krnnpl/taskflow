import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Rating, Typography, FormControlLabel, Checkbox, Alert, Box } from '@mui/material';
import { Star } from '@mui/icons-material';
import { feedbackAPI } from '../../utils/api';

export default function FeedbackModal({ open, onClose, task, onSuccess }) {
  const [form, setForm] = useState({ feedbackText: '', rating: 4, isComplaint: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await feedbackAPI.create({ taskId: task.id, ...form });
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
    } finally { setLoading(false); }
  };

  const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Excellent' };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 700, color: 'text.primary' }}>Submit Feedback</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
        <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5 }}>Task</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.3 }}>{task?.title}</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>Writer: {task?.writer?.username}</Typography>
        </Box>
        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>Quality Rating</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Rating value={form.rating} onChange={(_, val) => setForm({ ...form, rating: val })} size="large" icon={<Star sx={{ color: '#f59e0b' }} />} emptyIcon={<Star sx={{ color: 'divider' }} />} />
            <Typography variant="body2" sx={{ color: '#6366f1', fontWeight: 600 }}>{ratingLabels[form.rating]}</Typography>
          </Box>
        </Box>
        <TextField label="Feedback Comments" fullWidth multiline rows={4} value={form.feedbackText} onChange={e => setForm({ ...form, feedbackText: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        <FormControlLabel
          control={<Checkbox checked={form.isComplaint} onChange={e => setForm({ ...form, isComplaint: e.target.checked })} sx={{ color: '#ef4444', '&.Mui-checked': { color: '#ef4444' } }} />}
          label={<Typography variant="body2" sx={{ color: '#ef4444', fontWeight: 500 }}>Mark as Complaint</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2, color: 'text.secondary' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>Submit Feedback</Button>
      </DialogActions>
    </Dialog>
  );
}
