import React from 'react';
import { NavLink } from 'react-router-dom';
import { BarChart3, Cpu, Database, GitCompare, LayoutDashboard, Trophy } from 'lucide-react';
import PublicThemeToggle from './PublicThemeToggle';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/benchmarks', label: 'Benchmarks', icon: Trophy },
  { to: '/hardware', label: 'Hardware', icon: Cpu },
  { to: '/results', label: 'Results', icon: BarChart3 },
  { to: '/systems', label: 'Systems', icon: Database },
];

const PublicNav = () => (
  <header className="border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-950/90">
    <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div>
        <NavLink to="/" className="inline-flex items-center gap-2 text-lg font-bold text-gray-950 dark:text-white">
          <GitCompare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          Benchmarkinator
        </NavLink>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Public hardware benchmark database
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `inline-flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
        <PublicThemeToggle />
      </div>
    </div>
  </header>
);

export default PublicNav;
