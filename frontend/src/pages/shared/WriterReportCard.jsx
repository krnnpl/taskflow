import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar,
  Button, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow, LinearProgress
} from '@mui/material';
import { ArrowBack, Star, Warning, CheckCircle, Assignment, TrendingUp } from '@mui/icons-material';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { analyticsAPI } from '../../utils/api';

const statusColor = s => ({
  completed: '#059669', in_progress: '#0ea5e9', overdue: '#ef4444',
  assigned_to_writer: '#8b5cf6', assigned_to_assigner: '#f97316', pending: '#94a3b8'
}[s] || '#94a3b8');

const statusBg = s => ({
  completed: 'rgba(16,185,129,0.15)', in_progress: '#e0f2fe', overdue: '#fee2e2',
  assigned_to_writer: '#ede9fe', assigned_to_assigner: '#fff7ed', pending: '#f1f5f9'
}[s] || '#f1f5f9');

export default function WriterReportCard({ writerId, onBack }) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsAPI.getWriterReport(writerId)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [writerId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress sx={{ color: '#6366f1' }} /></Box>;
  if (!data) return null;

  const { writer, tasks, trend } = data;
  const perf = writer.Performance || {};
  const levelColor = { expert: '#059669', intermediate: '#d97706', beginner: '#ef4444' }[perf.level] || '#94a3b8';
  const levelBg    = { expert: 'rgba(16,185,129,0.15)', intermediate: 'rgba(245,158,11,0.15)', beginner: '#fee2e2' }[perf.level] || '#f1f5f9';

  const completed = tasks.filter(t => t.status === 'completed').length;
  const overdue   = tasks.filter(t => t.status === 'overdue').length;
  const inProgress= tasks.filter(t => t.status === 'in_progress').length;
  const compRate  = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  const radarData = [
    { subject: 'Completion', value: compRate },
    { subject: 'Quality',    value: Math.round((perf.avgRating || 0) / 5 * 100) },
    { subject: 'Volume',     value: Math.min(tasks.length * 10, 100) },
    { subject: 'On-Time',    value: tasks.length > 0 ? Math.round(((tasks.length - overdue) / tasks.length) * 100) : 100 },
    { subject: 'Score',      value: perf.performanceScore || 0 },
  ];

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={onBack}
        sx={{ mb: 3, color: 'text.secondary', textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: 'action.hover' } }}>
        Back to Analytics
      </Button>

      {/* Header */}
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', mb: 3, background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 28, fontWeight: 800, color: 'white', border: '3px solid rgba(255,255,255,0.4)' }}>
              {writer.username[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontSize: 26, fontWeight: 800, color: 'white' }}>{writer.username}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{writer.email}</Typography>
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
                <Chip label={perf.level || 'beginner'} size="small" sx={{ bgcolor: levelBg, color: levelColor, fontWeight: 700, textTransform: 'capitalize' }} />
                <Chip label={`Score: ${perf.performanceScore || 0}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 700 }} />
                <Chip label={`Member since ${new Date(writer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                  size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.85)', fontSize: 11 }} />
              </Box>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{ fontSize: 52, fontWeight: 900, color: 'white', lineHeight: 1 }}>{perf.performanceScore || 0}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Performance Score</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stats row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {[
          { label: 'Total Tasks',   value: tasks.length,  icon: <Assignment />,  color: '#6366f1' },
          { label: 'Completed',     value: completed,     icon: <CheckCircle />, color: '#059669', sub: `${compRate}%` },
          { label: 'In Progress',   value: inProgress,    icon: <TrendingUp />,  color: '#0ea5e9' },
          { label: 'Overdue',       value: overdue,       icon: <Warning />,     color: '#ef4444' },
          { label: 'Avg Rating',    value: `${(perf.avgRating || 0).toFixed(1)} ★`, icon: <Star />, color: '#f59e0b' },
          { label: 'Complaints',    value: perf.complaints || 0, icon: <Warning />, color: '#dc2626' },
        ].map(s => (
          <Grid item xs={6} md={2} key={s.label}>
            <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', p: 2, textAlign: 'center' }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1 }}>
                {React.cloneElement(s.icon, { sx: { color: s.color, fontSize: 18 } })}
              </Box>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: 'text.primary' }}>{s.value}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>{s.label}</Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Trend chart */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 3 }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>Performance Trend (6 Months)</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'text.secondary' }} />
                <YAxis tick={{ fontSize: 12, fill: 'text.secondary' }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid' }} />
                <Legend />
                <Line type="monotone" dataKey="completed" name="Completed" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="overdue"   name="Overdue"   stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        {/* Radar */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 3 }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>Performance Profile</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'text.secondary' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip formatter={v => [`${v}%`]} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Score breakdown */}
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 3, mb: 3 }}>
        <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>Score Breakdown</Typography>
        {[
          { label: 'Completion Rate (30%)',   value: compRate,                      color: '#6366f1' },
          { label: 'Quality / Avg Rating (25%)', value: Math.round((perf.avgRating || 0) / 5 * 100), color: '#f59e0b' },
          { label: 'Volume (15%)',            value: Math.min(tasks.length * 8, 100), color: '#0ea5e9' },
          { label: 'On-Time Rate',            value: tasks.length > 0 ? Math.round(((tasks.length - overdue) / tasks.length) * 100) : 100, color: '#059669' },
        ].map(f => (
          <Box key={f.label} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>{f.label}</Typography>
              <Typography variant="body2" sx={{ color: f.color, fontWeight: 700 }}>{f.value}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={f.value}
              sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover',
                '& .MuiLinearProgress-bar': { bgcolor: f.color, borderRadius: 4 } }} />
          </Box>
        ))}
      </Card>

      {/* Task history */}
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
          <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Task History ({tasks.length})</Typography>
        </Box>
        <Table>
          <TableHead>
            <TableRow>
              {['Task','Status','Priority','Due Date','Rating'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 11, textTransform: 'uppercase' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {tasks.slice(0, 20).map(t => (
              <TableRow key={t.id} hover>
                <TableCell><Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{t.title}</Typography></TableCell>
                <TableCell>
                  <Chip label={t.status.replace(/_/g,' ')} size="small"
                    sx={{ bgcolor: statusBg(t.status), color: statusColor(t.status), fontWeight: 600, fontSize: 11, textTransform: 'capitalize' }} />
                </TableCell>
                <TableCell>
                  <Chip label={t.priority} size="small"
                    sx={{ bgcolor: t.priority === 'high' ? '#fee2e2' : t.priority === 'medium' ? 'rgba(245,158,11,0.15)' : '#f1f5f9',
                      color: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#d97706' : '#64748b', fontWeight: 600, fontSize: 11 }} />
                </TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                  </Typography>
                </TableCell>
                <TableCell>
                  {t.Feedbacks?.length > 0
                    ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}><Typography sx={{ color: '#f59e0b' }}>★</Typography><Typography variant="body2">{t.Feedbacks[0].rating}</Typography></Box>
                    : <Typography variant="caption" sx={{ color: 'text.disabled' }}>—</Typography>
                  }
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Box>
  );
}
