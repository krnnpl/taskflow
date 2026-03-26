import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, Box, Typography, IconButton, Chip, Avatar, Divider,
  TextField, Button, Tab, Tabs, LinearProgress, Tooltip, CircularProgress
} from '@mui/material';
import {
  Close, AttachFile, Download, Delete, Send, PlayArrow, Stop,
  Schedule, CheckCircle, Warning, FolderOpen
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { taskAPI } from '../../utils/api';

const statusColor = {
  pending:               { color: 'text.secondary', bg: 'rgba(100,116,139,0.15)' },
  assigned_to_assigner:  { color: '#d97706', bg: 'rgba(245,158,11,0.15)' },
  assigned_to_writer:    { color: '#7c3aed', bg: 'rgba(139,92,246,0.15)' },
  in_progress:           { color: '#0369a1', bg: 'rgba(14,165,233,0.15)' },
  completed:             { color: '#059669', bg: 'rgba(16,185,129,0.15)' },
  overdue:               { color: '#dc2626', bg: 'rgba(239,68,68,0.15)' },
  rejected:              { color: 'text.secondary', bg: 'rgba(100,116,139,0.15)' },
};
const priorityColor = { high: '#ef4444', medium: '#d97706', low: '#059669' };
const roleColor = { superadmin: '#ef4444', admin: '#f97316', pm: '#8b5cf6', assigner: '#059669', writer: '#0ea5e9' };

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
function formatTime(mins) {
  if (!mins) return '0m';
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function timeAgo(date) {
  const s = Math.floor((new Date() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fileIcon(mime) {
  if (mime?.startsWith('image/')) return '🖼️';
  if (mime === 'application/pdf') return '📄';
  if (mime?.includes('word')) return '📝';
  if (mime?.includes('excel') || mime?.includes('spreadsheet')) return '📊';
  if (mime?.includes('zip')) return '📦';
  return '📎';
}

export default function TaskDetailModal({ open, task, onClose, onUpdate }) {
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [activity, setActivity] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const fileRef = useRef();
  const deliverableRef = useRef();
  const commentsEndRef = useRef();

  useEffect(() => {
    if (!open || !task) return;
    taskAPI.getComments(task.id).then(r => setComments(r.data)).catch(() => {});
    taskAPI.getAttachments(task.id).then(r => setAttachments(r.data)).catch(() => {});
    taskAPI.getActivity(task.id).then(r => setActivity(r.data)).catch(() => {});
    setTimerRunning(!!task.timerStartedAt);
    setElapsed(task.loggedMinutes || 0);
  }, [open, task]);

  // Live timer counter
  useEffect(() => {
    if (!timerRunning || !task?.timerStartedAt) return;
    const base = Math.round((new Date() - new Date(task.timerStartedAt)) / 60000);
    const interval = setInterval(() => setElapsed((task.loggedMinutes || 0) + base + Math.round((new Date() - new Date(task.timerStartedAt)) / 60000)), 30000);
    return () => clearInterval(interval);
  }, [timerRunning, task]);

  useEffect(() => {
    if (tab === 0) commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments, tab]);

  const handleComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const r = await taskAPI.addComment(task.id, { comment: newComment });
      setComments(p => [...p, r.data]);
      setNewComment('');
    } catch {} finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (cid) => {
    await taskAPI.deleteComment(cid);
    setComments(p => p.filter(c => c.id !== cid));
  };

  const handleUpload = async (file, type) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('taskId', task.id);
    fd.append('attachmentType', type);
    setUploading(true);
    try {
      const r = await taskAPI.uploadAttachment(fd);
      setAttachments(p => [r.data, ...p]);
      if (onUpdate) onUpdate();
    } catch (e) { alert(e.response?.data?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleDeleteAttachment = async (aid) => {
    if (!window.confirm('Delete this file?')) return;
    await taskAPI.deleteAttachment(aid);
    setAttachments(p => p.filter(a => a.id !== aid));
  };

  const handleStartTimer = async () => {
    await taskAPI.startTimer(task.id);
    setTimerRunning(true);
    if (onUpdate) onUpdate();
  };
  const handleStopTimer = async () => {
    const r = await taskAPI.stopTimer(task.id);
    setTimerRunning(false);
    setElapsed(r.data.loggedMinutes);
    if (onUpdate) onUpdate();
  };

  if (!task) return null;
  const sc = statusColor[task.status] || statusColor.pending;
  const isWriter = user?.role === 'writer';
  const briefFiles = attachments.filter(a => a.attachmentType === 'brief');
  const deliverables = attachments.filter(a => a.attachmentType === 'deliverable');
  const otherFiles = attachments.filter(a => a.attachmentType === 'other');
  const progress = task.estimatedMinutes ? Math.min(Math.round((elapsed / task.estimatedMinutes) * 100), 100) : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, maxHeight: '90vh' } }}>
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid #f1f5f9' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, mr: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
              <Chip label={task.status?.replace(/_/g,' ')} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: 11, textTransform: 'capitalize' }} />
              <Chip label={task.priority} size="small" sx={{ bgcolor: `${priorityColor[task.priority]}15`, color: priorityColor[task.priority], fontWeight: 600, fontSize: 11, textTransform: 'capitalize' }} />
              {task.isOverdue && <Chip icon={<Warning sx={{ fontSize: 12 }} />} label="Overdue" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#dc2626', fontWeight: 700, fontSize: 11 }} />}
              {task.dependency && <Chip label={`Depends on: ${task.dependency.title}`} size="small" sx={{ bgcolor: 'rgba(14,165,233,0.15)', color: '#0369a1', fontSize: 11 }} />}
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.3 }}>{task.title}</Typography>
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: 'text.disabled' }}><Close /></IconButton>
        </Box>

        {/* Meta row */}
        <Box sx={{ display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap' }}>
          {task.creator && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Typography variant="caption" sx={{ color: 'text.disabled' }}>By</Typography><Avatar sx={{ width: 18, height: 18, bgcolor: '#8b5cf6', fontSize: 9 }}>{task.creator.username?.[0]}</Avatar><Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{task.creator.username}</Typography></Box>}
          {task.writer && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}><Typography variant="caption" sx={{ color: 'text.disabled' }}>Writer</Typography><Avatar sx={{ width: 18, height: 18, bgcolor: '#0ea5e9', fontSize: 9 }}>{task.writer.username?.[0]}</Avatar><Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{task.writer.username}</Typography></Box>}
          {task.dueDate && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Schedule sx={{ fontSize: 13, color: task.isOverdue ? '#dc2626' : '#94a3b8' }} /><Typography variant="caption" sx={{ color: task.isOverdue ? '#dc2626' : '#64748b', fontWeight: task.isOverdue ? 700 : 400 }}>Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Typography></Box>}
        </Box>

        {/* Time tracking bar (writer only) */}
        {isWriter && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary' }}>Time Logged</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#6366f1' }}>{formatTime(elapsed)} {task.estimatedMinutes ? `/ ${formatTime(task.estimatedMinutes)} est.` : ''}</Typography>
              </Box>
              {task.estimatedMinutes > 0 && <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, bgcolor: 'divider', '& .MuiLinearProgress-bar': { bgcolor: progress > 90 ? '#ef4444' : '#6366f1' } }} />}
            </Box>
            {task.status !== 'completed' && (
              timerRunning
                ? <Button size="small" variant="contained" startIcon={<Stop />} onClick={handleStopTimer} sx={{ bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}>Stop Timer</Button>
                : <Button size="small" variant="contained" startIcon={<PlayArrow />} onClick={handleStartTimer} sx={{ bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, borderRadius: 2, fontWeight: 600, whiteSpace: 'nowrap' }}>Start Timer</Button>
            )}
          </Box>
        )}
      </Box>

      <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Description */}
        {task.description && (
          <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #f1f5f9', bgcolor: 'background.paper' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, lineHeight: 1.7 }}>{task.description}</Typography>
          </Box>
        )}

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: '1px solid #f1f5f9', '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: 13, minHeight: 44 } }}>
          <Tab label={`Comments (${comments.length})`} />
          <Tab label={`Files (${attachments.length})`} />
          <Tab label="Activity" />
        </Tabs>

        <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 2 }}>
          {/* COMMENTS TAB */}
          {tab === 0 && (
            <Box>
              {comments.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>No comments yet — be the first to add one</Typography>
                </Box>
              )}
              {comments.map(c => (
                <Box key={c.id} sx={{ display: 'flex', gap: 1.5, mb: 2.5 }}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: roleColor[c.author?.role] || '#6366f1', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{c.author?.username?.[0]?.toUpperCase()}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', fontSize: 13 }}>{c.author?.username}</Typography>
                        <Chip label={c.author?.role} size="small" sx={{ bgcolor: `${roleColor[c.author?.role]}15`, color: roleColor[c.author?.role], fontSize: 10, fontWeight: 600, height: 17, textTransform: 'capitalize' }} />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>{timeAgo(c.createdAt)}</Typography>
                        {c.userId === user?.id && (
                          <IconButton size="small" onClick={() => handleDeleteComment(c.id)} sx={{ color: '#cbd5e1', '&:hover': { color: '#ef4444' }, p: 0.3 }}><Delete sx={{ fontSize: 14 }} /></IconButton>
                        )}
                      </Box>
                    </Box>
                    <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: '4px 12px 12px 12px', border: '1px solid' }}>
                      <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{c.comment}</Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
              <div ref={commentsEndRef} />

              {/* Comment input */}
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2, pt: 2, borderTop: '1px solid #f1f5f9' }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: roleColor[user?.role] || '#6366f1', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{user?.username?.[0]?.toUpperCase()}</Avatar>
                <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                  <TextField fullWidth multiline maxRows={4} placeholder="Add a comment..." value={newComment} onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13 } }} size="small" />
                  <Button variant="contained" onClick={handleComment} disabled={!newComment.trim() || submitting}
                    sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, minWidth: 40, px: 1.5 }}>
                    {submitting ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Send sx={{ fontSize: 18 }} />}
                  </Button>
                </Box>
              </Box>
            </Box>
          )}

          {/* FILES TAB */}
          {tab === 1 && (
            <Box>
              {/* Brief files (created by PM) */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <FolderOpen sx={{ fontSize: 13 }} /> Task Brief / Reference Files
                  </Typography>
                  {['pm','admin','superadmin'].includes(user?.role) && (
                    <>
                      <input type="file" ref={fileRef} style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0], 'brief')} />
                      <Button size="small" startIcon={<AttachFile sx={{ fontSize: 13 }} />} onClick={() => fileRef.current.click()} disabled={uploading}
                        sx={{ fontSize: 11, color: '#6366f1', fontWeight: 600, textTransform: 'none' }}>
                        {uploading ? 'Uploading...' : 'Attach Brief'}
                      </Button>
                    </>
                  )}
                </Box>
                {briefFiles.length === 0
                  ? <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', py: 1 }}>No brief files attached</Typography>
                  : briefFiles.map(a => <FileRow key={a.id} att={a} onDelete={handleDeleteAttachment} userId={user?.id} userRole={user?.role} />)
                }
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Deliverables (uploaded by writer) */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 13 }} /> Deliverables (Submitted Work)
                  </Typography>
                  {isWriter && task.status !== 'pending' && (
                    <>
                      <input type="file" ref={deliverableRef} style={{ display: 'none' }} onChange={e => handleUpload(e.target.files[0], 'deliverable')} />
                      <Button size="small" variant="contained" startIcon={<AttachFile sx={{ fontSize: 13 }} />} onClick={() => deliverableRef.current.click()} disabled={uploading}
                        sx={{ fontSize: 11, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, borderRadius: 2, fontWeight: 600, textTransform: 'none' }}>
                        {uploading ? 'Uploading...' : 'Upload Work'}
                      </Button>
                    </>
                  )}
                </Box>
                {deliverables.length === 0
                  ? <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', py: 1 }}>No deliverables submitted yet</Typography>
                  : deliverables.map(a => <FileRow key={a.id} att={a} onDelete={handleDeleteAttachment} userId={user?.id} userRole={user?.role} />)
                }
              </Box>
            </Box>
          )}

          {/* ACTIVITY TAB */}
          {tab === 2 && (
            <Box>
              {activity.length === 0
                ? <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 4 }}>No activity yet</Typography>
                : activity.map((a, i) => (
                  <Box key={a.id} sx={{ display: 'flex', gap: 2, mb: 2, position: 'relative' }}>
                    {i < activity.length - 1 && <Box sx={{ position: 'absolute', left: 15, top: 28, bottom: -8, width: 2, bgcolor: 'action.hover' }} />}
                    <Avatar sx={{ width: 30, height: 30, bgcolor: a.actor ? roleColor[a.actor.role] || '#6366f1' : '#e2e8f0', fontSize: 11, fontWeight: 700, flexShrink: 0, zIndex: 1 }}>
                      {a.actor?.username?.[0]?.toUpperCase() || '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontSize: 13, lineHeight: 1.5 }}>
                        <strong>{a.actor?.username || 'System'}</strong> {a.action}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>{timeAgo(a.createdAt)}</Typography>
                    </Box>
                  </Box>
                ))
              }
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function FileRow({ att, onDelete, userId, userRole }) {
  const canDelete = att.uploadedBy === userId || ['superadmin','admin'].includes(userRole);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', mb: 1, '&:hover': { bgcolor: 'action.hover' } }}>
      <Typography sx={{ fontSize: 20, flexShrink: 0 }}>{fileIcon(att.mimetype)}</Typography>
      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.originalName}</Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>{formatSize(att.size)} · by {att.uploader?.username}</Typography>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        <Tooltip title="Download">
          <IconButton size="small" component="a" href={taskAPI.downloadAttachment(att.id)} download sx={{ color: '#6366f1', '&:hover': { bgcolor: 'rgba(139,92,246,0.15)' } }}>
            <Download sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
        {canDelete && (
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => onDelete(att.id)} sx={{ color: '#cbd5e1', '&:hover': { color: '#ef4444', bgcolor: 'rgba(239,68,68,0.15)' } }}>
              <Delete sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
}
