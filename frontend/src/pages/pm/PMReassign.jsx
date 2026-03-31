import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Chip, Grid,
  Alert, CircularProgress, Tooltip, Button
} from '@mui/material';
import { SwapHoriz, Person, CheckCircle, DragIndicator } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import { taskAPI, userAPI } from '../../utils/api';

const STATUS_COLOR = {
  pending: '#94a3b8', assigned_to_assigner: '#f97316',
  assigned_to_writer: '#8b5cf6', in_progress: '#0ea5e9',
  completed: '#059669', overdue: '#ef4444',
};

function TaskCard({ task, onDragStart }) {
  return (
    <Box
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('taskId', task.id); onDragStart(task); }}
      sx={{
        p: 1.5, mb: 1, borderRadius: 2, border: '1px solid',
        borderColor: 'divider', bgcolor: 'background.paper',
        cursor: 'grab', transition: 'all 0.15s',
        '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.04)', transform: 'translateX(2px)' },
        '&:active': { cursor: 'grabbing' },
        display: 'flex', alignItems: 'center', gap: 1.5,
      }}
    >
      <DragIndicator sx={{ fontSize: 16, color: '#cbd5e1', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.primary',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {task.title}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.3 }}>
          <Chip label={task.status?.replace(/_/g, ' ')} size="small"
            sx={{ height: 16, fontSize: 9,
              bgcolor: `${STATUS_COLOR[task.status]}20`,
              color: STATUS_COLOR[task.status] }} />
          <Chip label={task.priority} size="small"
            sx={{ height: 16, fontSize: 9,
              bgcolor: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? '#fef3c7' : '#dcfce7',
              color: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#d97706' : '#059669' }} />
        </Box>
      </Box>
    </Box>
  );
}

function AssignerColumn({ assigner, tasks, onDrop, dragOverId, setDragOverId }) {
  const handleDragOver = (e) => { e.preventDefault(); setDragOverId(assigner?.id || 'unassigned'); };
  const handleDragLeave = () => setDragOverId(null);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOverId(null);
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    onDrop(taskId, assigner?.id || null);
  };

  const isOver = dragOverId === (assigner?.id || 'unassigned');

  return (
    <Box sx={{ flex: 1, minWidth: 220, maxWidth: 300 }}>
      {/* Assigner Header */}
      <Box sx={{ p: 1.5, mb: 1.5, borderRadius: 2, border: '1px solid',
        borderColor: assigner ? '#059669' : 'divider',
        bgcolor: assigner ? 'rgba(5,150,105,0.06)' : 'background.paper',
        display: 'flex', alignItems: 'center', gap: 1.5 }}>
        {assigner ? (
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#059669', fontSize: 13, fontWeight: 700 }}>
            {assigner.username?.[0]?.toUpperCase()}
          </Avatar>
        ) : (
          <Avatar sx={{ width: 32, height: 32, bgcolor: '#e2e8f0' }}>
            <Person sx={{ fontSize: 16, color: '#94a3b8' }} />
          </Avatar>
        )}
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>
            {assigner ? assigner.username : 'Unassigned'}
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Box>

      {/* Drop Zone */}
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          minHeight: 200, p: 1.5, borderRadius: 2,
          border: '2px dashed',
          borderColor: isOver ? '#6366f1' : 'divider',
          bgcolor: isOver ? 'rgba(99,102,241,0.06)' : 'background.default',
          transition: 'all 0.2s',
        }}
      >
        {tasks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ fontSize: 11, color: '#cbd5e1' }}>
              {isOver ? '✨ Drop here to assign' : 'Drop tasks here'}
            </Typography>
          </Box>
        ) : (
          tasks.map(task => (
            <TaskCard key={task.id} task={task} onDragStart={() => {}} />
          ))
        )}
        {isOver && tasks.length > 0 && (
          <Box sx={{ p: 1.5, borderRadius: 1.5, border: '2px dashed #a5b4fc',
            bgcolor: 'rgba(99,102,241,0.06)', textAlign: 'center' }}>
            <Typography sx={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
              Drop to reassign here
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function PMReassign() {
  const [tasks, setTasks] = useState([]);
  const [assigners, setAssigners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  const load = async () => {
    try {
      const [tr, ar] = await Promise.all([taskAPI.getAll(), userAPI.getAssigners()]);
      setTasks(tr.data);
      setAssigners(ar.data);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDrop = async (taskId, assignerId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (task.assignedToAssigner === assignerId) return; // No change

    try {
      await taskAPI.update(taskId, { assignedToAssigner: assignerId });
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, assignedToAssigner: assignerId,
          status: assignerId ? 'assigned_to_assigner' : 'pending' } : t
      ));
      const toName = assignerId ? assigners.find(a => a.id === assignerId)?.username : 'Unassigned';
      const fromName = task.assignedToAssigner
        ? assigners.find(a => a.id === task.assignedToAssigner)?.username : 'Unassigned';
      setMsg({ type: 'success', text: `"${task.title}" moved from ${fromName} → ${toName}` });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reassign task' });
    }
  };

  // Group tasks by assigner
  const getTasksFor = (assignerId) =>
    tasks.filter(t => assignerId === null
      ? !t.assignedToAssigner
      : t.assignedToAssigner === assignerId
    ).filter(t => !['completed'].includes(t.status));

  if (loading) return (
    <PageShell title="Reassign Tasks" subtitle="Drag tasks between assigners">
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress sx={{ color: '#6366f1' }} />
      </Box>
    </PageShell>
  );

  return (
    <PageShell title="Reassign Tasks" subtitle="Drag tasks between assigners to reassign them">
      {msg && (
        <Alert severity={msg.type} sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setMsg(null)}>
          {msg.text}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, alignItems: 'flex-start' }}>
        {/* Unassigned column */}
        <AssignerColumn
          assigner={null}
          tasks={getTasksFor(null)}
          onDrop={handleDrop}
          dragOverId={dragOverId}
          setDragOverId={setDragOverId}
        />

        {/* One column per assigner */}
        {assigners.map(a => (
          <AssignerColumn
            key={a.id}
            assigner={a}
            tasks={getTasksFor(a.id)}
            onDrop={handleDrop}
            dragOverId={dragOverId}
            setDragOverId={setDragOverId}
          />
        ))}
      </Box>

      {assigners.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <Person sx={{ fontSize: 48, color: '#e2e8f0', mb: 2 }} />
          <Typography sx={{ color: 'text.secondary' }}>No assigners found</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            Invite assigners first from the Invite page
          </Typography>
        </Box>
      )}
    </PageShell>
  );
}