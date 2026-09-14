import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RootState } from "../store";
import { User } from "../types";

// Components
import Navigation from "../components/layout/Navigation";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";

const AboutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth as { user: User | null });

  const handleLogout = () => {
    navigate("/login");
  };

  const handleDashboardNavigation = () => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user?.role === "instructor") {
      navigate("/instructor/dashboard");
    } else if (user?.role === "student") {
      navigate("/student/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto w-full max-w-7xl px-6 pt-6">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          className="inline-flex items-center gap-2 text-sm font-medium leading-5 text-indigo-600 transition-colors hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
        >
          Back
        </button>
      </div>
      <Navigation
        user={user}
        onLogout={handleLogout}
        onDashboardNavigation={handleDashboardNavigation}
      />

      <main className="flex-grow py-16">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-6">
          <motion.header
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-3xl text-center"
          >
            <p className="mb-3 text-xs font-medium uppercase leading-4 tracking-[0.18em] text-cyan-600 dark:text-cyan-400">A practical path forward</p>
            <h1 className="text-4xl font-bold leading-tight text-slate-950 dark:text-slate-50">About Arodonna ICT Arena</h1>
            <p className="mt-4 text-base font-normal leading-6 text-slate-600 dark:text-slate-400">Empowering learners worldwide with practical tech education and meaningful career outcomes.</p>
          </motion.header>

          <section aria-labelledby="mission" className="space-y-8">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 id="mission" className="text-2xl font-bold leading-8 text-indigo-600 dark:text-indigo-400">Our Mission</h2>
              <p className="mt-3 max-w-3xl text-base font-normal leading-6 text-slate-600 dark:text-slate-400">We provide practical, industry-aligned tech education that helps learners build skills employers need. Our goal is to make that education accessible, affordable, and relevant.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-lg font-semibold leading-7 text-slate-950 dark:text-slate-50">Our Vision</h3>
                <p className="mt-2 text-base font-normal leading-6 text-slate-600 dark:text-slate-400">To be the go-to platform for learners and instructors who want measurable career impact through practical learning experiences.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-lg font-semibold leading-7 text-slate-950 dark:text-slate-50">Who We Serve</h3>
                <p className="mt-2 text-base font-normal leading-6 text-slate-600 dark:text-slate-400">Students seeking career transitions, self-learners looking to upskill, and instructors aiming to reach a global audience.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="values">
            <h2 id="values" className="mb-6 text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Our Core Values</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { title: 'Excellence', text: 'High-quality content and instructors.' },
                { title: 'Accessibility', text: 'Affordable education for every learner.' },
                { title: 'Innovation', text: 'Continuous platform and curriculum improvement.' },
                { title: 'Community', text: 'Supportive peer and instructor network.' },
                { title: 'Integrity', text: 'Transparent and fair policies.' },
                { title: 'Empowerment', text: 'Tools that help learners succeed.' },
              ].map((v, i) => (
                <motion.div key={v.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.35 }} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-lg font-semibold leading-7 text-indigo-600 dark:text-indigo-400">{v.title}</h3>
                  <p className="mt-2 text-base font-normal leading-6 text-slate-600 dark:text-slate-400">{v.text}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section aria-labelledby="why">
            <h2 id="why" className="mb-6 text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Why Choose Us</h2>
            <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-6 dark:border-cyan-900/60 dark:bg-cyan-950/20">
              <ul className="grid gap-6 md:grid-cols-2">
                <li className="flex items-start gap-3 text-base font-normal leading-6 text-slate-700 dark:text-slate-300"><span className="font-bold text-indigo-600 dark:text-indigo-400">✓</span><span>Expert instructors with real-world experience</span></li>
                <li className="flex items-start gap-3 text-base font-normal leading-6 text-slate-700 dark:text-slate-300"><span className="font-bold text-indigo-600 dark:text-indigo-400">✓</span><span>Hands-on projects and portfolios</span></li>
                <li className="flex items-start gap-3 text-base font-normal leading-6 text-slate-700 dark:text-slate-300"><span className="font-bold text-indigo-600 dark:text-indigo-400">✓</span><span>Certificates and career support</span></li>
                <li className="flex items-start gap-3 text-base font-normal leading-6 text-slate-700 dark:text-slate-300"><span className="font-bold text-indigo-600 dark:text-indigo-400">✓</span><span>Flexible learning and lifetime access</span></li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="cta" className="border-t border-slate-200 pt-8 text-center dark:border-slate-800">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <h3 id="cta" className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Ready to get started?</h3>
              <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" onClick={() => navigate('/courses')}>Browse Courses</Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/signup')}>Create Account</Button>
              </div>
            </motion.div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
