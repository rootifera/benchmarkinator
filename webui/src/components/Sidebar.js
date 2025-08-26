import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Cpu, 
  Monitor, 
  BarChart3, 
  Settings, 
  X,
  LogOut,
  Key
} from 'lucide-react';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const { isAuthenticated, logout, apiKey } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Hardware', href: '/hardware', icon: Cpu },
    { name: 'Benchmarks', href: '/benchmarks', icon: Monitor },
    { name: 'Results', href: '/results', icon: BarChart3 },
    { name: 'Configurations', href: '/configurations', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-secondary-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-secondary-200">
            <h1 className="text-xl font-bold text-primary-600">Benchmarkinator</h1>
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden text-secondary-400 hover:text-secondary-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
                    ${isActive(item.href)
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-secondary-200">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center px-3 py-2 text-sm text-secondary-600">
                  <Key className="w-4 h-4 mr-2" />
                  <span className="truncate">{apiKey.substring(0, 20)}...</span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="text-sm text-secondary-500 text-center">
                Please set your API key
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
