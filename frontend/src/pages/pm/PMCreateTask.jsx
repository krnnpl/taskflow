import React, { useState, useEffect, useRef } from 'react';
import { Grid, Card, CardContent, Typography, Box, TextField, Button, MenuItem,
  Select, FormControl, InputLabel, Alert, Chip, IconButton, LinearProgress } from '@mui/material';
import { Send, AttachFile, Close, Description } from '@mui/icons-material';
import PageShell from '../../components/shared/PageShell';
import { taskAPI, userAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';

export default function PMCreateTask() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', assignedToAssigner: '', dueDate: '', priority: 'medium', estimatedMinutes: '', dependsOn: '' });
  const [assigners, setAssigners] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [files, setFiles] = useState([]);
  const [msg, setMsg] = useState({});
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();

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

  const handleSubmit = async () => {
    if (!form.title) return setMsg({ type: 'error', text: 'Task title is required' });
    setLoading(true); setMsg({});
    try {
      const task = await taskAPI.create({
        title: form.title, description: form.description,
        assignedToAssigner: form.assignedToAssigner || undefined,
        dueDate: form.dueDate || undefined, priority: form.priority,
        estimatedMinutes: form.estimatedMinutes || undefined,
        dependsOn: form.dependsOn || undefined,
      });

      // Upload any attached brief files
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        fd.append('taskId', task.data.id);
        fd.append('attachmentType', 'brief');
        await taskAPI.uploadAttachment(fd);
      }

      setMsg({ type: 'success', text: 'Task created successfully!' });
      setTimeout(() => navigate('/pm/tasks'), 1000);
    } catch (err) { setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create task' }); }
    finally { setLoading(false); }
  };

  const formatFileSize = (bytes) => bytes < 1024 * 1024 ? `${(bytes/1024).toFixed(1)} KB` : `${(bytes/1024/1024).toFixed(1)} MB`;

  return (
    <PageShell title="Create New Task" subtitle="Fill in the details, attach files, and assign to an Assigner">
      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid' }}>
            <CardContent sx={{ p: 4 }}>
              {msg.text && <Alert severity={msg.type} sx={{ mb: 3, borderRadius: 2 }}>{msg.text}</Alert>}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                <TextField label="Task Title *" fullWidth value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

                <TextField label="Description" fullWidth multiline rows={4} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe what needs to be done..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Priority</InputLabel>
                    <Select value={form.priority} label="Priority" onChange={e => setForm({ ...form, priority: e.target.value })} sx={{ borderRadius: 2 }}>
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
                  <TextField label="Estimated Hours (optional)" type="number" fullWidth
                    value={form.estimatedMinutes ? form.estimatedMinutes / 60 : ''}
                    onChange={e => setForm({ ...form, estimatedMinutes: e.target.value ? Math.round(e.target.value * 60) : '' })}
                    inputProps={{ min: 0, step: 0.5 }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                  <FormControl fullWidth>
                    <InputLabel>Depends On (optional)</InputLabel>
                    <Select value={form.dependsOn} label="Depends On (optional)" onChange={e => setForm({ ...form, dependsOn: e.target.value })} sx={{ borderRadius: 2 }}>
                      <MenuItem value="">— None —</MenuItem>
                      {allTasks.map(t => <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Assign to Assigner (optional)</InputLabel>
                  <Select value={form.assignedToAssigner} label="Assign to Assigner (optional)" onChange={e => setForm({ ...form, assignedToAssigner: e.target.value })} sx={{ borderRadius: 2 }}>
                    <MenuItem value="">— Leave Unassigned —</MenuItem>
                    {assigners.map(a => <MenuItem key={a.id} value={a.id}>{a.username}</MenuItem>)}
                  </Select>
                </FormControl>

                {/* File Upload Section */}
                <Box sx={{ border: '2px dashed #e2e8f0', borderRadius: 2, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary' }}>📎 Attach Brief Files</Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled' }}>Reference docs, guidelines, examples — visible to Assigner & Writer</Typography>
                    </Box>
                    <input type="file" ref={fileRef} style={{ display: 'none' }} multiple onChange={handleFile} />
                    <Button size="small" variant="outlined" startIcon={<AttachFile />} onClick={() => fileRef.current.click()}
                      sx={{ borderRadius: 2, borderColor: 'divider', color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}>
                      Browse
                    </Button>
                  </Box>
                  {files.length === 0
                    ? <Box sx={{ textAlign: 'center', py: 2 }}><Typography variant="caption" sx={{ color: '#cbd5e1' }}>No files selected — file attachment is optional</Typography></Box>
                    : files.map((f, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.2, bgcolor: 'background.default', borderRadius: 2, mb: 1, border: '1px solid' }}>
                        <Description sx={{ fontSize: 18, color: '#6366f1' }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12, color: 'text.primary' }}>{f.name}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>{formatFileSize(f.size)}</Typography>
                        </Box>
                        <IconButton size="small" onClick={() => removeFile(i)} sx={{ color: '#cbd5e1', '&:hover': { color: '#ef4444' }, p: 0.5 }}><Close sx={{ fontSize: 14 }} /></IconButton>
                      </Box>
                    ))
                  }
                </Box>

                {loading && <LinearProgress sx={{ borderRadius: 2 }} />}
                <Button variant="contained" size="large" endIcon={<Send />} onClick={handleSubmit} disabled={loading}
                  sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, py: 1.5, fontWeight: 700 }}>
                  {loading ? 'Creating Task...' : 'Create Task'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Tips sidebar */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', bgcolor: 'background.paper' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 2 }}>💡 Tips</Typography>
              {[
                ['📋 Be specific', 'A clear title and description reduces back-and-forth with writers.'],
                ['📎 Attach briefs', 'Upload guidelines, templates, or examples so writers know exactly what you need.'],
                ['🔗 Dependencies', 'Use "Depends On" so tasks are blocked until prerequisites are done.'],
                ['⏱️ Estimate time', 'Adding an estimated time helps writers track their pace.'],
                ['📅 Set deadlines', 'Due dates trigger automatic overdue alerts if a task is not completed in time.'],
              ].map(([t, d]) => (
                <Box key={t} sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block' }}>{t}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>{d}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </PageShell>
  );
}
