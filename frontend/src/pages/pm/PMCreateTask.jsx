import React, { useState, useEffect, useRef } from 'react';
import {
  Grid, Card, CardContent, Typography, Box, TextField, Button, MenuItem,
  Select, FormControl, InputLabel, Alert, Chip, IconButton, LinearProgress,
  Avatar, Tooltip, Badge
} from '@mui/material';
import {
  Send, AttachFile, Close, Description, DragIndicator,
  Person, CheckCircle, SwapHoriz, Cancel
} from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import { taskAPI, userAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

const ROLE_COLORS = { assigner: '#059669', writer: '#6366f1' };

function AssignerCard({ assigner, isSelected, onDrop, onRemove, dragOver, setDragOver }) {
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(assigner.id); };
  const handleDragLeave = () => setDragOver(null);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(null); onDrop(assigner.id); };

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => onDrop(assigner.id)}
      sx={{
        p: 2, borderRadius: 2, border: '2px solid',
        borderColor: isSelected ? '#6366f1' : dragOver === assigner.id ? '#a5b4fc' : 'divider',
        bgcolor: isSelected ? 'rgba(99,102,241,0.08)' : dragOver === assigner.id ? 'rgba(99,102,241,0.04)' : 'background.paper',
        cursor: 'pointer', transition: 'all 0.2s',
        transform: dragOver === assigner.id ? 'scale(1.02)' : 'scale(1)',
        '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.04)' },
        position: 'relative',
      }}
    >
      {isSelected && (
        <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
          <CheckCircle sx={{ fontSize: 18, color: '#6366f1' }} />
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: '#059669', fontSize: 14, fontWeight: 700 }}>
          {assigner.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 13, color: 'text.primary' }}>
            {assigner.username}
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
            {assigner.email}
          </Typography>
        </Box>
      </Box>
      {isSelected && (
        <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <CheckCircle sx={{ fontSize: 13, color: '#6366f1' }} />
          <Typography sx={{ fontSize: 11, color: '#6366f1', fontWeight: 600 }}>
            Task will be assigned to this person
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default function PMCreateTask() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', dueDate: '',
    priority: 'medium', estimatedMinutes: '', dependsOn: ''
  });
  const [assigners, setAssigners] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedAssigner, setSelectedAssigner] = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef();
  const taskCardRef = useRef();

  useEffect(() => {
    userAPI.getAssigners().then(r => setAssigners(r.data));
    taskAPI.getAll().then(r => setAllTasks(r.data));
  }, []);

  const handleFile = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selected]);
    e.target.value = '';
  };
  const removeFile = (i) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleTaskDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', 'task');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTaskDragEnd = () => setIsDragging(false);

  const handleDropOnAssigner = (assignerId) => {
    setSelectedAssigner(assignerId === selectedAssigner ? null : assignerId);
  };

  const handleSubmit = async () => {
    if (!form.title) return setMsg({ type: 'error', text: 'Task title is required' });
    setLoading(true); setMsg({});
    try {
      const task = await taskAPI.create({
        title: form.title,
        description: form.description,
        assignedToAssigner: selectedAssigner || undefined,
        dueDate: form.dueDate || undefined,
        priority: form.priority,
        estimatedMinutes: form.estimatedMinutes || undefined,
        dependsOn: form.dependsOn || undefined,
      });

      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('taskId', task.data.id);
        fd.append('attachmentType', 'brief');
        await taskAPI.uploadAttachment(fd);
      }

      setMsg({ type: 'success', text: 'Task created successfully!' });
      setTimeout(() => navigate('/pm/tasks'), 1000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create task' });
    } finally { setLoading(false); }
  };

  const formatFileSize = (bytes) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  const selectedAssignerData = assigners.find(a => a.id === selectedAssigner);

  return (
    <PageShell title="Create New Task" subtitle="Fill in details, then drag the task card onto an assigner — or click an assigner to select them">
      <Grid container spacing={3}>

        {/* LEFT: Task Form */}
        <Grid item xs={12} lg={7}>
          {/* Draggable Task Card */}
          <Box
            ref={taskCardRef}
            draggable={!!form.title}
            onDragStart={handleTaskDragStart}
            onDragEnd={handleTaskDragEnd}
            sx={{
              mb: 2, p: 2, borderRadius: 2,
              border: '2px dashed',
              borderColor: isDragging ? '#6366f1' : form.title ? '#a5b4fc' : 'divider',
              bgcolor: isDragging ? 'rgba(99,102,241,0.08)' : 'background.paper',
              cursor: form.title ? 'grab' : 'default',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 2,
            }}
          >
            <DragIndicator sx={{ color: form.title ? '#6366f1' : '#cbd5e1', fontSize: 20 }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 13, color: form.title ? 'text.primary' : 'text.disabled' }}>
                {form.title || 'Task title will appear here...'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                <Chip label={form.priority} size="small"
                  sx={{ height: 18, fontSize: 10,
                    bgcolor: form.priority === 'high' ? '#fee2e2' : form.priority === 'medium' ? '#fef3c7' : '#dcfce7',
                    color: form.priority === 'high' ? '#ef4444' : form.priority === 'medium' ? '#d97706' : '#059669' }} />
                {form.dueDate && <Chip label={`Due: ${form.dueDate}`} size="small" sx={{ height: 18, fontSize: 10 }} />}
                {selectedAssignerData && (
                  <Chip
                    avatar={<Avatar sx={{ width: 14, height: 14, fontSize: 9, bgcolor: '#059669' }}>{selectedAssignerData.username[0]}</Avatar>}
                    label={selectedAssignerData.username}
                    size="small"
                    onDelete={() => setSelectedAssigner(null)}
                    sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(5,150,105,0.1)', color: '#059669' }}
                  />
                )}
              </Box>
            </Box>
            {form.title && (
              <Typography sx={{ fontSize: 10, color: 'text.disabled', whiteSpace: 'nowrap' }}>
                {assigners.length > 0 ? '← drag to assigner' : ''}
              </Typography>
            )}
          </Box>

          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 3 }}>
              {msg.text && <Alert severity={msg.type} sx={{ mb: 2.5, borderRadius: 2 }}>{msg.text}</Alert>}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                <TextField label="Task Title *" fullWidth value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

                <TextField label="Description" fullWidth multiline rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what needs to be done..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select value={form.priority} label="Priority"
                      onChange={e => setForm({ ...form, priority: e.target.value })} sx={{ borderRadius: 2 }}>
                      <MenuItem value="low">🟢 Low</MenuItem>
                      <MenuItem value="medium">🟡 Medium</MenuItem>
                      <MenuItem value="high">🔴 High</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField label="Due Date" type="date" fullWidth InputLabelProps={{ shrink: true }}
                    value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField label="Estimated Hours" type="number" fullWidth
                    value={form.estimatedMinutes ? form.estimatedMinutes / 60 : ''}
                    onChange={e => setForm({ ...form, estimatedMinutes: e.target.value ? Math.round(e.target.value * 60) : '' })}
                    inputProps={{ min: 0, step: 0.5 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  <FormControl fullWidth>
                    <InputLabel>Depends On</InputLabel>
                    <Select value={form.dependsOn} label="Depends On"
                      onChange={e => setForm({ ...form, dependsOn: e.target.value })} sx={{ borderRadius: 2 }}>
                      <MenuItem value="">— None —</MenuItem>
                      {allTasks.map(t => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>

                {/* File Upload */}
                <Box sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>📎 Brief Files</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>Reference docs visible to Assigner & Writer</Typography>
                    </Box>
                    <input type="file" ref={fileRef} style={{ display: 'none' }} multiple onChange={handleFile} />
                    <Button size="small" variant="outlined" startIcon={<AttachFile />}
                      onClick={() => fileRef.current.click()}
                      sx={{ borderRadius: 2, textTransform: 'none', fontSize: 12 }}>Browse</Button>
                  </Box>
                  {files.length === 0
                    ? <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', textAlign: 'center', py: 1 }}>No files selected</Typography>
                    : files.map((f, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: 'background.default', borderRadius: 1.5, mb: 0.8, border: '1px solid', borderColor: 'divider' }}>
                        <Description sx={{ fontSize: 16, color: '#6366f1' }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10 }}>{formatFileSize(f.size)}</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => removeFile(i)} sx={{ p: 0.3 }}><Close sx={{ fontSize: 13 }} /></IconButton>
                      </Box>
                    ))
                  }
                </Box>

                {loading && <LinearProgress sx={{ borderRadius: 2 }} />}
                <Button variant="contained" size="large" endIcon={<Send />}
                  onClick={handleSubmit} disabled={loading}
                  sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, py: 1.5, fontWeight: 700 }}>
                  {loading ? 'Creating...' : selectedAssigner ? `Create & Assign to ${selectedAssignerData?.username}` : 'Create Task'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* RIGHT: Assigners Drop Zone */}
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', position: 'sticky', top: 80 }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'text.primary' }}>
                    👥 Assign to Assigner
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Drag task card here or click to select
                  </Typography>
                </Box>
                {selectedAssigner && (
                  <Chip
                    label="Clear"
                    size="small"
                    icon={<Cancel sx={{ fontSize: 12 }} />}
                    onClick={() => setSelectedAssigner(null)}
                    sx={{ fontSize: 11, cursor: 'pointer' }}
                  />
                )}
              </Box>

              {assigners.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Person sx={{ fontSize: 32, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>No assigners found</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>Invite assigners from the Invite page</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {assigners.map(a => (
                    <AssignerCard
                      key={a.id}
                      assigner={a}
                      isSelected={selectedAssigner === a.id}
                      onDrop={handleDropOnAssigner}
                      dragOver={dragOver}
                      setDragOver={setDragOver}
                    />
                  ))}
                </Box>
              )}

              {/* Drop hint when dragging */}
              {isDragging && (
                <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.06)',
                  border: '2px dashed #a5b4fc', textAlign: 'center' }}>
                  <Typography sx={{ fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                    Drop on an assigner to assign the task
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageShell>
  );
}