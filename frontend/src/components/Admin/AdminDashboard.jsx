import React, { useState, useEffect } from 'react';
import { Grid, Typography, Box, Card, CardContent, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, Avatar, Tab, Tabs } from '@mui/material';
import { People, Assignment, CheckCircle, PersonAdd, Delete } from '@mui/icons-material';
import StatCard from '../shared/StatCard';
import TaskTable from '../shared/TaskTable';
import ActivityFeed from '../shared/ActivityFeed';
import InviteModal from '../shared/InviteModal';
import { taskAPI, userAPI } from '../../utils/api';

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [inviteOpen, setInviteOpen] = useState(false);

  const load = () => {
    taskAPI.getStats().then(r => setStats(r.data));
    userAPI.getAll().then(r => setUsers(r.data));
    taskAPI.getAll().then(r => setTasks(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this user?')) { await userAPI.delete(id); load(); }
  };

  const roleConfig = {
    pm:         { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)', label: 'Project Manager' },
    assigner:   { color: '#059669', bg: 'rgba(16,185,129,0.15)', label: 'Assigner' },
    writer:     { color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', label: 'Writer' },
    admin:      { color: '#f97316', bg: 'rgba(249,115,22,0.15)', label: 'Admin' },
    superadmin: { color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Super Admin' },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Admin Dashboard</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Invite PMs and manage your team</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setInviteOpen(true)}
          sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, fontWeight: 600, textTransform: 'none' }}>
          Invite PM
        </Button>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard title="Total Tasks" value={stats.total || 0}       icon={<Assignment />} color="#6366f1" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Completed"   value={stats.completed || 0}   icon={<CheckCircle />} color="#059669" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="In Progress" value={stats.inProgress || 0}  icon={<Assignment />} color="#d97706" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Team Size"   value={users.filter(u => !['superadmin','admin'].includes(u.role)).length} icon={<People />} color="#0ea5e9" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}>
            <Tab label="Users" />
            <Tab label="All Tasks" />
          </Tabs>
          {tab === 0 && (
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      {['User','Email','Role','Status','Actions'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.filter(u => u.role !== 'superadmin').map(u => {
                      const rc = roleConfig[u.role] || roleConfig.writer;
                      return (
                        <TableRow key={u.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: rc.color, fontSize: 13, fontWeight: 700 }}>{u.username?.[0]?.toUpperCase()}</Avatar>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>{u.username}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell><Typography variant="caption" sx={{ color: 'text.secondary' }}>{u.email}</Typography></TableCell>
                          <TableCell><Chip label={rc.label} size="small" sx={{ bgcolor: rc.bg, color: rc.color, fontWeight: 600, fontSize: 11 }} /></TableCell>
                          <TableCell><Chip label={u.isActive ? 'Active' : 'Pending'} size="small" sx={{ bgcolor: u.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: u.isActive ? '#059669' : '#d97706', fontWeight: 600, fontSize: 11 }} /></TableCell>
                          <TableCell>
                            {u.role !== 'admin' && (
                              <IconButton size="small" onClick={() => handleDelete(u.id)} sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)' } }}><Delete sx={{ fontSize: 16 }} /></IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
          {tab === 1 && <TaskTable tasks={tasks} />}
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 2.5 }}>
            <ActivityFeed limit={10} />
          </Card>
        </Grid>
      </Grid>

      <InviteModal open={inviteOpen} onClose={() => { setInviteOpen(false); load(); }} />
    </Box>
  );
}
