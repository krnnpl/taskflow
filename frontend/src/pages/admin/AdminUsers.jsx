import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, IconButton, Avatar, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Select, MenuItem,
  FormControl, InputLabel, Alert, Tooltip, TextField, InputAdornment
} from '@mui/material';
import { Delete, Edit, PersonAdd, Search, SwapHoriz, People } from '@mui/icons-material';
import InviteModal from '../../components/shared/InviteModal';
import { userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const ROLE_CONFIG = {
  pm:         { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'Project Manager' },
  assigner:   { color: '#059669', bg: 'rgba(16,185,129,0.15)', label: 'Assigner' },
  writer:     { color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', label: 'Writer' },
  admin:      { color: '#f97316', bg: 'rgba(249,115,22,0.15)', label: 'Admin' },
  superadmin: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Super Admin' },
};

const AVAIL_CONFIG = {
  available:   { label: 'Available',   color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  busy:        { label: 'Busy',        color: '#d97706', bg: 'rgba(245,158,11,0.15)' },
  on_leave:    { label: 'On Leave',    color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)' },
  unavailable: { label: 'Unavailable', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
};

function RoleChangeDialog({ open, user: target, onClose, onSave, currentUserRole }) {
  const [role, setRole]   = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  useEffect(() => { if (target) { setRole(target.role); setError(''); } }, [target]);

  const allowedRoles = currentUserRole === 'superadmin'
    ? ['admin','pm','assigner','writer']
    : ['pm','assigner','writer'];

  const handleSave = async () => {
    if (role === target.role) { onClose(); return; }
    setSaving(true);
    try {
      await onSave(target.id, role);
      onClose();
    } catch (e) { setError(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SwapHoriz sx={{ color: '#6366f1' }} />
          Change Role — {target?.username}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        <Box sx={{ p: 2, bgcolor: 'rgba(245,158,11,0.15)', borderRadius: 2, mb: 2 }}>
          <Typography variant="caption" sx={{ color: 'warning.main' }}>
            ⚠️ This will change the user's access level immediately. The change is logged in the activity history.
          </Typography>
        </Box>
        <FormControl fullWidth>
          <InputLabel>New Role</InputLabel>
          <Select value={role} label="New Role" onChange={e => setRole(e.target.value)} sx={{ borderRadius: 2 }}>
            {allowedRoles.map(r => (
              <MenuItem key={r} value={r}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: ROLE_CONFIG[r]?.color }} />
                  <Typography sx={{ textTransform: 'capitalize', fontWeight: 600 }}>{ROLE_CONFIG[r]?.label || r}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', textTransform: 'none' }}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || role === target?.role}
          sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, textTransform: 'none', fontWeight: 600 }}>
          {saving ? 'Saving...' : 'Change Role'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers]         = useState([]);
  const [search, setSearch]       = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState(null);

  const load = () => userAPI.getAll().then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user? This cannot be undone.')) {
      await userAPI.delete(id); load();
    }
  };

  const handleRoleChange = async (id, role) => {
    await userAPI.updateRole(id, role); load();
  };

  const filtered = users.filter(u => u.role !== 'superadmin' &&
    (u.username.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const groupedByRole = ['admin','pm','assigner','writer'].map(r => ({
    role: r, count: users.filter(u => u.role === r).length,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>User Management</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Manage roles, invite members, remove users</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setInviteOpen(true)}
          sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, textTransform: 'none' }}>
          Invite User
        </Button>
      </Box>

      {/* Role counts */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {groupedByRole.map(({ role, count }) => (
          <Chip key={role} label={`${ROLE_CONFIG[role]?.label}: ${count}`} size="small"
            sx={{ bgcolor: ROLE_CONFIG[role]?.bg, color: ROLE_CONFIG[role]?.color, fontWeight: 700, fontSize: 12 }} />
        ))}
        <Chip icon={<People sx={{ fontSize: '14px !important' }} />} label={`Total: ${users.length}`} size="small"
          sx={{ bgcolor: 'action.hover', color: 'text.secondary', fontWeight: 700, fontSize: 12 }} />
      </Box>

      {/* Search */}
      <TextField placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} size="small"
        InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.disabled', fontSize: 18 }} /></InputAdornment> }}
        sx={{ mb: 2.5, width: 320, '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {['User','Email','Role','Availability','Status','Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(u => {
                const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.writer;
                const av = AVAIL_CONFIG[u.availability] || AVAIL_CONFIG.available;
                return (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: rc.color, fontSize: 13, fontWeight: 700 }}>
                          {u.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{u.username}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="caption" sx={{ color: 'text.secondary' }}>{u.email}</Typography></TableCell>
                    <TableCell>
                      <Chip label={rc.label} size="small" sx={{ bgcolor: rc.bg, color: rc.color, fontWeight: 600, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      {u.role === 'writer'
                        ? <Chip label={av.label} size="small" sx={{ bgcolor: av.bg, color: av.color, fontWeight: 600, fontSize: 11 }} />
                        : <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>
                      }
                    </TableCell>
                    <TableCell>
                      <Chip label={u.isActive ? 'Active' : 'Pending'} size="small"
                        sx={{ bgcolor: u.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: u.isActive ? '#059669' : '#d97706', fontWeight: 600, fontSize: 11 }} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {u.role !== 'admin' && u.id !== currentUser?.id && (
                          <Tooltip title="Change role">
                            <IconButton size="small" onClick={() => setRoleTarget(u)}
                              sx={{ color: '#6366f1', '&:hover': { bgcolor: 'rgba(99,102,241,0.12)' }, borderRadius: 1.5 }}>
                              <SwapHoriz sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        {u.id !== currentUser?.id && (
                          <Tooltip title="Delete user">
                            <IconButton size="small" onClick={() => handleDelete(u.id)}
                              sx={{ color: 'text.disabled', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444' }, borderRadius: 1.5 }}>
                              <Delete sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <InviteModal open={inviteOpen} onClose={() => { setInviteOpen(false); load(); }} />
      <RoleChangeDialog open={!!roleTarget} user={roleTarget} onClose={() => setRoleTarget(null)} onSave={handleRoleChange} currentUserRole={currentUser?.role} />
    </Box>
  );
}
