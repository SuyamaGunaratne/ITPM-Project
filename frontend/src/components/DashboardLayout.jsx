import { useState } from 'react';
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
