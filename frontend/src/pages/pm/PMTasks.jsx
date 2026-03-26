import React, { useState, useEffect } from 'react';
import { Button, Box, Checkbox, IconButton, Tooltip } from '@mui/material';
import { Add, OpenInNew, Delete, Warning } from '@mui/icons-material';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, Chip, Avatar, Typography } from '@mui/material';
import PageShell from '../../components/shared/PageShell';
import TaskFormModal from '../../components/shared/TaskFormModal';
import FeedbackModal from '../../components/shared/FeedbackModal';
import TaskDetailModal from '../../components/shared/TaskDetailModal';
import { taskAPI } from '../../utils/api';

const statusColor = {
  pending:              { label: 'Pending',          color: 'text.secondary', bg: 'rgba(100,116,139,0.15)' },
  assigned_to_assigner: { label: 'With Assigner',    color: '#d97706', bg: 'rgba(245,158,11,0.15)' },
  assigned_to_writer:   { label: 'With Writer',      color: '#7c3aed', bg: 'rgba(139,92,246,0.15)' },
  in_progress:          { label: 'In Progress',      color: '#0369a1', bg: 'rgba(14,165,233,0.15)' },
  completed:            { label: 'Completed',        color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  overdue:              { label: 'Overdue',          color: '#dc2626', bg: 'rgba(239,68,68,0.15)' },
  rejected:             { label: 'Rejected',         color: 'text.secondary', bg: 'rgba(100,116,139,0.15)' },
};

export default function PMTasks() {
  const [tasks, setTasks] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [feedbackTask, setFeedbackTask] = useState(null);
  const [detailTask, setDetailTask] = useState(null);
  const [selected, setSelected] = useState([]);
  const load = () => taskAPI.getAll().then(r => setTasks(r.data));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => { if (window.confirm('Delete this task?')) { await taskAPI.delete(id); load(); } };
  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === tasks.length ? [] : tasks.map(t => t.id));

  return (
    <PageShell title="All Tasks" subtitle="Tasks you've created"
      action={
        <Box sx={{ display: 'flex', gap: 1 }}>
          {selected.length > 0 && (
            <Button variant="outlined" size="small" onClick={async () => { await taskAPI.bulkUpdate({ taskIds: selected, status: 'completed' }); setSelected([]); load(); }}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }}>
              Close {selected.length} Tasks
            </Button>
          )}
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditTask(null); setCreateOpen(true); }}
            sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>New Task</Button>
        </Box>
      }>
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox"><Checkbox checked={tasks.length > 0 && selected.length === tasks.length} indeterminate={selected.length > 0 && selected.length < tasks.length} onChange={toggleAll} size="small" /></TableCell>
                {['Task','Assigned To','Priority','Due Date','Status','Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map(task => {
                const sc = statusColor[task.status] || statusColor.pending;
                return (
                  <TableRow key={task.id} hover sx={{ bgcolor: task.isOverdue ? '#fff8f8' : 'white' }}>
                    <TableCell padding="checkbox"><Checkbox checked={selected.includes(task.id)} onChange={() => toggleSelect(task.id)} size="small" /></TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        {task.isOverdue && <Warning sx={{ fontSize: 14, color: '#dc2626' }} />}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{task.title}</Typography>
                          {task.TaskAttachments?.length > 0 && <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>📎 {task.TaskAttachments.length} file{task.TaskAttachments.length > 1 ? 's' : ''}</Typography>}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {task.writer ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Avatar sx={{ width: 20, height: 20, bgcolor: '#0ea5e9', fontSize: 9 }}>{task.writer.username?.[0]?.toUpperCase()}</Avatar>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{task.writer.username}</Typography>
                        </Box>
                      ) : task.assignerUser ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Avatar sx={{ width: 20, height: 20, bgcolor: '#059669', fontSize: 9 }}>{task.assignerUser.username?.[0]?.toUpperCase()}</Avatar>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{task.assignerUser.username}</Typography>
                        </Box>
                      ) : <Typography variant="caption" sx={{ color: '#cbd5e1' }}>Unassigned</Typography>}
                    </TableCell>
                    <TableCell><Chip label={task.priority} size="small" sx={{ bgcolor: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', color: task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#d97706' : '#059669', fontWeight: 600, fontSize: 11, textTransform: 'capitalize' }} /></TableCell>
                    <TableCell><Typography variant="caption" sx={{ color: task.isOverdue ? '#dc2626' : '#64748b', fontWeight: task.isOverdue ? 700 : 400 }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</Typography></TableCell>
                    <TableCell><Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: 11 }} /></TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="View details, comments & files">
                          <IconButton size="small" onClick={() => setDetailTask(task)} sx={{ color: '#6366f1', '&:hover': { bgcolor: 'rgba(139,92,246,0.15)' } }}><OpenInNew sx={{ fontSize: 15 }} /></IconButton>
                        </Tooltip>
                        {task.status === 'completed' && (
                          <Tooltip title="Give Feedback">
                            <Button size="small" onClick={() => setFeedbackTask(task)} sx={{ fontSize: 11, color: '#d97706', fontWeight: 600, textTransform: 'none', minWidth: 'auto', px: 1 }}>⭐</Button>
                          </Tooltip>
                        )}
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(task.id)} sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)' } }}><Delete sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {tasks.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 6 }}><Typography variant="body2" sx={{ color: 'text.disabled' }}>No tasks yet — click New Task to create one</Typography></TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      <TaskFormModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={load} editTask={editTask} />
      {feedbackTask && <FeedbackModal open task={feedbackTask} onClose={() => setFeedbackTask(null)} onSuccess={load} />}
      {detailTask && <TaskDetailModal open task={detailTask} onClose={() => setDetailTask(null)} onUpdate={load} />}
    </PageShell>
  );
}
