import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { Email, ArrowBack, CheckCircle } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
      <Box sx={{ position: 'absolute', top: -100, left: '30%', width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Box sx={{ width: '100%', maxWidth: 420, mx: 3, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 4, textAlign: 'center' }}>
          Task<span style={{ color: '#6366f1' }}>Flow</span>
        </Typography>

        <Box sx={{ bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 4 }}>
          {!sent ? (
            <>
              {/* Icon */}
              <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Email sx={{ color: '#818cf8', fontSize: 24 }} />
              </Box>

              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>Forgot password?</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 3.5, lineHeight: 1.7 }}>
                Enter your email and we'll send you a link to reset your password. The link expires in 1 hour.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, bgcolor: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', '& .MuiAlert-icon': { color: '#fca5a5' } }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11, display: 'block', mb: 1 }}>Email Address</Typography>
                  <TextField
                    fullWidth required type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' }, '& input': { color: 'white', fontSize: 14 } } }}
                  />
                </Box>

                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                  sx={{ borderRadius: 2, py: 1.5, bgcolor: '#6366f1', fontWeight: 700, fontSize: 15, '&:hover': { bgcolor: '#4f46e5' }, '&:disabled': { bgcolor: 'rgba(99,102,241,0.4)' } }}>
                  {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Send Reset Link'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: 'rgba(5,150,105,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <CheckCircle sx={{ color: '#34d399', fontSize: 24 }} />
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>Check your email</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, mb: 3.5 }}>
                We sent a password reset link to <strong style={{ color: 'rgba(255,255,255,0.7)' }}>{email}</strong>. Check your inbox and spam folder — the link expires in 1 hour.
              </Typography>
              <Alert severity="info" sx={{ borderRadius: 2, bgcolor: 'rgba(99,102,241,0.1)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.2)', '& .MuiAlert-icon': { color: '#a5b4fc' }, mb: 2 }}>
                If email is not configured, check the server console for the reset link.
              </Alert>
            </>
          )}

          <Button startIcon={<ArrowBack />} onClick={() => navigate('/login')} fullWidth
            sx={{ mt: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'none', fontWeight: 500, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}>
            Back to Sign In
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
