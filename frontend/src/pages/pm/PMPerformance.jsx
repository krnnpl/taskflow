import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, Chip, LinearProgress } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import PageShell from '../../components/shared/PageShell';
import { userAPI } from '../../utils/api';

const levelConfig = {
  beginner: { color: 'text.secondary', bg: 'rgba(100,116,139,0.15)', emoji: '🌱' },
  intermediate: { color: '#d97706', bg: 'rgba(245,158,11,0.15)', emoji: '⭐' },
  expert: { color: '#059669', bg: 'rgba(16,185,129,0.15)', emoji: '🏆' },
};

export default function PMPerformance() {
  const [writers, setWriters] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    userAPI.getWriters().then(r => {
      setWriters(r.data);
      if (r.data.length > 0) setSelected(r.data[0]);
    });
  }, []);

  const radarData = selected?.Performance ? [
    { metric: 'Completion', value: selected.Performance.completionRate || 0 },
    { metric: 'Quality', value: selected.Performance.qualityScore || 0 },
    { metric: 'Feedback', value: selected.Performance.feedbackScore || 0 },
    { metric: 'Volume', value: Math.min((selected.Performance.completedTasks / 20) * 100, 100) },
    { metric: 'Clean Record', value: Math.max(0, 100 - (selected.Performance.complaints || 0) * 20) },
  ] : [];

  return (
    <PageShell title="Writer Performance" subtitle="Detailed performance metrics for each writer">
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: 10, letterSpacing: 0.5, display: 'block', mb: 1.5 }}>Writers</Typography>
              {writers.map(w => {
                const lc = levelConfig[w.Performance?.level] || levelConfig.beginner;
                const isSelected = selected?.id === w.id;
                return (
                  <Box key={w.id} onClick={() => setSelected(w)} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, mb: 1, cursor: 'pointer', bgcolor: isSelected ? '#ede9fe' : 'transparent', border: `1px solid ${isSelected ? '#c4b5fd' : 'transparent'}`, '&:hover': { bgcolor: 'background.default' } }}>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#0ea5e9', fontSize: 13, fontWeight: 700 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
                    <Box sx={{ flex: 1, overflow: 'hidden' }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{w.username}</Typography>
                      <Typography variant="caption" sx={{ color: lc.color, fontWeight: 600 }}>{lc.emoji} {w.Performance?.level || 'beginner'}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#6366f1' }}>{w.Performance?.performanceScore || 0}%</Typography>
                  </Box>
                );
              })}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          {selected && selected.Performance ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', textAlign: 'center' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: '#0ea5e9', fontSize: 22, fontWeight: 800, mx: 'auto', mb: 2 }}>{selected.username?.[0]?.toUpperCase()}</Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>{selected.username}</Typography>
                    <Typography sx={{ fontSize: 52, fontWeight: 900, color: '#6366f1', lineHeight: 1.2, fontFamily: '"Syne", sans-serif' }}>{Math.round(selected.Performance.performanceScore)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>Performance Score</Typography>
                    <Box sx={{ mt: 2 }}>
                      {(() => { const lc = levelConfig[selected.Performance.level] || levelConfig.beginner; return <Chip label={`${lc.emoji} ${selected.Performance.level}`} sx={{ bgcolor: lc.bg, color: lc.color, fontWeight: 700, textTransform: 'capitalize' }} />; })()}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={8}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 1 }}>Performance Radar</Typography>
                    <ResponsiveContainer width="100%" height={200}>
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
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, mb: 2.5 }}>Metric Breakdown</Typography>
                    <Grid container spacing={2}>
                      {[
                        { label: 'Task Completion', value: selected.Performance.completionRate, color: '#059669', sub: `${selected.Performance.completedTasks}/${selected.Performance.totalTasks} tasks` },
                        { label: 'Quality of Work', value: selected.Performance.qualityScore, color: '#6366f1', sub: `Avg rating: ${selected.Performance.avgRating}/5` },
                        { label: 'Feedback Score', value: selected.Performance.feedbackScore, color: '#0ea5e9', sub: 'From PM & Assigner feedback' },
                        { label: 'Volume', value: Math.min((selected.Performance.completedTasks/20)*100,100), color: '#d97706', sub: `${selected.Performance.completedTasks} projects done` },
                      ].map(m => (
                        <Grid item xs={6} key={m.label}>
                          <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>{m.label}</Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: m.color }}>{Math.round(m.value)}%</Typography>
                            </Box>
                            <LinearProgress variant="determinate" value={Math.min(m.value, 100)} sx={{ height: 6, borderRadius: 3, bgcolor: `${m.color}20`, '& .MuiLinearProgress-bar': { bgcolor: m.color } }} />
                            <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>{m.sub}</Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    {selected.Performance.complaints > 0 && (
                      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(239,68,68,0.15)', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>⚠️ {selected.Performance.complaints} complaint{selected.Performance.complaints > 1 ? 's' : ''} on record — each deducts 5 points</Typography>
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
    </PageShell>
  );
}
