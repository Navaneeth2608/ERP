import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { ChevronRight, Home } from 'lucide-react';

const AppShell: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  // Automatically collapse sidebar on smaller screens (tablet size and below)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    
    // Run initially and register listener
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate dynamic breadcrumbs from location pathname
  const generateBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    if (pathnames.length === 0) return null;

    const formatBreadcrumb = (str: string) => {
      return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-6" aria-label="Breadcrumb">
        <Link 
          to="/" 
          className="flex items-center gap-1 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
        >
          <Home size={14} />
          <span>Home</span>
        </Link>
        
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;

          return (
            <React.Fragment key={to}>
              <ChevronRight size={12} className="text-slate-400" />
              {last ? (
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {formatBreadcrumb(value)}
                </span>
              ) : (
                <Link 
                  to={to} 
                  className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                  {formatBreadcrumb(value)}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-200">
      {/* Collapsible Sidebar Navigation */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300
          ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}
      >
        {/* Top Header Bar */}
        <Header />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {/* Breadcrumb Trail */}
          {generateBreadcrumbs()}
          
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppShell;
