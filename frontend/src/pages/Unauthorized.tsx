import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors duration-200">
      <div className="text-center max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-lg p-8">
        
        {/* Shield Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 flex items-center justify-center text-rose-500 mx-auto mb-6">
          <ShieldAlert size={36} />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-slate-850 dark:text-slate-100 mb-2">
          403 - Forbidden Access
        </h1>
        
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
          Your active user role does not possess the permissions required to view this directory workspace. Please contact your campus system administrator or switch to an authorized role.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-colors"
          >
            <Home size={16} />
            <span>Go to Dashboard</span>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 font-semibold text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default Unauthorized;
