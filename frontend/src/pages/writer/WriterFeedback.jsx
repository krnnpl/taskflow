import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Card, Table, TableBody, TableCell, TableHead,
  TableRow, Chip, Avatar, Rating, LinearProgress, Alert
} from '@mui/material';
import { Star, Warning, Refresh, CheckCircle } from '@mui/icons-material';
import { feedbackAPI } from '../../utils/api';

export default function WriterFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    feedbackAPI.getMyFeedback().then(r => setFeedbacks(r.data)).catch(() => {});
  }, []);

  const complaints   = feedbacks.filter(f => f.isComplaint).length;
  const corrections  = feedbacks.filter(f => f.correctionRequested).length;
  const ratings      = feedbacks.filter(f => f.rating).map(f => f.rating);
  const avgRating    = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '—';

  const pendingCorrections = feedbacks.filter(f => f.correctionRequested);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>My Feedback</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Feedback and ratings received from your PM and Assigner
        </Typography>
      </Box>

      {/* Summary cards */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Feedback', value: feedbacks.length, color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
          { label: 'Avg Rating',     value: avgRating,        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
          { label: 'Complaints',     value: complaints,       color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
          { label: 'Corrections',    value: corrections,      color: '#d97706', bg: 'rgba(245,158,11,0.15)' },
        ].map(s => (
          <Box key={s.label} sx={{ px: 2.5, py: 1.5, borderRadius: 2.5, bgcolor: s.bg, minWidth: 110 }}>
            <Typography sx={{ fontSize: 26, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
            <Typography variant="caption" sx={{ color: s.color, fontWeight: 600, opacity: 0.8 }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Pending corrections alert */}
      {pendingCorrections.length > 0 && (
        <Alert
          severity="warning"
          icon={<Refresh />}
          sx={{ mb: 3, borderRadius: 2, border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>
            🔄 {pendingCorrections.length} Correction{pendingCorrections.length > 1 ? 's' : ''} Requested
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Your PM or Assigner has requested corrections on the following tasks. Please redo the work and resubmit.
          </Typography>
          <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
            {pendingCorrections.map(f => (
              <Box key={f.id} sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.6)', borderRadius: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: 13, color: 'warning.main' }}>
                  📋 {f.Task?.title || 'Task'}
                </Typography>
                {f.feedbackText && (
                  <Typography variant="body2" sx={{ color: '#78350f', mt: 0.3, fontSize: 12 }}>
                    "{f.feedbackText}"
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: '#a16207', fontSize: 11 }}>
                  From: {f.giver?.username} · {new Date(f.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: 'warning.main', display: 'block', mt: 1 }}>
            💡 Go to My Tasks → find the task → click Reopen to redo it
          </Typography>
        </Alert>
      )}

      {/* Feedback table */}
      {feedbacks.length === 0 ? (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', p: 6, textAlign: 'center' }}>
          <Star sx={{ fontSize: 48, color: 'divider', mb: 1.5 }} />
          <Typography sx={{ fontWeight: 700, color: 'text.secondary' }}>No feedback yet</Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Complete tasks to start receiving feedback</Typography>
        </Card>
      ) : (
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Table>
            <TableHead>
              <TableRow>
                {['Task','From','Rating','Feedback','Flags','Date'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {feedbacks.map(fb => (
                <TableRow key={fb.id} hover sx={{
                  bgcolor: fb.correctionRequested ? 'rgba(251,191,36,0.06)' : fb.isComplaint ? 'rgba(239,68,68,0.04)' : 'inherit'
                }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fb.Task?.title || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 26, height: 26, bgcolor: '#6366f1', fontSize: 11, fontWeight: 700 }}>
                        {fb.giver?.username?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary', display: 'block' }}>{fb.giver?.username}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10, textTransform: 'capitalize' }}>{fb.giver?.role}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {fb.rating ? <Rating value={fb.rating} readOnly size="small" /> : <Typography variant="caption" sx={{ color: 'text.secondary' }}>—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: 'text.primary', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: fb.feedbackText ? 'normal' : 'italic' }}>
                      {fb.feedbackText || <span style={{ color: 'text.disabled' }}>No comment</span>}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {fb.correctionRequested && (
                        <Chip label="🔄 Correction" size="small"
                          sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: '#d97706', fontWeight: 700, fontSize: 10, height: 20 }} />
                      )}
                      {fb.isComplaint && (
                        <Chip label="⚠️ Complaint" size="small"
                          sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: 700, fontSize: 10, height: 20 }} />
                      )}
                      {!fb.isComplaint && !fb.correctionRequested && (
                        <Chip label="✅ Good" size="small"
                          sx={{ bgcolor: 'rgba(16,185,129,0.15)', color: '#059669', fontWeight: 700, fontSize: 10, height: 20 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </Box>
  );
}
