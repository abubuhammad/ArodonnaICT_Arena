// src/components/sections/Testimonials.tsx
import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    name: 'Ada Lovelace',
    role: 'Software Engineer',
    text: 'This platform transformed my career. The projects and mentors are world-class.',
    avatar: 'https://i.pravatar.cc/100?img=5',
  },
  {
    name: 'Grace Hopper',
    role: 'Data Scientist',
    text: 'Beautiful experience from start to finish. The UI makes learning a joy.',
    avatar: 'https://i.pravatar.cc/100?img=15',
  },
  {
    name: 'Linus T.',
    role: 'Systems Architect',
    text: 'Practical lessons, clean design, and great community. Highly recommended.',
    avatar: 'https://i.pravatar.cc/100?img=25',
  },
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-16 bg-gradient-to-b from-white to-indigo-50/40 dark:from-gray-950 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">Loved by learners</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Hear what our students say about their journey</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl p-6 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-gray-800 shadow-[0_12px_32px_-16px_rgba(79,70,229,0.25)]"
            >
              <div className="flex items-center gap-3 mb-4">
                <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full" />
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{t.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{t.role}</div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">“{t.text}”</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
