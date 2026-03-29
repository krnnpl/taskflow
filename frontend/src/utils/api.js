import axios from 'axios';

const BASE = 'https://taskflow-production-32a8.up.railway.app';
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

export const taskAPI = {
  getAll:           ()       => api.get('/api/tasks'),
  getById:          (id)     => api.get(`/api/tasks/${id}`),
  getStats:         ()       => api.get('/api/tasks/stats'),
  getCalendarTasks: ()       => api.get('/api/tasks/calendar'),
  getCalendar:      (y, m)   => api.get(`/api/tasks/calendar?year=${y}&month=${m}`),
  getWorkload:      ()       => api.get('/api/tasks/workload'),
  create:           (d)      => api.post('/api/tasks', d),
  update:           (id, d)  => api.put(`/api/tasks/${id}`, d),
  delete:           (id)     => api.delete(`/api/tasks/${id}`),
  bulkUpdate:       (d)      => api.post('/api/tasks/bulk', d),
  assignToWriter:   (id, d)  => api.put(`/api/tasks/${id}/assign-writer`, d),
  startTimer:       (id)     => api.post(`/api/tasks/${id}/timer/start`),
  stopTimer:        (id)     => api.post(`/api/tasks/${id}/timer/stop`),
  getActivity:      (id)     => api.get(`/api/tasks/${id}/activity`),
  getComments:      (id)     => api.get(`/api/tasks/${id}/comments`),
  addComment:       (id, d)  => api.post(`/api/tasks/${id}/comments`, d),
  deleteComment:    (cid)    => api.delete(`/api/tasks/comments/${cid}`),
  getAttachments:   (id)     => api.get(`/api/tasks/${id}/attachments`),
  uploadAttachment: (d)      => api.post('/api/tasks/attachments/upload', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  deleteAttachment: (aid)    => api.delete(`/api/tasks/attachments/${aid}`),
  downloadAttachment:(aid)   => `${BASE}/api/tasks/attachments/${aid}/download`,
};

export const userAPI = {
  getAll:            ()      => api.get('/api/users'),
  getMe:             ()      => api.get('/api/auth/me'),
  updateRole:        (id, r) => api.put(`/api/users/${id}/role`, { role: r }),
  delete:            (id)    => api.delete(`/api/users/${id}`),
  getMyPerformance:  ()      => api.get('/api/users/my-performance'),
  getAllPerformance:  ()      => api.get('/api/users/performance'),
  updateAvailability:(d)     => api.put('/api/users/availability', d),
  getAvailability:   ()      => api.get('/api/users/availability'),
  updatePreferences: (d)     => api.put('/api/users/preferences', d),
};

export const feedbackAPI = {
  create:        (d)     => api.post('/api/feedback', d),
  update:        (id, d) => api.put(`/api/feedback/${id}`, d),
  delete:        (id)    => api.delete(`/api/feedback/${id}`),
  getForTask:    (tid)   => api.get(`/api/feedback/task/${tid}`),
  getMyFeedback: ()      => api.get('/api/feedback/my-feedback'),
};

export const notificationAPI = {
  getAll:      ()    => api.get('/api/notifications'),
  markRead:    (id)  => api.put(`/api/notifications/${id}/read`),
  markAllRead: ()    => api.put('/api/notifications/read-all'),
  delete:      (id)  => api.delete(`/api/notifications/${id}`),
};

export const chatAPI = {
  getUsers:          ()        => api.get('/api/chat/users'),
  getUnreadCount:    ()        => api.get('/api/chat/unread-count'),
  getDMList:         ()        => api.get('/api/chat/dm'),
  getDMConversation: (uid)     => api.get(`/api/chat/dm/${uid}`),
  sendDM:            (uid, d)  => api.post(`/api/chat/dm/${uid}`, d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  editDM:            (id, d)   => api.put(`/api/chat/dm/${id}`, d),
  deleteDM:          (id)      => api.delete(`/api/chat/dm/${id}`),
  reactDM:           (id, d)   => api.post(`/api/chat/dm/${id}/react`, d),
  getTaskChat:       (tid)     => api.get(`/api/chat/task/${tid}`),
  sendTaskMessage:   (tid, d)  => api.post(`/api/chat/task/${tid}`, d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  editTaskMessage:   (id, d)   => api.put(`/api/chat/task/message/${id}`, d),
  deleteTaskMessage: (id)      => api.delete(`/api/chat/task/message/${id}`),
  reactMessage:      (id, d)   => api.post(`/api/chat/task/message/${id}/react`, d),
  fileUrl:           (id)      => `${BASE}/api/chat/file/${id}`,
};

export const creditAPI = {
  getAll:  ()      => api.get('/api/credits'),
  create:  (d)     => api.post('/api/credits', d, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:  (id, d) => api.put(`/api/credits/${id}`, d),
  delete:  (id)    => api.delete(`/api/credits/${id}`),
  react:   (id, d) => api.post(`/api/credits/${id}/react`, d),
  fileUrl: (id)    => `${BASE}/api/credits/file/${id}`,
};

export const analyticsAPI = {
  getSummary:      ()    => api.get('/api/analytics/overview'),
  getOverview:     ()    => api.get('/api/analytics/overview'),
  getByMonth:      ()    => api.get('/api/analytics/by-month'),
  getWriterStats:  ()    => api.get('/api/analytics/writers'),
  getWriters:      ()    => api.get('/api/analytics/writers'),
  getStatus:       ()    => api.get('/api/analytics/status'),
  getPriority:     ()    => api.get('/api/analytics/priority'),
  getWriterReport: (id)  => api.get(`/api/analytics/writer/${id}`),
};

export const searchAPI = {
  search: (q) => api.get(`/api/search?q=${encodeURIComponent(q)}`),
};

export const authAPI = {
  setupStatus:       ()    => api.get('/api/auth/setup-status'),
  setup:             (d)   => api.post('/api/auth/setup', d),
  register:          (d)   => api.post('/api/auth/register', d),
  invite:            (d)   => api.post('/api/auth/invite', d),
  getPendingInvites: ()    => api.get('/api/auth/pending-invites'),
  resendInvite:      (id)  => api.post(`/api/auth/invite/${id}/resend`),
  cancelInvite:      (id)  => api.delete(`/api/auth/invite/${id}`),
  forgotPassword:    (d)   => api.post('/api/auth/forgot-password', d),
  resetPassword:     (d)   => api.post('/api/auth/reset-password', d),
};

export default api;