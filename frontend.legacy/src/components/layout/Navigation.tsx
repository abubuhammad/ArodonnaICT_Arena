import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Sun, Moon } from 'lucide-react';
import { User } from '../../types';
import { useDispatch } from 'react-redux';
import { requestInstructorRole } from '../../store/slices/authSlice';

interface NavigationProps {
  user: User | null;
  onLogout: () => void;
  onDashboardNavigation: () => void;
}

const Navigation: React.FC<NavigationProps> = ({
  user,
  onLogout,
  onDashboardNavigation,
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const dispatch = useDispatch();

  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    // Default to system preference if nothing saved
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Apply theme on mount and when toggled
  React.useEffect(() => {
    const applyTheme = (dark: boolean) => {
      const root = document.documentElement;
      const body = document.body;
      // add a transient transition class for smoothness
      root.classList.add('theme-transition');
      body.classList.add('theme-transition');
      window.setTimeout(() => {
        root.classList.remove('theme-transition');
        body.classList.remove('theme-transition');
      }, 300);

      if (dark) {
        root.classList.add('dark');
        body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        root.classList.remove('dark');
        body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };

    applyTheme(isDark);
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);
  
  const handleRemindAdmin = async () => {
  if (!user) return;
  const userId = (user as any).id || (user as any)._id;
  try {
  await dispatch<any>(requestInstructorRole(userId));
  alert('Approval reminder sent to admin.');
  } catch (e) {
  console.error('Failed to send reminder', e);
  }
  };

  const handleNav = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
  <nav className="bg-white dark:bg-gray-950/80 backdrop-blur shadow-md sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand - Always visible */}
          <div className="flex items-center space-x-4">
          <img 
          src="/logo192.png" 
          alt="Logo" 
          className="h-10 w-10 rounded-lg" 
          />
            <span className="text-lg sm:text-xl font-bold text-indigo-600">
              Arodonna ICT Arena
            </span>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-indigo-600 p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <button onClick={() => handleNav("/courses")} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600">
              Courses
            </button>
            <button onClick={() => handleNav("/features")} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600">
              Features
            </button>
            <button onClick={() => handleNav("/about")} className="text-gray-600 dark:text-gray-300 hover:text-indigo-600">
              About Us
            </button>

            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              aria-pressed={isDark}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span className="sr-only">{isDark ? 'Light mode' : 'Dark mode'}</span>
            </button>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  Role: <span className="font-semibold capitalize">{user.role}</span>
                </span>
                <div className="flex items-center space-x-4">
                  {user.role === "pending" ? (
                    <>
                      <span className="text-amber-600">Instructor approval pending</span>
                      <button
                        onClick={handleRemindAdmin}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600"
                      >
                        Remind Admin
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={onDashboardNavigation}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                    >
                      {user.role === "admin"
                        ? "Admin Dashboard"
                        : user.role === "instructor"
                        ? "Instructor Dashboard"
                        : "Student Dashboard"}
                    </button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                  >
                    Logout
                  </motion.button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <button onClick={() => handleNav("/courses")} className="block w-full text-left px-3 py-2 text-gray-600 hover:text-indigo-600">
              Courses
            </button>
            <button onClick={() => handleNav("/features")} className="block w-full text-left px-3 py-2 text-gray-600 hover:text-indigo-600">
              Features
            </button>
            <button onClick={() => handleNav("/about")} className="block w-full text-left px-3 py-2 text-gray-600 hover:text-indigo-600">
              About Us
            </button>
            
            {user ? (
              <>
                <div className="px-3 py-2 text-gray-700">
                  Role: <span className="font-semibold capitalize">{user.role}</span>
                </div>
                <button
                  onClick={onDashboardNavigation}
                  className="w-full text-left px-3 py-2 text-indigo-600 hover:bg-indigo-50"
                >
                  {user.role === "admin"
                    ? "Admin Dashboard"
                    : user.role === "instructor"
                    ? "Instructor Dashboard"
                    : "Student Dashboard"}
                </button>
                <button
                  onClick={onLogout}
                  className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="w-full text-left px-3 py-2 text-indigo-600 hover:bg-indigo-50"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
