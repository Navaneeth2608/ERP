import React from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Building, 
  Calendar, 
  CheckSquare, 
  Clock, 
  CreditCard, 
  BookOpen, 
  BookMarked,
  Shield,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const Dashboard: React.FC = () => {
  const { user, activeRole } = useAuthStore();
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (!user || !activeRole) return null;

  // --- STAT CARD PRIMITIVE ---
  const StatCard = ({ title, value, change, icon: Icon, colorClass = "text-blue-500 bg-blue-50 dark:bg-blue-900/10" }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all duration-300">
      <div>
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-extrabold mt-1 tracking-tight text-slate-800 dark:text-white">{value}</h3>
        {change && (
          <p className="text-[11px] font-medium text-emerald-500 flex items-center gap-0.5 mt-1">
            <TrendingUp size={12} />
            <span>{change} vs last month</span>
          </p>
        )}
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
  );

  // --- DASHBOARD SWITCHER BY ROLE ---
  const renderDashboardContent = () => {
    switch (activeRole) {
      case 'super_admin':
        // --- 1. SUPER ADMIN PLATFORM ---
        const saData = [
          { name: 'Jan', tenants: 5 },
          { name: 'Feb', tenants: 8 },
          { name: 'Mar', tenants: 12 },
          { name: 'Apr', tenants: 18 },
          { name: 'May', tenants: 24 },
          { name: 'Jun', tenants: 32 }
        ];
        return (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Active Tenants" value="32" change="+12%" icon={Building} />
              <StatCard title="System Users" value="45,200" change="+8%" icon={Users} colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" />
              <StatCard title="License Revenue" value="$84,500" change="+15%" icon={CreditCard} colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/10" />
              <StatCard title="Server Uptime" value="99.98%" icon={Shield} colorClass="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Analytics Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Tenant Registration Trend</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={saData}>
                      <defs>
                        <linearGradient id="colorTenants" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Area type="monotone" dataKey="tenants" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTenants)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Platform Administration</h4>
                  <div className="space-y-3">
                    <button 
                      onClick={() => navigate('/tenant-setup')}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors text-xs font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <Plus size={14} className="text-blue-500" />
                        Configure System Tenant
                      </span>
                      <ArrowRight size={14} className="text-slate-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors text-xs font-semibold">
                      <span className="flex items-center gap-2">
                        <Users size={14} className="text-emerald-500" />
                        Manage System Admins
                      </span>
                      <ArrowRight size={14} className="text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 text-amber-600 dark:text-amber-400 text-xs flex gap-2 mt-6">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>2 tenants are currently approaching billing cycles.</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'college_admin':
        // --- 2. COLLEGE ADMIN INSTITUTIONAL ---
        const caData = [
          { name: 'Engineering', students: 1200 },
          { name: 'Management', students: 800 },
          { name: 'Science', students: 600 },
          { name: 'Arts', students: 450 }
        ];
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Active Campuses" value="2" icon={Building} />
              <StatCard title="Total Departments" value="8" icon={BookOpen} colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" />
              <StatCard title="Enrolled Students" value="3,050" change="+5%" icon={Users} colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/10" />
              <StatCard title="System Audits" value="142" icon={FileText} colorClass="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Student Distribution by Department</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={caData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-100 dark:stroke-slate-800" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="students" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Setup Checklist</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 h-4 w-4" disabled />
                    <span className="text-xs text-slate-500 dark:text-slate-400 line-through">Configure Branding Logos</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 h-4 w-4" disabled />
                    <span className="text-xs text-slate-500 dark:text-slate-400 line-through">Define Campus Locations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 h-4 w-4" disabled />
                    <span className="text-xs text-slate-500 dark:text-slate-400 line-through">Create Academic Calendar</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="rounded border-slate-300 text-blue-500 focus:ring-blue-500 h-4 w-4" disabled />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Build Curriculum Structures</span>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/tenant-setup')}
                    className="w-full mt-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors"
                  >
                    Manage Setup Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'principal':
        // --- 3. PRINCIPAL ACADEMIC ---
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Active Batches" value="12" icon={Calendar} />
              <StatCard title="Average Attendance" value="88.4%" icon={CheckSquare} colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" />
              <StatCard title="Upcoming Examinations" value="4 Modules" icon={Clock} colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/10" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center py-12">
              <Shield size={48} className="text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">Principal's Command Portal</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                No active critical exceptions reported. All campus departments, faculty modules, and class schedules are running under standard operating conditions.
              </p>
            </div>
          </div>
        );

      case 'hod':
        // --- 4. HOD DEPARTMENT ---
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Department Faculty" value="18 members" icon={Users} />
              <StatCard title="Active Sections" value="6 Batches" icon={Building} colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" />
              <StatCard title="Curriculum Completion" value="64%" icon={BookOpen} colorClass="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center py-12">
              <Clock size={48} className="text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">Department Timetable Builder</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Review conflict reports or initiate schedule planning schemas. Timetable builder will launch in Phase 2.
              </p>
            </div>
          </div>
        );

      case 'faculty':
        // --- 5. FACULTY CLASSROOM ---
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Assigned Subjects" value="3 Courses" icon={BookOpen} />
              <StatCard title="Today's Sessions" value="2 Classes" icon={Clock} colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" />
              <StatCard title="Unsubmitted Attendance" value="1 Session" icon={CheckSquare} colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/10" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Today's Class Schedule</h4>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Advanced Algorithms (CS-401)</p>
                    <p className="text-slate-400 mt-0.5">Section A • Room 304</p>
                  </div>
                  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded font-semibold">09:00 AM - 10:30 AM</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-100">Discrete Mathematics (CS-202)</p>
                    <p className="text-slate-400 mt-0.5">Section B • Room 102</p>
                  </div>
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-semibold">11:00 AM - 12:30 PM</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'student':
        // --- 6. STUDENT PORTAL ---
        const studentPie = [
          { name: 'Attended', value: 85 },
          { name: 'Absent', value: 15 }
        ];
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Current CGPA" value="3.92 / 4.0" icon={BookOpen} />
              <StatCard title="Attendance Average" value="85%" icon={CheckSquare} colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" />
              <StatCard title="Active Invoices Due" value="$0.00" icon={CreditCard} colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/10" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Schedule */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Today's Class Schedule</h4>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-850 dark:text-slate-100">Database Systems Laboratory</p>
                      <p className="text-slate-400 mt-0.5">Room 501 • Dr. Charles Xavier</p>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold">01:30 PM - 03:00 PM</span>
                  </div>
                </div>
              </div>

              {/* Attendance Breakdown */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col items-center">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 self-start uppercase tracking-wider">Attendance Status</h4>
                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={studentPie}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present (85%)</span>
                  <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent (15%)</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'parent':
        // --- 7. PARENT VIEW ---
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Ward Enrolled" value="Peter Parker" icon={Users} />
              <StatCard title="Ward Attendance" value="85%" icon={CheckSquare} colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" />
              <StatCard title="Outstanding Dues" value="No balance" icon={CreditCard} colorClass="text-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center py-12">
              <Users size={48} className="text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">Parent Portal Overview</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Review your child's continuous assessments, grade sheets, attendance compliance metrics, and invoice statements.
              </p>
            </div>
          </div>
        );

      case 'accountant':
        // --- 8. ACCOUNTANT CASHIER ---
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Fee Collection Status" value="84% collected" icon={CreditCard} />
              <StatCard title="Outstanding Dues" value="$12,400" icon={AlertCircle} colorClass="text-rose-500 bg-rose-50 dark:bg-rose-950/20" />
              <StatCard title="Refund Requests" value="0 Pending" icon={CheckSquare} colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center py-12">
              <CreditCard size={48} className="text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">Fee Management Dashboard</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Generate new fee structures, review transaction history log, or export invoice reports. Fee features launch in Phase 3.
              </p>
            </div>
          </div>
        );

      case 'librarian':
        // --- 9. LIBRARIAN CIRCULATION ---
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard title="Total Catalog Books" value="14,200 volumes" icon={BookMarked} />
              <StatCard title="Currently Checked Out" value="382 Books" icon={Users} colorClass="text-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" />
              <StatCard title="Overdue Returns" value="12 Books" icon={AlertCircle} colorClass="text-amber-500 bg-amber-50 dark:bg-amber-900/10" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center py-12">
              <BookMarked size={48} className="text-slate-400 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-800 dark:text-white">Library Circulation Desk</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Configure book issues/returns, track fines ledger, or run catalog search protocols. Library features launch in Phase 4.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center py-12">
            <h4 className="text-lg font-bold text-slate-800 dark:text-white">Dashboard Under Development</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
              This specific dashboard shell is currently being configured.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-850 dark:text-white tracking-tight">
            Welcome back, {user.firstName}!
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{today}</p>
        </div>
        
        {/* Quick Date Display */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 shadow-sm w-fit self-start sm:self-auto text-xs font-semibold text-slate-500">
          <Calendar size={14} className="text-blue-500" />
          <span>Academic Term: Fall 2026</span>
        </div>
      </div>

      {/* Role Switch Alert for Multi-Role Profile */}
      {user.roles.length > 1 && (
        <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users size={16} />
            <span>You have access to multiple user profiles. Use the role switcher in the top bar to swap dashboards.</span>
          </div>
        </div>
      )}

      {/* Render Specific Dashboard */}
      {renderDashboardContent()}
    </div>
  );
};

export default Dashboard;
