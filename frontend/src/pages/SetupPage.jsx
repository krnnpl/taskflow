import React, { useState, useEffect } from 'react';
import {
  Box, TextField, Button, Typography, Alert,
  CircularProgress, InputAdornment, IconButton, LinearProgress
} from '@mui/material';
import {
  Person, Email, Lock, Visibility, VisibilityOff,
  AdminPanelSettings, CheckCircle, ArrowForward
} from '@mui/icons-material';
import { authAPI } from '../utils/api';
import { useNavigate } from 'react-router-dom';

function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Contains a number',     pass: /\d/.test(password) },
    { label: 'Contains uppercase',    pass: /[A-Z]/.test(password) },
    { label: 'Contains symbol',       pass: /[^a-zA-Z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const color = score <= 1 ? '#ef4444' : score <= 2 ? '#f97316' : score === 3 ? '#f59e0b' : '#10b981';
  const label = score <= 1 ? 'Weak' : score <= 2 ? 'Fair' : score === 3 ? 'Good' : 'Strong';

  if (!password) return null;
  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Password strength</Typography>
        <Typography variant="caption" sx={{ color, fontWeight: 700 }}>{label}</Typography>
      </Box>
      <LinearProgress variant="determinate" value={(score / 4) * 100}
        sx={{ height: 4, borderRadius: 2,
          bgcolor: 'rgba(0,0,0,0.08)',
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
        {checks.map(c => (
          <Box key={c.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%',
              bgcolor: c.pass ? '#10b981' : '#e2e8f0' }} />
            <Typography variant="caption" sx={{ fontSize: 10,
              color: c.pass ? '#10b981' : 'text.disabled' }}>
              {c.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default function SetupPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [form, setForm]     = useState({ username: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);

  // Check if setup already done
  useEffect(() => {
    authAPI.setupStatus().then(r => {
      if (r.data.setupDone) {
        navigate('/login', { replace: true });
      } else {
        setChecking(false);
      }
    }).catch(() => setChecking(false));
  }, [navigate]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');
    if (!form.username.trim())     return setError('Username is required');
    if (form.username.length < 3)  return setError('Username must be at least 3 characters');
    if (!form.email.trim())        return setError('Email is required');
    if (form.password.length < 8)  return setError('Password must be at least 8 characters');
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res  = await authAPI.setup(form);
      const user = res.data.user;
      localStorage.setItem('taskflow_token', res.data.token);
      localStorage.setItem('taskflow_user', JSON.stringify(user));
      setDone(true);
      setTimeout(() => navigate('/superadmin/dashboard', { replace: true }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Setup failed');
    } finally { setLoading(false); }
  };

  if (checking) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: '#6366f1' }} />
    </Box>
  );

  if (done) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)' }}>
      <Box sx={{ textAlign: 'center', color: 'white' }}>
        <CheckCircle sx={{ fontSize: 72, color: '#10b981', mb: 2 }} />
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>Setup Complete!</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Taking you to your dashboard...</Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      {[
        { top: '-10%', left: '-5%', width: 400, height: 400 },
        { bottom: '-10%', right: '-5%', width: 500, height: 500 },
      ].map((orb, i) => (
        <Box key={i} sx={{ position: 'absolute', borderRadius: '50%',
          bgcolor: i === 0 ? 'rgba(99,102,241,0.3)' : 'rgba(139,92,246,0.2)',
          filter: 'blur(60px)', ...orb }} />
      ))}

      <Box sx={{ width: '100%', maxWidth: 480, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ width: 64, height: 64, borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2, backdropFilter: 'blur(10px)' }}>
            <AdminPanelSettings sx={{ color: 'white', fontSize: 30 }} />
          </Box>
          <Typography sx={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
            TaskFlow Setup
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, mt: 0.5 }}>
            Create your SuperAdmin account to get started
          </Typography>
        </Box>

        {/* Step indicator */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 3 }}>
          {['Create SuperAdmin', 'Invite Admin', 'Invite Team'].map((step, i) => (
            <Box key={step} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 24, height: 24, borderRadius: '50%',
                bgcolor: i === 0 ? 'white' : 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800,
                  color: i === 0 ? '#6366f1' : 'rgba(255,255,255,0.5)' }}>
                  {i + 1}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 11, color: i === 0 ? 'white' : 'rgba(255,255,255,0.4)',
                fontWeight: i === 0 ? 700 : 400, display: { xs: 'none', sm: 'block' } }}>
                {step}
              </Typography>
              {i < 2 && <Box sx={{ width: 20, height: 1, bgcolor: 'rgba(255,255,255,0.2)' }} />}
            </Box>
          ))}
        </Box>

        {/* Form card */}
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.97)', borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.3)', p: 4,
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}>

          <Typography sx={{ fontWeight: 800, fontSize: 20, color: '#0f172a', mb: 0.5 }}>
            Create SuperAdmin Account
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            This is the master account. You will invite everyone else from inside the app.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

            <TextField label="Full Name" fullWidth value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="e.g. Kiran Nepal" autoFocus
              InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }} />

            <TextField label="Email Address" type="email" fullWidth value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="superadmin@yourcompany.com"
              InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }} />

            <Box>
              <TextField label="Password" type={showPw ? 'text' : 'password'} fullWidth
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment>,
                  endAdornment: <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw(p => !p)}>
                      {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                    </IconButton>
                  </InputAdornment>,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }} />
              <PasswordStrength password={form.password} />
            </Box>

            <TextField label="Confirm Password" type="password" fullWidth
              value={form.confirm}
              onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ fontSize: 18, color: '#94a3b8' }} /></InputAdornment> }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }} />

            <Button type="submit" variant="contained" fullWidth size="large"
              disabled={loading}
              endIcon={loading
                ? <CircularProgress size={16} sx={{ color: 'white' }} />
                : <ArrowForward />}
              sx={{ borderRadius: 2.5, py: 1.5, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                '&:hover': { boxShadow: '0 12px 32px rgba(99,102,241,0.5)', transform: 'translateY(-1px)' } }}>
              {loading ? 'Creating Account...' : 'Create SuperAdmin Account'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#fef3c7', borderRadius: 2,
            border: '1px solid #fde68a' }}>
            <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 700, display: 'block', mb: 0.5 }}>
              ⚠️ Important
            </Typography>
            <Typography variant="caption" sx={{ color: '#78350f' }}>
              This page is only available once — when no SuperAdmin exists.
              After setup, this page automatically redirects to login.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
