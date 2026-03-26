import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Alert, Chip, Divider,
  Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Tooltip, CircularProgress
} from '@mui/material';
import {
  PersonAdd, ContentCopy, Check, Refresh, Delete,
  Email, Link as LinkIcon, AccessTime, Warning
} from '@mui/icons-material';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const roleOptions = {
  superadmin: [{ value: 'admin',    label: '🔶 Admin' }],
  admin:      [{ value: 'pm',       label: '🟣 Project Manager' }],
  pm:         [{ value: 'assigner', label: '🟢 Assigner' }, { value: 'writer', label: '🔵 Writer' }],
  assigner:   [{ value: 'writer',   label: '🔵 Writer' }],
};

function timeLeft(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return { label: 'Expired', color: '#ef4444' };
  const h = Math.floor(diff / 3600000);
  if (h < 1) return { label: 'Expires soon', color: '#d97706' };
  if (h < 24) return { label: `${h}h left`, color: '#d97706' };
  return { label: `${Math.floor(h / 24)}d left`, color: '#059669' };
}

export default function InviteModal({ open, onClose }) {
  const { user } = useAuth();
  const options = roleOptions[user?.role] || [];
  const [email, setEmail]   = useState('');
  const [role, setRole]     = useState(options[0]?.value || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { success, message, inviteLink, emailSent }
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const loadPending = async () => {
    setLoadingPending(true);
    try {
      const r = await authAPI.getPendingInvites();
      setPendingInvites(r.data);
    } catch {} finally { setLoadingPending(false); }
  };

  useEffect(() => { if (open) { loadPending(); setResult(null); setEmail(''); } }, [open]);

  const handleSend = async () => {
    if (!email.trim() || !role) return;
    setLoading(true); setResult(null);
    try {
      const r = await authAPI.invite({ email: email.trim(), role });
      setResult({ success: true, message: r.data.message, inviteLink: r.data.inviteLink, emailSent: r.data.emailSent });
      setEmail('');
      loadPending();
    } catch (err) {
      setResult({ success: false, message: err.response?.data?.message || 'Failed to send invite' });
    } finally { setLoading(false); }
  };

  const copyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResend = async (id) => {
    try {
      await authAPI.resendInvite(id);
      loadPending();
    } catch {}
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this invitation?')) return;
    try {
      await authAPI.cancelInvite(id);
      setPendingInvites(p => p.filter(i => i.id !== id));
    } catch {}
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PersonAdd sx={{ color: '#6366f1', fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: 16, color: 'text.primary' }}>Invite Team Member</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>They'll receive an email with a registration link</Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        {/* Send invite form */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <TextField
            fullWidth label="Email Address" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="colleague@gmail.com"
            InputProps={{ startAdornment: <Email sx={{ color: 'text.disabled', mr: 1, fontSize: 18 }} /> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select value={role} label="Role" onChange={e => setRole(e.target.value)} sx={{ borderRadius: 2 }}>
              {options.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
            </Select>
          </FormControl>

          <Button
            variant="contained" fullWidth size="large" onClick={handleSend}
            disabled={loading || !email.trim() || !role}
            startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <PersonAdd />}
            sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 700, py: 1.3 }}>
            {loading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </Box>

        {/* Result box */}
        {result && (
          <Box sx={{ mb: 3 }}>
            {result.success ? (
              <Box sx={{ p: 2.5, bgcolor: result.emailSent ? '#f0fdf4' : '#fffbeb', borderRadius: 2, border: `1px solid ${result.emailSent ? '#bbf7d0' : '#fde68a'}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: result.inviteLink ? 1.5 : 0 }}>
                  {result.emailSent
                    ? <><Email sx={{ color: '#059669', fontSize: 18 }} /><Typography variant="body2" sx={{ fontWeight: 700, color: 'success.main' }}>Email sent successfully!</Typography></>
                    : <><Warning sx={{ color: '#d97706', fontSize: 18 }} /><Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>Email not configured — share this link manually</Typography></>
                  }
                </Box>
                {!result.emailSent && result.inviteLink && (
                  <>
                    <Typography variant="caption" sx={{ color: '#78716c', display: 'block', mb: 1 }}>
                      To set up email delivery, see <strong>EMAIL_SETUP_GUIDE.md</strong> in the project folder.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Box sx={{ flex: 1, p: 1.2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', overflow: 'hidden' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', wordBreak: 'break-all', fontSize: 11, fontFamily: 'monospace' }}>
                          {result.inviteLink}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained" size="small"
                        startIcon={copiedId === 'new' ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                        onClick={() => copyLink(result.inviteLink, 'new')}
                        sx={{ borderRadius: 2, bgcolor: copiedId === 'new' ? '#059669' : '#6366f1', whiteSpace: 'nowrap', fontWeight: 600, fontSize: 12 }}>
                        {copiedId === 'new' ? 'Copied!' : 'Copy Link'}
                      </Button>
                    </Box>
                  </>
                )}
              </Box>
            ) : (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{result.message}</Alert>
            )}
          </Box>
        )}

        {/* Pending invites */}
        {pendingInvites.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Pending Invites <Chip label={pendingInvites.length} size="small" sx={{ bgcolor: 'action.hover', ml: 0.5, fontWeight: 700, height: 18, fontSize: 10 }} />
              </Typography>
              {loadingPending && <CircularProgress size={14} />}
            </Box>
            <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
              {pendingInvites.map(inv => {
                const tl = timeLeft(inv.expiresAt);
                return (
                  <Box key={inv.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: inv.expired ? '#fff8f8' : '#fafbff', borderRadius: 2, border: `1px solid ${inv.expired ? '#fecaca' : '#e2e8f0'}`, mb: 1 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.3 }}>
                        <Chip label={inv.role} size="small" sx={{ fontSize: 10, height: 16, textTransform: 'capitalize', bgcolor: 'rgba(99,102,241,0.15)', color: '#4338ca', fontWeight: 600 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                          <AccessTime sx={{ fontSize: 11, color: tl.color }} />
                          <Typography variant="caption" sx={{ fontSize: 10, color: tl.color, fontWeight: 600 }}>{tl.label}</Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <Tooltip title="Copy invite link">
                        <IconButton size="small" onClick={() => copyLink(inv.inviteLink, inv.id)}
                          sx={{ bgcolor: copiedId === inv.id ? 'rgba(16,185,129,0.15)' : '#f1f5f9', color: copiedId === inv.id ? '#059669' : '#475569', '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' }, borderRadius: 1.5 }}>
                          {copiedId === inv.id ? <Check sx={{ fontSize: 14 }} /> : <LinkIcon sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Resend / refresh link">
                        <IconButton size="small" onClick={() => handleResend(inv.id)}
                          sx={{ bgcolor: 'action.hover', color: 'text.secondary', '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' }, borderRadius: 1.5 }}>
                          <Refresh sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Cancel invite">
                        <IconButton size="small" onClick={() => handleCancel(inv.id)}
                          sx={{ bgcolor: 'action.hover', color: 'text.disabled', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444' }, borderRadius: 1.5 }}>
                          <Delete sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </>
        )}

        {/* How it works */}
        <Box sx={{ mt: 2.5, p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', mb: 1 }}>How invitations work</Typography>
          {[
            '1. Enter email + role and click Send',
            '2. They receive an email with a registration link (valid 48 hours)',
            '3. They click the link, choose a username and password',
            '4. Their account is instantly active and they can log in',
            '💡 If email is not set up, copy the link and share it manually',
          ].map(s => (
            <Typography key={s} variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.8, fontSize: 11.5 }}>{s}</Typography>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #f1f5f9' }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
