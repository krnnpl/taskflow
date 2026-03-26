import React, { useState } from 'react';
import { Box, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Lock, Visibility, VisibilityOff, CheckCircle, ArrowBack } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token');
  const email = params.get('email');

  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPw, setShowPw]           = useState(false);
  const [loading, setLoading]         = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState('');

  if (!token || !email) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
        <Box sx={{ textAlign: 'center', p: 4 }}>
          <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>Invalid reset link</Typography>
          <Button variant="contained" onClick={() => navigate('/forgot-password')} sx={{ bgcolor: '#6366f1' }}>Request a new one</Button>
        </Box>
      </Box>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setError(''); setLoading(true);
    try {
      await authAPI.resetPassword({ token, email, password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally { setLoading(false); }
  };

  const inputSx = { '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' }, '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' }, '& input': { color: 'white', fontSize: 14 } }, '& .MuiInputAdornment-root .MuiIconButton-root': { color: 'rgba(255,255,255,0.3)' } };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0f172a' }}>
      <Box sx={{ position: 'absolute', top: -100, left: '30%', width: 400, height: 400, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <Box sx={{ width: '100%', maxWidth: 420, mx: 3, position: 'relative', zIndex: 1 }}>
        <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 4, textAlign: 'center' }}>
          Task<span style={{ color: '#6366f1' }}>Flow</span>
        </Typography>

        <Box sx={{ bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, p: 4 }}>
          {!done ? (
            <>
              <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <Lock sx={{ color: '#818cf8', fontSize: 24 }} />
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>Set new password</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 3.5 }}>
                Choose a strong password for <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{email}</strong>
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, bgcolor: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.2)', '& .MuiAlert-icon': { color: '#fca5a5' } }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11, display: 'block', mb: 1 }}>New Password</Typography>
                  <TextField
                    fullWidth required type={showPw ? 'text' : 'password'}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    InputProps={{ endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPw(p => !p)} edge="end">
                          {showPw ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                        </IconButton>
                      </InputAdornment>
                    )}}
                    sx={inputSx}
                  />
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11, display: 'block', mb: 1 }}>Confirm Password</Typography>
                  <TextField
                    fullWidth required type={showPw ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    sx={inputSx}
                  />
                </Box>

                <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
                  sx={{ borderRadius: 2, py: 1.5, bgcolor: '#6366f1', fontWeight: 700, fontSize: 15, mt: 0.5, '&:hover': { bgcolor: '#4f46e5' }, '&:disabled': { bgcolor: 'rgba(99,102,241,0.4)' } }}>
                  {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Reset Password'}
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: 'rgba(5,150,105,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                <CheckCircle sx={{ color: '#34d399', fontSize: 24 }} />
              </Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>Password reset!</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', mb: 3.5, lineHeight: 1.7 }}>
                Your password has been updated. You can now sign in with your new password.
              </Typography>
              <Button variant="contained" fullWidth size="large" onClick={() => navigate('/login')}
                sx={{ borderRadius: 2, py: 1.5, bgcolor: '#6366f1', fontWeight: 700, fontSize: 15, '&:hover': { bgcolor: '#4f46e5' } }}>
                Go to Sign In
              </Button>
            </>
          )}

          {!done && (
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/login')} fullWidth
              sx={{ mt: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'none', fontWeight: 500, '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}>
              Back to Sign In
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
