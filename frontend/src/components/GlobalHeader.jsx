import { useState, useEffect, useCallback } from 'react';
import ThemeToggle from './ThemeToggle';

const DEFAULT_LINKS = [
  { label: 'Home',     href: '/'},
  { label: 'Login',    href: '/login' },
  { label: 'Register', href: '/boarding/register',   icon: '✨', cta: true },
];

export default function GlobalHeader({
  showNav = false,
  links   = DEFAULT_LINKS,
  active  = typeof window !== 'undefined' ? window.location.pathname : '/',
}) {
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [scrolled,  setScrolled]  = useState(false);

  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 12);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const close = () => { if (mq.matches) setMenuOpen(false); };
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  const regularLinks = links.filter(l => !l.cta);
  const ctaLink      = links.find(l => l.cta);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 font-sans ${scrolled ? 'bg-white/90 dark:bg-dark-card/90 backdrop-blur-md shadow-sm border-b border-slate-200 dark:border-dark-border py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Brand */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-accent-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-all group-hover:scale-105">
              U
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-xl text-slate-900 dark:text-white leading-none">UniHub LMS</span>
              <span className="text-[0.65rem] font-medium text-slate-500 tracking-wider uppercase mt-1">Learn &bull; Connect &bull; Grow</span>
            </div>
          </a>

          {/* Desktop Nav */}
          {showNav && (
            <nav className="hidden md:flex items-center gap-1">
              {regularLinks.map(link => {
                const isActive = active === link.href;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {link.label}
                  </a>
                );
              })}
              {ctaLink && (
                <a
                  href={ctaLink.href}
                  className="ml-4 btn-primary"
                >
                  {ctaLink.icon && <span className="mr-2">{ctaLink.icon}</span>}
                  {ctaLink.label}
                </a>
              )}
              <div className="ml-4 border-l pl-4 border-slate-200 dark:border-dark-border">
                <ThemeToggle />
              </div>
            </nav>
          )}

          {/* Mobile controls */}
          {showNav && (
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showNav && (
        <div className={`md:hidden absolute top-full left-0 w-full bg-white dark:bg-dark-card border-b border-slate-200 dark:border-dark-border shadow-lg transition-all duration-300 transform origin-top ${menuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'}`}>
          <div className="px-4 py-4 space-y-2 flex flex-col">
            {regularLinks.map(link => {
              const isActive = active === link.href;
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 rounded-xl font-medium ${isActive ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              );
            })}
            {ctaLink && (
              <a
                href={ctaLink.href}
                className="mt-4 block text-center btn-primary w-full"
                onClick={() => setMenuOpen(false)}
              >
                {ctaLink.label}
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
