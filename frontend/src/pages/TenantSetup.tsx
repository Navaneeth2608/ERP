import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as zod from 'zod';
import { MockApiService } from '../api/mock';
import type { Tenant, Campus, AcademicCalendarEvent } from '../types';
import { 
  Building, 
  MapPin, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Globe, 
  Mail, 
  Phone, 
  Loader2 
} from 'lucide-react';

const tenantSchema = zod.object({
  name: zod.string().min(3, 'Institutional name is required'),
  website: zod.string().url('Please enter a valid website URL'),
  email: zod.string().email('Please enter a valid email address'),
  phone: zod.string().min(6, 'Please enter a contact number'),
  address: zod.string().min(10, 'Please enter a full address description'),
});

const campusSchema = zod.object({
  name: zod.string().min(3, 'Campus name is required'),
  code: zod.string().min(2, 'Campus code is required (e.g., MMC)'),
  address: zod.string().min(10, 'Address is required'),
  contactEmail: zod.string().email('Valid contact email is required'),
  contactPhone: zod.string().min(6, 'Valid contact phone is required'),
});

const eventSchema = zod.object({
  title: zod.string().min(3, 'Title is required'),
  description: zod.string().optional(),
  startDate: zod.string().min(10, 'Start date is required'),
  endDate: zod.string().min(10, 'End date is required'),
  type: zod.enum(['holiday', 'exam', 'term_start', 'term_end', 'event']),
});

type TenantFormData = zod.infer<typeof tenantSchema>;
type CampusFormData = zod.infer<typeof campusSchema>;
type EventFormData = zod.infer<typeof eventSchema>;

const TenantSetup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'campuses' | 'calendar'>('profile');
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [events, setEvents] = useState<AcademicCalendarEvent[]>([]);
  
  // Loading indicators
  const [loading, setLoading] = useState(false);
  const [crudLoading, setCrudLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // CRUD Forms/Modals States
  const [showCampusModal, setShowCampusModal] = useState(false);
  const [editingCampus, setEditingCampus] = useState<Campus | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  // Initialize Forms
  const { register: regTenant, handleSubmit: subTenant, reset: resetTenant, formState: { errors: errTenant } } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
  });

  const { register: regCampus, handleSubmit: subCampus, reset: resetCampus, formState: { errors: errCampus } } = useForm<CampusFormData>({
    resolver: zodResolver(campusSchema),
  });

  const { register: regEvent, handleSubmit: subEvent, reset: resetEvent, formState: { errors: errEvent } } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  // Fetch baseline dataset
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, cData, eData] = await Promise.all([
        MockApiService.getTenantProfile(),
        MockApiService.getCampuses(),
        MockApiService.getCalendarEvents()
      ]);
      setTenant(tData);
      setCampuses(cData);
      setEvents(eData);
      
      resetTenant({
        name: tData.name,
        website: tData.website,
        email: tData.email,
        phone: tData.phone,
        address: tData.address,
      });
    } catch (error) {
      console.error('Failed to load setup records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Profile Form Submission
  const onTenantSubmit = async (data: TenantFormData) => {
    setCrudLoading(true);
    setSuccessMsg(null);
    try {
      const updated = await MockApiService.updateTenantProfile(data);
      setTenant(updated);
      setSuccessMsg('Institutional profile successfully saved.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setCrudLoading(false);
    }
  };

  // Palette color switcher
  const handlePaletteSelect = async (primary: string) => {
    if (!tenant) return;
    try {
      const updated = await MockApiService.updateTenantProfile({
        config: { ...tenant.config, primaryColor: primary }
      });
      setTenant(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Campus Create or Update
  const onCampusSubmit = async (data: CampusFormData) => {
    setCrudLoading(true);
    try {
      if (editingCampus) {
        const updated = await MockApiService.updateCampus(editingCampus.id, data);
        setCampuses(prev => prev.map(c => c.id === editingCampus.id ? updated : c));
      } else {
        const created = await MockApiService.createCampus(data);
        setCampuses(prev => [...prev, created]);
      }
      setShowCampusModal(false);
      setEditingCampus(null);
      resetCampus();
    } catch (error) {
      console.error(error);
    } finally {
      setCrudLoading(false);
    }
  };

  const handleEditCampus = (campus: Campus) => {
    setEditingCampus(campus);
    resetCampus({
      name: campus.name,
      code: campus.code,
      address: campus.address,
      contactEmail: campus.contactEmail,
      contactPhone: campus.contactPhone
    });
    setShowCampusModal(true);
  };

  const handleDeleteCampus = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campus location?')) return;
    try {
      await MockApiService.deleteCampus(id);
      setCampuses(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  // Calendar Event Submission
  const onEventSubmit = async (data: EventFormData) => {
    setCrudLoading(true);
    try {
      const created = await MockApiService.createCalendarEvent(data);
      setEvents(prev => [...prev, created]);
      setShowEventModal(false);
      resetEvent();
    } catch (error) {
      console.error(error);
    } finally {
      setCrudLoading(false);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    if (!confirm('Remove this event from academic logs?')) return;
    try {
      await MockApiService.deleteCalendarEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">Tenant Management</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Configure institutional attributes, branding tokens, campuses, and term schedules.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 text-sm font-semibold">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all
            ${activeTab === 'profile' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <Building size={16} />
          <span>Profile & Branding</span>
        </button>
        <button 
          onClick={() => setActiveTab('campuses')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all
            ${activeTab === 'campuses' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <MapPin size={16} />
          <span>Campuses</span>
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all
            ${activeTab === 'calendar' ? 'border-blue-500 text-blue-500' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
        >
          <Calendar size={16} />
          <span>Academic Calendar</span>
        </button>
      </div>

      {/* TAB 1: PROFILE SETUP */}
      {activeTab === 'profile' && tenant && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main profile form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-6 uppercase tracking-wider">Institutional Profile</h3>
            
            {successMsg && (
              <div className="mb-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 text-xs">
                {successMsg}
              </div>
            )}

            <form onSubmit={subTenant(onTenantSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Institution Name</label>
                <input 
                  type="text" 
                  {...regTenant('name')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                {errTenant.name && <p className="text-[11px] text-rose-500 mt-1">{errTenant.name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Official Website</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Globe size={14} /></span>
                    <input 
                      type="text" 
                      {...regTenant('website')}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  {errTenant.website && <p className="text-[11px] text-rose-500 mt-1">{errTenant.website.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Administrative Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Mail size={14} /></span>
                    <input 
                      type="email" 
                      {...regTenant('email')}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  {errTenant.email && <p className="text-[11px] text-rose-500 mt-1">{errTenant.email.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Contact Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Phone size={14} /></span>
                    <input 
                      type="text" 
                      {...regTenant('phone')}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  {errTenant.phone && <p className="text-[11px] text-rose-500 mt-1">{errTenant.phone.message}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Institution Address</label>
                  <input 
                    type="text" 
                    {...regTenant('address')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  {errTenant.address && <p className="text-[11px] text-rose-500 mt-1">{errTenant.address.message}</p>}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={crudLoading}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                {crudLoading && <Loader2 size={12} className="animate-spin" />}
                <span>Save Profile Changes</span>
              </button>
            </form>
          </div>

          {/* Branding Sidebar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Logo Branding</h3>
              <div className="flex items-center gap-4">
                <img 
                  src={tenant.config.logoUrl || 'https://via.placeholder.com/128'} 
                  alt="Institution logo" 
                  className="w-16 h-16 object-cover rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 p-1"
                />
                <div>
                  <p className="text-xs font-semibold">Active Institution Logo</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG formats supported</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 uppercase tracking-wider">Primary Theme Palette</h3>
              <div className="flex gap-3">
                {['#3b82f6', '#10b981', '#6366f1', '#8b5cf6'].map((color) => (
                  <button 
                    key={color}
                    onClick={() => handlePaletteSelect(color)}
                    style={{ backgroundColor: color }}
                    className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 focus:ring-2 focus:ring-slate-400 flex items-center justify-center text-white"
                    aria-label={`Select primary color ${color}`}
                  >
                    {tenant.config.primaryColor === color && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPUSES LIST */}
      {activeTab === 'campuses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Campus Locations Directory</h3>
            <button 
              onClick={() => { setEditingCampus(null); resetCampus(); setShowCampusModal(true); }}
              className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <Plus size={14} />
              <span>Add Campus</span>
            </button>
          </div>

          {/* Campuses Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Campus Name</th>
                  <th className="p-4">Code</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-350">
                {campuses.map(campus => (
                  <tr key={campus.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850 transition-colors">
                    <td className="p-4 font-semibold text-slate-800 dark:text-slate-100">{campus.name}</td>
                    <td className="p-4 font-mono">{campus.code}</td>
                    <td className="p-4 max-w-xs truncate">{campus.address}</td>
                    <td className="p-4">{campus.contactEmail}</td>
                    <td className="p-4">{campus.contactPhone}</td>
                    <td className="p-4 flex justify-center gap-3">
                      <button 
                        onClick={() => handleEditCampus(campus)}
                        className="p-1 hover:text-blue-500 transition-colors"
                        aria-label="Edit campus"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCampus(campus.id)}
                        className="p-1 hover:text-rose-500 transition-colors"
                        aria-label="Delete campus"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CAMPUS MODAL */}
          {showCampusModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-pulse-subtle">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <div className="p-6">
                  <h4 className="text-md font-bold mb-4">{editingCampus ? 'Edit Campus Location' : 'Register New Campus'}</h4>
                  <form onSubmit={subCampus(onCampusSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Campus Name</label>
                      <input 
                        type="text" 
                        {...regCampus('name')} 
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                      />
                      {errCampus.name && <p className="text-[10px] text-rose-500 mt-1">{errCampus.name.message}</p>}
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-1">
                        <label className="block text-xs font-bold text-slate-400 mb-1">Code</label>
                        <input 
                          type="text" 
                          {...regCampus('code')} 
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono focus:outline-none"
                        />
                        {errCampus.code && <p className="text-[10px] text-rose-500 mt-1">{errCampus.code.message}</p>}
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-400 mb-1">Phone</label>
                        <input 
                          type="text" 
                          {...regCampus('contactPhone')} 
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                        />
                        {errCampus.contactPhone && <p className="text-[10px] text-rose-500 mt-1">{errCampus.contactPhone.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Contact Email</label>
                      <input 
                        type="email" 
                        {...regCampus('contactEmail')} 
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                      />
                      {errCampus.contactEmail && <p className="text-[10px] text-rose-500 mt-1">{errCampus.contactEmail.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Address</label>
                      <input 
                        type="text" 
                        {...regCampus('address')} 
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                      />
                      {errCampus.address && <p className="text-[10px] text-rose-500 mt-1">{errCampus.address.message}</p>}
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowCampusModal(false)}
                        className="py-1.5 px-4 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={crudLoading}
                        className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        {crudLoading && <Loader2 size={10} className="animate-spin" />}
                        <span>Submit</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CALENDAR */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">Academic Term Schedule</h3>
            <button 
              onClick={() => { resetEvent(); setShowEventModal(true); }}
              className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <Plus size={14} />
              <span>Add Event</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <div 
                key={event.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative"
              >
                <button 
                  onClick={() => handleDeleteEvent(event.id)}
                  className="absolute top-4 right-4 p-1 hover:text-rose-500 text-slate-400 transition-colors"
                  aria-label="Delete event"
                >
                  <Trash2 size={14} />
                </button>

                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-3
                  ${event.type === 'holiday' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-500' : ''}
                  ${event.type === 'exam' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500' : ''}
                  ${event.type === 'term_start' || event.type === 'term_end' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500' : ''}
                  ${event.type === 'event' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : ''}
                `}>
                  {event.type.replace('_', ' ')}
                </span>
                
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">{event.title}</h4>
                {event.description && <p className="text-xs text-slate-400 mt-1 leading-relaxed">{event.description}</p>}
                
                <div className="border-t border-slate-100 dark:border-slate-850 mt-4 pt-3 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Start: {event.startDate}</span>
                  <span>End: {event.endDate}</span>
                </div>
              </div>
            ))}
          </div>

          {/* CALENDAR EVENT MODAL */}
          {showEventModal && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-pulse-subtle">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                <div className="p-6">
                  <h4 className="text-md font-bold mb-4">Add Academic Event</h4>
                  <form onSubmit={subEvent(onEventSubmit)} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Event Title</label>
                      <input 
                        type="text" 
                        {...regEvent('title')} 
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                      />
                      {errEvent.title && <p className="text-[10px] text-rose-500 mt-1">{errEvent.title.message}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Event Type</label>
                      <select 
                        {...regEvent('type')}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                      >
                        <option value="holiday">Holiday / Closure</option>
                        <option value="exam">Examination Period</option>
                        <option value="term_start">Term Commencement</option>
                        <option value="term_end">Term End</option>
                        <option value="event">Campus Event</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Start Date</label>
                        <input 
                          type="date" 
                          {...regEvent('startDate')} 
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                        />
                        {errEvent.startDate && <p className="text-[10px] text-rose-500 mt-1">{errEvent.startDate.message}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">End Date</label>
                        <input 
                          type="date" 
                          {...regEvent('endDate')} 
                          className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                        />
                        {errEvent.endDate && <p className="text-[10px] text-rose-500 mt-1">{errEvent.endDate.message}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Description (Optional)</label>
                      <textarea 
                        {...regEvent('description')} 
                        rows={3}
                        className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowEventModal(false)}
                        className="py-1.5 px-4 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        disabled={crudLoading}
                        className="py-1.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        {crudLoading && <Loader2 size={10} className="animate-spin" />}
                        <span>Submit</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantSetup;
