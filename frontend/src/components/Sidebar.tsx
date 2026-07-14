import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  BookOpen, 
  Calendar, 
  Clock, 
  CheckSquare, 
  CreditCard, 
  BookMarked, 
  Home, 
  Truck, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Building
} from 'lucide-react';
import type { UserRoleType } from '../types';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
}

// Navigation lists mapped to specific roles
const ROLE_NAV_MAP: Record<UserRoleType, NavItem[]> = {
  super_admin: [
    { label: 'Platform Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Tenant Settings', path: '/tenant-setup', icon: Settings },
    { label: 'Global Logs', path: '/audit-logs', icon: ShieldAlert },
  ],
  college_admin: [
    { label: 'Admin Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Institution Profile', path: '/tenant-setup', icon: Building },
    { label: 'User Directory', path: '/users', icon: Users },
    { label: 'Curriculum & Structure', path: '/curriculum', icon: BookOpen },
    { label: 'Academic Calendar', path: '/calendar', icon: Calendar },
  ],
  principal: [
    { label: 'Principal Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Timetable Overview', path: '/timetable', icon: Clock },
    { label: 'Departments & Batches', path: '/departments', icon: Building },
  ],
  hod: [
    { label: 'HOD Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Timetable Builder', path: '/timetable-builder', icon: Clock },
    { label: 'Faculty Roster', path: '/faculty-list', icon: Users },
    { label: 'Department Structure', path: '/department-curriculum', icon: BookOpen },
  ],
  faculty: [
    { label: 'Faculty Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Class Timetable', path: '/my-timetable', icon: Clock },
    { label: 'Mark Attendance', path: '/mark-attendance', icon: CheckSquare },
    { label: 'Student Gradebook', path: '/gradebook', icon: BookOpen },
  ],
  student: [
    { label: 'Student Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'My Timetable', path: '/student-timetable', icon: Clock },
    { label: 'Attendance Report', path: '/student-attendance', icon: CheckSquare },
    { label: 'Fee Payments', path: '/fee-payment', icon: CreditCard },
  ],
  parent: [
    { label: 'Parent Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Child Attendance', path: '/child-attendance', icon: CheckSquare },
    { label: 'Fee Invoices', path: '/child-fees', icon: CreditCard },
    { label: 'Faculty Messages', path: '/inbox', icon: MessageSquare },
  ],
  accountant: [
    { label: 'Finance Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Fee Structure Builder', path: '/fee-builder', icon: CreditCard },
    { label: 'Invoice Receipts', path: '/receipts', icon: Settings },
  ],
  librarian: [
    { label: 'Library Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Catalog Search', path: '/catalog', icon: BookMarked },
    { label: 'Book Circulation', path: '/circulation', icon: Settings },
  ],
  support_staff: [
    { label: 'Helpdesk Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Room Maintenance', path: '/maintenance', icon: Home },
    { label: 'Transport Status', path: '/transport', icon: Truck },
  ]
};

const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { activeRole, user } = useAuthStore();
  const navItems = activeRole ? ROLE_NAV_MAP[activeRole] || [] : [];

  // Helper to format role names prettily
  const getRoleDisplayName = (role: UserRoleType) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <aside 
      className={`fixed top-0 left-0 h-full bg-slate-900 text-slate-100 flex flex-col transition-all duration-300 z-30 shadow-xl border-r border-slate-800
        ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            CAMPUS ERP
          </span>
        )}
        {collapsed && (
          <span className="text-xl font-black mx-auto text-blue-400">C</span>
        )}
        
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* User Session Metadata */}
      {!collapsed && user && (
        <div className="p-4 border-b border-slate-800 bg-slate-950/40">
          <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Active Workspace</p>
          <p className="text-sm font-bold truncate mt-0.5">{user.firstName} {user.lastName}</p>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-900/40 border border-blue-700/50 text-blue-300 mt-1">
            {activeRole ? getRoleDisplayName(activeRole) : 'No Role'}
          </span>
        </div>
      )}

      {/* Navigation Tree Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }
                ${collapsed ? 'justify-center px-0' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 text-center text-xs text-slate-500">
        {!collapsed ? 'v1.0.0 © Campus' : 'v1.0'}
      </div>
    </aside>
  );
};

export default Sidebar;
