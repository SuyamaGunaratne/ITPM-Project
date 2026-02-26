// src/pages/HomePage.jsx
import { useEffect, useState } from 'react';
import '../styles/HomePage.css';

const sliderImages = [
  '/images/uni-1.jpg',
  '/images/uni-2.jpg',
  '/images/uni-3.jpg',
];

function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    loading: true,
  });

  // Simple auto image slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Fetch actual counts from backend (example: /api/stats)
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('http://localhost:5000/api/stats');
        const data = await res.json();
        setStats({
          students: data.studentsCount || 0,
          teachers: data.teachersCount || 0,
          loading: false,
        });
      } catch {
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="home-root">
      {/* NAVBAR */}
      <header className="navbar">
        <div className="navbar-left">
          <img src="/logo.png" alt="UniHub Logo" className="navbar-logo" />
          <span className="navbar-title">UniHub LMS</span>
        </div>
        <nav className="navbar-links">
          <button
            className="btn-outline"
            onClick={() => (window.location.href = '/login')}
          >
            Login
          </button>
          <button
            className="btn-primary"
            onClick={() => (window.location.href = '/boarding/register')}
          >
            Register Boarding Owner
          </button>
        </nav>
      </header>

      {/* HERO + SLIDER */}
      <main className="hero">
        <div className="hero-text">
          <h1>Smart Online Learning for Modern Universities</h1>
          <p>
            Manage courses, students, teachers and off‑campus boarding in one
            powerful, easy‑to‑use platform.
          </p>

          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Students</span>
              <span className="stat-value">
                {stats.loading ? '...' : stats.students}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Teachers</span>
              <span className="stat-value">
                {stats.loading ? '...' : stats.teachers}
              </span>
            </div>
          </div>
        </div>

        <div className="hero-slider">
          <div className="slider-window">
            {sliderImages.map((src, idx) => (
              <img
                key={src}
                src={src}
                alt={`Campus ${idx + 1}`}
                className={`slider-image ${
                  idx === currentSlide ? 'active' : ''
                }`}
              />
            ))}
          </div>
          <div className="slider-dots">
            {sliderImages.map((_, idx) => (
              <button
                key={idx}
                className={`dot ${idx === currentSlide ? 'dot-active' : ''}`}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div>© {new Date().getFullYear()} UniHub LMS. All rights reserved.</div>
        <div className="footer-links">
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
          <a href="#privacy">Privacy</a>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;