import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Avatar, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ArrowForward, RateReview } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import FeedbackModal from '../../components/shared/FeedbackModal';
import TaskDetailModal from '../../components/shared/TaskDetailModal';
import { taskAPI, userAPI } from '../../utils/api';

const columns = [
  { id: 'assigned_to_assigner', label: 'From PM', color: '#d97706', bg: 'rgba(245,158,11,0.15)', dot: '#fbbf24' },
  { id: 'assigned_to_writer', label: 'Assigned to Writer', color: '#7c3aed', bg: 'rgba(139,92,246,0.15)', dot: '#a78bfa' },
  { id: 'in_progress', label: 'In Progress', color: '#0369a1', bg: 'rgba(14,165,233,0.15)', dot: '#38bdf8' },
  { id: 'completed', label: 'Completed', color: '#059669', bg: 'rgba(16,185,129,0.15)', dot: '#4ade80' },
];

const priorityColor = { high: '#ef4444', medium: '#d97706', low: '#059669' };

export default function AssignerTasks() {
  const [tasks, setTasks] = useState([]);
  const [writers, setWriters] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedWriter, setSelectedWriter] = useState('');
  const [assignMsg, setAssignMsg] = useState({});
  const [feedbackTask, setFeedbackTask] = useState(null);

  const load = () => {
    taskAPI.getAll().then(r => setTasks(r.data));
    userAPI.getWriters().then(r => setWriters(r.data));
  };
  useEffect(() => { load(); }, []);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const newStatus = destination.droppableId;
    const taskId = parseInt(draggableId);
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    try {
      await taskAPI.update(taskId, { status: newStatus });
    } catch { load(); }
  };

  const openAssign = (task) => { setSelectedTask(task); setSelectedWriter(''); setAssignMsg({}); setAssignOpen(true); };

  const handleAssign = async () => {
    if (!selectedWriter) return setAssignMsg({ type: 'error', text: 'Please select a writer' });
    try {
      await taskAPI.assignToWriter(selectedTask.id, { assignedTo: selectedWriter });
      setAssignOpen(false);
      load();
    } catch (err) { setAssignMsg({ type: 'error', text: err.response?.data?.message || 'Failed' }); }
  };

  const tasksByStatus = (status) => tasks.filter(t => t.status === status);

  return (
    <PageShell title="Task Board" subtitle="Drag tasks between columns or assign writers">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 500 }}>
          {columns.map(col => (
            <Box key={col.id} sx={{ minWidth: 270, flex: 1 }}>
              {/* Column header */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 0.5 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: col.dot }} />
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>{col.label}</Typography>
                <Chip label={tasksByStatus(col.id).length} size="small" sx={{ bgcolor: col.bg, color: col.color, fontWeight: 700, fontSize: 11, height: 20, ml: 'auto' }} />
              </Box>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <Box ref={provided.innerRef} {...provided.droppableProps}
                    sx={{ minHeight: 100, bgcolor: snapshot.isDraggingOver ? col.bg : '#f8fafc', borderRadius: 3, p: 1.5, border: `2px dashed ${snapshot.isDraggingOver ? col.dot : '#e2e8f0'}`, transition: 'all 0.2s' }}>
                    {tasksByStatus(col.id).map((task, index) => (
                      <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                        {(provided, snapshot) => (
                          <Card ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                            elevation={snapshot.isDragging ? 8 : 0}
                            sx={{ mb: 1.5, borderRadius: 2.5, border: '1px solid', bgcolor: 'background.paper', cursor: 'grab', transform: snapshot.isDragging ? 'rotate(2deg)' : 'none', transition: 'box-shadow 0.2s', '&:active': { cursor: 'grabbing' } }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Chip label={task.priority} size="small" sx={{ bgcolor: `${priorityColor[task.priority]}15`, color: priorityColor[task.priority], fontWeight: 600, fontSize: 10, height: 18, textTransform: 'capitalize' }} />
                                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>
                                  {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 1, lineHeight: 1.4 }}>{task.title}</Typography>
                              {task.writer ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 20, height: 20, bgcolor: '#0ea5e9', fontSize: 9 }}>{task.writer.username?.[0]?.toUpperCase()}</Avatar>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>{task.writer.username}</Typography>
                                </Box>
                              ) : (
                                <Button size="small" variant="outlined" endIcon={<ArrowForward sx={{ fontSize: 12 }} />} onClick={() => openAssign(task)}
                                  sx={{ fontSize: 11, py: 0.3, borderRadius: 2, borderColor: 'divider', color: 'text.secondary', '&:hover': { bgcolor: 'action.hover' } }}>
                                  Assign Writer
                                </Button>
                              )}
                              {task.status === 'completed' && (
                                <IconButton size="small" onClick={() => setFeedbackTask(task)} sx={{ mt: 0.5, color: '#d97706', '&:hover': { bgcolor: 'rgba(245,158,11,0.15)' } }}>
                                  <RateReview sx={{ fontSize: 14 }} />
                                </IconButton>
                              )}
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {tasksByStatus(col.id).length === 0 && !snapshot.isDraggingOver && (
                      <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', textAlign: 'center', py: 3 }}>Drop tasks here</Typography>
                    )}
                  </Box>
                )}
              </Droppable>
            </Box>
          ))}
        </Box>
      </DragDropContext>

      {/* Assign Writer Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign to Writer</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedTask && <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, mb: 2, border: '1px solid' }}><Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedTask.title}</Typography></Box>}
          {assignMsg.text && <Alert severity={assignMsg.type} sx={{ mb: 2, borderRadius: 2 }}>{assignMsg.text}</Alert>}
          <FormControl fullWidth>
            <InputLabel>Select Writer</InputLabel>
            <Select value={selectedWriter} label="Select Writer" onChange={e => setSelectedWriter(e.target.value)} sx={{ borderRadius: 2 }}>
              {writers.map(w => (
                <MenuItem key={w.id} value={w.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ width: 26, height: 26, bgcolor: '#0ea5e9', fontSize: 11 }}>{w.username?.[0]?.toUpperCase()}</Avatar>
                    <Box><Typography variant="body2" sx={{ fontWeight: 600 }}>{w.username}</Typography>
                    {w.Performance && <Typography variant="caption" sx={{ color: 'text.disabled' }}>Score: {w.Performance.performanceScore}%</Typography>}</Box>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAssignOpen(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} sx={{ borderRadius: 2, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }}>Assign</Button>
        </DialogActions>
      </Dialog>

      {feedbackTask && <FeedbackModal open task={feedbackTask} onClose={() => setFeedbackTask(null)} onSuccess={load} />}
    </PageShell>
  );
}
