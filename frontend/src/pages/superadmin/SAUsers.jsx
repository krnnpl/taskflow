import React, { useState, useEffect } from 'react';
import {
  Box, Card, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Avatar, Chip, IconButton, Button, Typography,
  Select, MenuItem, Tooltip, TextField, InputAdornment, LinearProgress
} from '@mui/material';
import { Delete, PersonAdd, Search, People, SwapHoriz } from '@mui/icons-material';
import InviteModal from '../../components/shared/InviteModal';
import { userAPI } from '../../utils/api';

const ROLE_CONFIG = {
  superadmin: { color: '#ef4444', label: 'Super Admin', bg: 'rgba(239,68,68,0.12)' },
  admin:      { color: '#f97316', label: 'Admin',       bg: 'rgba(249,115,22,0.12)' },
  pm:         { color: '#8b5cf6', label: 'PM',          bg: 'rgba(139,92,246,0.12)' },
  assigner:   { color: '#10b981', label: 'Assigner',    bg: 'rgba(16,185,129,0.12)' },
  writer:     { color: '#0ea5e9', label: 'Writer',      bg: 'rgba(14,165,233,0.12)' },
};

export default function SAUsers() {
  const [users, setUsers]           = useState([]);
  const [search, setSearch]         = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = () => userAPI.getAll().then(r => setUsers(r.data));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user? This cannot be undone.')) {
      await userAPI.delete(id); load();
    }
  };
  const handleRoleChange = async (id, role) => { await userAPI.updateRole(id, role); load(); };

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleGroups = Object.entries(ROLE_CONFIG).map(([role, cfg]) => ({
    ...cfg, role, count: users.filter(u => u.role === role).length,
  }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>All Users</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Manage roles, invite members, remove users
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setInviteOpen(true)}
          sx={{ borderRadius: 2.5, fontWeight: 700 }}>
          Add User
        </Button>
      </Box>

      {/* Role summary chips */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
        {roleGroups.map(r => (
          <Box key={r.role} sx={{ display: 'flex', alignItems: 'center', gap: 1,
            px: 2, py: 1, borderRadius: 2.5, bgcolor: r.bg, border: `1px solid ${r.color}30` }}>
            <Typography sx={{ fontWeight: 900, color: r.color, fontSize: 16, lineHeight: 1 }}>{r.count}</Typography>
            <Typography variant="caption" sx={{ color: r.color, fontWeight: 600 }}>{r.label}</Typography>
          </Box>
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1,
          px: 2, py: 1, borderRadius: 2.5, bgcolor: 'action.hover' }}>
          <People sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {users.length} total
          </Typography>
        </Box>
      </Box>

      {/* Search */}
      <Box sx={{ mb: 2.5 }}>
        <TextField placeholder="Search by name or email..." size="small" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: 'text.disabled' }} /></InputAdornment> }}
          sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 2.5 } }} />
      </Box>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['User', 'Email', 'Role', 'Status', 'Change Role', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '0.06em', color: 'text.secondary', py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(u => {
                const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.writer;
                return (
                  <TableRow key={u.id} hover>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: rc.color, fontSize: 13, fontWeight: 800,
                          boxShadow: `0 0 0 3px ${rc.color}25` }}>
                          {u.username?.[0]?.toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.3 }}>
                            {u.username}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>
                            ID #{u.id}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{u.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Chip label={rc.label} size="small"
                        sx={{ bgcolor: rc.bg, color: rc.color, fontWeight: 700, fontSize: 11,
                          border: `1px solid ${rc.color}30`, height: 24 }} />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%',
                          bgcolor: u.isActive ? '#10b981' : '#f59e0b',
                          boxShadow: u.isActive ? '0 0 0 3px rgba(16,185,129,0.2)' : '0 0 0 3px rgba(245,158,11,0.2)' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600,
                          color: u.isActive ? '#10b981' : '#f59e0b' }}>
                          {u.isActive ? 'Active' : 'Pending'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      {u.role !== 'superadmin' ? (
                        <Select size="small" value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          sx={{ fontSize: 13, minWidth: 130, borderRadius: 2,
                            '& .MuiSelect-select': { py: 0.8, color: 'text.primary' } }}>
                          {['admin','pm','assigner','writer'].map(r => (
                            <MenuItem key={r} value={r} sx={{ color: 'text.primary' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ROLE_CONFIG[r]?.color, flexShrink: 0 }} />
                                {ROLE_CONFIG[r]?.label}
                              </Box>
                            </MenuItem>
                          ))}
                        </Select>
                      ) : (
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                          Fixed role
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      {u.role !== 'superadmin' && (
                        <Tooltip title="Delete user">
                          <IconButton size="small" onClick={() => handleDelete(u.id)}
                            sx={{ color: 'text.disabled', borderRadius: 2,
                              '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.1)' } }}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <InviteModal open={inviteOpen} onClose={() => { setInviteOpen(false); load(); }} />
    </Box>
  );
}
