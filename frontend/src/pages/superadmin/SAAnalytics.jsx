import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, Chip, LinearProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import PageShell from '../../components/shared/PageShell';
import { taskAPI, userAPI } from '../../utils/api';

const COLORS = ['#6366f1','#059669','#d97706','#ef4444','#0ea5e9'];

export default function SAAnalytics() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(() => {
    taskAPI.getAll().then(r => setTasks(r.data));
    userAPI.getAll().then(r => setUsers(r.data));
    taskAPI.getStats().then(r => setStats(r.data));
  }, []);

  const statusData = [
    { name: 'Pending', value: stats.pending || 0 },
    { name: 'In Progress', value: stats.inProgress || 0 },
    { name: 'Completed', value: stats.completed || 0 },
    { name: 'Assigned', value: (stats.assignedToAssigner || 0) + (stats.assignedToWriter || 0) },
  ].filter(d => d.value > 0);

  const writers = users.filter(u => u.role === 'writer' && u.Performance);
  const perfData = writers.map(w => ({ name: w.username, score: w.Performance?.performanceScore || 0, completed: w.Performance?.completedTasks || 0 }));

  const priorityData = ['high','medium','low'].map(p => ({
    name: p.charAt(0).toUpperCase() + p.slice(1),
    count: tasks.filter(t => t.priority === p).length
  }));

  return (
    <PageShell title="Analytics" subtitle="System-wide performance and task analytics">
      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>Task Status Distribution</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>Writer Performance Scores</Typography>
              {perfData.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>No writer data yet</Typography>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={perfData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0,100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
                    <Bar dataKey="score" fill="#6366f1" radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>Tasks by Priority</Typography>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={priorityData} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0,6,6,0]}>
                    {priorityData.map((_, i) => <Cell key={i} fill={['#ef4444','#d97706','#059669'][i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 2 }}>Writer Leaderboard</Typography>
              {writers.sort((a,b) => (b.Performance?.performanceScore||0) - (a.Performance?.performanceScore||0)).map((w, i) => (
                <Box key={w.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography sx={{ fontWeight: 800, color: i===0?'#d97706':i===1?'#94a3b8':i===2?'#92400e':'#cbd5e1', fontSize: 16, width: 24 }}>{i+1}</Typography>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#0ea5e9', fontSize: 13 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{w.username}</Typography>
                    <LinearProgress variant="determinate" value={w.Performance?.performanceScore || 0}
                      sx={{ height: 5, borderRadius: 3, bgcolor: 'divider', mt: 0.5, '& .MuiLinearProgress-bar': { bgcolor: '#6366f1' } }} />
                  </Box>
                  <Chip label={`${w.Performance?.performanceScore || 0}%`} size="small" sx={{ bgcolor: 'rgba(139,92,246,0.15)', color: '#6366f1', fontWeight: 700, fontSize: 11 }} />
                </Box>
              ))}
              {writers.length === 0 && <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>No writers yet</Typography>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageShell>
  );
}
