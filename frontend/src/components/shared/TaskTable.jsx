import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, Tooltip, Box, Typography, TextField, MenuItem, Select, FormControl, InputLabel, Avatar } from '@mui/material';
import { Edit, Delete, RateReview, Visibility, ArrowForward } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const statusConfig = {
  pending: { label: 'Pending', color: 'text.secondary', bg: 'rgba(100,116,139,0.15)' },
  assigned_to_assigner: { label: 'Sent to Assigner', color: '#d97706', bg: 'rgba(245,158,11,0.15)' },
  assigned_to_writer: { label: 'Sent to Writer', color: '#7c3aed', bg: 'rgba(139,92,246,0.15)' },
  in_progress: { label: 'In Progress', color: '#0369a1', bg: 'rgba(14,165,233,0.15)' },
  completed: { label: 'Completed', color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: 'rgba(239,68,68,0.15)' },
};

const priorityConfig = {
  low: { color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  medium: { color: '#d97706', bg: 'rgba(245,158,11,0.15)' },
  high: { color: '#dc2626', bg: 'rgba(239,68,68,0.15)' },
};

export default function TaskTable({ tasks, onDelete, onEdit, showFeedback, showAssignWriter, showAssignee = true }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = tasks.filter(t => {
    const matchSearch = t.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
        <TextField size="small" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filter by Status</InputLabel>
          <Select value={statusFilter} label="Filter by Status" onChange={e => setStatusFilter(e.target.value)}
            sx={{ borderRadius: 2, bgcolor: 'background.paper' }}>
            <MenuItem value="all">All Statuses</MenuItem>
            {Object.entries(statusConfig).map(([key, val]) => <MenuItem key={key} value={key}>{val.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <TableContainer sx={{ borderRadius: 3, border: '1px solid', bgcolor: 'background.paper', overflow: 'hidden' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }}>Task</TableCell>
              {showAssignee && <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Assigned To</TableCell>}
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Priority</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Due Date</TableCell>
              <TableCell sx={{ fontWeight: 700, fontSize: 11 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No tasks found</Typography>
                </TableCell>
              </TableRow>
            ) : filtered.map(task => {
              const sc = statusConfig[task.status] || statusConfig.pending;
              const pc = priorityConfig[task.priority] || priorityConfig.medium;
              return (
                <TableRow key={task.id} sx={{ '&:hover': { bgcolor: 'background.default' }, borderBottom: '1px solid #f1f5f9' }}>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.3 }}>{task.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>{task.description?.slice(0, 55)}{task.description?.length > 55 ? '...' : ''}</Typography>
                  </TableCell>
                  {showAssignee && (
                    <TableCell>
                      {task.writer ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 26, height: 26, bgcolor: '#6366f1', fontSize: 11 }}>{task.writer.username?.[0]?.toUpperCase()}</Avatar>
                          <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>{task.writer.username}</Typography>
                        </Box>
                      ) : <Typography variant="caption" sx={{ color: '#cbd5e1' }}>—</Typography>}
                    </TableCell>
                  )}
                  <TableCell>
                    <Chip label={sc.label} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 600, fontSize: 11, border: 'none' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={task.priority} size="small" sx={{ bgcolor: pc.bg, color: pc.color, fontWeight: 600, fontSize: 11, textTransform: 'capitalize', border: 'none' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {onEdit && <Tooltip title="Edit"><IconButton size="small" onClick={() => onEdit(task)} sx={{ color: '#6366f1', '&:hover': { bgcolor: 'rgba(139,92,246,0.15)' } }}><Edit sx={{ fontSize: 16 }} /></IconButton></Tooltip>}
                      {showAssignWriter && !task.assignedTo && task.status === 'assigned_to_assigner' && (
                        <Tooltip title="Assign to Writer"><IconButton size="small" onClick={() => showAssignWriter(task)} sx={{ color: '#059669', '&:hover': { bgcolor: 'rgba(16,185,129,0.15)' } }}><ArrowForward sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      )}
                      {showFeedback && task.status === 'completed' && (
                        <Tooltip title="Give Feedback"><IconButton size="small" onClick={() => showFeedback(task)} sx={{ color: '#d97706', '&:hover': { bgcolor: 'rgba(245,158,11,0.15)' } }}><RateReview sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                      )}
                      {onDelete && <Tooltip title="Delete"><IconButton size="small" onClick={() => onDelete(task.id)} sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)' } }}><Delete sx={{ fontSize: 16 }} /></IconButton></Tooltip>}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
