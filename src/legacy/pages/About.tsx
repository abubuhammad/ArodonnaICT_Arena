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
            className="grid gap-8 border-b border-slate-200 pb-16 dark:border-slate-800 lg:grid-cols-[1.3fr_0.7fr] lg:items-end"
          >
            <div>
              <p className="text-sm font-medium leading-5 text-indigo-600 dark:text-indigo-400">About Arodonna ICT Arena</p>
              <h1 className="mt-4 max-w-4xl text-5xl font-bold leading-tight text-slate-950 dark:text-slate-50 sm:text-6xl">Practical, industry-aligned tech education.</h1>
            </div>
            <p className="max-w-md text-base font-normal leading-6 text-slate-600 dark:text-slate-400 lg:justify-self-end">We help learners build the skills employers need, with meaningful career outcomes as the goal.</p>
          </motion.header>

          <section aria-labelledby="mission" className="border-b border-slate-200 py-8 dark:border-slate-800">
            <div className="max-w-5xl">
              <h2 id="mission" className="text-2xl font-bold leading-8 text-indigo-600 dark:text-indigo-400">Our mission</h2>
              <p className="mt-6 text-3xl font-semibold leading-tight text-slate-950 dark:text-slate-50 sm:text-4xl">“We make practical tech education accessible, affordable, and relevant for the skills employers need.”</p>
            </div>
          </section>

          <section className="grid gap-8 border-b border-slate-200 py-8 dark:border-slate-800 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Our vision</h2>
              <p className="mt-3 max-w-xl text-base font-normal leading-6 text-slate-600 dark:text-slate-400">To be the go-to platform for learners and instructors who want measurable career impact through practical learning experiences.</p>
            </div>
            <div>
              <h2 className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Who we serve</h2>
              <p className="mt-3 max-w-xl text-base font-normal leading-6 text-slate-600 dark:text-slate-400">Students seeking career transitions, self-learners looking to upskill, and instructors aiming to reach a global audience.</p>
            </div>
          </section>

          <section aria-labelledby="values">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
              <h2 id="values" className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Our core values</h2>
              <p className="max-w-sm text-sm font-normal leading-5 text-slate-500 dark:text-slate-400">The principles behind how we teach, build, and support the learning community.</p>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {[
                { title: 'Excellence', text: 'High-quality content and instructors.' },
                { title: 'Accessibility', text: 'Affordable education for every learner.' },
                { title: 'Innovation', text: 'Continuous platform and curriculum improvement.' },
                { title: 'Community', text: 'Supportive peer and instructor network.' },
                { title: 'Integrity', text: 'Transparent and fair policies.' },
                { title: 'Empowerment', text: 'Tools that help learners succeed.' },
              ].map((v, i) => (
                <motion.div key={v.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.35 }} className="grid gap-2 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
                  <h3 className="text-lg font-semibold leading-7 text-indigo-600 dark:text-indigo-400">{v.title}</h3>
                  <p className="text-base font-normal leading-6 text-slate-600 dark:text-slate-400">{v.text}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section aria-labelledby="why">
            <div className="bg-indigo-600 px-6 py-10 text-white dark:bg-indigo-500 sm:px-10">
              <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
                <h2 id="why" className="text-2xl font-bold leading-8">Why choose us</h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  <li className="flex items-start gap-3 text-base font-normal leading-6 text-indigo-50"><span className="font-bold text-cyan-300">✓</span><span>Expert instructors with real-world experience</span></li>
                  <li className="flex items-start gap-3 text-base font-normal leading-6 text-indigo-50"><span className="font-bold text-cyan-300">✓</span><span>Hands-on projects and portfolios</span></li>
                  <li className="flex items-start gap-3 text-base font-normal leading-6 text-indigo-50"><span className="font-bold text-cyan-300">✓</span><span>Certificates and career support</span></li>
                  <li className="flex items-start gap-3 text-base font-normal leading-6 text-indigo-50"><span className="font-bold text-cyan-300">✓</span><span>Flexible learning and lifetime access</span></li>
                </ul>
              </div>
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
