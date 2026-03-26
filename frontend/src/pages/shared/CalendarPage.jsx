import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip, IconButton, Grid, Button } from '@mui/material';
import { ChevronLeft, ChevronRight, Today } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import TaskDetailModal from '../../components/shared/TaskDetailModal';
import { taskAPI } from '../../utils/api';

const statusColor = {
  pending:              { dot: '#94a3b8', bg: 'rgba(100,116,139,0.15)', text: '#64748b' },
  assigned_to_assigner: { dot: '#fbbf24', bg: 'rgba(245,158,11,0.15)', text: '#d97706' },
  assigned_to_writer:   { dot: '#a78bfa', bg: 'rgba(139,92,246,0.15)', text: '#7c3aed' },
  in_progress:          { dot: '#38bdf8', bg: 'rgba(14,165,233,0.15)', text: '#0369a1' },
  completed:            { dot: '#4ade80', bg: 'rgba(16,185,129,0.15)', text: '#059669' },
  overdue:              { dot: '#f87171', bg: 'rgba(239,68,68,0.15)', text: '#dc2626' },
};
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  const load = () => taskAPI.getCalendar(year, month).then(r => setTasks(r.data)).catch(() => {});
  useEffect(() => { load(); }, [year, month]);

  const prev = () => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); };
  const next = () => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()+1); };

  const firstDay = new Date(year, month-1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i+1));
  while (cells.length % 7 !== 0) cells.push(null);

  const tasksOnDay = (day) => tasks.filter(t => t.dueDate && new Date(t.dueDate).getDate() === day && new Date(t.dueDate).getMonth() === month-1);
  const isToday = (day) => day === today.getDate() && month === today.getMonth()+1 && year === today.getFullYear();

  return (
    <PageShell title="Calendar" subtitle="Task deadlines at a glance">
      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={prev} sx={{ bgcolor: 'background.default', border: '1px solid' }}><ChevronLeft /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', minWidth: 200, textAlign: 'center' }}>{MONTHS[month-1]} {year}</Typography>
          <IconButton onClick={next} sx={{ bgcolor: 'background.default', border: '1px solid' }}><ChevronRight /></IconButton>
        </Box>
        <Button variant="outlined" startIcon={<Today />} onClick={goToday} sx={{ borderRadius: 2, borderColor: 'divider', color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>Today</Button>
      </Box>

      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
        {/* Day headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #f1f5f9' }}>
          {DAYS.map(d => (
            <Box key={d} sx={{ p: 1.5, textAlign: 'center', bgcolor: 'background.default' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 }}>{d}</Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
          {cells.map((day, idx) => {
            const dayTasks = day ? tasksOnDay(day) : [];
            const isCurrentDay = day && isToday(day);
            return (
              <Box key={idx} sx={{
                minHeight: 110, p: 1, borderRight: (idx+1) % 7 !== 0 ? '1px solid #f1f5f9' : 'none',
                borderBottom: idx < cells.length - 7 ? '1px solid #f1f5f9' : 'none',
                bgcolor: isCurrentDay ? '#fafbff' : 'white',
                '&:hover': { bgcolor: day ? '#fafbff' : 'white' },
              }}>
                {day && (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                      <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: isCurrentDay ? '#6366f1' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="caption" sx={{ fontWeight: isCurrentDay ? 800 : 500, color: isCurrentDay ? 'white' : 'text.primary', fontSize: 12 }}>{day}</Typography>
                      </Box>
                    </Box>
                    {dayTasks.slice(0, 3).map(t => {
                      const sc = statusColor[t.status] || statusColor.pending;
                      return (
                        <Box key={t.id} onClick={() => setSelectedTask(t)} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, p: '3px 6px', bgcolor: sc.bg, borderRadius: 1.5, mb: 0.5, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}>
                          <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: sc.dot, flexShrink: 0 }} />
                          <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 600, color: sc.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</Typography>
                        </Box>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10, pl: 0.5 }}>+{dayTasks.length - 3} more</Typography>
                    )}
                  </>
                )}
              </Box>
            );
          })}
        </Box>
      </Card>

      {/* Legend */}
      <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
        {Object.entries(statusColor).map(([s, c]) => (
          <Box key={s} sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: c.dot }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11, textTransform: 'capitalize' }}>{s.replace(/_/g,' ')}</Typography>
          </Box>
        ))}
      </Box>

      {selectedTask && <TaskDetailModal open task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={load} />}
    </PageShell>
  );
}
