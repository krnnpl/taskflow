import axios from 'axios';

const BASE = process.env.REACT_APP_API_URL || 'https://taskflow-backend-xa7t.onrender.com';
const api  = axios.create({ baseURL: BASE });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('taskflow_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('taskflow_token');
      localStorage.removeItem('taskflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const taskAPI = {
  getAll:           ()        => api.get('/api/tasks'),
  getById:          (id)      => api.get(`/api/tasks/${id}`),
  create:           (d)       => api.post('/api/tasks', d),
  update:           (id, d)   => api.put(`/api/tasks/${id}`, d),
  delete:           (id)      => api.delete(`/api/tasks/${id}`),
  getStats:         ()        => api.get('/api/tasks/stats'),
  getCalendar:      (y, m)    => api.get(`/api/tasks/calendar?year=${y}&month=${m}`),
  getWorkload:      ()        => api.get('/api/tasks/workload'),
  bulkUpdate:       (d)       => api.post('/api/tasks/bulk', d),
  getActivity:      (id)      => api.get(`/api/tasks/${id}/activity`),
  startTimer:       (id)      => api.post(`/api/tasks/${id}/timer/start`),
  stopTimer:        (id)      => api.post(`/api/tasks/${id}/timer/stop`),
  assignToWriter:   (id, d)   => api.put(`/api/tasks/${id}/assign-writer`, d),
  getComments:      (id)      => api.get(`/api/tasks/${id}/comments`),
  addComment:       (id, d)   => api.post(`/api/tasks/${id}/comments`, d),
  deleteComment:    (cid)     => api.delete(`/api/tasks/comments/${cid}`),
  getAttachments:   (id)      => api.get(`/api/tasks/${id}/attachments`),
  uploadAttachment: (d)       => api.post('/api/tasks/attachments/upload', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  downloadAttachment:(aid)    => `${BASE}/api/tasks/attachments/${aid}/download`,
  deleteAttachment: (aid)     => api.delete(`/api/tasks/attachments/${aid}`),
};

export const userAPI = {
  getAll:             ()         => api.get('/api/users'),
  getById:            (id)       => api.get(`/api/users/${id}`),
  getWriters:         ()         => api.get('/api/users/writers'),
  getAssigners:       ()         => api.get('/api/users/assigners'),
  updateRole:         (id, role) => api.put(`/api/users/${id}/role`, { role }),
  delete:             (id)       => api.delete(`/api/users/${id}`),
  getMyPerformance:   ()         => api.get('/api/users/my-performance'),
  getAvailability:    ()         => api.get('/api/users/availability'),
  updateAvailability: (d)        => api.put('/api/users/availability', d),
};

export const feedbackAPI = {
  create:        (d)        => api.post('/api/feedback', d),
  update:        (id, d)    => api.put(`/api/feedback/${id}`, d),
  delete:        (id)       => api.delete(`/api/feedback/${id}`),
  getForTask:    (tid)      => api.get(`/api/feedback/task/${tid}`),
  getMyFeedback: ()         => api.get('/api/feedback/my-feedback'),
};

export const notificationAPI = {
  getAll:         ()   => api.get('/api/notifications'),
  getUnreadCount: ()   => api.get('/api/notifications/unread-count'),
  markRead:       (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead:    ()   => api.put('/api/notifications/mark-all-read'),
};

export const authAPI = {
  setupStatus:       ()   => api.get('/api/auth/setup-status'),
  setup:             (d)  => api.post('/api/auth/setup', d),
  register:          (d)  => api.post('/api/auth/register', d),
  invite:            (d)  => api.post('/api/auth/invite', d),
  getPendingInvites: ()   => api.get('/api/auth/pending-invites'),
  resendInvite:      (id) => api.post(`/api/auth/invite/${id}/resend`),
  cancelInvite:      (id) => api.delete(`/api/auth/invite/${id}`),
  forgotPassword:    (d)  => api.post('/api/auth/forgot-password', d),
  resetPassword:     (d)  => api.post('/api/auth/reset-password', d),
};

export const chatAPI = {
  getUsers:          ()          => api.get('/api/chat/users'),
  getUnreadCount:    ()          => api.get('/api/chat/unread-count'),
  getDMList:         ()          => api.get('/api/chat/dm'),
  getDMConversation: (uid)       => api.get(`/api/chat/dm/${uid}`),
  sendDM:            (uid, d)    => api.post(`/api/chat/dm/${uid}`, d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  editDM:            (id, d)     => api.put(`/api/chat/dm/msg/${id}`, d),
  deleteDM:          (id)        => api.delete(`/api/chat/dm/msg/${id}`),
  reactDM:           (id, emoji) => api.post(`/api/chat/dm/msg/${id}/react`, { emoji }),
  getTaskChat:       (tid)       => api.get(`/api/chat/task/${tid}`),
  sendTaskMessage:   (tid, d)    => api.post(`/api/chat/task/${tid}`, d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  editTaskMessage:   (id, d)     => api.put(`/api/chat/task/msg/${id}`, d),
  deleteTaskMessage: (id)        => api.delete(`/api/chat/task/msg/${id}`),
  reactMessage:      (id, emoji) => api.post(`/api/chat/task/msg/${id}/react`, { emoji }),
  fileUrl:           (id)        => `${BASE}/api/chat/file/${id}`,
};

export const creditAPI = {
  getAll:   ()          => api.get('/api/credits'),
  create:   (d)         => api.post('/api/credits', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:   (id, d)     => api.put(`/api/credits/${id}`, d),
  delete:   (id)        => api.delete(`/api/credits/${id}`),
  react:    (id, emoji) => api.post(`/api/credits/${id}/react`, { emoji }),
  fileUrl:  (id)        => `${BASE}/api/credits/file/${id}`,
};

export const searchAPI = {
  search: (q) => api.get(`/api/search?q=${encodeURIComponent(q)}`),
};

export const analyticsAPI = {
  getOverview:    ()   => api.get('/api/analytics/overview'),
  getByMonth:     ()   => api.get('/api/analytics/by-month'),
  getWriters:     ()   => api.get('/api/analytics/writers'),
  getStatus:      ()   => api.get('/api/analytics/status'),
  getPriority:    ()   => api.get('/api/analytics/priority'),
  getWriterReport:(id) => api.get(`/api/analytics/writer/${id}`),
};
