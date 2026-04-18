import { useState, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';

export default function DashboardLayout({
  role,
  sidebarBrand,
  sidebarSub,
  navItems,
  activePath,
  userName,
  userAvatar,
  title,
  subtitleText,
  onLogout,
  children
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

  // Get user from localStorage
  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const token = user?.token || null;

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      
      try {
        const response = await fetch('http://localhost:5000/api/notifications', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n._id === notificationId ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownOpen && !event.target.closest('.notification-dropdown')) {
        setNotificationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notificationDropdownOpen]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-dark-bg overflow-hidden text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:flex-shrink-0
        flex flex-col
        ${mobileMenuOpen ? 'translate-x-0 block' : '-translate-x-full hidden lg:flex'}
      `}>
        {/* Sidebar Header */}
        <div className="h-20 flex flex-col justify-center px-6 border-b border-slate-200 dark:border-dark-border bg-gradient-to-r from-primary-50 to-white dark:from-slate-800 dark:to-dark-card">
          <h2 className="text-xl font-heading font-bold text-gradient">{sidebarBrand}</h2>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{sidebarSub}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  window.location.href = item.path;
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-800/30' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }
                `}
              >
                {/* Simulated Icon for now */}
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-primary-100 dark:bg-primary-800/50 text-primary-600 dark:text-primary-400' : 'bg-slate-100 dark:bg-slate-800/50 group-hover:bg-white dark:group-hover:bg-slate-700'}`}>
                  {item.icon || <div className="w-2 h-2 rounded-full bg-current opacity-70" />}
                </span>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-border">
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 dark:bg-dark-bg relative">
        {/* Topbar */}
        <header className="h-20 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border flex items-center justify-between px-6 lg:px-10 z-30 sticky top-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(true)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <div>
              <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white leading-tight">{title}</h1>
              {subtitleText && <p className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">{subtitleText}</p>}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {/* Notification Bell */}
            <div className="relative notification-dropdown">
              <button
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 hover:scale-105"
              >
                <svg className={`w-6 h-6 transition-transform duration-200 ${notificationDropdownOpen ? 'rotate-12' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5 5v-5zM4 12h8m0 0v8m0-8V4" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse shadow-lg">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationDropdownOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-2xl z-50 max-h-96 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
                  {/* Header with gradient */}
                  <div className="p-5 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border-b border-slate-200 dark:border-dark-border">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 dark:text-white text-lg">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs px-2 py-1 rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5 5v-5zM4 12h8m0 0v8m0-8V4" />
                        </svg>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">No notifications yet</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">We'll notify you when something important happens</p>
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.slice(0, 10).map((notification, index) => (
                        <div
                          key={notification._id}
                          className={`p-4 hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 dark:hover:from-slate-800/50 dark:hover:to-blue-900/10 cursor-pointer transition-all duration-200 border-b border-slate-100 dark:border-dark-border last:border-b-0 group ${
                            !notification.read ? 'bg-gradient-to-r from-blue-50/50 to-indigo-50/30 dark:from-blue-900/20 dark:to-indigo-900/10' : ''
                          }`}
                          onClick={() => {
                            markAsRead(notification._id);
                            // Navigate to post for post-related notifications
                            if (['post_comment', 'post_like', 'post_approved', 'post_rejected'].includes(notification.type) && notification.post) {
                              window.location.href = `/student/community?postId=${notification.post}`;
                            }
                          }}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-start gap-4">
                            {/* Notification Icon */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110 ${
                              notification.type === 'admin_request' 
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                                : notification.type === 'boarding_registration_request'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                                : notification.type === 'post_approved'
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                : notification.type === 'post_rejected'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                : notification.type === 'post_comment'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                                : notification.type === 'post_like'
                                ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
                                : notification.type === 'support_request'
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}>
                              {notification.type === 'admin_request' && '💬'}
                              {notification.type === 'boarding_registration_request' && '🏠'}
                              {notification.type === 'post_approved' && '✅'}
                              {notification.type === 'post_rejected' && '❌'}
                              {notification.type === 'post_comment' && '💭'}
                              {notification.type === 'post_like' && '❤️'}
                              {notification.type === 'support_request' && '🆘'}
                              {!['admin_request', 'boarding_registration_request', 'post_approved', 'post_rejected', 'post_comment', 'post_like', 'support_request'].includes(notification.type) && '🔔'}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-slate-900 dark:text-white font-medium leading-relaxed">
                                  {notification.message}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1 animate-pulse"></div>
                                )}
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                  {formatDate(notification.createdAt)}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  notification.type === 'admin_request' 
                                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                                    : notification.type === 'boarding_registration_request'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : notification.type === 'post_approved'
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                    : notification.type === 'post_rejected'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    : notification.type === 'post_comment'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                    : notification.type === 'post_like'
                                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                }`}>
                                  {notification.type === 'admin_request' && 'Community'}
                                  {notification.type === 'boarding_registration_request' && 'Registration'}
                                  {notification.type === 'post_approved' && 'Approved'}
                                  {notification.type === 'post_rejected' && 'Rejected'}
                                  {notification.type === 'post_comment' && 'Comment'}
                                  {notification.type === 'post_like' && 'Like'}
                                  {!['admin_request', 'boarding_registration_request', 'post_approved', 'post_rejected', 'post_comment', 'post_like'].includes(notification.type) && 'System'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {notifications.length > 10 && (
                    <div className="p-4 text-center border-t border-slate-200 dark:border-dark-border bg-slate-50/50 dark:bg-slate-800/50">
                      <button className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium hover:underline transition-colors duration-200">
                        View all notifications →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{userName}</span>
              <span className="text-xs text-slate-500 font-medium">{role}</span>
            </div>
            <button className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-primary-200 dark:border-primary-500/30 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-shadow hover:shadow-lg">
              <img src={userAvatar || '/images/teacher-avatar.jpg'} alt={userName} className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8 pb-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
