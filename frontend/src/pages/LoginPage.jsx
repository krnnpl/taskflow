import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowForward, Lock } from '@mui/icons-material';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(`/${user.role}/dashboard`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 70%, #6366f1 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background orbs */}
      {[
        { top: '-10%', left: '-5%', width: 400, height: 400, bgcolor: 'rgba(99,102,241,0.3)', filter: 'blur(60px)', position: 'absolute', borderRadius: '50%' },
        { bottom: '-10%', right: '-5%', width: 500, height: 500, bgcolor: 'rgba(139,92,246,0.2)', filter: 'blur(60px)', position: 'absolute', borderRadius: '50%' },
        { top: '40%', right: '15%', width: 200, height: 200, bgcolor: 'rgba(16,185,129,0.1)', filter: 'blur(60px)', position: 'absolute', borderRadius: '50%' },
      ].map((orb, i) => <Box key={i} sx={orb} />)}

      <Box sx={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>

        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2, backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <Lock sx={{ color: 'white', fontSize: 28 }} />
          </Box>
          <Typography sx={{ fontSize: 34, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
            TaskFlow
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, mt: 0.5 }}>
            Sign in to your workspace
          </Typography>
        </Box>

        {/* Card */}
        <Box sx={{
          bgcolor: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.3)',
          p: 4,
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}>
          <Typography sx={{ fontWeight: 800, fontSize: 22, color: '#0f172a', mb: 0.5 }}>
            Welcome back 👋
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Enter your credentials to continue
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField
              label="Email Address" type="email" fullWidth
              value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              required autoFocus
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }} />

            <TextField
              label="Password" type="password" fullWidth
              value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              required
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, bgcolor: '#f8fafc' } }} />

            <Box sx={{ textAlign: 'right', mt: -1 }}>
              <Typography component={Link} to="/forgot-password" variant="caption"
                sx={{ color: '#6366f1', textDecoration: 'none', fontWeight: 600,
                  '&:hover': { textDecoration: 'underline' } }}>
                Forgot password?
              </Typography>
            </Box>

            <Button type="submit" variant="contained" fullWidth size="large"
              disabled={loading}
              endIcon={loading
                ? <CircularProgress size={16} sx={{ color: 'white' }} />
                : <ArrowForward />}
              sx={{
                borderRadius: 2.5, py: 1.5, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                '&:hover': {
                  boxShadow: '0 12px 32px rgba(99,102,241,0.5)',
                  transform: 'translateY(-1px)',
                },
              }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>

          <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Don't have an account? Contact your administrator to get an invite.
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption"
          sx={{ display: 'block', textAlign: 'center', color: 'rgba(255,255,255,0.4)', mt: 3 }}>
          © {new Date().getFullYear()} TaskFlow · Invite-only access
        </Typography>
      </Box>
    </Box>
  );
}
