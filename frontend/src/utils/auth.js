// Utility functions for auth and security

export const secureLogout = () => {
  // Clear all auth data
  window.localStorage.removeItem('unihub_user');
  window.sessionStorage.clear();

  // Prevent back button by replacing history
  window.history.pushState(null, '', window.location.href);
  window.onpopstate = () => {
    window.history.pushState(null, '', window.location.href);
  };

  // Set no-cache headers
  const noCacheHeaders = new Headers();
  noCacheHeaders.append('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  noCacheHeaders.append('Pragma', 'no-cache');
  noCacheHeaders.append('Expires', '0');

  // Clear service worker cache if available
  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName);
      });
    });
  }

  // Redirect to login
  window.location.href = '/login';
};

export const setupBackButtonProtection = () => {
  // Prevent back navigation after logout
  window.history.pushState(null, '', window.location.href);
  window.onpopstate = () => {
    const user = window.localStorage.getItem('unihub_user');
    if (!user) {
      // User is logged out, prevent back
      window.history.pushState(null, '', window.location.href);
      window.location.href = '/login';
    } else {
      // User is logged in, allow back
      window.history.back();
    }
  };
};

export const checkAuthAndPreventCaching = () => {
  // Prevent caching of authenticated pages
  const user = window.localStorage.getItem('unihub_user');
  
  if (!user) {
    // No user logged in, redirect to login
    window.location.href = '/login';
    return false;
  }

  // Set no-cache metadata (tells browser not to cache)
  const meta = document.createElement('meta');
  meta.httpEquiv = 'pragma';
  meta.content = 'no-cache';
  document.head.appendChild(meta);

  const meta2 = document.createElement('meta');
  meta2.httpEquiv = 'cache-control';
  meta2.content = 'no-store, no-cache, must-revalidate, max-age=0';
  document.head.appendChild(meta2);

  return true;
};

export const isUserLoggedIn = () => {
  const user = window.localStorage.getItem('unihub_user');
  return !!user;
};

export default {
  secureLogout,
  setupBackButtonProtection,
  checkAuthAndPreventCaching,
  isUserLoggedIn,
};
