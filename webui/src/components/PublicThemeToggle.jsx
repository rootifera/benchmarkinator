import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const APP_MODE = import.meta.env.VITE_APP_MODE || 'admin';

const PublicThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useAuth();

  if (APP_MODE !== 'public') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};

export default PublicThemeToggle;
