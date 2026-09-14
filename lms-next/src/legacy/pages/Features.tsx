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
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto w-full px-4 pt-4">
        <button onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/"))} className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-2">← Back</button>
      </div>
      <Navigation user={user} onLogout={handleLogout} onDashboardNavigation={handleDashboardNavigation} />

      <main className="py-16 flex-grow">
        <div className="max-w-7xl mx-auto px-4">
          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4">Powerful Features</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Everything you need to learn, teach and grow in the tech industry.</p>
          </motion.header>

          <section aria-labelledby="learning-features" className="mb-16">
            <h2 id="learning-features" className="text-3xl font-bold mb-6 text-center">Learning Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div key={i} whileHover={{ y: -6 }} className="bg-white dark:bg-gray-900 rounded-xl p-6 shadow hover:shadow-lg transition">
                  <div className="mb-4">{f.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                  <p className="text-gray-700 dark:text-gray-300">{f.description}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section aria-labelledby="for-instructors" className="mb-16">
            <h2 id="for-instructors" className="text-3xl font-bold mb-6 text-center">For Instructors</h2>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-4">
                {instructorFeatures.map((t, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-indigo-600 mt-1" />
                    <p className="text-gray-700 dark:text-gray-200">{t}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section aria-labelledby="platform-highlights" className="mb-16">
            <h2 id="platform-highlights" className="text-3xl font-bold mb-6 text-center">Platform Highlights</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {platformFeatures.map((p, i) => (
                <motion.div key={i} whileHover={{ scale: 1.02 }} className="bg-white dark:bg-gray-900 rounded-lg p-4 text-center border">
                  <p className="font-semibold text-gray-700 dark:text-gray-200">{p}</p>
                </motion.div>
              ))}
            </div>
          </section>

          <section aria-labelledby="why-platform" className="mb-12 bg-white dark:bg-gray-900 rounded-2xl p-10 shadow">
            <h2 id="why-platform" className="text-3xl font-bold mb-6 text-center">Why Our Platform?</h2>
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
