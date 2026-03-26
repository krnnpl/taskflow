import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, Avatar, IconButton,
  Chip, CircularProgress, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Alert, Popover
} from '@mui/material';
import {
  Send, AttachFile, Edit, Delete, Schedule, EmojiEmotions,
  Close, Download, InsertDriveFile, PictureAsPdf, EmojiEvents, Check
} from '@mui/icons-material';
import { creditAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { formatDistanceToNow, format } from 'date-fns';

const ROLE_COLORS = {
  superadmin: '#ef4444', admin: '#f97316', pm: '#8b5cf6',
  assigner: '#059669', writer: '#0ea5e9',
};
const ROLE_LABELS = {
  superadmin: 'Super Admin', admin: 'Admin', pm: 'PM',
  assigner: 'Assigner', writer: 'Writer',
};
const QUICK_REACTIONS = ['👍','❤️','🎉','✅','🔥','👏','💯','🙌'];

const timeAgo = d => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; } };
const fmtBytes = b => { if (!b) return ''; if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b/1024).toFixed(1)}KB`; return `${(b/1048576).toFixed(1)}MB`; };

function Reactions({ reactions, onReact, currentUserId }) {
  if (!reactions) return null;
  let parsed = {};
  try { parsed = JSON.parse(reactions); } catch {}
  const entries = Object.entries(parsed).filter(([, ids]) => ids.length > 0);
  if (!entries.length) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.5 }}>
      {entries.map(([emoji, ids]) => (
        <Chip key={emoji} label={`${emoji} ${ids.length}`} size="small"
          onClick={() => onReact(emoji)}
          sx={{ height: 20, fontSize: 11, cursor: 'pointer', borderRadius: 10,
            bgcolor: ids.includes(currentUserId) ? '#eef2ff' : '#f1f5f9',
            border: `1px solid ${ids.includes(currentUserId) ? '#c7d2fe' : '#e2e8f0'}`,
            color: ids.includes(currentUserId) ? '#6366f1' : '#475569',
            fontWeight: ids.includes(currentUserId) ? 700 : 400,
            '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' }, '& .MuiChip-label': { px: 0.8 } }} />
      ))}
    </Box>
  );
}

function CreditPost({ post, currentUser, darkMode, onEdit, onDelete, onReact }) {
  const [hover, setHover] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const isOwn    = post.author?.id === currentUser?.id;
  const color    = ROLE_COLORS[post.author?.role] || '#6366f1';
  const deleted  = post.isDeleted;
  const isImage  = post.fileMimeType?.startsWith('image/');
  const fileUrl  = creditAPI.fileUrl(post.id);

  return (
    <Box
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      sx={{ display: 'flex', gap: 1.5, px: 2.5, py: 1.5,
        borderRadius: 2, position: 'relative',
        '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' } }}>

      <Avatar sx={{ width: 36, height: 36, bgcolor: color, fontSize: 14, fontWeight: 700, flexShrink: 0, mt: 0.2 }}>
        {post.author?.username?.[0]?.toUpperCase()}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14, color }}>
            {post.author?.username}
          </Typography>
          <Chip label={ROLE_LABELS[post.author?.role] || ''} size="small"
            sx={{ height: 16, fontSize: 10, fontWeight: 600,
              bgcolor: `${color}18`, color, border: `1px solid ${color}30`,
              '& .MuiChip-label': { px: 0.8 } }} />
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
            {timeAgo(post.createdAt)}
          </Typography>
          {post.isEdited && !deleted && (
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10, fontStyle: 'italic' }}>(edited)</Typography>
          )}
          {post.scheduledAt && !deleted && (
            <Chip label={`Scheduled: ${format(new Date(post.scheduledAt), 'MMM d h:mm a')}`} size="small"
              sx={{ height: 16, fontSize: 9, bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706', fontWeight: 600, '& .MuiChip-label': { px: 0.8 } }} />
          )}
        </Box>

        {post.content && !deleted && (
          <Typography sx={{ mt: 0.3, fontSize: 14, lineHeight: 1.65,
            color: darkMode ? '#e2e8f0' : '#1e293b',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            fontFamily: '"Plus Jakarta Sans", monospace' }}>
            {post.content}
          </Typography>
        )}

        {deleted && (
          <Typography sx={{ mt: 0.3, fontSize: 13, color: 'text.disabled', fontStyle: 'italic' }}>
            This post was deleted
          </Typography>
        )}

        {/* File */}
        {!deleted && post.fileName && (
          <Box sx={{ mt: 1 }}>
            {isImage ? (
              <Box component="img" src={fileUrl} alt={post.fileOriginalName}
                sx={{ maxWidth: 320, maxHeight: 280, borderRadius: 2, display: 'block',
                  border: '1px solid', cursor: 'pointer', '&:hover': { opacity: 0.9 } }}
                onClick={() => window.open(fileUrl, '_blank')} />
            ) : (
              <Box component="a" href={fileUrl} download={post.fileOriginalName}
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 1,
                  px: 1.5, py: 1, borderRadius: 2, textDecoration: 'none', cursor: 'pointer',
                  bgcolor: darkMode ? 'rgba(99,102,241,0.1)' : '#f1f5f9',
                  border: `1px solid ${darkMode ? 'rgba(99,102,241,0.2)' : '#e2e8f0'}`,
                  '&:hover': { bgcolor: darkMode ? 'rgba(99,102,241,0.18)' : '#e2e8f0' } }}>
                {post.fileMimeType === 'application/pdf'
                  ? <PictureAsPdf sx={{ fontSize: 18, color: '#ef4444' }} />
                  : <InsertDriveFile sx={{ fontSize: 18, color: '#6366f1' }} />}
                <Box>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: darkMode ? '#e2e8f0' : '#1e293b', lineHeight: 1.2 }}>
                    {post.fileOriginalName}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>
                    {fmtBytes(post.fileSize)}
                  </Typography>
                </Box>
                <Download sx={{ fontSize: 14, color: 'text.disabled' }} />
              </Box>
            )}
          </Box>
        )}

        {/* Reactions */}
        {!deleted && (
          <Reactions reactions={post.reactions} onReact={emoji => onReact(post.id, emoji)}
            currentUserId={currentUser?.id} />
        )}
      </Box>

      {/* Hover actions (own posts only) */}
      {hover && !deleted && (
        <Box sx={{ position: 'absolute', top: 8, right: 12,
          display: 'flex', gap: 0.3, bgcolor: darkMode ? '#1e293b' : 'white',
          border: '1px solid', borderRadius: 2, p: 0.4,
          boxShadow: '0 2px 12px rgba(0,0,0,0.12)', zIndex: 10 }}>
          {QUICK_REACTIONS.slice(0, 4).map(e => (
            <IconButton key={e} size="small" onClick={() => onReact(post.id, e)}
              sx={{ width: 24, height: 24, fontSize: 13, borderRadius: 1, p: 0,
                '&:hover': { bgcolor: 'rgba(99,102,241,0.12)' } }}>
              {e}
            </IconButton>
          ))}
          <Tooltip title="More reactions">
            <IconButton size="small" onClick={e => setEmojiAnchor(e.currentTarget)}
              sx={{ width: 24, height: 24, borderRadius: 1, '&:hover': { bgcolor: 'rgba(99,102,241,0.12)' } }}>
              <EmojiEmotions sx={{ fontSize: 12, color: 'text.disabled' }} />
            </IconButton>
          </Tooltip>
          {isOwn && (
            <>
              <Box sx={{ width: 1, bgcolor: 'divider', mx: 0.2 }} />
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(post)}
                  sx={{ width: 24, height: 24, borderRadius: 1,
                    '&:hover': { bgcolor: 'rgba(99,102,241,0.12)', color: '#6366f1' } }}>
                  <Edit sx={{ fontSize: 12 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => onDelete(post.id)}
                  sx={{ width: 24, height: 24, borderRadius: 1,
                    '&:hover': { bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444' } }}>
                  <Delete sx={{ fontSize: 12 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )}

      {/* Full emoji picker */}
      <Popover open={!!emojiAnchor} anchorEl={emojiAnchor} onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Box sx={{ p: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: 200 }}>
          {QUICK_REACTIONS.map(e => (
            <IconButton key={e} size="small" onClick={() => { onReact(post.id, e); setEmojiAnchor(null); }}
              sx={{ width: 32, height: 32, fontSize: 16, borderRadius: 1.5,
                '&:hover': { bgcolor: 'rgba(99,102,241,0.12)' } }}>
              {e}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
}

export default function CreditsPage() {
  const { user }     = useAuth();
  const { darkMode } = useDarkMode();

  const [posts, setPosts]           = useState([]);
  const [content, setContent]       = useState('');
  const [file, setFile]             = useState(null);
  const [sending, setSending]       = useState(false);
  const [loading, setLoading]       = useState(true);
  const [editPost, setEditPost]     = useState(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError]           = useState('');
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt]   = useState('');

  const fileRef   = useRef();
  const bottomRef = useRef();
  const color = ROLE_COLORS[user?.role] || '#6366f1';

  const load = useCallback(async () => {
    try {
      const r = await creditAPI.getAll();
      setPosts([...r.data].reverse());
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [posts.length]);

  const handleSend = async () => {
    if (!content.trim() && !file) return;
    setSending(true); setError('');
    try {
      const fd = new FormData();
      if (content.trim()) fd.append('content', content.trim());
      if (file) fd.append('file', file);
      if (scheduledAt) fd.append('scheduledAt', new Date(scheduledAt).toISOString());
      await creditAPI.create(fd);
      setContent(''); setFile(null); setScheduledAt('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to post');
    } finally { setSending(false); }
  };

  const handleReact = async (id, emoji) => {
    try {
      const r = await creditAPI.react(id, emoji);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, reactions: JSON.stringify(r.data.reactions) } : p));
    } catch {}
  };

  const handleEdit = async () => {
    if (!editPost || !editContent.trim()) return;
    try {
      await creditAPI.update(editPost.id, { content: editContent.trim() });
      setPosts(prev => prev.map(p => p.id === editPost.id ? { ...p, content: editContent.trim(), isEdited: true } : p));
      setEditPost(null); setEditContent('');
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await creditAPI.delete(id);
      setPosts(prev => prev.map(p => p.id === id ? { ...p, isDeleted: true } : p));
    } catch {}
  };

  const handleKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
      border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>

      {/* Header */}
      <Box sx={{ px: 3, py: 1.8, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0,
        bgcolor: darkMode ? '#1e293b' : 'white' }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <EmojiEvents sx={{ color: '#6366f1', fontSize: 18 }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: darkMode ? '#f1f5f9' : '#0f172a', lineHeight: 1.2 }}>
            # credits
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 11 }}>
            Drop work credits · visible to everyone · {posts.filter(p => !p.isDeleted).length} posts
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,
          px: 1.2, py: 0.4, borderRadius: 2, bgcolor: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#059669',
            animation: 'blink 2s infinite', '@keyframes blink': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, fontSize: 10 }}>Live</Typography>
        </Box>
      </Box>

      {/* Feed */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1,
        bgcolor: darkMode ? '#0f172a' : '#fafbff',
        '&::-webkit-scrollbar': { width: 5 },
        '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(99,102,241,0.2)', borderRadius: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
            <CircularProgress size={26} sx={{ color: '#6366f1' }} />
          </Box>
        ) : posts.filter(p => !p.isDeleted).length === 0 ? (
          <Box sx={{ textAlign: 'center', pt: 8 }}>
            <EmojiEvents sx={{ fontSize: 52, color: 'divider', mb: 1.5 }} />
            <Typography sx={{ fontWeight: 700, color: 'text.disabled', fontSize: 15 }}>No credits yet</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>Be the first to drop a credit!</Typography>
          </Box>
        ) : (
          <>
            {posts.map(post => (
              <CreditPost key={post.id} post={post} currentUser={user} darkMode={darkMode}
                onEdit={p => { setEditPost(p); setEditContent(p.content || ''); }}
                onDelete={handleDelete}
                onReact={handleReact}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </Box>

      {/* Composer */}
      <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0,
        bgcolor: darkMode ? '#1e293b' : 'white' }}>
        {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 1.5, borderRadius: 2, py: 0.5 }}>{error}</Alert>}

        {/* File preview */}
        {file && (
          <Box sx={{ mb: 1.2, display: 'flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 0.8, borderRadius: 2, bgcolor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <InsertDriveFile sx={{ fontSize: 16, color: '#6366f1' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, flex: 1, color: '#6366f1' }}>
              {file.name} <span style={{ color: 'text.disabled' }}>({fmtBytes(file.size)})</span>
            </Typography>
            <IconButton size="small" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
              sx={{ p: 0.3, '&:hover': { color: '#ef4444' } }}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )}

        {/* Schedule preview */}
        {scheduledAt && (
          <Box sx={{ mb: 1.2, display: 'flex', alignItems: 'center', gap: 1,
            px: 1.5, py: 0.6, borderRadius: 2, bgcolor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <Schedule sx={{ fontSize: 14, color: '#d97706' }} />
            <Typography variant="caption" sx={{ flex: 1, color: 'warning.main', fontWeight: 600 }}>
              Scheduled: {format(new Date(scheduledAt), 'MMM d, h:mm a')}
            </Typography>
            <IconButton size="small" onClick={() => setScheduledAt('')} sx={{ p: 0.3 }}>
              <Close sx={{ fontSize: 12 }} />
            </IconButton>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: color, fontSize: 12, fontWeight: 700, flexShrink: 0, mb: 0.3 }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>

          <TextField multiline maxRows={6} fullWidth value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={handleKey}
            placeholder={`Drop your credit, ${user?.username?.split(' ')[0]}... (Enter to post)`}
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2.5, fontSize: 13.5,
              fontFamily: '"Plus Jakarta Sans", monospace',
              bgcolor: darkMode ? 'rgba(255,255,255,0.04)' : 'white',
              '& fieldset': { borderColor: darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0' },
              '&:hover fieldset': { borderColor: '#6366f1' },
              '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
          />

          <input ref={fileRef} type="file" hidden
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.txt,.csv"
            onChange={e => setFile(e.target.files[0] || null)} />

          <Tooltip title="Attach file">
            <IconButton onClick={() => fileRef.current?.click()}
              sx={{ color: 'text.disabled', borderRadius: 2, width: 38, height: 38, flexShrink: 0,
                '&:hover': { bgcolor: 'rgba(99,102,241,0.12)', color: '#6366f1' } }}>
              <AttachFile sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Schedule post">
            <IconButton onClick={() => setScheduleOpen(true)}
              sx={{ color: scheduledAt ? '#d97706' : '#94a3b8', borderRadius: 2, width: 38, height: 38, flexShrink: 0,
                '&:hover': { bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706' } }}>
              <Schedule sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>

          <Button variant="contained" onClick={handleSend}
            disabled={sending || (!content.trim() && !file)}
            sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
              minWidth: 42, width: 42, height: 40, p: 0, flexShrink: 0, mb: 0.2 }}>
            {sending ? <CircularProgress size={15} sx={{ color: 'white' }} /> : <Send sx={{ fontSize: 16 }} />}
          </Button>
        </Box>

        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: 10, mt: 0.5, display: 'block', pl: 5.5 }}>
          Enter to post · Shift+Enter for new line · 📎 attach file · 🕐 schedule
        </Typography>
      </Box>

      {/* Schedule dialog */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16, pb: 1 }}>Schedule Post</DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 2, display: 'block' }}>
            The post will appear in the feed at the scheduled time.
          </Typography>
          <TextField fullWidth type="datetime-local" value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            inputProps={{ min: new Date().toISOString().slice(0,16) }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setScheduleOpen(false)} sx={{ color: 'text.secondary', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" disabled={!scheduledAt}
            onClick={() => setScheduleOpen(false)}
            sx={{ borderRadius: 2, bgcolor: '#6366f1', textTransform: 'none', fontWeight: 600 }}>
            Set Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editPost} onClose={() => setEditPost(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16, pb: 1 }}>Edit Post</DialogTitle>
        <DialogContent>
          <TextField multiline rows={4} fullWidth value={editContent}
            onChange={e => setEditContent(e.target.value)} autoFocus
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13.5, fontFamily: 'monospace' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditPost(null)} sx={{ color: 'text.secondary', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={!editContent.trim()}
            sx={{ borderRadius: 2, bgcolor: '#6366f1', textTransform: 'none', fontWeight: 600 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
