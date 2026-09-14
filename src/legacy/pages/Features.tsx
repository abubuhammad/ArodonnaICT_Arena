import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { RootState } from "../store";
import { User } from "../types";
import { CheckCircle, Users, BookOpen, Award, Zap, Globe } from "lucide-react";

// Components
import Navigation from "../components/layout/Navigation";
import Footer from "../components/layout/Footer";
import { Button } from "../components/ui/button";

const FeaturesPage: React.FC = () => {
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

  const features = [
    { icon: <BookOpen className="w-12 h-12 text-indigo-600" />, title: "Comprehensive Courses", description: "Curated, up-to-date tech courses for real skills." },
    { icon: <Users className="w-12 h-12 text-indigo-600" />, title: "Expert Instructors", description: "Learn from professionals with industry experience." },
    { icon: <Award className="w-12 h-12 text-indigo-600" />, title: "Certificates", description: "Earn certificates to showcase your achievements." },
    { icon: <Zap className="w-12 h-12 text-indigo-600" />, title: "Interactive Learning", description: "Hands-on projects, quizzes and practical assessments." },
    { icon: <Globe className="w-12 h-12 text-indigo-600" />, title: "Global Community", description: "Connect with learners and professionals worldwide." },
    { icon: <CheckCircle className="w-12 h-12 text-indigo-600" />, title: "Flexible Learning", description: "Learn at your own pace with lifetime access." },
  ];

  const instructorFeatures = [
    "Create and publish your own courses",
    "Set pricing and manage content",
    "Earn revenue from sales",
    "Access analytics and student insights",
    "Grow your brand and audience",
  ];

  const platformFeatures = [
    "Multi-currency support",
    "Secure payment processing",
    "Mobile responsive",
    "Dark mode",
    "Advanced search & filters",
    "Progress tracking",
    "Email notifications",
    "Category browsing",
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto w-full max-w-7xl px-6 pt-6">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} className="inline-flex items-center gap-2 text-sm font-medium leading-5 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">Back</button>
      </div>
      <Navigation user={user} onLogout={handleLogout} onDashboardNavigation={handleDashboardNavigation} />

      <main className="flex-grow py-16">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-6">
          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="max-w-3xl border-b border-slate-200 pb-16 dark:border-slate-800">
            <h1 className="text-5xl font-bold leading-tight text-slate-950 dark:text-slate-50">Everything you need to learn, teach, and grow.</h1>
            <p className="mt-4 text-base font-normal leading-6 text-slate-600 dark:text-slate-400">A practical learning platform for building skills, teaching expertise, and creating meaningful career momentum.</p>
          </motion.header>

          <section aria-labelledby="learning-features" className="mb-16">
            <h2 id="learning-features" className="mb-6 text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Learning features</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <motion.div key={i} whileHover={{ y: -2 }} className={`${i === 0 ? "md:col-span-2 lg:col-span-2" : ""} rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900`}>
                  <div className="mb-4">{React.cloneElement(f.icon, { className: `${i === 0 ? "h-14 w-14" : "h-10 w-10"} text-indigo-600 dark:text-indigo-400` })}</div>
                  <h3 className={`${i === 0 ? "text-2xl" : "text-lg"} font-semibold leading-7 text-slate-950 dark:text-slate-50`}>{f.title}</h3>
                  <p className="mt-2 text-base font-normal leading-6 text-slate-600 dark:text-slate-400">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section aria-labelledby="for-instructors" className="mb-16">
            <h2 id="for-instructors" className="mb-6 text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">For instructors</h2>
            <div className="bg-indigo-600 p-8 text-white dark:bg-indigo-500">
              <div className="grid md:grid-cols-2 gap-4">
                {instructorFeatures.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-indigo-600 mt-1" />
                    <p className="text-base font-normal leading-6 text-indigo-50">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="platform-highlights" className="mb-16">
            <h2 id="platform-highlights" className="mb-6 text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Platform highlights</h2>
            <div className="grid divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
              {platformFeatures.map((p, i) => (
                <motion.div key={i} whileHover={{ y: -1 }} className="p-4 text-center">
                  <p className="text-sm font-semibold leading-5 text-slate-700 dark:text-slate-300">{p}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section aria-labelledby="why-platform" className="mb-12 bg-white dark:bg-gray-900 rounded-2xl p-10 shadow">
            <h2 id="why-platform" className="text-2xl font-bold leading-8 text-slate-950 dark:text-slate-50">Why our platform?</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { title: 'Quality Content', items: ['Expert courses', 'Hands-on projects', 'Regular updates'] },
                { title: 'Community Support', items: ['Instructor feedback', 'Peer learning', 'Forums'] },
                { title: 'Success Metrics', items: ['Track progress', 'Certificates', 'Portfolio-ready projects'] },
              ].map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-xl font-semibold text-indigo-600 mb-3">{section.title}</h3>
                  <ul className="space-y-2">
                    {section.items.map((it, j) => (
                      <li key={j} className="text-gray-700 dark:text-gray-300">{it}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <div className="text-center py-12">
            <h3 className="text-3xl font-bold mb-4">Ready to experience these features?</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Join learners and instructors building careers and audiences on Arodonna.</p>
            <div className="flex justify-center gap-4">
              <Button onClick={() => navigate('/courses')} className="bg-indigo-600 text-white px-6 py-3">Explore Courses</Button>
              <Button onClick={() => navigate('/signup')} className="bg-purple-600 text-white px-6 py-3">Get Started</Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
