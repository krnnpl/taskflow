import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Alert, Avatar, Tab, Tabs } from '@mui/material';
import { People, Assignment, CheckCircle, HourglassEmpty, Delete, PersonAdd, AdminPanelSettings, SupervisorAccount, Person, VerifiedUser } from '@mui/icons-material';
import StatCard from '../shared/StatCard';
import TaskTable from '../shared/TaskTable';
import { taskAPI, userAPI, authAPI } from '../../utils/api';
import ActivityFeed from '../shared/ActivityFeed';

const roleConfig = {
  superadmin: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Super Admin' },
  admin: { color: '#f97316', bg: 'rgba(249,115,22,0.15)', label: 'Admin' },
  pm: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'Project Manager' },
  assigner: { color: '#059669', bg: 'rgba(16,185,129,0.15)', label: 'Assigner' },
  writer: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', label: 'Writer' },
};

function PageHeader({ title, subtitle, action }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', fontFamily: '"Syne", sans-serif' }}>{title}</Typography>
        {subtitle && <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{subtitle}</Typography>}
      </Box>
      {action}
    </Box>
  );
}

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: '', role: 'admin' });
  const [inviteMsg, setInviteMsg] = useState({ type: '', text: '' });

  const load = () => {
    taskAPI.getStats().then(r => setStats(r.data));
    userAPI.getAll().then(r => setUsers(r.data));
    taskAPI.getAll().then(r => setTasks(r.data));
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async () => {
    setInviteMsg({});
    try {
      await authAPI.invite(invite);
      setInviteMsg({ type: 'success', text: `Admin invitation sent to ${invite.email}` });
      setInvite({ email: '', role: 'admin' });
      load();
    } catch (err) { setInviteMsg({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user?')) { await userAPI.delete(id); load(); }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Delete this task?')) { await taskAPI.delete(id); load(); }
  };

  const grouped = { superadmin: [], admin: [], pm: [], assigner: [], writer: [] };
  users.forEach(u => { if (grouped[u.role]) grouped[u.role].push(u); });

  return (
    <Box>
      <PageHeader
        title="Super Admin Dashboard"
        subtitle="Full system control and oversight"
        action={<Button variant="contained" startIcon={<PersonAdd />} onClick={() => setInviteOpen(true)} sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>Add Admin</Button>}
      />

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}><StatCard title="Total Tasks" value={stats.total || 0} icon={<Assignment />} color="#6366f1" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Completed" value={stats.completed || 0} icon={<CheckCircle />} color="#059669" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="In Progress" value={stats.inProgress || 0} icon={<HourglassEmpty />} color="#d97706" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Total Users" value={users.length} icon={<People />} color="#0ea5e9" /></Grid>
      </Grid>

      {/* Role breakdown */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {Object.entries(grouped).map(([role, list]) => {
          const rc = roleConfig[role];
          return (
            <Grid item xs={6} md={2.4} key={role}>
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', textAlign: 'center', p: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: rc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                  <Typography sx={{ color: rc.color, fontWeight: 800, fontSize: 18 }}>{list.length}</Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 11 }}>{rc.label}s</Typography>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: 14 } }}>
        <Tab label="All Users" />
        <Tab label="All Tasks" />
      </Tabs>

      {tab === 0 && (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {['User', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map(u => {
                    const rc = roleConfig[u.role] || roleConfig.writer;
                    return (
                      <TableRow key={u.id} hover sx={{ '&:hover': { bgcolor: 'background.default' } }}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: rc.color, fontSize: 13, fontWeight: 700 }}>{u.username?.[0]?.toUpperCase()}</Avatar>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{u.username}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell><Typography variant="caption" sx={{ color: 'text.secondary' }}>{u.email}</Typography></TableCell>
                        <TableCell><Chip label={rc.label} size="small" sx={{ bgcolor: rc.bg, color: rc.color, fontWeight: 600, fontSize: 11 }} /></TableCell>
                        <TableCell><Chip label={u.isActive ? 'Active' : 'Pending'} size="small" sx={{ bgcolor: u.isActive ? 'rgba(16,185,129,0.15)' : '#f1f5f9', color: u.isActive ? '#059669' : '#64748b', fontWeight: 600, fontSize: 11 }} /></TableCell>
                        <TableCell>
                          {u.role !== 'superadmin' && (
                            <IconButton size="small" onClick={() => handleDelete(u.id)} sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)' } }}><Delete sx={{ fontSize: 16 }} /></IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {tab === 1 && <TaskTable tasks={tasks} onDelete={handleDeleteTask} />}

      {/* Invite Admin Dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Admin</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {inviteMsg.text && <Alert severity={inviteMsg.type} sx={{ borderRadius: 2 }}>{inviteMsg.text}</Alert>}
          <TextField label="Admin Email" type="email" fullWidth value={invite.email} onChange={e => setInvite({ ...invite, email: e.target.value })} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
          <TextField label="Role" value="Admin" disabled fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setInviteOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleInvite} sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>Send Invitation</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
