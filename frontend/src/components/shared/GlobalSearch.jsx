import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, TextField, Typography, Avatar, Chip, CircularProgress,
  InputAdornment, Divider, Paper, ClickAwayListener
} from '@mui/material';
import { Search, Assignment, People, RateReview, Star, Warning } from '@mui/icons-material';
import { searchAPI } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';

const ROLE_COLORS = { superadmin:'#ef4444', admin:'#f97316', pm:'#8b5cf6', assigner:'#059669', writer:'#0ea5e9' };
const STATUS_COLORS = { completed:'#059669', in_progress:'#0ea5e9', overdue:'#ef4444', pending:'#94a3b8', assigned_to_assigner:'#f97316', assigned_to_writer:'#8b5cf6' };

export default function GlobalSearch() {
  const { user }     = useAuth();
  const { darkMode } = useDarkMode();
  const navigate     = useNavigate();
  const [q, setQ]           = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const doSearch = useCallback(async (query) => {
    if (query.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const r = await searchAPI.search(query);
      setResults(r.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (q.length >= 2) {
      timerRef.current = setTimeout(() => doSearch(q), 350);
    } else { setResults(null); }
    return () => clearTimeout(timerRef.current);
  }, [q, doSearch]);

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault(); inputRef.current?.focus(); setOpen(true);
      }
      if (e.key === 'Escape') { setOpen(false); setQ(''); setResults(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const goToTask = (task) => {
    setOpen(false); setQ(''); setResults(null);
    navigate(`/${user.role}/tasks`);
  };

  const goToUser = () => { setOpen(false); setQ(''); setResults(null); navigate(`/${user.role}/users`); };

  const hasResults = results && (results.tasks?.length || results.users?.length || results.feedback?.length);
  const paper = darkMode ? '#1e293b' : 'white';
  const border = darkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0';
  const textPrimary = darkMode ? '#f1f5f9' : '#0f172a';
  const textMuted   = darkMode ? 'rgba(255,255,255,0.5)' : '#64748b';

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative', width: { xs: 180, md: 280 } }}>
        <TextField
          inputRef={inputRef}
          size="small" fullWidth placeholder="Search... (Ctrl+K)"
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {loading ? <CircularProgress size={14} sx={{ color: '#6366f1' }} />
                  : <Search sx={{ fontSize: 16, color: 'text.disabled' }} />}
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2.5, fontSize: 13, height: 36,
              bgcolor: darkMode ? 'rgba(255,255,255,0.06)' : '#f8fafc',
              '& fieldset': { borderColor: border },
              '&:hover fieldset': { borderColor: '#6366f1' },
              '&.Mui-focused fieldset': { borderColor: '#6366f1' },
              '& input': { color: textPrimary },
              '& input::placeholder': { color: textMuted },
            },
          }}
        />

        {open && (q.length >= 2) && (
          <Paper elevation={0} sx={{
            position: 'absolute', top: '100%', left: 0, right: 0, mt: 0.5,
            bgcolor: paper, border: `1px solid ${border}`,
            borderRadius: 3, zIndex: 9999, maxHeight: 480, overflowY: 'auto',
            boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
          }}>
            {loading && !results && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <CircularProgress size={20} sx={{ color: '#6366f1' }} />
              </Box>
            )}

            {!loading && results && !hasResults && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Search sx={{ fontSize: 32, color: 'divider', mb: 1 }} />
                <Typography variant="body2" sx={{ color: textMuted }}>No results for "{q}"</Typography>
              </Box>
            )}

            {/* Tasks */}
            {results?.tasks?.length > 0 && (
              <Box>
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Assignment sx={{ fontSize: 13, color: '#6366f1' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 }}>
                    Tasks ({results.tasks.length})
                  </Typography>
                </Box>
                {results.tasks.map(t => (
                  <Box key={t.id} onClick={() => goToTask(t)}
                    sx={{ px: 2, py: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                      '&:hover': { bgcolor: darkMode ? 'rgba(99,102,241,0.1)' : '#f5f3ff' }, transition: 'all 0.1s' }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      bgcolor: STATUS_COLORS[t.status] || '#94a3b8' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: textPrimary,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: 10 }}>
                        {t.status?.replace(/_/g,' ')} · by {t.creator?.username}
                        {t.writer && ` → ${t.writer.username}`}
                      </Typography>
                    </Box>
                    <Chip label={t.priority} size="small"
                      sx={{ height: 16, fontSize: 9, fontWeight: 700, textTransform: 'capitalize',
                        bgcolor: t.priority === 'high' ? '#fee2e2' : t.priority === 'medium' ? 'rgba(245,158,11,0.15)' : '#f1f5f9',
                        color: t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#d97706' : '#64748b',
                        '& .MuiChip-label': { px: 0.8 } }} />
                  </Box>
                ))}
                {results.users?.length > 0 || results.feedback?.length > 0 ? <Divider sx={{ mx: 2, borderColor: border }} /> : null}
              </Box>
            )}

            {/* Users */}
            {results?.users?.length > 0 && (
              <Box>
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <People sx={{ fontSize: 13, color: '#059669' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 }}>
                    Users ({results.users.length})
                  </Typography>
                </Box>
                {results.users.map(u => (
                  <Box key={u.id} onClick={goToUser}
                    sx={{ px: 2, py: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                      '&:hover': { bgcolor: darkMode ? 'rgba(5,150,105,0.1)' : '#f0fdf4' }, transition: 'all 0.1s' }}>
                    <Avatar sx={{ width: 26, height: 26, bgcolor: ROLE_COLORS[u.role], fontSize: 11, fontWeight: 700 }}>
                      {u.username[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{u.username}</Typography>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: 10 }}>{u.email}</Typography>
                    </Box>
                    <Chip label={u.role} size="small" sx={{ height: 16, fontSize: 9, fontWeight: 700, textTransform: 'capitalize',
                      bgcolor: `${ROLE_COLORS[u.role]}18`, color: ROLE_COLORS[u.role], '& .MuiChip-label': { px: 0.8 } }} />
                    {u.Performance && (
                      <Typography sx={{ fontSize: 11, fontWeight: 800, color: '#6366f1' }}>
                        {u.Performance.performanceScore}
                      </Typography>
                    )}
                  </Box>
                ))}
                {results.feedback?.length > 0 ? <Divider sx={{ mx: 2, borderColor: border }} /> : null}
              </Box>
            )}

            {/* Feedback */}
            {results?.feedback?.length > 0 && (
              <Box>
                <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <RateReview sx={{ fontSize: 13, color: '#d97706' }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 10 }}>
                    Feedback ({results.feedback.length})
                  </Typography>
                </Box>
                {results.feedback.map(f => (
                  <Box key={f.id}
                    sx={{ px: 2, py: 1, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box sx={{ flexShrink: 0, mt: 0.3 }}>
                      {f.isComplaint ? <Warning sx={{ fontSize: 14, color: '#ef4444' }} />
                        : <Star sx={{ fontSize: 14, color: '#f59e0b' }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.feedbackText}
                      </Typography>
                      <Typography variant="caption" sx={{ color: textMuted, fontSize: 10 }}>
                        {f.giver?.username} → {f.receiver?.username} · {f.Task?.title}
                        {f.rating && ` · ${f.rating}/5`}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}

            <Box sx={{ px: 2, py: 1, borderTop: `1px solid ${border}` }}>
              <Typography variant="caption" sx={{ color: textMuted, fontSize: 10 }}>
                Press Esc to close · Ctrl+K to open
              </Typography>
            </Box>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}
