// src/components/sections/HeroSection.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { HeroSectionProps } from '../../types';

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  description,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryClick,
  onSecondaryClick,
  imageUrl
}) => {
  return (
    <section className="relative isolate min-h-[680px] overflow-hidden bg-[#171717] text-white">
      <img
        src={imageUrl || '/images/mainhero.jpeg'}
        alt="Learners building their technology careers"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-[#111111]/70" />
      <div className="absolute inset-y-0 left-0 w-full bg-[#111111]/45 md:w-3/5" />

      <div className="relative mx-auto flex min-h-[680px] max-w-7xl items-end px-6 pb-16 pt-32 sm:px-10 lg:px-12 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-3xl"
        >
          <div className="mb-7 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f3c969]">
            <span className="h-px w-10 bg-[#f3c969]" />
            Arodonna ICT Arena
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
            {title}
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/78 sm:text-lg">
            {description}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={onPrimaryClick}
              className="group inline-flex items-center gap-3 bg-[#f3c969] px-6 py-3.5 text-sm font-bold text-[#171717] transition hover:bg-[#ffe09a]"
            >
              {primaryButtonText}
              <span className="text-lg transition-transform group-hover:translate-x-1">-&gt;</span>
            </button>
            <button
              onClick={onSecondaryClick}
              className="border border-white/45 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
            >
              {secondaryButtonText}
            </button>
          </div>
          <div className="mt-14 grid max-w-lg grid-cols-3 divide-x divide-white/20 border-t border-white/20 pt-5">
            {[
              ['50k+', 'Learners'],
              ['500+', 'Courses'],
              ['95%', 'Completion rate'],
            ].map(([value, label]) => (
              <div key={label} className="first:pl-0 pl-5">
                <div className="text-2xl font-semibold tracking-tight">{value}</div>
                <div className="mt-1 text-xs text-white/55">{label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;