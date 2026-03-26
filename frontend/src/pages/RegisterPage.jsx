import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton, Chip } from '@mui/material';
import { Person, Lock, Visibility, VisibilityOff, CheckCircle, TaskAlt } from '@mui/icons-material';
import { authAPI } from '../utils/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

const roleConfig = {
  superadmin: { color: '#ef4444', label: 'Super Admin' },
  admin:      { color: '#f97316', label: 'Admin' },
  pm:         { color: '#8b5cf6', label: 'Project Manager' },
  assigner:   { color: '#059669', label: 'Assigner' },
  writer:     { color: '#0ea5e9', label: 'Writer' },
};

export default function RegisterPage() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const token           = searchParams.get('token');
  const email           = searchParams.get('email');

  const [form, setForm] = useState({ username: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);

  // Invalid link
  if (!token || !email) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '2px solid #fecaca', maxWidth: 400, p: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ fontSize: 48, mb: 2 }}>🔗</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#dc2626', mb: 1 }}>Invalid Invite Link</Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
              This link is missing required information. Ask whoever invited you to send a fresh invite.
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/login')} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const handleSubmit = async () => {
    setError('');
    if (!form.username.trim())  return setError('Username is required');
    if (form.username.length < 3) return setError('Username must be at least 3 characters');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const res  = await authAPI.register({ token, email, username: form.username.trim(), password: form.password });
      const user = res.data.user;
      localStorage.setItem('taskflow_token', res.data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(user));
      setDone(true);
      setTimeout(() => navigate(`/${user.role}/dashboard`), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed — the link may have expired');
    } finally { setLoading(false); }
  };

  // Detect role from email param if possible (we try to show it, but backend decides)
  const decodedEmail = decodeURIComponent(email);

  if (done) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8fafc' }}>
        <Card elevation={0} sx={{ borderRadius: 3, border: '2px solid #bbf7d0', maxWidth: 380 }}>
          <CardContent sx={{ textAlign: 'center', py: 5, px: 4 }}>
            <TaskAlt sx={{ fontSize: 56, color: '#059669', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>You're all set!</Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>Taking you to your dashboard...</Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: '#f8fafc',
      backgroundImage: 'radial-gradient(circle at 20% 20%, #eef2ff 0%, transparent 50%), radial-gradient(circle at 80% 80%, #f0fdf4 0%, transparent 50%)',
    }}>
      <Card elevation={0} sx={{ width: 420, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#0f172a', mb: 0.5 }}>
              Task<span style={{ color: '#6366f1' }}>Flow</span>
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>You've been invited — create your account below</Typography>
          </Box>

          {/* Invite info box */}
          <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd', mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircle sx={{ color: '#0369a1', fontSize: 20, flexShrink: 0 }} />
            <Box>
              <Typography variant="caption" sx={{ color: '#0369a1', fontWeight: 700, display: 'block' }}>Invited as</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: 13 }}>{decodedEmail}</Typography>
            </Box>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Choose a Username" fullWidth
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Create Password" type={showPw ? 'text' : 'password'} fullWidth
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              helperText="Minimum 6 characters"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setShowPw(p => !p)}>{showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}</IconButton></InputAdornment>,
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Confirm Password" type="password" fullWidth
              value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />

            <Button
              variant="contained" size="large" fullWidth
              onClick={handleSubmit} disabled={loading}
              sx={{ mt: 1, borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, py: 1.5, fontWeight: 700 }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Create My Account'}
            </Button>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: '#94a3b8', mt: 2.5 }}>
            Already have an account?{' '}
            <Typography component="span" variant="caption" sx={{ color: '#6366f1', cursor: 'pointer', fontWeight: 600 }} onClick={() => navigate('/login')}>
              Sign in
            </Typography>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
