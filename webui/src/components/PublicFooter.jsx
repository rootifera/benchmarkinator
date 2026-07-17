import React from 'react';
import { GitCompare } from 'lucide-react';

const PublicFooter = () => (
  <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
    <div className="mx-auto flex min-h-14 max-w-7xl flex-col justify-center gap-1 px-4 py-2 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8 dark:text-gray-400">
      <div className="inline-flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200">
        <GitCompare className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        <span>Benchmarkinator</span>
      </div>
      <div>Public hardware benchmark database</div>
    </div>
  </footer>
);

export default PublicFooter;
