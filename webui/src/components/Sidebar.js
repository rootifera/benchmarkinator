import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Cpu, 
  Wrench, 
  BarChart3, 
  FileText, 
  LogOut,
  Sun,
  Moon
} from 'lucide-react';

const Sidebar = () => {
  const { isAuthenticated, logout, darkMode, toggleDarkMode } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Hardware', href: '/hardware', icon: Cpu },
    { name: 'Build PC', href: '/configurations', icon: Wrench },
    { name: 'Benchmarks', href: '/benchmarks', icon: BarChart3 },
    { name: 'Results', href: '/results', icon: FileText },
  ];

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-64 min-h-screen p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Benchmarkinator
        </h1>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      <nav className="space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive(item.href)
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }
              `}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              API Status
            </span>
            <div className={`w-2 h-2 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
          
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Disconnect
            </button>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
              Not connected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
