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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))}
          className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          ← Back
        </button>
      </div>
      <Navigation
        user={user}
        onLogout={handleLogout}
        onDashboardNavigation={handleDashboardNavigation}
      />

      <main className="py-16 flex-grow">
        <div className="max-w-6xl mx-auto px-4">
          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">About Arodonna ICT Arena</h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">Empowering learners worldwide with practical tech education and meaningful career outcomes.</p>
          </motion.header>

          <section aria-labelledby="mission" className="space-y-8 mb-10">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow">
              <h2 id="mission" className="text-3xl font-bold text-indigo-600 mb-3">Our Mission</h2>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">We provide practical, industry-aligned tech education that helps learners build skills employers need. Our goal is to make that education accessible, affordable, and relevant.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
                <h3 className="text-2xl font-semibold text-indigo-600 mb-2">Our Vision</h3>
                <p className="text-gray-700 dark:text-gray-300">To be the go-to platform for learners and instructors who want measurable career impact through practical learning experiences.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow">
                <h3 className="text-2xl font-semibold text-indigo-600 mb-2">Who We Serve</h3>
                <p className="text-gray-700 dark:text-gray-300">Students seeking career transitions, self-learners looking to upskill, and instructors aiming to reach a global audience.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="values" className="mb-12">
            <h2 id="values" className="text-3xl font-bold mb-6">Our Core Values</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Excellence', text: 'High-quality content and instructors.' },
                { title: 'Accessibility', text: 'Affordable education for every learner.' },
                { title: 'Innovation', text: 'Continuous platform and curriculum improvement.' },
                { title: 'Community', text: 'Supportive peer and instructor network.' },
                { title: 'Integrity', text: 'Transparent and fair policies.' },
                { title: 'Empowerment', text: 'Tools that help learners succeed.' },
              ].map((v, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-indigo-600 mb-2">{v.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{v.text}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section aria-labelledby="why" className="mb-12">
            <h2 id="why" className="text-3xl font-bold mb-6">Why Choose Us</h2>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8">
              <ul className="grid md:grid-cols-2 gap-4">
                <li className="flex items-start gap-3"><span className="text-indigo-600 font-bold">✓</span><span>Expert instructors with real-world experience</span></li>
                <li className="flex items-start gap-3"><span className="text-indigo-600 font-bold">✓</span><span>Hands-on projects and portfolios</span></li>
                <li className="flex items-start gap-3"><span className="text-indigo-600 font-bold">✓</span><span>Certificates and career support</span></li>
                <li className="flex items-start gap-3"><span className="text-indigo-600 font-bold">✓</span><span>Flexible learning and lifetime access</span></li>
              </ul>
            </div>
          </section>

          <section aria-labelledby="cta" className="text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
              <h3 id="cta" className="text-2xl font-bold mb-4">Ready to get started?</h3>
              <div className="flex justify-center gap-4">
                <Button onClick={() => navigate('/courses')} className="bg-indigo-600 text-white px-6 py-3">Browse Courses</Button>
                <Button variant="outline" onClick={() => navigate('/signup')} className="px-6 py-3">Create Account</Button>
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
