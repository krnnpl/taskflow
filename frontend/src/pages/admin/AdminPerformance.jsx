import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, Chip, LinearProgress, Tab, Tabs } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { EmojiEvents, TrendingUp, Warning, CheckCircle, Star } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import StatCard from '../../components/shared/StatCard';
import { userAPI } from '../../utils/api';

const levelConfig = {
  beginner:     { color: 'text.secondary', bg: 'rgba(100,116,139,0.15)', emoji: '🌱' },
  intermediate: { color: '#d97706', bg: 'rgba(245,158,11,0.15)', emoji: '⭐' },
  expert:       { color: '#059669', bg: 'rgba(16,185,129,0.15)', emoji: '🏆' },
};

export default function AdminPerformance() {
  const [writers, setWriters] = useState([]);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    userAPI.getWriters().then(r => {
      const withPerf = r.data.filter(w => w.Performance);
      setWriters(withPerf);
      if (withPerf.length > 0) setSelected(withPerf[0]);
    });
  }, []);

  const radarData = selected?.Performance ? [
    { metric: 'Completion',    value: selected.Performance.completionRate || 0 },
    { metric: 'Quality',       value: selected.Performance.qualityScore || 0 },
    { metric: 'Feedback',      value: selected.Performance.feedbackScore || 0 },
    { metric: 'Volume',        value: Math.min((selected.Performance.completedTasks / 20) * 100, 100) },
    { metric: 'Clean Record',  value: Math.max(0, 100 - (selected.Performance.complaints || 0) * 20) },
  ] : [];

  const barData = writers.map(w => ({
    name: w.username.split(' ')[0],
    score: w.Performance?.performanceScore || 0,
    completed: w.Performance?.completedTasks || 0,
  }));

  const avgScore = writers.length
    ? Math.round(writers.reduce((s, w) => s + (w.Performance?.performanceScore || 0), 0) / writers.length)
    : 0;
  const experts = writers.filter(w => w.Performance?.level === 'expert').length;
  const totalComplaints = writers.reduce((s, w) => s + (w.Performance?.complaints || 0), 0);

  return (
    <PageShell title="Writer Performance" subtitle="Full performance overview for all writers">
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard title="Total Writers" value={writers.length} icon={<TrendingUp />} color="#6366f1" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Avg Score" value={`${avgScore}%`} icon={<Star />} color="#d97706" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Expert Level" value={experts} icon={<EmojiEvents />} color="#059669" /></Grid>
        <Grid item xs={6} md={3}><StatCard title="Total Complaints" value={totalComplaints} icon={<Warning />} color="#ef4444" /></Grid>
      </Grid>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600, textTransform: 'none' } }}>
        <Tab label="Overview" />
        <Tab label="Individual Detail" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>Performance Comparison</Typography>
                {barData.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>No writer data yet</Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={barData}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v, n) => [`${v}${n === 'score' ? '%' : ''}`, n === 'score' ? 'Score' : 'Completed']} />
                      <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} name="score" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>Leaderboard</Typography>
                {writers.sort((a, b) => (b.Performance?.performanceScore || 0) - (a.Performance?.performanceScore || 0)).map((w, i) => {
                  const lc = levelConfig[w.Performance?.level] || levelConfig.beginner;
                  return (
                    <Box key={w.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Typography sx={{ fontWeight: 900, color: i === 0 ? '#d97706' : i === 1 ? '#94a3b8' : '#cd7c2f', fontSize: 16, width: 22 }}>{i + 1}</Typography>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: '#0ea5e9', fontSize: 12, fontWeight: 700 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{w.username}</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#6366f1' }}>{w.Performance?.performanceScore || 0}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={w.Performance?.performanceScore || 0}
                          sx={{ height: 5, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: lc.color } }} />
                      </Box>
                      <Chip label={lc.emoji} size="small" sx={{ bgcolor: lc.bg, color: lc.color, fontWeight: 700, px: 0.5 }} />
                    </Box>
                  );
                })}
                {writers.length === 0 && <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>No writers yet</Typography>}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Grid container spacing={3}>
          {/* Writer selector */}
          <Grid item xs={12} md={3}>
            <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, display: 'block', mb: 1.5 }}>Select Writer</Typography>
                {writers.map(w => {
                  const lc = levelConfig[w.Performance?.level] || levelConfig.beginner;
                  const isSelected = selected?.id === w.id;
                  return (
                    <Box key={w.id} onClick={() => setSelected(w)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, mb: 1, cursor: 'pointer', bgcolor: isSelected ? '#ede9fe' : 'transparent', border: `1px solid ${isSelected ? '#c4b5fd' : 'transparent'}`, '&:hover': { bgcolor: 'background.default' } }}>
                      <Avatar sx={{ width: 30, height: 30, bgcolor: '#0ea5e9', fontSize: 12, fontWeight: 700 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
                      <Box sx={{ flex: 1, overflow: 'hidden' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{w.username}</Typography>
                        <Typography variant="caption" sx={{ color: lc.color, fontWeight: 600 }}>{lc.emoji} {w.Performance?.level}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#6366f1' }}>{w.Performance?.performanceScore || 0}%</Typography>
                    </Box>
                  );
                })}
                {writers.length === 0 && <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>No writers yet</Typography>}
              </CardContent>
            </Card>
          </Grid>

          {/* Detail panel */}
          <Grid item xs={12} md={9}>
            {selected && selected.Performance ? (
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', textAlign: 'center' }}>
                    <CardContent sx={{ p: 3 }}>
                      {(() => { const lc = levelConfig[selected.Performance.level] || levelConfig.beginner; return (
                        <>
                          <Avatar sx={{ width: 52, height: 52, bgcolor: '#0ea5e9', fontSize: 20, fontWeight: 800, mx: 'auto', mb: 1.5 }}>{selected.username?.[0]?.toUpperCase()}</Avatar>
                          <Typography variant="body1" sx={{ fontWeight: 800 }}>{selected.username}</Typography>
                          <Typography sx={{ fontSize: 52, fontWeight: 900, color: lc.color, lineHeight: 1.2, mt: 1 }}>{Math.round(selected.Performance.performanceScore)}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled' }}>/ 100</Typography>
                          <Box sx={{ mt: 1.5 }}>
                            <Chip label={`${lc.emoji} ${selected.Performance.level}`} sx={{ bgcolor: lc.bg, color: lc.color, fontWeight: 700, textTransform: 'capitalize' }} />
                          </Box>
                        </>
                      ); })()}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={8}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>Radar View</Typography>
                      <ResponsiveContainer width="100%" height={190}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'text.secondary' }} />
                          <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                          <Tooltip formatter={v => [`${Math.round(v)}%`]} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, mb: 2 }}>Metric Breakdown</Typography>
                      <Grid container spacing={2}>
                        {[
                          { label: 'Task Completion', value: selected.Performance.completionRate, color: '#059669', sub: `${selected.Performance.completedTasks}/${selected.Performance.totalTasks} tasks` },
                          { label: 'Quality of Work', value: selected.Performance.qualityScore, color: '#6366f1', sub: `Avg: ${selected.Performance.avgRating}/5 ★` },
                          { label: 'Feedback Score', value: selected.Performance.feedbackScore, color: '#0ea5e9', sub: 'PM + Assigner feedback' },
                          { label: 'Volume', value: Math.min((selected.Performance.completedTasks / 20) * 100, 100), color: '#d97706', sub: `${selected.Performance.completedTasks} completed` },
                        ].map(m => (
                          <Grid item xs={6} key={m.label}>
                            <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>{m.label}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: m.color }}>{Math.round(m.value)}%</Typography>
                              </Box>
                              <LinearProgress variant="determinate" value={Math.min(m.value, 100)} sx={{ height: 6, borderRadius: 3, bgcolor: `${m.color}20`, '& .MuiLinearProgress-bar': { bgcolor: m.color } }} />
                              <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block', fontSize: 11 }}>{m.sub}</Typography>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                      {selected.Performance.complaints > 0 && (
                        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(239,68,68,0.15)', borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {selected.Performance.complaints} complaint{selected.Performance.complaints > 1 ? 's' : ''} on record (each deducts 5 pts)</Typography>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : (
              <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 6, textAlign: 'center' }}>
                <Typography variant="body1" sx={{ color: 'text.disabled' }}>Select a writer to view their performance</Typography>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </PageShell>
  );
}
