import { useEffect, useState } from 'react';

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

  // Auto image slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch actual counts
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
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg font-sans flex flex-col pt-24 cursor-default">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-200/40 dark:bg-primary-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent-200/40 dark:bg-accent-900/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3" />
      </div>

      {/* HERO SECTION */}
      <main className="flex-grow flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto w-full px-6 lg:px-8 py-12 relative z-10">
        
        {/* Hero Text Content */}
        <div className="flex-1 lg:pr-16 flex flex-col items-center lg:items-start text-center lg:text-left mb-16 lg:mb-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800 text-primary-600 dark:text-primary-400 text-sm font-semibold mb-8 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
            </span>
            Platform Live Now
          </div>

          <h1 className="text-5xl lg:text-7xl font-heading font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-6 tracking-tight">
            Smart Online Learning for <span className="text-gradient">Modern Universities</span>
          </h1>
          
          <p className="text-lg lg:text-xl text-slate-600 dark:text-slate-300 mb-10 max-w-2xl font-medium leading-relaxed">
            Manage courses, students, teachers and off‑campus boarding in one powerful, beautifully designed platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center lg:justify-start mb-12">
            <a href="/login" className="btn-primary text-lg flex justify-center items-center py-4 px-8">
              Get Started Now
            </a>
            <a href="/boarding/register" className="btn-secondary text-lg flex justify-center items-center py-4 px-8">
              Register Boarding
            </a>
          </div>

          {/* Stats Row */}
          <div className="flex gap-8 lg:gap-12 w-full justify-center lg:justify-start">
            <div className="flex flex-col">
              <span className="text-3xl lg:text-4xl font-heading font-bold text-slate-900 dark:text-white">
                {stats.loading ? '...' : stats.students.toLocaleString()}+
              </span>
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Active Students</span>
            </div>
            <div className="w-px bg-slate-200 dark:bg-dark-border" />
            <div className="flex flex-col">
              <span className="text-3xl lg:text-4xl font-heading font-bold text-slate-900 dark:text-white">
                 {stats.loading ? '...' : stats.teachers.toLocaleString()}+
              </span>
              <span className="text-sm font-medium text-slate-500 uppercase tracking-wider mt-1">Expert Teachers</span>
            </div>
          </div>
        </div>

        {/* Hero Image Slider Container */}
        <div className="flex-1 w-full max-w-2xl lg:max-w-none relative">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden glass-card p-2 md:p-3">
            <div className="w-full h-full rounded-2xl overflow-hidden relative">
              {sliderImages.length > 0 ? (
                sliderImages.map((src, idx) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Campus ${idx + 1}`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                      idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                    }`}
                  />
                ))
              ) : (
                <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  <span className="text-slate-400">Campus Images</span>
                </div>
              )}
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
              
              {/* Slider Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {sliderImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Decorative Floaters */}
          <div className="hidden lg:flex absolute -bottom-10 -left-10 glass-panel p-5 rounded-2xl items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
             <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 text-green-600 rounded-full flex items-center justify-center text-xl font-bold">✓</div>
             <div>
               <p className="font-bold text-slate-900 dark:text-white">Fully Verified</p>
               <p className="text-sm text-slate-500">Boardings & Tutors</p>
             </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full py-8 text-center text-slate-500 dark:text-slate-400 text-sm border-t border-slate-200 dark:border-dark-border mt-10 relative z-10 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} UniHub LMS. All rights reserved.</p>
          <div className="flex gap-6 font-medium">
            <a href="#about" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About</a>
            <a href="#contact" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact</a>
            <a href="#privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;