import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, LinearProgress } from '@mui/material';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle, Star, TrendingUp, EmojiEvents, Warning, ThumbUp, Refresh } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import StatCard from '../../components/shared/StatCard';
import { userAPI } from '../../utils/api';

const levelConfig = {
  beginner:     { color: 'text.secondary', bg: 'rgba(100,116,139,0.15)', emoji: '🌱', next: 'Reach 45 pts to become Intermediate' },
  intermediate: { color: '#d97706', bg: 'rgba(245,158,11,0.15)', emoji: '⭐', next: 'Reach 75 pts to become Expert' },
  expert:       { color: '#059669', bg: 'rgba(16,185,129,0.15)', emoji: '🏆', next: 'You have reached the highest level!' },
};

function MetricBar({ label, value, color, icon, sub }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.8 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color, display: 'flex' }}>{icon}</Box>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13 }}>{label}</Typography>
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 800, color, fontSize: 14 }}>{Math.round(value)}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={Math.min(value, 100)}
        sx={{ height: 10, borderRadius: 5, bgcolor: `${color}18`,
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 } }} />
      {sub && <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block', fontSize: 11 }}>{sub}</Typography>}
    </Box>
  );
}

export default function WriterPerformance() {
  const [perf, setPerf] = useState(null);
  useEffect(() => { userAPI.getMyPerformance().then(r => setPerf(r.data)).catch(() => {}); }, []);
  if (!perf) return null;

  const lc          = levelConfig[perf.level] || levelConfig.beginner;
  const score       = Math.round(perf.performanceScore || 0);
  const corrections = perf.totalCorrections || 0;
  const complaints  = perf.complaints || 0;
  const scoreColor  = score >= 75 ? '#059669' : score >= 45 ? '#d97706' : '#ef4444';

  const radarData = [
    { metric: 'Completion', value: perf.completionRate || 0 },
    { metric: 'Quality',    value: perf.qualityScore   || 0 },
    { metric: 'Feedback',   value: perf.feedbackScore  || 0 },
    { metric: 'Volume',     value: Math.min((perf.completedTasks / 20) * 100, 100) },
    { metric: 'Clean',      value: Math.max(0, 100 - complaints * 20 - corrections * 15) },
  ];

  // Score formula breakdown
  const breakdown = [
    { label: 'Task Completion', weight: '×30%', pts: Math.round(perf.completionRate * 0.3),   color: '#059669' },
    { label: 'Quality of Work', weight: '×25%', pts: Math.round(perf.qualityScore * 0.25),    color: '#6366f1' },
    { label: 'Feedback Score',  weight: '×20%', pts: Math.round(perf.feedbackScore * 0.2),    color: '#0ea5e9' },
    { label: 'Projects Done',   weight: '×15%', pts: Math.round(Math.min(perf.completedTasks/20,1)*100*0.15), color: '#d97706' },
    { label: 'Complaint Penalty', weight: '−5 each', pts: -(complaints * 5), color: '#ef4444' },
    { label: 'Correction Penalty', weight: '−3 each', pts: -(corrections * 3), color: '#f97316' },
  ];

  return (
    <PageShell title="My Performance" subtitle="Detailed breakdown of your performance score">
      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={6} md={2}><StatCard title="Score"      value={score}                  icon={<TrendingUp />} color="#6366f1" /></Grid>
        <Grid item xs={6} md={2}><StatCard title="Completed"  value={perf.completedTasks}    icon={<CheckCircle />} color="#059669" /></Grid>
        <Grid item xs={6} md={2}><StatCard title="Avg Rating" value={`${perf.avgRating}/5`} icon={<Star />} color="#d97706" /></Grid>
        <Grid item xs={6} md={2}><StatCard title="Level"      value={perf.level}             icon={<EmojiEvents />} color={lc.color} /></Grid>
        <Grid item xs={6} md={2}><StatCard title="Complaints" value={complaints}             icon={<Warning />} color="#ef4444" /></Grid>
        <Grid item xs={6} md={2}><StatCard title="Corrections" value={corrections}           icon={<Refresh />}  color="#f97316" /></Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Score circle */}
        <Grid item xs={12} md={3}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', textAlign: 'center', height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, fontSize: 10 }}>Your Score</Typography>
              <Typography sx={{ fontSize: 80, fontWeight: 900, color: scoreColor, lineHeight: 1, my: 1 }}>
                {score}
              </Typography>
              <Chip label={`${lc.emoji} ${perf.level}`}
                sx={{ bgcolor: lc.bg, color: lc.color, fontWeight: 800, fontSize: 13, px: 1, mb: 2, textTransform: 'capitalize' }} />
              <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', lineHeight: 1.5 }}>
                {lc.next}
              </Typography>
              {(complaints > 0 || corrections > 0) && (
                <Box sx={{ mt: 2, p: 1.5, bgcolor: 'rgba(245,158,11,0.15)', borderRadius: 2, width: '100%' }}>
                  <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, display: 'block' }}>
                    ⚠️ Score penalties active
                  </Typography>
                  {complaints > 0 && (
                    <Typography variant="caption" sx={{ color: 'warning.main', fontSize: 11, display: 'block' }}>
                      − {complaints * 5} pts ({complaints} complaint{complaints > 1 ? 's' : ''})
                    </Typography>
                  )}
                  {corrections > 0 && (
                    <Typography variant="caption" sx={{ color: 'warning.main', fontSize: 11, display: 'block' }}>
                      − {corrections * 3} pts ({corrections} correction{corrections > 1 ? 's' : ''})
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Radar */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>Performance Radar</Typography>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'text.secondary' }} />
                  <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2.5} />
                  <Tooltip formatter={v => [`${Math.round(v)}%`]} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Metric bars */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, mb: 2.5, color: 'text.primary' }}>Detailed Breakdown</Typography>
              <MetricBar label="Task Completion Rate" value={perf.completionRate || 0}
                color="#059669" icon={<CheckCircle sx={{ fontSize: 16 }} />}
                sub={`${perf.completedTasks} of ${perf.totalTasks} tasks completed`} />
              <MetricBar label="Quality of Work" value={perf.qualityScore || 0}
                color="#6366f1" icon={<Star sx={{ fontSize: 16 }} />}
                sub={`Average rating: ${perf.avgRating}/5 stars`} />
              <MetricBar label="Feedback Score" value={perf.feedbackScore || 0}
                color="#0ea5e9" icon={<ThumbUp sx={{ fontSize: 16 }} />}
                sub="Based on all PM & Assigner feedback" />
              <MetricBar label="Volume of Work" value={Math.min((perf.completedTasks / 20) * 100, 100)}
                color="#d97706" icon={<EmojiEvents sx={{ fontSize: 16 }} />}
                sub={`${perf.completedTasks} tasks done (target: 20)`} />

              {/* Penalties */}
              <Box sx={{ mt: 1, p: 1.5, borderRadius: 2,
                bgcolor: complaints > 0 || corrections > 0 ? '#fff7ed' : 'rgba(16,185,129,0.15)',
                border: `1px solid ${complaints > 0 || corrections > 0 ? '#fed7aa' : '#bbf7d0'}` }}>
                {complaints === 0 && corrections === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ThumbUp sx={{ color: '#059669', fontSize: 16 }} />
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669' }}>
                      🎉 No penalties — clean record!
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#c2410c', display: 'block', mb: 0.5 }}>
                      ⚠️ Active Penalties
                    </Typography>
                    {complaints > 0 && (
                      <Typography variant="caption" sx={{ color: 'error.main', display: 'block', fontSize: 11 }}>
                        • {complaints} complaint{complaints > 1 ? 's' : ''} → −{complaints * 5} pts (−5 each)
                      </Typography>
                    )}
                    {corrections > 0 && (
                      <Typography variant="caption" sx={{ color: 'error.main', display: 'block', fontSize: 11 }}>
                        • {corrections} correction{corrections > 1 ? 's' : ''} → −{corrections * 3} pts (−3 each)
                      </Typography>
                    )}
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Score formula */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                How Your Score Is Calculated
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2.5 }}>
                Score = (Completion×30%) + (Quality×25%) + (Feedback×20%) + (Volume×15%) − (Complaints×5) − (Corrections×3)
              </Typography>
              <Grid container spacing={1.5}>
                {breakdown.map(m => (
                  <Grid item xs={6} md={2} key={m.label}>
                    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2,
                      border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                      <Typography sx={{ fontSize: 22, fontWeight: 900, color: m.pts < 0 ? m.color : m.color, lineHeight: 1 }}>
                        {m.pts > 0 ? '+' : ''}{m.pts}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', lineHeight: 1.4, my: 0.5, fontSize: 11 }}>
                        {m.label}
                      </Typography>
                      <Chip label={m.weight} size="small"
                        sx={{ bgcolor: `${m.color}15`, color: m.color, fontWeight: 700, fontSize: 10, '& .MuiChip-label': { px: 0.8 } }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageShell>
  );
}
