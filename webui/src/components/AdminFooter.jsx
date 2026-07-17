import React from 'react';
import { ShieldCheck } from 'lucide-react';

const AdminFooter = () => (
  <footer className="shrink-0 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
    <div className="flex min-h-14 flex-col justify-center gap-1 px-6 py-2 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between dark:text-gray-400">
      <div className="inline-flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200">
        <ShieldCheck className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        <span>Benchmarkinator Admin</span>
      </div>
      <div>Management console</div>
    </div>
  </footer>
);

export default AdminFooter;
