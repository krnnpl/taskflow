import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar, Button,
  Select, MenuItem, FormControl, InputLabel, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, CircularProgress, LinearProgress, Tooltip
} from '@mui/material';
import { Circle, BeachAccess, Work, Block, CheckCircle, Edit, Warning } from '@mui/icons-material';
import { userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
  available:   { label: 'Available',    color: '#059669', bg: 'rgba(16,185,129,0.15)', icon: <CheckCircle sx={{ fontSize: 14 }} /> },
  busy:        { label: 'Busy',         color: '#d97706', bg: 'rgba(245,158,11,0.15)', icon: <Work sx={{ fontSize: 14 }} /> },
  on_leave:    { label: 'On Leave',     color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', icon: <BeachAccess sx={{ fontSize: 14 }} /> },
  unavailable: { label: 'Unavailable',  color: '#ef4444', bg: 'rgba(239,68,68,0.15)', icon: <Block sx={{ fontSize: 14 }} /> },
};

const LOAD_CONFIG = [
  { max: 2,  label: 'Light',      color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  { max: 4,  label: 'Moderate',   color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)' },
  { max: 6,  label: 'Heavy',      color: '#d97706', bg: 'rgba(245,158,11,0.15)' },
  { max: 999,label: 'Overloaded', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
];

function getLoad(n) {
  return LOAD_CONFIG.find(c => n <= c.max) || LOAD_CONFIG[LOAD_CONFIG.length - 1];
}

function WriterCard({ w }) {
  const st   = STATUS_CONFIG[w.availability] || STATUS_CONFIG.available;
  const load = getLoad(w.activeTasks);
  const pct  = Math.min((w.activeTasks / 8) * 100, 100);

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', height: '100%',
      opacity: w.availability === 'unavailable' ? 0.6 : 1,
      transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.06)' } }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <Avatar sx={{ width: 44, height: 44, bgcolor: '#6366f1', fontSize: 16, fontWeight: 700 }}>
              {w.username[0].toUpperCase()}
            </Avatar>
            <Box sx={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', bgcolor: st.color, border: '2px solid white' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: 15 }}>{w.username}</Typography>
            <Box sx={{ display: 'flex', gap: 0.8, mt: 0.5, flexWrap: 'wrap' }}>
              <Chip icon={st.icon} label={st.label} size="small"
                sx={{ bgcolor: st.bg, color: st.color, fontWeight: 700, fontSize: 11, height: 22,
                  '& .MuiChip-icon': { color: st.color } }} />
              <Chip label={load.label} size="small"
                sx={{ bgcolor: load.bg, color: load.color, fontWeight: 600, fontSize: 11, height: 22 }} />
            </Box>
          </Box>
          {w.Performance && (
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 800, color: '#6366f1', fontSize: 18 }}>{w.Performance.score || 0}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>score</Typography>
            </Box>
          )}
        </Box>

        {/* Leave reason */}
        {w.availability === 'on_leave' && w.leaveReason && (
          <Box sx={{ bgcolor: 'rgba(14,165,233,0.15)', borderRadius: 2, px: 1.5, py: 1, mb: 1.5 }}>
            <Typography variant="caption" sx={{ color: '#0369a1', fontSize: 11 }}>
              📋 {w.leaveReason}
              {w.leaveUntil && ` · Returns ${new Date(w.leaveUntil).toLocaleDateString()}`}
            </Typography>
          </Box>
        )}

        {/* Task load */}
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>Active Tasks</Typography>
            <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>{w.activeTasks}</Typography>
          </Box>
          <LinearProgress variant="determinate" value={pct}
            sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover',
              '& .MuiLinearProgress-bar': { bgcolor: load.color, borderRadius: 3 } }} />
        </Box>

        {/* Warning for unavailable */}
        {(w.availability === 'unavailable' || w.availability === 'on_leave') && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1.5, p: 1, bgcolor: 'rgba(245,158,11,0.15)', borderRadius: 2 }}>
            <Warning sx={{ fontSize: 13, color: '#d97706' }} />
            <Typography variant="caption" sx={{ color: 'warning.main', fontSize: 11, fontWeight: 600 }}>
              Cannot be assigned new tasks
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

function AvailabilityForm({ open, onClose, current, onSave }) {
  const [form, setForm] = useState({ availability: 'available', leaveReason: '', leaveUntil: '' });
  useEffect(() => {
    if (current) setForm({ availability: current.availability || 'available', leaveReason: current.leaveReason || '', leaveUntil: current.leaveUntil ? current.leaveUntil.split('T')[0] : '' });
  }, [current, open]);

  const handleSave = async () => {
    await onSave(form);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>Update My Availability</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select value={form.availability} label="Status" onChange={e => setForm(p => ({ ...p, availability: e.target.value }))} sx={{ borderRadius: 2 }}>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                <MenuItem key={k} value={k}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: v.color }} />
                    {v.label}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {(form.availability === 'on_leave' || form.availability === 'unavailable') && (
            <>
              <TextField label="Reason" fullWidth value={form.leaveReason} onChange={e => setForm(p => ({ ...p, leaveReason: e.target.value }))}
                placeholder="e.g. Annual leave, sick day, personal" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              <TextField label="Return Date (optional)" type="date" fullWidth value={form.leaveUntil}
                onChange={e => setForm(p => ({ ...p, leaveUntil: e.target.value }))}
                InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}
          sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 600 }}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AvailabilityPage() {
  const { user } = useAuth();
  const isWriter = user?.role === 'writer';
  const [writers, setWriters]   = useState([]);
  const [myStatus, setMyStatus] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await userAPI.getAvailability();
      setWriters(r.data);
      if (isWriter) setMyStatus(r.data.find(w => w.id === user.id));
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (form) => {
    await userAPI.updateAvailability(form);
    load();
  };

  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, k) => {
    acc[k] = writers.filter(w => w.availability === k).length;
    return acc;
  }, {});

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}><CircularProgress sx={{ color: '#6366f1' }} /></Box>;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Team Availability</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {isWriter ? 'Update your availability status' : 'See who is available for task assignment'}
          </Typography>
        </Box>
        {isWriter && (
          <Button variant="outlined" startIcon={<Edit />} onClick={() => setFormOpen(true)}
            sx={{ borderRadius: 2, borderColor: 'divider', color: '#6366f1', fontWeight: 600, textTransform: 'none' }}>
            Update My Status
          </Button>
        )}
      </Box>

      {/* Summary chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_CONFIG).map(([k, v]) => (
          <Chip key={k} icon={<Circle sx={{ fontSize: '10px !important', color: `${v.color} !important` }} />}
            label={`${v.label}: ${statusCounts[k]}`} size="small"
            sx={{ bgcolor: v.bg, color: v.color, fontWeight: 700, fontSize: 12, px: 0.5 }} />
        ))}
      </Box>

      {/* My status card (writer only) */}
      {isWriter && myStatus && (
        <Card elevation={0} sx={{ mb: 3, borderRadius: 3, border: `2px solid ${STATUS_CONFIG[myStatus.availability]?.color || '#e2e8f0'}`, bgcolor: STATUS_CONFIG[myStatus.availability]?.bg || '#f8fafc' }}>
          <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: STATUS_CONFIG[myStatus.availability]?.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {React.cloneElement(STATUS_CONFIG[myStatus.availability]?.icon || <CheckCircle />, { sx: { color: 'white', fontSize: 20 } })}
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Your status: {STATUS_CONFIG[myStatus.availability]?.label}</Typography>
              {myStatus.leaveReason && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{myStatus.leaveReason}</Typography>}
              {myStatus.leaveUntil && <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>· Returns {new Date(myStatus.leaveUntil).toLocaleDateString()}</Typography>}
            </Box>
            <Button size="small" onClick={() => setFormOpen(true)} sx={{ textTransform: 'none', fontWeight: 600, color: '#6366f1' }}>Change</Button>
          </CardContent>
        </Card>
      )}

      {/* Writers grid */}
      <Grid container spacing={2.5}>
        {writers.map(w => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={w.id}>
            <WriterCard w={w} />
          </Grid>
        ))}
      </Grid>

      <AvailabilityForm open={formOpen} onClose={() => setFormOpen(false)} current={myStatus} onSave={handleSave} />
    </Box>
  );
}
