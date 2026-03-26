import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Avatar, Chip, LinearProgress, Tooltip } from '@mui/material';
import { Warning, CheckCircle, HourglassEmpty, Schedule } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import { taskAPI } from '../../utils/api';

const statusConfig = {
  assigned_to_writer: { color: '#7c3aed', label: 'New' },
  in_progress:        { color: '#0369a1', label: 'In Progress' },
  overdue:            { color: '#dc2626', label: 'Overdue' },
};
const priorityConfig = { high: '#ef4444', medium: '#d97706', low: '#059669' };

export default function WorkloadPage() {
  const [workload, setWorkload] = useState([]);
  const load = () => taskAPI.getWorkload().then(r => setWorkload(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const maxLoad = Math.max(...workload.map(w => w.activeCount), 1);

  return (
    <PageShell title="Writer Workload" subtitle="See how many active tasks each writer currently has — use this when assigning">
      {/* Summary bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {workload.map(w => (
          <Tooltip key={w.id} title={`${w.username}: ${w.activeCount} active tasks`} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', cursor: 'default' }}>
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#0ea5e9', fontSize: 11, fontWeight: 700 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 12, display: 'block', lineHeight: 1.2 }}>{w.username}</Typography>
                <Typography variant="caption" sx={{ color: w.activeCount > 5 ? '#dc2626' : w.activeCount > 3 ? '#d97706' : '#059669', fontWeight: 700, fontSize: 11 }}>
                  {w.activeCount} active
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        ))}
      </Box>

      <Grid container spacing={3}>
        {workload.length === 0 && (
          <Grid item xs={12}><Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', p: 6, textAlign: 'center' }}><Typography variant="body1" sx={{ color: 'text.disabled' }}>No writers found</Typography></Card></Grid>
        )}
        {workload.map(w => {
          const hasOverdue = w.activeTasks?.some(t => t.status === 'overdue');
          const loadPercent = Math.round((w.activeCount / Math.max(maxLoad, 5)) * 100);
          const loadColor = w.activeCount > 5 ? '#ef4444' : w.activeCount > 3 ? '#d97706' : '#059669';
          return (
            <Grid item xs={12} md={6} key={w.id}>
              <Card elevation={0} sx={{ borderRadius: 3, border: `1px solid ${hasOverdue ? '#fecaca' : '#e2e8f0'}`, bgcolor: hasOverdue ? '#fff8f8' : 'white' }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Writer header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#0ea5e9', fontSize: 16, fontWeight: 800 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'text.primary' }}>{w.username}</Typography>
                        <Chip
                          icon={w.activeCount > 5 ? <Warning sx={{ fontSize: 12 }} /> : w.activeCount > 3 ? <HourglassEmpty sx={{ fontSize: 12 }} /> : <CheckCircle sx={{ fontSize: 12 }} />}
                          label={w.activeCount === 0 ? 'Available' : w.activeCount > 5 ? 'Overloaded' : w.activeCount > 3 ? 'Busy' : 'Manageable'}
                          size="small"
                          sx={{ bgcolor: `${loadColor}15`, color: loadColor, fontWeight: 700, fontSize: 11 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{w.activeCount} active tasks</Typography>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: loadColor }}>{loadPercent}% load</Typography>
                      </Box>
                      <LinearProgress variant="determinate" value={loadPercent} sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: loadColor } }} />
                    </Box>
                  </Box>

                  {/* Performance score */}
                  {w.Performance && (
                    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 2, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Performance Score</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#6366f1' }}>{w.Performance.performanceScore}% · {w.Performance.level}</Typography>
                    </Box>
                  )}

                  {/* Active task list */}
                  {w.activeTasks?.length > 0 ? (
                    <Box>
                      {w.activeTasks.map(t => {
                        const sc = statusConfig[t.status] || { color: 'text.secondary', label: t.status };
                        const isOverdue = t.status === 'overdue';
                        return (
                          <Box key={t.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2, bgcolor: isOverdue ? '#fee2e2' : '#f8fafc', borderRadius: 2, mb: 1, border: `1px solid ${isOverdue ? '#fecaca' : '#e2e8f0'}` }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: sc.color, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                              <Chip label={t.priority} size="small" sx={{ bgcolor: `${priorityConfig[t.priority]}15`, color: priorityConfig[t.priority], fontWeight: 600, fontSize: 9, height: 16, textTransform: 'capitalize' }} />
                              {t.dueDate && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
                                  <Schedule sx={{ fontSize: 10, color: isOverdue ? '#dc2626' : '#94a3b8' }} />
                                  <Typography variant="caption" sx={{ color: isOverdue ? '#dc2626' : '#94a3b8', fontSize: 10, fontWeight: isOverdue ? 700 : 400 }}>
                                    {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 2, bgcolor: 'rgba(16,185,129,0.1)', borderRadius: 2 }}>
                      <CheckCircle sx={{ fontSize: 20, color: '#4ade80', mb: 0.5 }} />
                      <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'block' }}>No active tasks — ready for assignment</Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </PageShell>
  );
}
