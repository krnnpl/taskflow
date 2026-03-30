import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  Box, Typography, TextField, IconButton, Avatar, Badge, Chip,
  List, ListItem, ListItemButton, ListItemAvatar, ListItemText,
  Tabs, Tab, CircularProgress, Divider, Tooltip,
  Popover, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert
} from '@mui/material';
import {
  Send, Chat, Assignment, Search, AttachFile,
  Edit, Delete, Schedule, EmojiEmotions, Close, Download,
  InsertDriveFile, Image as ImageIcon, PictureAsPdf, Check, DoneAll
} from '@mui/icons-material';
import { chatAPI, taskAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { formatDistanceToNow, format } from 'date-fns';

const ROLE_COLORS = {
  superadmin: '#ef4444', admin: '#f97316', pm: '#8b5cf6',
  assigner: '#059669', writer: '#0ea5e9',
};
const QUICK_REACTIONS = ['👍','❤️','😂','🎉','✅','🔥','👏','💯'];

const timeAgo = d => { try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ''; } };
const fmtBytes = b => { if (!b) return ''; if (b < 1024) return `${b}B`; if (b < 1048576) return `${(b/1024).toFixed(1)}KB`; return `${(b/1048576).toFixed(1)}MB`; };

// ── Separate memoized components to prevent re-render loop ────────────────

const FileAttachment = memo(({ msg, isMe }) => {
  const isImage = msg.fileMimeType?.startsWith('image/');
  const url = chatAPI.fileUrl(msg.id);

  const handleDownload = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('taskflow_token');
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) { alert('File not available. It may have been lost during server restart.'); return; }
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = msg.fileOriginalName || 'download';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { alert('Download failed. Please try again.'); }
  };

  if (isImage) return (
    <Box sx={{ mt: 0.5, maxWidth: 260 }}>
      <Box component="img" src={url} alt={msg.fileOriginalName}
        sx={{ maxWidth: '100%', maxHeight: 200, borderRadius: 2, display: 'block',
          cursor: 'pointer', border: '1px solid rgba(0,0,0,0.08)' }}
        onClick={() => window.open(url, '_blank')} />
      <Box component="a" href={url} onClick={handleDownload}
        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 0.3,
          fontSize: 11, color: isMe ? 'rgba(255,255,255,0.7)' : '#6366f1',
          textDecoration: 'none', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
        <Download sx={{ fontSize: 12 }} />{msg.fileOriginalName}
      </Box>
    </Box>
  );
  return (
    <Box component="a" href={url} onClick={handleDownload}
      sx={{ mt: 0.5, display: 'inline-flex', alignItems: 'center', gap: 1,
        px: 1.5, py: 1, borderRadius: 2,
        bgcolor: isMe ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.08)',
        border: `1px solid ${isMe ? 'rgba(255,255,255,0.25)' : 'rgba(99,102,241,0.2)'}`,
        textDecoration: 'none', cursor: 'pointer', '&:hover': { opacity: 0.85 },
        transition: 'all 0.15s' }}>
      {msg.fileMimeType === 'application/pdf'
        ? <PictureAsPdf sx={{ fontSize: 18, color: isMe ? 'rgba(255,255,255,0.9)' : '#ef4444' }} />
        : <InsertDriveFile sx={{ fontSize: 18, color: isMe ? 'rgba(255,255,255,0.9)' : '#6366f1' }} />}
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: isMe ? 'rgba(255,255,255,0.95)' : '#1e293b', lineHeight: 1.2, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {msg.fileOriginalName}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 10, color: isMe ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>
          {fmtBytes(msg.fileSize)} · Click to download
        </Typography>
      </Box>
      <Download sx={{ fontSize: 14, color: isMe ? 'rgba(255,255,255,0.6)' : '#94a3b8', flexShrink: 0 }} />
    </Box>
  );
});

const ReactionBar = memo(({ reactions, onReact, currentUserId, isMe }) => {
  let parsed = {};
  try { parsed = JSON.parse(reactions || '{}'); } catch {}
  const entries = Object.entries(parsed).filter(([, ids]) => ids.length > 0);
  if (!entries.length) return null;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.5,
      justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
      {entries.map(([emoji, ids]) => (
        <Chip key={emoji} label={`${emoji} ${ids.length}`} size="small"
          onClick={() => onReact(emoji)}
          sx={{ height: 22, fontSize: 12, cursor: 'pointer', borderRadius: 10,
            bgcolor: ids.includes(currentUserId) ? '#eef2ff' : '#f1f5f9',
            border: `1px solid ${ids.includes(currentUserId) ? '#c7d2fe' : '#e2e8f0'}`,
            color: ids.includes(currentUserId) ? '#6366f1' : '#475569',
            fontWeight: ids.includes(currentUserId) ? 700 : 400,
            '&:hover': { bgcolor: 'rgba(99,102,241,0.15)' }, '& .MuiChip-label': { px: 1 } }} />
      ))}
    </Box>
  );
});

const MessageBubble = memo(({ msg, isMe, darkMode, currentUserId, onEdit, onDelete, onReact }) => {
  const [hover, setHover] = useState(false);
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const deleted = msg.isDeleted;
  const scheduled = msg.scheduledAt && new Date(msg.scheduledAt) > new Date();
  const color = ROLE_COLORS[msg.sender?.role] || '#6366f1';

  return (
    <Box onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      sx={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start',
        mb: 0.5, alignItems: 'flex-end', gap: 1, px: 2, py: 0.3,
        '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)' },
        borderRadius: 2, position: 'relative' }}>

      {!isMe && (
        <Avatar sx={{ width: 30, height: 30, bgcolor: color, fontSize: 11, fontWeight: 700, flexShrink: 0, mb: 0.3 }}>
          {msg.sender?.username?.[0]?.toUpperCase()}
        </Avatar>
      )}

      <Box sx={{ maxWidth: '70%', minWidth: 60 }}>
        {!isMe && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 700, color }}>
              {msg.sender?.username}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: 10, color: 'text.disabled' }}>
              {timeAgo(msg.createdAt)}
            </Typography>
            {msg.isEdited && <Typography variant="caption" sx={{ fontSize: 9, color: 'text.disabled', fontStyle: 'italic' }}>(edited)</Typography>}
          </Box>
        )}

        <Box sx={{ position: 'relative' }}>
          {/* Bubble */}
          <Box sx={{
            px: 1.5, py: 1, borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            bgcolor: deleted ? (darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9')
              : isMe ? '#6366f1' : (darkMode ? '#1e293b' : 'white'),
            border: deleted || !isMe ? `1px solid ${darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` : 'none',
            boxShadow: isMe ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            {scheduled && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <Schedule sx={{ fontSize: 11, color: '#d97706' }} />
                <Typography variant="caption" sx={{ fontSize: 10, color: '#d97706', fontWeight: 600 }}>
                  Scheduled: {format(new Date(msg.scheduledAt), 'MMM d, h:mm a')}
                </Typography>
              </Box>
            )}
            {msg.content && (
              <Typography sx={{
                fontSize: 14, color: deleted ? '#94a3b8'
                  : isMe ? 'white' : (darkMode ? '#e2e8f0' : '#1e293b'),
                fontStyle: deleted ? 'italic' : 'normal',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5,
              }}>
                {msg.content}
              </Typography>
            )}
            {!deleted && msg.fileName && <FileAttachment msg={msg} isMe={isMe} />}
          </Box>

          {/* Read receipt */}
          {isMe && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.2, gap: 0.3, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: 9, color: 'text.disabled' }}>
                {timeAgo(msg.createdAt)}
              </Typography>
              {msg.isEdited && <Typography variant="caption" sx={{ fontSize: 9, color: 'text.disabled', fontStyle: 'italic' }}>(edited)</Typography>}
              {msg.isRead
                ? <DoneAll sx={{ fontSize: 12, color: '#6366f1' }} />
                : <Check sx={{ fontSize: 12, color: 'text.disabled' }} />}
            </Box>
          )}
        </Box>

        {/* Reactions */}
        {!deleted && (
          <ReactionBar reactions={msg.reactions} onReact={emoji => onReact(msg.id, emoji)}
            currentUserId={currentUserId} isMe={isMe} />
        )}
      </Box>

      {/* Hover action bar */}
      {!deleted && hover && (
        <Box sx={{
          position: 'absolute', top: -16, [isMe ? 'left' : 'right']: 8,
          display: 'flex', gap: 0.3, bgcolor: darkMode ? '#1e293b' : 'white',
          borderRadius: 2, border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)', px: 0.5, py: 0.3, zIndex: 10,
        }}>
          {/* Emoji picker trigger */}
          <Tooltip title="React">
            <IconButton size="small" onClick={e => setEmojiAnchor(e.currentTarget)}
              sx={{ p: 0.5, borderRadius: 1.5, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: '#f59e0b' } }}>
              <EmojiEmotions sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
          {isMe && (
            <>
              <Tooltip title="Edit">
                <IconButton size="small" onClick={() => onEdit(msg)}
                  sx={{ p: 0.5, borderRadius: 1.5, color: 'text.secondary', '&:hover': { bgcolor: 'action.hover', color: '#6366f1' } }}>
                  <Edit sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete">
                <IconButton size="small" onClick={() => onDelete(msg.id)}
                  sx={{ p: 0.5, borderRadius: 1.5, color: 'text.secondary', '&:hover': { bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444' } }}>
                  <Delete sx={{ fontSize: 15 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      )}

      {/* Quick emoji popover */}
      <Popover open={Boolean(emojiAnchor)} anchorEl={emojiAnchor}
        onClose={() => setEmojiAnchor(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        PaperProps={{ sx: { borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', p: 0.8 } }}>
        <Box sx={{ display: 'flex', gap: 0.3 }}>
          {QUICK_REACTIONS.map(e => (
            <IconButton key={e} size="small" onClick={() => { onReact(msg.id, e); setEmojiAnchor(null); }}
              sx={{ fontSize: 18, p: 0.6, borderRadius: 1.5, '&:hover': { bgcolor: 'action.hover', transform: 'scale(1.2)' }, transition: 'all 0.1s' }}>
              {e}
            </IconButton>
          ))}
        </Box>
      </Popover>
    </Box>
  );
});

// ── Main ChatPage ─────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user }     = useAuth();
  const { darkMode } = useDarkMode();

  const bg          = darkMode ? '#0f172a' : '#f8fafc';
  const sidebar     = darkMode ? '#1e293b' : '#ffffff';
  const borderColor = darkMode ? 'rgba(255,255,255,0.06)' : '#e2e8f0';
  const textPrimary = darkMode ? '#f1f5f9' : '#0f172a';
  const textMuted   = darkMode ? 'rgba(255,255,255,0.45)' : '#64748b';

  const [tab, setTab]             = useState(0);
  const [users, setUsers]         = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [dmList, setDmList]       = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [messages, setMessages]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [sending, setSending]     = useState(false);
  const [file, setFile]           = useState(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduledAt, setScheduledAt]   = useState('');
  const [editMsg, setEditMsg]     = useState(null);
  const [editContent, setEditContent]   = useState('');

  // Use ref for input to prevent re-render on every keystroke
  const inputRef      = useRef('');
  const inputElRef    = useRef(null);
  const messagesEndRef= useRef(null);
  const pollRef       = useRef(null);
  const fileRef       = useRef(null);
  const selectedUserRef = useRef(null);
  const selectedTaskRef = useRef(null);
  const tabRef          = useRef(0);

  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { selectedTaskRef.current = selectedTask; }, [selectedTask]);
  useEffect(() => { tabRef.current = tab; }, [tab]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  const fetchMessages = useCallback(async (silent = false) => {
    const curUser = selectedUserRef.current;
    const curTask = selectedTaskRef.current;
    const curTab  = tabRef.current;
    if (!curUser && !curTask) return;
    if (!silent) setLoading(true);
    try {
      let data;
      if (curTab === 0 && curUser)  data = (await chatAPI.getDMConversation(curUser.id)).data;
      if (curTab === 1 && curTask)  data = (await chatAPI.getTaskChat(curTask.id)).data;
      if (data) setMessages(data);
      // Reload sidebar to clear unread count after reading messages
      if (!silent) loadSidebar();
    } catch {} finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedUser || selectedTask) {
      fetchMessages();
      clearInterval(pollRef.current);
      pollRef.current = setInterval(() => fetchMessages(true), 3000);
    }
    return () => clearInterval(pollRef.current);
  }, [selectedUser, selectedTask, fetchMessages]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadSidebar = useCallback(async () => {
    try {
      const [u, d, t] = await Promise.all([chatAPI.getUsers(), chatAPI.getDMList(), taskAPI.getAll()]);
      setUsers(u.data); setDmList(d.data); setTasks(t.data);
    } catch {}
  }, []);

  useEffect(() => { loadSidebar(); }, [loadSidebar]);

  const handleSend = useCallback(async () => {
    const text = inputRef.current.trim();
    if (!text && !file) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text) fd.append('content', text);
      if (file) fd.append('file', file);
      if (scheduledAt) fd.append('scheduledAt', new Date(scheduledAt).toISOString());
      if (tabRef.current === 0 && selectedUserRef.current)
        await chatAPI.sendDM(selectedUserRef.current.id, fd);
      else if (tabRef.current === 1 && selectedTaskRef.current)
        await chatAPI.sendTaskMessage(selectedTaskRef.current.id, fd);
      // Clear input
      inputRef.current = '';
      if (inputElRef.current) inputElRef.current.value = '';
      setFile(null); setScheduledAt(''); setScheduleOpen(false);
      if (fileRef.current) fileRef.current.value = '';
      await fetchMessages(true);
      await loadSidebar();
    } catch {} finally { setSending(false); }
  }, [file, scheduledAt, fetchMessages, loadSidebar]);

  const handleReact = useCallback(async (msgId, emoji) => {
    try {
      const curTab = tabRef.current;
      let data;
      if (curTab === 0) data = (await chatAPI.reactDM(msgId, emoji)).data;
      else              data = (await chatAPI.reactMessage(msgId, emoji)).data;
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions: JSON.stringify(data.reactions) } : m));
    } catch {}
  }, []);

  const handleEdit = useCallback(async () => {
    if (!editMsg || !editContent.trim()) return;
    try {
      if (tabRef.current === 0) await chatAPI.editDM(editMsg.id, { content: editContent });
      else await chatAPI.editTaskMessage(editMsg.id, { content: editContent });
      setMessages(prev => prev.map(m => m.id === editMsg.id ? { ...m, content: editContent, isEdited: true } : m));
      setEditMsg(null); setEditContent('');
    } catch {}
  }, [editMsg, editContent]);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      if (tabRef.current === 0) await chatAPI.deleteDM(id);
      else await chatAPI.deleteTaskMessage(id);
      setMessages(prev => prev.map(m => m.id === id
        ? { ...m, isDeleted: true, content: 'This message was deleted', fileName: null } : m));
    } catch {}
  }, []);

  const openEdit = useCallback((msg) => { setEditMsg(msg); setEditContent(msg.content || ''); }, []);

  const handleKey = useCallback(e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  const chatTitle = tab === 0 ? selectedUser?.username : selectedTask?.title;
  const hasConversation = (tab === 0 && selectedUser) || (tab === 1 && selectedTask);

  return (
    <Box sx={{ height: 'calc(100vh - 80px)', display: 'flex', borderRadius: 3,
      border: `1px solid ${borderColor}`, overflow: 'hidden', bgcolor: bg }}>

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <Box sx={{ width: 268, flexShrink: 0, bgcolor: sidebar,
        borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, borderBottom: `1px solid ${borderColor}` }}>
          <Typography sx={{ fontWeight: 800, fontSize: 15, color: textPrimary, mb: 1.5 }}>Messages</Typography>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setSelectedUser(null); setSelectedTask(null); setMessages([]); }}
            sx={{ minHeight: 32, '& .MuiTab-root': { minHeight: 32, textTransform: 'none', fontWeight: 600, fontSize: 12 },
              '& .MuiTabs-indicator': { bgcolor: '#6366f1' } }}>
            <Tab label="Direct" />
            <Tab label="Tasks" />
          </Tabs>
        </Box>
        <Box sx={{ px: 1.5, pt: 1.5 }}>
          <TextField placeholder="Search..." size="small" fullWidth value={search}
            onChange={e => setSearch(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ fontSize: 16, color: 'text.disabled', mr: 0.5 }} /> }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 13, height: 34,
              bgcolor: darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc' } }} />
        </Box>

        <List sx={{ flex: 1, overflowY: 'auto', px: 0.5, py: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(99,102,241,0.2)', borderRadius: 2 } }}>
          {tab === 0 ? (
            filteredUsers.map(u => {
              const dm  = dmList.find(d => d.user?.id === u.id);
              const unread = dm?.unreadCount || 0;
              const active = selectedUser?.id === u.id;
              const color  = ROLE_COLORS[u.role] || '#6366f1';
              return (
                <ListItem key={u.id} disablePadding sx={{ mb: 0.3 }}>
                  <ListItemButton onClick={() => { setSelectedUser(u); setSelectedTask(null); }}
                    sx={{ borderRadius: 2, py: 0.8, px: 1,
                      bgcolor: active ? '#eef2ff' : 'transparent',
                      '&:hover': { bgcolor: active ? '#eef2ff' : (darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc') } }}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Badge badgeContent={unread} color="error"
                        sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 16, height: 16 } }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: color, fontSize: 12, fontWeight: 700 }}>
                          {u.username[0].toUpperCase()}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: unread > 0 ? 700 : 500, fontSize: 13, color: active ? '#6366f1' : textPrimary }}>{u.username}</Typography>}
                      secondary={<Typography variant="caption" sx={{ fontSize: 11, color: textMuted, textTransform: 'capitalize' }}>{u.role}</Typography>}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })
          ) : (
            filteredTasks.slice(0, 30).map(t => {
              const active = selectedTask?.id === t.id;
              return (
                <ListItem key={t.id} disablePadding sx={{ mb: 0.3 }}>
                  <ListItemButton onClick={() => { setSelectedTask(t); setSelectedUser(null); }}
                    sx={{ borderRadius: 2, py: 0.8, px: 1,
                      bgcolor: active ? '#eef2ff' : 'transparent',
                      '&:hover': { bgcolor: active ? '#eef2ff' : (darkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc') } }}>
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Assignment sx={{ fontSize: 18, color: active ? '#6366f1' : '#94a3b8' }} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography sx={{ fontWeight: active ? 700 : 500, fontSize: 12, color: active ? '#6366f1' : textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</Typography>}
                      secondary={<Typography variant="caption" sx={{ fontSize: 10, color: textMuted, textTransform: 'capitalize' }}>{t.status?.replace(/_/g,' ')}</Typography>}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </Box>

      {/* ── Main chat area ─────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {!hasConversation ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
            <Chat sx={{ fontSize: 56, color: 'divider' }} />
            <Typography sx={{ fontWeight: 700, color: 'text.disabled', fontSize: 16 }}>
              {tab === 0 ? 'Select someone to message' : 'Select a task to chat'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {tab === 0 ? 'Your messages are private between you and the recipient' : 'Task chat is visible to all members on that task'}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Chat header */}
            <Box sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${borderColor}`,
              display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0,
              bgcolor: sidebar }}>
              {tab === 0 && selectedUser && (
                <Avatar sx={{ width: 32, height: 32, bgcolor: ROLE_COLORS[selectedUser.role], fontSize: 12, fontWeight: 700 }}>
                  {selectedUser.username[0].toUpperCase()}
                </Avatar>
              )}
              {tab === 1 && <Assignment sx={{ fontSize: 20, color: '#6366f1' }} />}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14, color: textPrimary }}>{chatTitle}</Typography>
                <Typography variant="caption" sx={{ color: textMuted, fontSize: 11 }}>
                  {tab === 0 ? `@${selectedUser?.role}` : 'Task conversation'}
                </Typography>
              </Box>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(99,102,241,0.2)', borderRadius: 3 } }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
                  <CircularProgress size={24} sx={{ color: '#6366f1' }} />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', pt: 6, color: 'text.disabled' }}>
                  <Chat sx={{ fontSize: 40, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2">No messages yet — say hello!</Typography>
                </Box>
              ) : (
                messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMe={msg.senderId === user?.id}
                    darkMode={darkMode}
                    currentUserId={user?.id}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onReact={handleReact}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </Box>

            {/* Composer */}
            <Box sx={{ px: 2, py: 1.5, borderTop: `1px solid ${borderColor}`, flexShrink: 0, bgcolor: sidebar }}>
              {/* Scheduled badge */}
              {scheduledAt && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1,
                  px: 1.5, py: 0.6, bgcolor: 'rgba(245,158,11,0.15)', borderRadius: 2, border: '1px solid rgba(245,158,11,0.3)' }}>
                  <Schedule sx={{ fontSize: 14, color: '#d97706' }} />
                  <Typography variant="caption" sx={{ flex: 1, color: 'warning.main', fontWeight: 600 }}>
                    Scheduled: {format(new Date(scheduledAt), 'MMM d, h:mm a')}
                  </Typography>
                  <IconButton size="small" onClick={() => setScheduledAt('')}
                    sx={{ p: 0.3, '&:hover': { color: '#ef4444' } }}>
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              )}

              {/* File preview */}
              {file && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1,
                  px: 1.5, py: 0.6, bgcolor: 'rgba(99,102,241,0.12)', borderRadius: 2, border: '1px solid rgba(99,102,241,0.3)' }}>
                  <InsertDriveFile sx={{ fontSize: 16, color: '#6366f1' }} />
                  <Typography variant="caption" sx={{ flex: 1, fontWeight: 600, color: '#6366f1' }}>
                    {file.name} <span style={{ color: 'text.disabled', fontWeight: 400 }}>({fmtBytes(file.size)})</span>
                  </Typography>
                  <IconButton size="small" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                    sx={{ p: 0.3, '&:hover': { color: '#ef4444' } }}>
                    <Close sx={{ fontSize: 12 }} />
                  </IconButton>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                {/* Uncontrolled input to prevent re-render */}
                <Box sx={{ flex: 1, position: 'relative' }}>
                  <textarea
                    ref={inputElRef}
                    rows={1}
                    placeholder={`Message ${chatTitle}... (Enter to send, Shift+Enter for new line)`}
                    defaultValue=""
                    onChange={e => { inputRef.current = e.target.value; }}
                    onKeyDown={handleKey}
                    style={{
                      width: '100%', resize: 'none', border: `1px solid ${borderColor}`,
                      borderRadius: 12, padding: '10px 44px 10px 14px', fontSize: 14,
                      fontFamily: '"Plus Jakarta Sans", sans-serif', lineHeight: 1.5,
                      outline: 'none', boxSizing: 'border-box', maxHeight: 120,
                      overflow: 'auto', transition: 'border-color 0.15s',
                      background: darkMode ? 'rgba(255,255,255,0.04)' : 'white',
                      color: darkMode ? '#f1f5f9' : '#0f172a',
                    }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'}
                    onBlur={e => e.target.style.borderColor = borderColor}
                  />
                  <Tooltip title="Attach file">
                    <IconButton onClick={() => fileRef.current?.click()} size="small"
                      sx={{ position: 'absolute', right: 8, bottom: 8, color: 'text.disabled',
                        p: 0.4, borderRadius: 1.5, '&:hover': { bgcolor: 'rgba(99,102,241,0.12)', color: '#6366f1' } }}>
                      <AttachFile sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <input ref={fileRef} type="file" hidden
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.txt,.csv"
                  onChange={e => setFile(e.target.files[0] || null)} />

                {/* Schedule */}
                <Tooltip title="Schedule message">
                  <IconButton onClick={() => setScheduleOpen(true)}
                    sx={{ color: scheduledAt ? '#d97706' : '#94a3b8', borderRadius: 2, width: 38, height: 38,
                      flexShrink: 0, '&:hover': { bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706' } }}>
                    <Schedule sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>

                {/* Send */}
                <Button variant="contained" onClick={handleSend} disabled={sending}
                  sx={{ borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' },
                    minWidth: 42, width: 42, height: 42, p: 0, flexShrink: 0 }}>
                  {sending ? <CircularProgress size={16} sx={{ color: 'white' }} />
                    : <Send sx={{ fontSize: 16 }} />}
                </Button>
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>Schedule Message</DialogTitle>
        <DialogContent>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
            The message will be sent at the selected date and time.
          </Typography>
          <TextField fullWidth type="datetime-local" value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            InputLabelProps={{ shrink: true }} label="Send at"
            inputProps={{ min: new Date().toISOString().slice(0, 16) }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setScheduleOpen(false)} sx={{ color: 'text.secondary', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={() => setScheduleOpen(false)} disabled={!scheduledAt}
            sx={{ borderRadius: 2, bgcolor: '#6366f1', textTransform: 'none', fontWeight: 700 }}>
            Set Schedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editMsg} onClose={() => setEditMsg(null)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: 16 }}>Edit Message</DialogTitle>
        <DialogContent>
          <TextField fullWidth multiline rows={3} value={editContent} autoFocus
            onChange={e => setEditContent(e.target.value)}
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, fontSize: 14 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditMsg(null)} sx={{ color: 'text.secondary', textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={!editContent.trim()}
            sx={{ borderRadius: 2, bgcolor: '#6366f1', textTransform: 'none', fontWeight: 700 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}