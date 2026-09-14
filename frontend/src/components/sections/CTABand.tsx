// src/components/sections/CTABand.tsx
import React from 'react';

interface Props {
  onPrimary: () => void;
  onSecondary: () => void;
}

const CTABand: React.FC<Props> = ({ onPrimary, onSecondary }) => {
  return (
    <section className="relative overflow-hidden py-12">
      {/* Background gradient at z-0 */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 via-violet-700 to-cyan-600" />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        {/* Transparent container so gradient is visible */}
        <div className="rounded-3xl px-6 py-10 md:px-12 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 items-center text-white">
            <div>
              <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Ready to transform your career?
              </h3>
              <p className="mt-3 text-white/95 max-w-2xl">
                Join thousands of learners mastering in-demand tech skills with hands‑on projects and expert mentors.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
              <button
                onClick={onPrimary}
                className="px-6 py-3 rounded-xl font-semibold bg-white text-indigo-700 hover:bg-indigo-50 transition shadow-lg shadow-black/20"
              >
                Explore Courses
              </button>
              <button
                onClick={onSecondary}
                className="px-6 py-3 rounded-xl font-semibold border border-white/70 text-white hover:bg-white/10 transition"
              >
                Become an Instructor
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTABand;
