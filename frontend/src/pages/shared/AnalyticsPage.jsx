import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress,
  Select, MenuItem, FormControl, InputLabel, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, Avatar, Button, Tab, Tabs, LinearProgress
} from '@mui/material';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Assignment, CheckCircle, Warning, Download, People } from '@mui/icons-material';
import { analyticsAPI, userAPI } from '../../utils/api';
import WriterReportCard from './WriterReportCard';

const STATUS_COLORS = {
  pending: '#94a3b8', assigned_to_assigner: '#f97316', assigned_to_writer: '#8b5cf6',
  in_progress: '#0ea5e9', completed: '#059669', overdue: '#ef4444', rejected: '#6b7280',
};
const CHART_COLORS = ['#6366f1','#059669','#ef4444','#f97316','#0ea5e9','#8b5cf6'];

function StatCard({ title, value, icon, color, sub }) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>{title}</Typography>
            <Typography sx={{ fontSize: 36, fontWeight: 800, color: 'text.primary', lineHeight: 1.2, mt: 0.5 }}>{value}</Typography>
            {sub && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{sub}</Typography>}
          </Box>
          <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab]           = useState(0);
  const [overview, setOverview] = useState({});
  const [monthly, setMonthly]   = useState([]);
  const [writers, setWriters]   = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [selectedWriter, setSelectedWriter] = useState(null);
  const [loading, setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, mo, wr, st, pr] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getByMonth(),
        analyticsAPI.getWriters(),
        analyticsAPI.getStatus(),
        analyticsAPI.getPriority(),
      ]);
      setOverview(ov.data);
      setMonthly(mo.data);
      setWriters(wr.data);
      setStatuses(st.data);
      setPriorities(pr.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const levelColor = l => ({ expert: '#059669', intermediate: '#d97706', beginner: '#ef4444' }[l] || '#94a3b8');
  const levelBg    = l => ({ expert: 'rgba(16,185,129,0.15)', intermediate: 'rgba(245,158,11,0.15)', beginner: '#fee2e2' }[l] || '#f1f5f9');

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
      <CircularProgress sx={{ color: '#6366f1' }} />
    </Box>
  );

  if (selectedWriter) return (
    <WriterReportCard writerId={selectedWriter} onBack={() => setSelectedWriter(null)} />
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>Analytics & Reports</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>Team performance overview and insights</Typography>
      </Box>

      {/* Overview cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard title="Total Tasks"      value={overview.total || 0}          icon={<Assignment />}    color="#6366f1" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Completed"        value={overview.completed || 0}      icon={<CheckCircle />}   color="#059669" sub={`${overview.completionRate || 0}% rate`} /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Overdue"          value={overview.overdue || 0}        icon={<Warning />}       color="#ef4444" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="In Progress"      value={overview.inProgress || 0}     icon={<TrendingUp />}    color="#0ea5e9" /></Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: 14 } }}>
        <Tab label="Task Trends" />
        <Tab label="Status Breakdown" />
        <Tab label="Writer Performance" />
      </Tabs>

      {/* TAB 0: Monthly trends */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>Tasks Per Month (Last 6 Months)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'text.secondary' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'text.secondary' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                  <Legend />
                  <Bar dataKey="created"   name="Created"   fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="completed" name="Completed" fill="#059669" radius={[4,4,0,0]} />
                  <Bar dataKey="overdue"   name="Overdue"   fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} lg={4}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>Priority Split</Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={priorities} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={80} label={({ priority, count }) => `${priority}: ${count}`} labelLine={false}>
                    {priorities.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {priorities.map((p, i) => (
                  <Box key={p.priority} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: CHART_COLORS[i % CHART_COLORS.length] }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize', flex: 1 }}>{p.priority}</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>{p.count}</Typography>
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>Completion Trend</Typography>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'text.secondary' }} />
                  <YAxis tick={{ fontSize: 12, fill: 'text.secondary' }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid' }} />
                  <Legend />
                  <Line type="monotone" dataKey="completed" name="Completed" stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="overdue"   name="Overdue"   stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: Status breakdown */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>Tasks by Status</Typography>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={statuses} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={110} label={({ status, count }) => `${count}`}>
                    {statuses.map((s) => <Cell key={s.status} fill={STATUS_COLORS[s.status] || '#94a3b8'} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n.replace(/_/g,' ')]} />
                  <Legend formatter={v => v.replace(/_/g,' ')} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 3 }}>
              <Typography sx={{ fontWeight: 700, color: 'text.primary', mb: 3 }}>Status Breakdown</Typography>
              {statuses.map(s => {
                const total = statuses.reduce((a, b) => a + b.count, 0);
                const pct   = total > 0 ? Math.round((s.count / total) * 100) : 0;
                return (
                  <Box key={s.status} sx={{ mb: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize', color: 'text.primary', fontWeight: 600 }}>
                        {s.status.replace(/_/g,' ')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>{s.count} ({pct}%)</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={pct}
                      sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': { bgcolor: STATUS_COLORS[s.status] || '#94a3b8', borderRadius: 4 } }} />
                  </Box>
                );
              })}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 2: Writer performance table */}
      {tab === 2 && (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
          <Box sx={{ p: 3, borderBottom: '1px solid #f1f5f9' }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>Writer Performance Rankings</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>Click a writer to view their full report card</Typography>
          </Box>
          <Table>
            <TableHead>
              <TableRow>
                {['#','Writer','Score','Level','Tasks','Completed','Overdue','Corrections','Avg Rating','Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {writers.map((w, i) => (
                <TableRow key={w.id} hover sx={{ cursor: 'pointer' }} onClick={() => setSelectedWriter(w.id)}>
                  <TableCell>
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: i < 3 ? ['#fbbf24','#94a3b8','#b45309'][i] : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: i < 3 ? 'white' : '#64748b' }}>{i+1}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366f1', fontSize: 13, fontWeight: 700 }}>{w.username[0].toUpperCase()}</Avatar>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{w.username}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 800, color: '#6366f1', fontSize: 16 }}>{w.score}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={w.level} size="small" sx={{ bgcolor: levelBg(w.level), color: levelColor(w.level), fontWeight: 700, textTransform: 'capitalize', fontSize: 11 }} />
                  </TableCell>
                  <TableCell><Typography variant="body2">{w.total}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: '#059669', fontWeight: 600 }}>{w.completed}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: w.overdue > 0 ? '#ef4444' : '#64748b', fontWeight: w.overdue > 0 ? 700 : 400 }}>{w.overdue}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ color: w.corrections > 0 ? '#f97316' : '#64748b', fontWeight: w.corrections > 0 ? 700 : 400 }}>{w.corrections || 0}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography sx={{ color: '#f59e0b', fontWeight: 700 }}>★</Typography>
                      <Typography variant="body2">{(w.avgRating || 0).toFixed(1)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={e => { e.stopPropagation(); setSelectedWriter(w.id); }}
                      sx={{ borderRadius: 2, borderColor: 'divider', color: '#6366f1', fontSize: 11, textTransform: 'none', fontWeight: 600 }}>
                      Report Card
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
