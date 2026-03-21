// import '../styles/HomePage.css';

// export default function GlobalHeader({ showNav = false }) {
//   return (
//     <header className="navbar global-navbar">
//       <div className="navbar-left">
//         <img src="/logo.png" alt="UniHub Logo" className="navbar-logo" />
//         <div className="navbar-title-group">
//           <span className="navbar-title">UniHub LMS</span>
//           <span className="navbar-tagline">Learn • Connect • Grow</span>
//         </div>
//       </div>
//       {showNav && (
//         <nav className="navbar-links">
//           <a className="navbar-link" href="/" title="Home">
//             Home
//           </a>
//           <a className="navbar-link" href="/login" title="Login">
//             Login
//           </a>
//           <a className="navbar-link" href="/boarding/register" title="Register Boarding Owner">
//             Register
//           </a>
//         </nav>
//       )}
//     </header>
//   );
// }

import { useState, useEffect, useCallback } from 'react';
import '../styles/GlobalHeader.css';

/**
 * GlobalHeader — animated, responsive navbar
 *
 * Props:
 *   showNav  {boolean}  show navigation links (default: false)
 *   links    {Array}    override default nav links
 *                       each: { label, href, icon }
 *   active   {string}   href that should receive .gh-link-active style
 */

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

  /* ── Scroll shadow ── */
  const handleScroll = useCallback(() => {
    setScrolled(window.scrollY > 12);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* ── Close drawer on resize to desktop ── */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 641px)');
    const close = () => { if (mq.matches) setMenuOpen(false); };
    mq.addEventListener('change', close);
    return () => mq.removeEventListener('change', close);
  }, []);

  const navbarClass = [
    'gh-navbar',
    scrolled ? 'gh-scrolled' : '',
  ].filter(Boolean).join(' ');

  /* ── Separate CTA from regular links ── */
  const regularLinks = links.filter(l => !l.cta);
  const ctaLink      = links.find(l => l.cta);

  const LinkItem = ({ link, inDrawer = false }) => (
    <a
      href={link.href}
      className={[
        'gh-link',
        active === link.href ? 'gh-link-active' : '',
      ].filter(Boolean).join(' ')}
      title={link.label}
      onClick={() => inDrawer && setMenuOpen(false)}
    >
      <span className="gh-link-icon" aria-hidden="true">{link.icon}</span>
      {link.label}
    </a>
  );

  return (
    <header className={navbarClass}>
      <div className="gh-inner">

        {/* ── Brand ── */}
        <a href="/" className="gh-brand" aria-label="UniHub LMS — Home">
          <img src="/logo.png" alt="" className="gh-logo" aria-hidden="true" />
          <div className="gh-title-group">
            <span className="gh-title">UniHub LMS</span>
            <span className="gh-tagline">Learn&nbsp;•&nbsp;Connect&nbsp;•&nbsp;Grow</span>
          </div>
        </a>

        {/* ── Desktop nav ── */}
        {showNav && (
          <nav className="gh-nav" aria-label="Main navigation">
            {regularLinks.map(link => (
              <LinkItem key={link.href} link={link} />
            ))}

            {ctaLink && (
              <a
                href={ctaLink.href}
                className="gh-cta"
                title={ctaLink.label}
              >
                {ctaLink.label}
                <span className="gh-cta-icon" aria-hidden="true">→</span>
              </a>
            )}
          </nav>
        )}

        {/* ── Hamburger (mobile) ── */}
        {showNav && (
          <button
            className="gh-hamburger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="gh-mobile-drawer"
            onClick={() => setMenuOpen(v => !v)}
          >
            <span className="gh-bar" />
            <span className="gh-bar" />
            <span className="gh-bar" />
          </button>
        )}
      </div>

      {/* ── Mobile drawer ── */}
      {showNav && (
        <nav
          id="gh-mobile-drawer"
          className={['gh-drawer', menuOpen ? 'gh-drawer-open' : ''].filter(Boolean).join(' ')}
          aria-label="Mobile navigation"
          aria-hidden={!menuOpen}
        >
          {regularLinks.map(link => (
            <LinkItem key={link.href} link={link} inDrawer />
          ))}

          {ctaLink && (
            <a
              href={ctaLink.href}
              className="gh-cta"
              title={ctaLink.label}
              onClick={() => setMenuOpen(false)}
            >
              {ctaLink.label}
              <span className="gh-cta-icon" aria-hidden="true">→</span>
            </a>
          )}
        </nav>
      )}
    </header>
  );
}
