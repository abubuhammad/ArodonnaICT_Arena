// src/components/sections/LogoMarquee.tsx
import React from 'react';

const brands = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Airbnb'];

const LogoMarquee: React.FC = () => {
  const items = [...brands, ...brands]; // duplicate for seamless loop
  return (
    <section className="relative py-10 bg-white/60 dark:bg-gray-900/60 backdrop-blur border-y border-gray-100 dark:border-gray-800 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6 text-center">
          <p className="text-sm tracking-wider uppercase text-gray-500 dark:text-gray-400">Trusted by learners working at</p>
        </div>
      </div>
      <div className="relative">
        <div className="flex items-center gap-6 sm:gap-10 animate-marquee will-change-transform">
          {items.map((name, idx) => (
            <div key={`${name}-${idx}`} className="min-w-[160px]">
              <div className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 backdrop-blur flex items-center justify-center gap-2 shadow-sm">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{name}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white dark:from-gray-900 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white dark:from-gray-900 to-transparent" />
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          width: max-content;
          animation: marquee 18s linear infinite;
        }
      `}</style>
    </section>
  );
};

export default LogoMarquee;
