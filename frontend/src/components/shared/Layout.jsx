import React, { useState, useEffect } from 'react';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Avatar, IconButton,
  Divider, Menu, MenuItem, Badge, Tooltip, Chip, alpha
} from '@mui/material';
import {
  Dashboard, Assignment, People, Feedback, Analytics, Menu as MenuIcon,
  ExitToApp, Add, SupervisorAccount, RateReview, BarChart, CalendarMonth,
  GroupAdd, ViewWeek, Chat, DarkMode, LightMode, EmojiEvents, BeachAccess,
  NotificationsNone, KeyboardArrowDown
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useDarkMode } from '../../context/DarkModeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import GlobalSearch from './GlobalSearch';
import { chatAPI } from '../../utils/api';

const DRAWER_WIDTH = 260;

const ROLE_COLORS = {
  superadmin: '#ef4444', admin: '#f97316', pm: '#8b5cf6',
  assigner: '#10b981', writer: '#0ea5e9',
};
const ROLE_LABELS = {
  superadmin: 'Super Admin', admin: 'Admin', pm: 'Project Manager',
  assigner: 'Assigner', writer: 'Writer',
};

const roleMenus = {
  superadmin: [
    { label: 'Dashboard',   icon: <Dashboard sx={{ fontSize: 18 }} />,     path: '/superadmin/dashboard' },
    { label: 'All Users',   icon: <People sx={{ fontSize: 18 }} />,        path: '/superadmin/users' },
    { label: 'All Tasks',   icon: <Assignment sx={{ fontSize: 18 }} />,    path: '/superadmin/tasks' },
    { label: 'Analytics',   icon: <BarChart sx={{ fontSize: 18 }} />,      path: '/superadmin/analytics' },
    { label: 'Calendar',    icon: <CalendarMonth sx={{ fontSize: 18 }} />, path: '/superadmin/calendar' },
    { label: 'Messages',    icon: <Chat sx={{ fontSize: 18 }} />,          path: '/superadmin/chat', badge: true },
    { label: 'Portfolio',   icon: <EmojiEvents sx={{ fontSize: 18 }} />,   path: '/superadmin/credits' },
    { label: 'Invite',      icon: <GroupAdd sx={{ fontSize: 18 }} />,      path: '/superadmin/invite' },
  ],
  admin: [
    { label: 'Dashboard',   icon: <Dashboard sx={{ fontSize: 18 }} />,     path: '/admin/dashboard' },
    { label: 'Users',       icon: <People sx={{ fontSize: 18 }} />,        path: '/admin/users' },
    { label: 'All Tasks',   icon: <Assignment sx={{ fontSize: 18 }} />,    path: '/admin/tasks' },
    { label: 'Analytics',   icon: <BarChart sx={{ fontSize: 18 }} />,      path: '/admin/analytics' },
    { label: 'Performance', icon: <Analytics sx={{ fontSize: 18 }} />,     path: '/admin/performance' },
    { label: 'Workload',    icon: <ViewWeek sx={{ fontSize: 18 }} />,      path: '/admin/workload' },
    { label: 'Availability',icon: <BeachAccess sx={{ fontSize: 18 }} />,   path: '/admin/availability' },
    { label: 'Calendar',    icon: <CalendarMonth sx={{ fontSize: 18 }} />, path: '/admin/calendar' },
    { label: 'Messages',    icon: <Chat sx={{ fontSize: 18 }} />,          path: '/admin/chat', badge: true },
    { label: 'Portfolio',   icon: <EmojiEvents sx={{ fontSize: 18 }} />,   path: '/admin/credits' },
    { label: 'Invite',      icon: <GroupAdd sx={{ fontSize: 18 }} />,      path: '/admin/invite' },
  ],
  pm: [
    { label: 'Dashboard',   icon: <Dashboard sx={{ fontSize: 18 }} />,     path: '/pm/dashboard' },
    { label: 'Tasks',       icon: <Assignment sx={{ fontSize: 18 }} />,    path: '/pm/tasks' },
    { label: 'Create Task', icon: <Add sx={{ fontSize: 18 }} />,           path: '/pm/create-task' },
    { label: 'Analytics',   icon: <BarChart sx={{ fontSize: 18 }} />,      path: '/pm/analytics' },
    { label: 'Performance', icon: <Analytics sx={{ fontSize: 18 }} />,     path: '/pm/performance' },
    { label: 'Feedback',    icon: <RateReview sx={{ fontSize: 18 }} />,    path: '/pm/feedback' },
    { label: 'Workload',    icon: <ViewWeek sx={{ fontSize: 18 }} />,      path: '/pm/workload' },
    { label: 'Availability',icon: <BeachAccess sx={{ fontSize: 18 }} />,   path: '/pm/availability' },
    { label: 'Calendar',    icon: <CalendarMonth sx={{ fontSize: 18 }} />, path: '/pm/calendar' },
    { label: 'Messages',    icon: <Chat sx={{ fontSize: 18 }} />,          path: '/pm/chat', badge: true },
    { label: 'Portfolio',   icon: <EmojiEvents sx={{ fontSize: 18 }} />,   path: '/pm/credits' },
    { label: 'Invite',      icon: <GroupAdd sx={{ fontSize: 18 }} />,      path: '/pm/invite' },
  ],
  assigner: [
    { label: 'Dashboard',    icon: <Dashboard sx={{ fontSize: 18 }} />,        path: '/assigner/dashboard' },
    { label: 'Task Board',   icon: <Assignment sx={{ fontSize: 18 }} />,       path: '/assigner/tasks' },
    { label: 'Assign Writers',icon: <SupervisorAccount sx={{ fontSize: 18 }}/>,path: '/assigner/assign' },
    { label: 'Feedback',     icon: <RateReview sx={{ fontSize: 18 }} />,       path: '/assigner/feedback' },
    { label: 'Workload',     icon: <ViewWeek sx={{ fontSize: 18 }} />,         path: '/assigner/workload' },
    { label: 'Availability', icon: <BeachAccess sx={{ fontSize: 18 }} />,      path: '/assigner/availability' },
    { label: 'Calendar',     icon: <CalendarMonth sx={{ fontSize: 18 }} />,    path: '/assigner/calendar' },
    { label: 'Messages',     icon: <Chat sx={{ fontSize: 18 }} />,             path: '/assigner/chat', badge: true },
    { label: 'Portfolio',    icon: <EmojiEvents sx={{ fontSize: 18 }} />,      path: '/assigner/credits' },
    { label: 'Invite',       icon: <GroupAdd sx={{ fontSize: 18 }} />,         path: '/assigner/invite' },
  ],
  writer: [
    { label: 'Dashboard',    icon: <Dashboard sx={{ fontSize: 18 }} />,     path: '/writer/dashboard' },
    { label: 'My Tasks',     icon: <Assignment sx={{ fontSize: 18 }} />,    path: '/writer/tasks' },
    { label: 'My Feedback',  icon: <Feedback sx={{ fontSize: 18 }} />,      path: '/writer/feedback' },
    { label: 'Performance',  icon: <Analytics sx={{ fontSize: 18 }} />,     path: '/writer/performance' },
    { label: 'My Portfolio', icon: <EmojiEvents sx={{ fontSize: 18 }} />,   path: '/writer/credits' },
    { label: 'Availability', icon: <BeachAccess sx={{ fontSize: 18 }} />,   path: '/writer/availability' },
    { label: 'Calendar',     icon: <CalendarMonth sx={{ fontSize: 18 }} />, path: '/writer/calendar' },
    { label: 'Messages',     icon: <Chat sx={{ fontSize: 18 }} />,          path: '/writer/chat', badge: true },
  ],
};

export default function Layout({ children }) {
  const { user, logout }     = useAuth();
  const { darkMode, toggle } = useDarkMode();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [anchorEl, setAnchorEl]     = useState(null);

  useEffect(() => {
    const fetch = () => chatAPI.getUnreadCount().then(r => {
      const count = r.data.unreadCount || 0;
      setChatUnread(count);
      // Update browser tab title like Slack
      if (count > 0) {
        document.title = `(${count}) TaskFlow`;
      } else {
        document.title = 'TaskFlow';
      }
    }).catch(() => {});
    fetch();
    const t = setInterval(fetch, 5000);
    return () => {
      clearInterval(t);
      document.title = 'TaskFlow';
    };
  }, []);

  const roleColor = ROLE_COLORS[user?.role] || '#6366f1';
  const menu      = roleMenus[user?.role] || [];

  const drawerContent = (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      bgcolor: darkMode ? '#0d1117' : '#1e1b4b',
      background: darkMode
        ? 'linear-gradient(180deg, #0d1117 0%, #111827 100%)'
        : 'linear-gradient(180deg, #1e1b4b 0%, #312e81 100%)',
    }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: 2.5,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(99,102,241,0.5)',
          flexShrink: 0,
        }}>
          <Typography sx={{ color: 'white', fontWeight: 900, fontSize: 16 }}>T</Typography>
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 900, fontSize: 18, color: 'white', letterSpacing: '-0.5px', lineHeight: 1 }}>
            TaskFlow
          </Typography>
          <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
            {ROLE_LABELS[user?.role]}
          </Typography>
        </Box>
      </Box>

      {/* Role badge */}
      <Box sx={{ px: 3, pb: 2 }}>
        <Box sx={{
          px: 1.5, py: 0.8, borderRadius: 2,
          bgcolor: `${roleColor}20`,
          border: `1px solid ${roleColor}30`,
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: roleColor, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: roleColor }}>
            {ROLE_LABELS[user?.role]}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, mb: 1 }} />

      {/* Nav items */}
      <List sx={{ flex: 1, px: 1.5, py: 0.5, overflowY: 'auto',
        '&::-webkit-scrollbar': { width: 0 } }}>
        {menu.map(item => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                sx={{
                  borderRadius: 2.5, py: 1.1, px: 1.5,
                  bgcolor: active ? 'rgba(99,102,241,0.25)' : 'transparent',
                  border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                  '&:hover': { bgcolor: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)' },
                  transition: 'all 0.15s',
                }}>
                <ListItemIcon sx={{ minWidth: 34 }}>
                  {item.badge && chatUnread > 0
                    ? <Badge badgeContent={chatUnread} color="error"
                        sx={{ '& .MuiBadge-badge': { fontSize: 9, minWidth: 15, height: 15, p: 0 } }}>
                        {React.cloneElement(item.icon, { sx: { fontSize: 18, color: active ? '#a5b4fc' : 'rgba(255,255,255,0.45)' } })}
                      </Badge>
                    : React.cloneElement(item.icon, { sx: { fontSize: 18, color: active ? '#a5b4fc' : 'rgba(255,255,255,0.45)' } })}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 13.5, fontWeight: active ? 700 : 500,
                    color: active ? '#c7d2fe' : 'rgba(255,255,255,0.6)',
                  }} />
                {active && <Box sx={{ width: 3, height: 20, borderRadius: 4, bgcolor: '#818cf8', ml: 0.5, flexShrink: 0 }} />}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2, mt: 1 }} />

      {/* User section */}
      <Box sx={{ p: 2 }}>
        <Box
          onClick={e => setAnchorEl(e.currentTarget)}
          sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
            borderRadius: 2.5, cursor: 'pointer',
            bgcolor: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
            transition: 'all 0.15s',
          }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: roleColor, fontSize: 13, fontWeight: 800, flexShrink: 0 }}>
            {user?.username?.[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              {user?.username}
            </Typography>
            <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </Typography>
          </Box>
          <KeyboardArrowDown sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, flexShrink: 0 }} />
        </Box>
      </Box>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { borderRadius: 3, minWidth: 180, border: '1px solid', borderColor: 'divider' } }}>
        <MenuItem onClick={() => { toggle(); setAnchorEl(null); }} sx={{ gap: 1.5, py: 1.2 }}>
          {darkMode ? <LightMode sx={{ fontSize: 18 }} /> : <DarkMode sx={{ fontSize: 18 }} />}
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { logout(); setAnchorEl(null); }} sx={{ gap: 1.5, py: 1.2, color: 'error.main' }}>
          <ExitToApp sx={{ fontSize: 18 }} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Sign Out</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
          {drawerContent}
        </Drawer>
        <Drawer variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', boxSizing: 'border-box' } }} open>
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <AppBar position="sticky" elevation={0} sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid', borderColor: 'divider',
          backdropFilter: 'blur(12px)',
          zIndex: 1100,
        }}>
          <Toolbar sx={{ gap: 1.5, minHeight: '60px !important' }}>
            <IconButton sx={{ display: { md: 'none' }, color: 'text.secondary' }}
              onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>

            {/* Page title from URL */}
            <Box sx={{ flex: 1 }} />

            <GlobalSearch />

            <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'}>
              <IconButton onClick={toggle} size="small"
                sx={{ color: 'text.secondary', bgcolor: 'action.hover', borderRadius: 2, width: 36, height: 36 }}>
                {darkMode ? <LightMode sx={{ fontSize: 18 }} /> : <DarkMode sx={{ fontSize: 18 }} />}
              </IconButton>
            </Tooltip>

            <NotificationBell />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5,
              pl: 1.5, borderLeft: '1px solid', borderColor: 'divider' }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: ROLE_COLORS[user?.role], fontSize: 13, fontWeight: 800 }}>
                {user?.username?.[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
                  {user?.username}
                </Typography>
                <Typography sx={{ fontSize: 10, color: 'text.secondary' }}>
                  {ROLE_LABELS[user?.role]}
                </Typography>
              </Box>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Page */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 }, bgcolor: 'background.default', overflowX: 'hidden' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}