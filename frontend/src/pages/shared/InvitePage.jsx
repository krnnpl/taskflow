import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Select, MenuItem,
  FormControl, InputLabel, Alert, Chip, Avatar, IconButton, Tooltip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogContent, DialogTitle, Snackbar
} from '@mui/material';
import {
  PersonAdd, ContentCopy, Check, Refresh, Delete, MarkEmailRead,
  MailOutline, LinkOutlined, HourglassEmpty, Warning, CheckCircle
} from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import { authAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const roleConfig = {
  admin:    { color: '#f97316', bg: 'rgba(249,115,22,0.15)', label: 'Admin' },
  pm:       { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'Project Manager' },
  assigner: { color: '#059669', bg: 'rgba(16,185,129,0.1)', label: 'Assigner' },
  writer:   { color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', label: 'Writer' },
};

const allowedToInvite = {
  superadmin: ['admin'],
  admin:      ['pm'],
  pm:         ['assigner', 'writer'],
  assigner:   ['writer'],
};

function timeLeft(expiresAt) {
  const diff = new Date(expiresAt) - new Date();
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'expires soon';
  if (h < 24) return `${h}h left`;
  return `${Math.floor(h / 24)}d left`;
}

function CopyLinkBox({ link }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', mt: 1 }}>
      <LinkOutlined sx={{ fontSize: 16, color: '#6366f1', flexShrink: 0 }} />
      <Typography variant="caption" sx={{ flex: 1, color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: 11 }}>
        {link}
      </Typography>
      <Tooltip title={copied ? 'Copied!' : 'Copy link'}>
        <IconButton size="small" onClick={copy} sx={{ color: copied ? '#059669' : '#6366f1', bgcolor: copied ? 'rgba(16,185,129,0.15)' : '#eef2ff', borderRadius: 1.5, p: 0.6, '&:hover': { bgcolor: copied ? '#bbf7d0' : '#e0e7ff' } }}>
          {copied ? <Check sx={{ fontSize: 15 }} /> : <ContentCopy sx={{ fontSize: 15 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
}

export default function InvitePage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { inviteLink, emailSent, message, error }
  const [pending, setPending] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [snack, setSnack] = useState('');
  const [resendResult, setResendResult] = useState(null);

  const roles = allowedToInvite[user?.role] || [];

  const loadPending = () => {
    setLoadingPending(true);
    authAPI.getPendingInvites()
      .then(r => setPending(r.data))
      .catch(() => {})
      .finally(() => setLoadingPending(false));
  };

  useEffect(() => {
    loadPending();
    if (roles.length === 1) setRole(roles[0]);
  }, []);

  const handleSend = async () => {
    if (!email.trim()) return setResult({ error: 'Enter an email address' });
    if (!role)         return setResult({ error: 'Select a role' });
    setSending(true); setResult(null);
    try {
      const r = await authAPI.invite({ email: email.trim(), role });
      setResult({ inviteLink: r.data.inviteLink, emailSent: r.data.emailSent, message: r.data.message });
      setEmail('');
      loadPending();
    } catch (err) {
      setResult({ error: err.response?.data?.message || 'Failed to send invite' });
    } finally { setSending(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this invite?')) return;
    await authAPI.cancelInvite(id).catch(() => {});
    setSnack('Invite cancelled');
    loadPending();
  };

  const handleResend = async (id) => {
    try {
      const r = await authAPI.resendInvite(id);
      setResendResult({ inviteLink: r.data.inviteLink, emailSent: r.data.emailSent });
      loadPending();
    } catch { setSnack('Failed to resend'); }
  };

  return (
    <PageShell title="Invite Team Members" subtitle="Send invite links to add people to your team">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '420px 1fr' }, gap: 3, alignItems: 'start' }}>

        {/* LEFT — Send invite form */}
        <Box>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PersonAdd sx={{ color: '#6366f1' }} />
                </Box>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary' }}>Send Invitation</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>They'll get a link to create their account</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Email Address" type="email" fullWidth
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="colleague@company.com"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />

                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select value={role} label="Role" onChange={e => setRole(e.target.value)} sx={{ borderRadius: 2 }}>
                    {roles.map(r => {
                      const rc = roleConfig[r] || {};
                      return (
                        <MenuItem key={r} value={r}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: rc.color }} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{rc.label}</Typography>
                            </Box>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>

                {result?.error && <Alert severity="error" sx={{ borderRadius: 2 }}>{result.error}</Alert>}

                <Button
                  variant="contained" fullWidth size="large"
                  onClick={handleSend} disabled={sending}
                  startIcon={<PersonAdd />}
                  sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, py: 1.4, fontWeight: 700 }}
                >
                  {sending ? 'Sending...' : 'Send Invite'}
                </Button>
              </Box>

              {/* Invite result */}
              {result && !result.error && (
                <Box sx={{ mt: 3, p: 2.5, bgcolor: 'rgba(16,185,129,0.1)', borderRadius: 2, border: '1px solid rgba(16,185,129,0.3)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <CheckCircle sx={{ color: '#059669', fontSize: 18 }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#15803d' }}>Invite Created!</Typography>
                  </Box>

                  {result.emailSent ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1.5, bgcolor: 'rgba(16,185,129,0.15)', borderRadius: 2 }}>
                      <MarkEmailRead sx={{ color: '#059669', fontSize: 16 }} />
                      <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 600 }}>
                        Email sent — they'll find the link in their inbox
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ p: 1.5, bgcolor: 'rgba(245,158,11,0.15)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.3)', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <MailOutline sx={{ color: '#d97706', fontSize: 15 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main' }}>Email not configured</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#78350f', display: 'block', lineHeight: 1.5 }}>
                        Share this link manually with the person you're inviting:
                      </Typography>
                    </Box>
                  )}

                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.5 }}>Invite Link (valid 48 hours)</Typography>
                  <CopyLinkBox link={result.inviteLink} />

                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.5 }}>
                      📋 What they need to do:
                    </Typography>
                    {[
                      'Open the invite link in their browser',
                      'Enter a username and password',
                      'Click "Create Account" — they\'re in!',
                    ].map((s, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{s}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* How it works */}
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>🔐 Who can invite whom?</Typography>
              {[
                ['Super Admin', '→', 'Admin'],
                ['Admin', '→', 'Project Manager'],
                ['Project Manager', '→', 'Assigner, Writer'],
                ['Assigner', '→', 'Writer'],
              ].map(([from, arrow, to]) => (
                <Box key={from} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', minWidth: 110 }}>{from}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>{arrow}</Typography>
                  <Typography variant="caption" sx={{ color: '#6366f1', fontWeight: 600 }}>{to}</Typography>
                </Box>
              ))}
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(99,102,241,0.12)', borderRadius: 2 }}>
                <Typography variant="caption" sx={{ color: '#4338ca', lineHeight: 1.6, display: 'block' }}>
                  ✅ Invite links are valid for <strong>48 hours</strong>.<br />
                  ✅ If email isn't configured, copy and share the link manually.<br />
                  ✅ The invited person just needs the link — no email required.
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* RIGHT — Pending invites */}
        <Box>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 800, color: 'text.primary' }}>Pending Invites</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>People who haven't registered yet</Typography>
                </Box>
                <Tooltip title="Refresh">
                  <IconButton size="small" onClick={loadPending} sx={{ color: 'text.disabled', bgcolor: 'background.default', border: '1px solid' }}>
                    <Refresh sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>

              {loadingPending ? (
                <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>Loading...</Typography>
              ) : pending.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CheckCircle sx={{ fontSize: 40, color: 'divider', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.disabled', fontWeight: 500 }}>No pending invites</Typography>
                  <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Everyone you've invited has registered</Typography>
                </Box>
              ) : (
                <Box>
                  {pending.map(inv => {
                    const rc = roleConfig[inv.role] || {};
                    const tl = timeLeft(inv.expiresAt);
                    const expired = inv.expired;
                    return (
                      <Box key={inv.id} sx={{
                        p: 2, borderRadius: 2, border: `1px solid ${expired ? '#fecaca' : '#e2e8f0'}`,
                        bgcolor: expired ? '#fff8f8' : 'white', mb: 1.5,
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Avatar sx={{ width: 34, height: 34, bgcolor: rc.color || '#6366f1', fontSize: 13, fontWeight: 700 }}>
                              {inv.email?.[0]?.toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 13 }}>{inv.email}</Typography>
                              <Chip label={rc.label || inv.role} size="small" sx={{ bgcolor: rc.bg || '#eef2ff', color: rc.color || '#6366f1', fontWeight: 600, fontSize: 10, height: 18, textTransform: 'capitalize' }} />
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, flexShrink: 0 }}>
                            {expired
                              ? <Chip icon={<Warning sx={{ fontSize: 11 }} />} label="Expired" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#dc2626', fontWeight: 700, fontSize: 10, height: 20 }} />
                              : tl && <Chip icon={<HourglassEmpty sx={{ fontSize: 11 }} />} label={tl} size="small" sx={{ bgcolor: 'rgba(14,165,233,0.15)', color: '#0369a1', fontWeight: 600, fontSize: 10, height: 20 }} />
                            }
                          </Box>
                        </Box>

                        {/* Invite link */}
                        <CopyLinkBox link={inv.inviteLink} />

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                          <Button
                            size="small" variant="outlined"
                            startIcon={<Refresh sx={{ fontSize: 13 }} />}
                            onClick={() => handleResend(inv.id)}
                            sx={{ fontSize: 11, borderRadius: 2, borderColor: 'divider', color: 'text.secondary', fontWeight: 600, textTransform: 'none', flex: 1 }}
                          >
                            {expired ? 'Renew Link' : 'Refresh & Resend'}
                          </Button>
                          <Button
                            size="small" variant="outlined"
                            startIcon={<Delete sx={{ fontSize: 13 }} />}
                            onClick={() => handleCancel(inv.id)}
                            sx={{ fontSize: 11, borderRadius: 2, borderColor: '#fecaca', color: '#dc2626', fontWeight: 600, textTransform: 'none' }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Resend result dialog */}
      {resendResult && (
        <Dialog open onClose={() => setResendResult(null)} PaperProps={{ sx: { borderRadius: 3, p: 1 } }}>
          <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
            {resendResult.emailSent ? '✅ Email Sent' : '🔗 New Link Generated'}
          </DialogTitle>
          <DialogContent sx={{ minWidth: 340 }}>
            {resendResult.emailSent
              ? <Alert severity="success" sx={{ borderRadius: 2, mb: 2 }}>New invite email sent!</Alert>
              : <Alert severity="info" sx={{ borderRadius: 2, mb: 2 }}>Email not configured — share this link manually:</Alert>
            }
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block', mb: 0.5 }}>New Invite Link</Typography>
            <CopyLinkBox link={resendResult.inviteLink} />
          </DialogContent>
          <Box sx={{ px: 3, pb: 2.5 }}>
            <Button fullWidth variant="contained" onClick={() => setResendResult(null)} sx={{ borderRadius: 2, bgcolor: '#6366f1', fontWeight: 700, textTransform: 'none' }}>Done</Button>
          </Box>
        </Dialog>
      )}

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')} message={snack} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </PageShell>
  );
}
