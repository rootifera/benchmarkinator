import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Cpu, 
  Wrench, 
  BarChart3, 
  FileText, 
  LogOut,
  Sun,
  Moon,
  User
} from 'lucide-react';

const Sidebar = () => {
  const { user, isAuthenticated, logout, darkMode, toggleDarkMode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, protected: true },
    { name: 'Components', href: '/hardware', icon: Cpu, protected: true },
    { name: 'Test Systems', href: '/testsystems', icon: Wrench, protected: true },
    { name: 'Benchmarks', href: '/benchmarks', icon: BarChart3, protected: true },
    { name: 'Results', href: '/results', icon: FileText, protected: false },
  ];

  const isActive = (href) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigation = (href, isProtected) => {
    if (isProtected && !isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(href);
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
          const isNavActive = isActive(item.href);
          const isDisabled = item.protected && !isAuthenticated;
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.href, item.protected)}
              disabled={isDisabled}
              className={`
                flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isNavActive
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                  : isDisabled
                  ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                }
              `}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          {isAuthenticated ? (
            <>
              <div className="flex items-center mb-4 px-3 py-2">
                <User className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.username || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.role || 'Admin'}
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </button>
            </>
          ) : (
            <div className="px-3 py-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Not authenticated
              </p>
              <Link
                to="/login"
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
              >
                <User className="w-5 h-5 mr-3" />
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
