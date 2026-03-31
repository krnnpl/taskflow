import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { DarkModeProvider, useDarkMode } from './context/DarkModeContext';
import Layout from './components/shared/Layout';
import ToastContainer from './components/shared/ToastContainer';

import LoginPage          from './pages/LoginPage';
import SetupPage          from './pages/SetupPage';
import RegisterPage       from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import CalendarPage       from './pages/shared/CalendarPage';
import WorkloadPage       from './pages/shared/WorkloadPage';
import InvitePage         from './pages/shared/InvitePage';
import ChatPage           from './pages/shared/ChatPage';
import AnalyticsPage      from './pages/shared/AnalyticsPage';
import CreditsPage        from './pages/shared/CreditsPage';
import AvailabilityPage   from './pages/shared/AvailabilityPage';
import SADashboard        from './pages/superadmin/SADashboard';
import SAUsers            from './pages/superadmin/SAUsers';
import SATasks            from './pages/superadmin/SATasks';
import SAAnalytics        from './pages/superadmin/SAAnalytics';
import AdminDashboard     from './components/Admin/AdminDashboard';
import AdminUsers         from './pages/admin/AdminUsers';
import AdminTasks         from './pages/admin/AdminTasks';
import AdminPerformance   from './pages/admin/AdminPerformance';
import PMDashboard        from './components/PM/PMDashboard';
import PMTasks            from './pages/pm/PMTasks';
import PMCreateTask       from './pages/pm/PMCreateTask';
import PMPerformance      from './pages/pm/PMPerformance';
import PMFeedback         from './pages/pm/PMFeedback';
import PMReassign         from './pages/pm/PMReassign';
import AssignerDashboard  from './components/Assigner/AssignerDashboard';
import AssignerTasks      from './pages/assigner/AssignerTasks';
import AssignerAssign     from './pages/assigner/AssignerAssign';
import AssignerFeedback   from './pages/assigner/AssignerFeedback';
import WriterDashboard    from './components/Writer/WriterDashboard';
import WriterTasks        from './pages/writer/WriterTasks';
import WriterFeedback     from './pages/writer/WriterFeedback';
import WriterPerformance  from './pages/writer/WriterPerformance';

function ThemedApp({ children }) {
  const { darkMode } = useDarkMode();

  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary:   { main: '#6366f1', light: '#818cf8', dark: '#4338ca' },
      secondary: { main: '#8b5cf6' },
      success:   { main: '#10b981' },
      warning:   { main: '#f59e0b' },
      error:     { main: '#ef4444' },
      info:      { main: '#0ea5e9' },
      background: {
        default: darkMode ? '#0f1117' : '#f0f4ff',
        paper:   darkMode ? '#1a1f2e' : '#ffffff',
      },
      text: {
        primary:   darkMode ? '#f1f5f9' : '#0f172a',
        secondary: darkMode ? '#94a3b8' : '#64748b',
        disabled:  darkMode ? '#4b5563' : '#9ca3af',
      },
      divider: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
      action: {
        hover:    darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
        selected: darkMode ? 'rgba(99,102,241,0.16)' : 'rgba(99,102,241,0.08)',
      },
    },
    typography: {
      fontFamily: '"Inter", "Plus Jakarta Sans", system-ui, sans-serif',
      h4: { fontWeight: 800 },
      h5: { fontWeight: 800 },
      h6: { fontWeight: 700 },
    },
    shape: { borderRadius: 12 },
    shadows: darkMode
      ? ['none','0 1px 3px rgba(0,0,0,0.4)','0 4px 12px rgba(0,0,0,0.4)','0 8px 24px rgba(0,0,0,0.4)',
         '0 16px 48px rgba(0,0,0,0.5)',...Array(20).fill('0 16px 48px rgba(0,0,0,0.5)')]
      : ['none','0 1px 3px rgba(99,102,241,0.08)','0 4px 12px rgba(99,102,241,0.1)','0 8px 24px rgba(99,102,241,0.12)',
         '0 16px 48px rgba(99,102,241,0.15)',...Array(20).fill('0 16px 48px rgba(99,102,241,0.15)')],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundImage: darkMode
              ? 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.06) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at 20% 0%, rgba(99,102,241,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(139,92,246,0.04) 0%, transparent 60%)',
            minHeight: '100vh',
          },
          '::-webkit-scrollbar':       { width: 6, height: 6 },
          '::-webkit-scrollbar-track': { background: 'transparent' },
          '::-webkit-scrollbar-thumb': { background: darkMode ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)', borderRadius: 3 },
          '::-webkit-scrollbar-thumb:hover': { background: darkMode ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.4)' },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 600, borderRadius: 10,
            transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          },
          contained: {
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            '&:hover': { boxShadow: '0 4px 16px rgba(99,102,241,0.4)', transform: 'translateY(-1px)' },
          },
          outlined: {
            borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.2)',
            '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.06)' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            border: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.08)',
            boxShadow: darkMode
              ? '0 4px 24px rgba(0,0,0,0.3)'
              : '0 2px 16px rgba(99,102,241,0.06)',
            transition: 'all 0.2s',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            border: darkMode ? '1px solid rgba(255,255,255,0.06)' : 'none',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 8, fontWeight: 600 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)',
            color: darkMode ? '#e2e8f0' : '#1e293b',
          },
          head: {
            fontWeight: 700,
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: darkMode ? '#a5b4fc' : '#6366f1',
            backgroundColor: darkMode ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)',
            borderBottom: `2px solid ${darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.15)'}`,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:hover': { bgcolor: darkMode ? 'rgba(99,102,241,0.06)' : 'rgba(99,102,241,0.02)' },
            transition: 'background-color 0.15s',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '& fieldset': { borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.15)' },
            '&:hover fieldset': { borderColor: '#6366f1 !important' },
            '&.Mui-focused fieldset': { borderColor: '#6366f1 !important' },
          },
          input: { color: darkMode ? '#f1f5f9' : '#0f172a' },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: { color: darkMode ? '#94a3b8' : '#64748b' },
        },
      },
      MuiSelect: {
        styleOverrides: {
          icon: { color: darkMode ? '#94a3b8' : '#64748b' },
          select: { color: darkMode ? '#f1f5f9' : '#0f172a' },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: darkMode ? '#f1f5f9' : '#0f172a',
            '&:hover': { bgcolor: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)' },
            '&.Mui-selected': { bgcolor: darkMode ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.08)' },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none', fontWeight: 600,
            color: darkMode ? '#94a3b8' : '#64748b',
            '&.Mui-selected': { color: '#6366f1' },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: { backgroundColor: '#6366f1', height: 3, borderRadius: '3px 3px 0 0' },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 8, bgcolor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)' },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12 } },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            boxShadow: darkMode ? '0 24px 64px rgba(0,0,0,0.6)' : '0 24px 64px rgba(99,102,241,0.15)',
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { borderRadius: 8, fontSize: 12, fontWeight: 500 },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: { '&.Mui-checked': { color: '#6366f1' } },
          track: { '.Mui-checked.Mui-checked + &': { backgroundColor: '#6366f1' } },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: { fontWeight: 700 },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '&:hover': { bgcolor: darkMode ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)' },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { borderRadius: 10, transition: 'all 0.15s' },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: { borderRadius: 16 },
        },
      },
      MuiRating: {
        styleOverrides: {
          iconFilled: { color: '#f59e0b' },
          iconEmpty:  { color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)' },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: { color: 'inherit' },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: { color: darkMode ? '#94a3b8' : '#64748b' },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: { color: darkMode ? '#f1f5f9' : '#0f172a' },
          input: {
            color: darkMode ? '#f1f5f9' : '#0f172a',
            '&::placeholder': { color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', opacity: 1 },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: { color: darkMode ? '#94a3b8' : '#64748b' },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: { color: darkMode ? '#f1f5f9' : '#0f172a' },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: darkMode ? '#1a2233' : '#ffffff',
          },
        },
      },
    },
  });

  return <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>;
}

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} replace />;
  return <Layout>{children}</Layout>;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/setup"           element={<SetupPage />} />
        <Route path="/login"           element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <LoginPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* SuperAdmin */}
        <Route path="/superadmin/dashboard"   element={<ProtectedRoute roles={['superadmin']}><SADashboard /></ProtectedRoute>} />
        <Route path="/superadmin/users"       element={<ProtectedRoute roles={['superadmin']}><SAUsers /></ProtectedRoute>} />
        <Route path="/superadmin/tasks"       element={<ProtectedRoute roles={['superadmin']}><SATasks /></ProtectedRoute>} />
        <Route path="/superadmin/analytics"   element={<ProtectedRoute roles={['superadmin']}><SAAnalytics /></ProtectedRoute>} />
        <Route path="/superadmin/calendar"    element={<ProtectedRoute roles={['superadmin']}><CalendarPage /></ProtectedRoute>} />
        <Route path="/superadmin/chat"        element={<ProtectedRoute roles={['superadmin']}><ChatPage /></ProtectedRoute>} />
        <Route path="/superadmin/credits"     element={<ProtectedRoute roles={['superadmin']}><CreditsPage /></ProtectedRoute>} />
        <Route path="/superadmin/invite"      element={<ProtectedRoute roles={['superadmin']}><InvitePage /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard"    element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users"        element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/tasks"        element={<ProtectedRoute roles={['admin']}><AdminTasks /></ProtectedRoute>} />
        <Route path="/admin/analytics"    element={<ProtectedRoute roles={['admin']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/admin/performance"  element={<ProtectedRoute roles={['admin']}><AdminPerformance /></ProtectedRoute>} />
        <Route path="/admin/workload"     element={<ProtectedRoute roles={['admin']}><WorkloadPage /></ProtectedRoute>} />
        <Route path="/admin/availability" element={<ProtectedRoute roles={['admin']}><AvailabilityPage /></ProtectedRoute>} />
        <Route path="/admin/calendar"     element={<ProtectedRoute roles={['admin']}><CalendarPage /></ProtectedRoute>} />
        <Route path="/admin/chat"         element={<ProtectedRoute roles={['admin']}><ChatPage /></ProtectedRoute>} />
        <Route path="/admin/credits"      element={<ProtectedRoute roles={['admin']}><CreditsPage /></ProtectedRoute>} />
        <Route path="/admin/invite"       element={<ProtectedRoute roles={['admin']}><InvitePage /></ProtectedRoute>} />

        {/* PM */}
        <Route path="/pm/dashboard"    element={<ProtectedRoute roles={['pm']}><PMDashboard /></ProtectedRoute>} />
        <Route path="/pm/tasks"        element={<ProtectedRoute roles={['pm']}><PMTasks /></ProtectedRoute>} />
        <Route path="/pm/create-task"  element={<ProtectedRoute roles={['pm']}><PMCreateTask /></ProtectedRoute>} />
        <Route path="/pm/analytics"    element={<ProtectedRoute roles={['pm']}><AnalyticsPage /></ProtectedRoute>} />
        <Route path="/pm/performance"  element={<ProtectedRoute roles={['pm']}><PMPerformance /></ProtectedRoute>} />
        <Route path="/pm/feedback"     element={<ProtectedRoute roles={['pm']}><PMFeedback /></ProtectedRoute>} />
        <Route path="/pm/workload"     element={<ProtectedRoute roles={['pm']}><WorkloadPage /></ProtectedRoute>} />
        <Route path="/pm/availability" element={<ProtectedRoute roles={['pm']}><AvailabilityPage /></ProtectedRoute>} />
        <Route path="/pm/calendar"     element={<ProtectedRoute roles={['pm']}><CalendarPage /></ProtectedRoute>} />
        <Route path="/pm/chat"         element={<ProtectedRoute roles={['pm']}><ChatPage /></ProtectedRoute>} />
        <Route path="/pm/credits"      element={<ProtectedRoute roles={['pm']}><CreditsPage /></ProtectedRoute>} />
        <Route path="/pm/invite"       element={<ProtectedRoute roles={['pm']}><InvitePage /></ProtectedRoute>} />
        <Route path="/pm/reassign"     element={<ProtectedRoute roles={['pm']}><PMReassign /></ProtectedRoute>} />

        {/* Assigner */}
        <Route path="/assigner/dashboard"    element={<ProtectedRoute roles={['assigner']}><AssignerDashboard /></ProtectedRoute>} />
        <Route path="/assigner/tasks"        element={<ProtectedRoute roles={['assigner']}><AssignerTasks /></ProtectedRoute>} />
        <Route path="/assigner/assign"       element={<ProtectedRoute roles={['assigner']}><AssignerAssign /></ProtectedRoute>} />
        <Route path="/assigner/feedback"     element={<ProtectedRoute roles={['assigner']}><AssignerFeedback /></ProtectedRoute>} />
        <Route path="/assigner/workload"     element={<ProtectedRoute roles={['assigner']}><WorkloadPage /></ProtectedRoute>} />
        <Route path="/assigner/availability" element={<ProtectedRoute roles={['assigner']}><AvailabilityPage /></ProtectedRoute>} />
        <Route path="/assigner/calendar"     element={<ProtectedRoute roles={['assigner']}><CalendarPage /></ProtectedRoute>} />
        <Route path="/assigner/chat"         element={<ProtectedRoute roles={['assigner']}><ChatPage /></ProtectedRoute>} />
        <Route path="/assigner/credits"      element={<ProtectedRoute roles={['assigner']}><CreditsPage /></ProtectedRoute>} />
        <Route path="/assigner/invite"       element={<ProtectedRoute roles={['assigner']}><InvitePage /></ProtectedRoute>} />

        {/* Writer */}
        <Route path="/writer/dashboard"    element={<ProtectedRoute roles={['writer']}><WriterDashboard /></ProtectedRoute>} />
        <Route path="/writer/tasks"        element={<ProtectedRoute roles={['writer']}><WriterTasks /></ProtectedRoute>} />
        <Route path="/writer/feedback"     element={<ProtectedRoute roles={['writer']}><WriterFeedback /></ProtectedRoute>} />
        <Route path="/writer/performance"  element={<ProtectedRoute roles={['writer']}><WriterPerformance /></ProtectedRoute>} />
        <Route path="/writer/credits"      element={<ProtectedRoute roles={['writer']}><CreditsPage /></ProtectedRoute>} />
        <Route path="/writer/availability" element={<ProtectedRoute roles={['writer']}><AvailabilityPage /></ProtectedRoute>} />
        <Route path="/writer/calendar"     element={<ProtectedRoute roles={['writer']}><CalendarPage /></ProtectedRoute>} />
        <Route path="/writer/chat"         element={<ProtectedRoute roles={['writer']}><ChatPage /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <DarkModeProvider>
      <ThemedApp>
        <AuthProvider>
          <BrowserRouter>
            <NotificationProvider>
              <AppRoutes />
            </NotificationProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemedApp>
    </DarkModeProvider>
  );
}