import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, 
  FileText, Database, TrendingUp, Settings, 
  LogOut, ChevronLeft, ChevronRight, Bell, 
  User, Award, HelpCircle, ShieldAlert, Server, Clock,
  Sun, Moon, Upload
} from 'lucide-react';
import { Breadcrumb, BreadcrumbItem } from '../components/Breadcrumb';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Helper to parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const currentTab = queryParams.get('tab') || 'overview';

  if (!user) return null;

  // Define sidebar links based on user role
  const getSidebarLinks = () => {
    switch (user.role) {
      case 'admin':
        return [
          { label: 'Overview', tab: 'overview', icon: LayoutDashboard },
          { label: 'Academics', tab: 'academics', icon: BookOpen },
          { label: 'Faculty Management', tab: 'faculty', icon: GraduationCap },
          { label: 'Students Directory', tab: 'students', icon: Users },
          { label: 'Exams & Proctoring', tab: 'proctoring', icon: ShieldAlert },
          { label: 'Question Bank', tab: 'questions', icon: Database },
          { label: 'Q-Papers / Extractor', tab: 'qpapers', icon: Upload },
          { label: 'Bulk Imports', tab: 'uploads', icon: Server },
          { label: 'Exam Results & Export', tab: 'results', icon: Award },
          { label: 'Settings', tab: 'settings', icon: Settings },
        ];
      case 'faculty':
        return [
          { label: 'Dashboard', tab: 'overview', icon: LayoutDashboard },
          { label: 'Academic Structure', tab: 'academics', icon: BookOpen },
          { label: 'Question Bank', tab: 'questions', icon: Database },
          { label: 'Q-Papers / Extractor', tab: 'qpapers', icon: Upload },
          { label: 'Manage Exams', tab: 'exams', icon: BookOpen },
          { label: 'Locked Students', tab: 'proctoring', icon: ShieldAlert },
          { label: 'Results & Grading', tab: 'results', icon: Award },
          { label: 'My Profile', tab: 'profile', icon: User },
        ];
      case 'student':
        return [
          { label: 'Dashboard', tab: 'overview', icon: LayoutDashboard },
          { label: 'Available Exams', tab: 'exams', icon: FileText },
          { label: 'Attempt History', tab: 'history', icon: Database },
          { label: 'Performance Analytics', tab: 'analytics', icon: TrendingUp },
          { label: 'Leaderboard', tab: 'leaderboard', icon: Award },
          { label: 'My Profile', tab: 'profile', icon: User },
        ];
      default:
        return [];
    }
  };

  const links = getSidebarLinks();

  const handleLinkClick = (tab: string) => {
    navigate(`/${user.role}/dashboard?tab=${tab}`);
  };

  // Build Breadcrumbs
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      { label: user.role.toUpperCase(), link: `/${user.role}/dashboard` }
    ];

    const matchedLink = links.find(l => l.tab === currentTab);
    if (matchedLink) {
      items.push({ label: matchedLink.label });
    } else {
      // Check if viewing details, e.g. results
      if (location.pathname.includes('/results/')) {
        items.push({ label: 'Exam Attempt History', link: `/${user.role}/dashboard?tab=history` });
        items.push({ label: 'Score Report' });
      } else {
        items.push({ label: 'Overview' });
      }
    }

    return items;
  };

  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err: any) {
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        console.error('Error fetching notifications:', err);
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-brand">
              <img src="/logo.jpeg" alt="Logo" />
              <span>SkillCetamol</span>
            </div>
          )}
          {collapsed && (
            <div className="sidebar-brand" style={{ justifyContent: 'center', width: '100%' }}>
              <img src="/logo.jpeg" alt="Logo" style={{ margin: 0 }} />
            </div>
          )}
          <button className="sidebar-toggle-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className="sidebar-menu">
          <div>
            {!collapsed && <div className="sidebar-group-title">Navigation</div>}
            <ul className="sidebar-menu-list">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = currentTab === link.tab && !location.pathname.includes('/results/');
                return (
                  <li key={link.tab} className={`sidebar-menu-item ${isActive ? 'active' : ''}`}>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleLinkClick(link.tab); }}>
                      <Icon size={18} />
                      {!collapsed && <span>{link.label}</span>}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar" style={{ overflow: 'hidden', padding: 0 }}>
              {(user as any).photoUrl ? (
                <img
                  src={(user as any).photoUrl}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
              )}
            </div>
            {!collapsed && (
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            )}
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="main-wrapper">
        <header className="top-nav">
          <Breadcrumb items={getBreadcrumbs()} />

          <div className="top-nav-actions">
            {/* Theme Toggle */}
            <button 
              className="notification-bell" 
              onClick={toggleTheme}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              style={{ marginRight: '8px' }}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div className="card" style={{
                  position: 'absolute',
                  top: '40px',
                  right: 0,
                  width: '350px',
                  zIndex: 100,
                  padding: '16px',
                  boxShadow: 'var(--shadow-md)',
                  margin: 0
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '12px' }}>
                    <span style={{ fontWeight: 600 }}>Notifications ({unreadCount})</span>
                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                      {unreadCount > 0 && (
                        <a href="#" onClick={(e) => { e.preventDefault(); handleMarkAllAsRead(); }}>Mark all read</a>
                      )}
                      <a href="#" onClick={(e) => { e.preventDefault(); setShowNotifications(false); }}>Close</a>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '10px' }}>No notifications</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => !n.read && handleMarkAsRead(n.id)}
                          style={{
                            fontSize: '13px',
                            borderBottom: '1px solid var(--hover)',
                            paddingBottom: '8px',
                            cursor: n.read ? 'default' : 'pointer',
                            backgroundColor: n.read ? 'transparent' : 'rgba(37, 99, 235, 0.05)',
                            padding: '6px',
                            borderRadius: '4px',
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '8px'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ color: n.read ? 'var(--text-muted)' : 'var(--text-main)', marginBottom: '2px', fontWeight: n.read ? 'normal' : '600' }}>
                              {n.title}: {n.message}
                            </p>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <button
                            onClick={(e) => handleDeleteNotification(n.id, e)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              fontSize: '12px',
                              padding: '2px 6px'
                            }}
                            title="Delete"
                          >
                            &times;
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-avatar" style={{ border: '2px solid var(--border)', overflow: 'hidden', padding: 0 }}>
              {(user as any).photoUrl ? (
                <img
                  src={(user as any).photoUrl}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                />
              ) : (
                <User size={16} />
              )}
            </div>
          </div>
        </header>

        <main className="content-container">
          <Outlet />
        </main>

        <footer className="footer">
          <span>&copy; 2026 SkillCetamol Exam Portal. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <a href="#" style={{ color: 'var(--text-muted)' }}>Support</a>
            <a href="#" style={{ color: 'var(--text-muted)' }}>Privacy Policy</a>
            <a href="#" style={{ color: 'var(--text-muted)' }}>Terms of Service</a>
          </div>
        </footer>
      </div>
    </div>
  );
};
