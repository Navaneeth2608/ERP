import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  Sun, 
  Moon, 
  LogOut, 
  User as UserIcon,
  ChevronDown,
  UserCheck
} from 'lucide-react';
import type { UserRoleType } from '../types';

const Header: React.FC = () => {
  const { user, activeRole, setActiveRole, logout } = useAuthStore();
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });
  
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [unreadNotifications] = useState(3);

  // Sync theme changes with DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const getRoleDisplayName = (role: UserRoleType) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const handleRoleChange = (role: UserRoleType) => {
    setActiveRole(role);
    setShowRoleMenu(false);
    // Redirect to home dashboard on role switch to refresh components
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
      {/* Search Bar */}
      <div className="relative w-80 max-w-xs md:max-w-md hidden sm:block">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
          <Search size={16} />
        </span>
        <input 
          type="text" 
          placeholder="Global search (files, courses, people)..."
          className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all duration-200"
          aria-label="Search"
        />
      </div>
      <div className="sm:hidden text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
        CAMPUS
      </div>

      {/* Header Utilities */}
      <div className="flex items-center gap-4">
        {/* Multi-Role Switcher */}
        {user && user.roles.length > 1 && (
          <div className="relative">
            <button 
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 text-xs font-semibold transition-colors"
              aria-expanded={showRoleMenu}
              aria-haspopup="true"
            >
              <UserCheck size={14} className="text-blue-500" />
              <span>Role: {activeRole ? getRoleDisplayName(activeRole) : 'None'}</span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
            
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Active Role
                </div>
                {user.roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center justify-between
                      ${activeRole === role ? 'font-bold text-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-700 dark:text-slate-350'}`}
                  >
                    <span>{getRoleDisplayName(role)}</span>
                    {activeRole === role && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button 
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="View notifications"
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse-subtle">
                {unreadNotifications}
              </span>
            )}
          </button>
        </div>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* User Session Profile Menu */}
        {user && (
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 hover:opacity-80 focus:outline-none transition-opacity"
              aria-expanded={showProfileMenu}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold leading-tight">{user.firstName} {user.lastName}</p>
                <p className="text-[10px] text-slate-400 leading-none">{user.email}</p>
              </div>
              <ChevronDown size={14} className="text-slate-400 hidden md:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 md:hidden">
                  <p className="text-xs font-bold leading-tight">{user.firstName} {user.lastName}</p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                </div>
                <button
                  onClick={() => { setShowProfileMenu(false); navigate('/tenant-setup'); }}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors flex items-center gap-2"
                >
                  <UserIcon size={14} className="text-slate-400" />
                  <span>Account Setup</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-xs text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors flex items-center gap-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
