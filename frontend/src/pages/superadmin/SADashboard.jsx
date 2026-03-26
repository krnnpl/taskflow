import React, { useState, useEffect } from 'react';
import { Grid, Box, Card, CardContent, Typography, Avatar, Chip, LinearProgress } from '@mui/material';
import { Assignment, CheckCircle, HourglassEmpty, People, TrendingUp, Warning } from '@mui/icons-material';
import StatCard from '../../components/shared/StatCard';
import { taskAPI, userAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const ROLE_CONFIG = {
  superadmin: { color: '#ef4444', label: 'Super Admin', bg: 'rgba(239,68,68,0.12)' },
  admin:      { color: '#f97316', label: 'Admin',       bg: 'rgba(249,115,22,0.12)' },
  pm:         { color: '#8b5cf6', label: 'Project Manager', bg: 'rgba(139,92,246,0.12)' },
  assigner:   { color: '#10b981', label: 'Assigner',    bg: 'rgba(16,185,129,0.12)' },
  writer:     { color: '#0ea5e9', label: 'Writer',      bg: 'rgba(14,165,233,0.12)' },
};

export default function SADashboard() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    taskAPI.getStats().then(r => setStats(r.data));
    userAPI.getAll().then(r => setUsers(r.data));
  }, []);

  const roleCounts = Object.entries(ROLE_CONFIG).map(([role, cfg]) => ({
    role, ...cfg, count: users.filter(u => u.role === role).length,
  }));
  const activeUsers    = users.filter(u => u.isActive).length;
  const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>System Overview</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Full visibility across all users and tasks
        </Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={2.4}><StatCard title="Total Tasks"   value={stats.total||0}      icon={<Assignment />}     color="#6366f1" /></Grid>
        <Grid item xs={6} md={2.4}><StatCard title="Completed"     value={stats.completed||0}  icon={<CheckCircle />}    color="#10b981" /></Grid>
        <Grid item xs={6} md={2.4}><StatCard title="In Progress"   value={stats.inProgress||0} icon={<HourglassEmpty />} color="#f59e0b" /></Grid>
        <Grid item xs={6} md={2.4}><StatCard title="Overdue"       value={stats.overdue||0}    icon={<Warning />}        color="#ef4444" /></Grid>
        <Grid item xs={6} md={2.4}><StatCard title="Active Users"  value={activeUsers}         icon={<People />}         color="#0ea5e9" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Team breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
                Team Breakdown
              </Typography>
              {roleCounts.map(rc => (
                <Box key={rc.role} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                  <Box sx={{ width: 42, height: 42, borderRadius: 2, bgcolor: rc.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Typography sx={{ fontWeight: 900, color: rc.color, fontSize: 16 }}>{rc.count}</Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {rc.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        {users.length ? Math.round((rc.count / users.length) * 100) : 0}%
                      </Typography>
                    </Box>
                    <LinearProgress variant="determinate"
                      value={users.length ? (rc.count / users.length) * 100 : 0}
                      sx={{ height: 6, borderRadius: 4,
                        bgcolor: rc.bg,
                        '& .MuiLinearProgress-bar': { bgcolor: rc.color, borderRadius: 4 } }} />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Task health */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>
                Task Health
              </Typography>

              {/* Completion ring */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 120, height: 120 }}>
                  <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%',
                    background: `conic-gradient(#10b981 ${completionRate * 3.6}deg, rgba(16,185,129,0.1) 0deg)`,
                    padding: 1.5 }} />
                  <Box sx={{ position: 'relative', width: 88, height: 88, borderRadius: '50%',
                    bgcolor: 'background.paper', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontWeight: 900, fontSize: 24, color: '#10b981', lineHeight: 1 }}>
                      {completionRate}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>Complete</Typography>
                  </Box>
                </Box>
              </Box>

              {[
                { label: 'Completed',   value: stats.completed||0,  color: '#10b981', total: stats.total||1 },
                { label: 'In Progress', value: stats.inProgress||0, color: '#6366f1', total: stats.total||1 },
                { label: 'Overdue',     value: stats.overdue||0,    color: '#ef4444', total: stats.total||1 },
                { label: 'Pending',     value: stats.pending||0,    color: '#f59e0b', total: stats.total||1 },
              ].map(s => (
                <Box key={s.label} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>{s.label}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>{s.value}</Typography>
                  </Box>
                  <LinearProgress variant="determinate"
                    value={s.total > 0 ? (s.value / s.total) * 100 : 0}
                    sx={{ height: 5, borderRadius: 3,
                      bgcolor: `${s.color}15`,
                      '& .MuiLinearProgress-bar': { bgcolor: s.color, borderRadius: 3 } }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
