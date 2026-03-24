import { useEffect } from 'react';

export default function AuthLayout({ children, title, subtitle, imageSrc, contentMaxWidth = "max-w-md" }) {
  useEffect(() => {
    // Add specific auth body styling if needed
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-28 pb-10 font-sans">
      <div className="w-full max-w-6xl bg-white dark:bg-dark-card rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-200 dark:border-dark-border relative z-10">
        
        {/* Decorative Graphic Side */}
        <div className="hidden md:flex md:w-5/12 lg:w-1/2 p-12 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-800 text-white relative items-center justify-center overflow-hidden">
          {/* Abstract background shapes */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20">
             <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white blur-3xl" />
             <div className="absolute bottom-10 -right-10 w-72 h-72 rounded-full bg-accent-400 blur-3xl" />
          </div>
          
          <div className="relative z-10 flex flex-col items-start max-w-md">
            <h2 className="text-4xl lg:text-5xl font-heading font-bold mb-6 leading-tight">
              {title || "Welcome to UniHub LMS"}
            </h2>
            <p className="text-lg text-primary-100 mb-10 leading-relaxed font-medium">
              {subtitle || "The modern platform to learn, connect, and grow. Everything you need to manage your academic journey in one place."}
            </p>
            
            <div className="glass-panel text-white p-6 rounded-2xl w-full">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✨</span>
                </div>
                <div>
                  <h4 className="font-semibold text-white">Join the Community</h4>
                  <p className="text-primary-100 text-sm">Thousands of students and educators.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Side */}
        <div className="w-full md:w-7/12 lg:w-1/2 p-8 sm:p-12 lg:py-16 lg:px-20 flex flex-col justify-center bg-white dark:bg-dark-card">
          <div className={`w-full ${contentMaxWidth} mx-auto`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
