import type { Tenant, User, Campus, AcademicCalendarEvent } from '../types';

// Helper for realistic network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Pre-seeded Local Storage Mock DB ---
const initMockDB = () => {
  if (!localStorage.getItem('mock_tenant')) {
    const defaultTenant: Tenant = {
      id: 1,
      name: 'Exemplar Institute of Technology',
      subdomain: 'exemplar',
      status: 'active',
      subscriptionTier: 'premium',
      config: {
        logoUrl: 'https://images.unsplash.com/photo-1592280771190-3e2e4d571952?w=128&auto=format&fit=crop&q=80',
        primaryColor: '#3b82f6', // blue-500
        secondaryColor: '#1e293b', // slate-800
      },
      address: '100 University Parkway, Tech City, TC 94016',
      phone: '+1 (555) 019-2834',
      email: 'administration@exemplar.edu',
      website: 'www.exemplar.edu'
    };
    localStorage.setItem('mock_tenant', JSON.stringify(defaultTenant));
  }

  if (!localStorage.getItem('mock_campuses')) {
    const defaultCampuses: Campus[] = [
      {
        id: 1,
        tenantId: 1,
        name: 'Main Metro Campus',
        code: 'MMC',
        address: '100 University Parkway, Tech City, TC 94016',
        contactEmail: 'metro-campus@exemplar.edu',
        contactPhone: '+1 (555) 019-2834'
      },
      {
        id: 2,
        tenantId: 1,
        name: 'North Hills Engineering Annex',
        code: 'NHE',
        address: '400 Innovation Drive, Engineering Hills, EH 94018',
        contactEmail: 'engineering-campus@exemplar.edu',
        contactPhone: '+1 (555) 019-5881'
      }
    ];
    localStorage.setItem('mock_campuses', JSON.stringify(defaultCampuses));
  }

  if (!localStorage.getItem('mock_calendar_events')) {
    const defaultEvents: AcademicCalendarEvent[] = [
      {
        id: 1,
        tenantId: 1,
        title: 'Fall Semester Registration Start',
        description: 'Online class selection opens for all returning undergraduate batches.',
        startDate: '2026-08-15',
        endDate: '2026-08-20',
        type: 'term_start'
      },
      {
        id: 2,
        tenantId: 1,
        title: 'Midterm Examination Period',
        description: 'Centralized exams across all engineering and sciences programs.',
        startDate: '2026-10-12',
        endDate: '2026-10-18',
        type: 'exam'
      },
      {
        id: 3,
        tenantId: 1,
        title: 'Founder\'s Memorial Holiday',
        description: 'Campus offices closed; no academic sessions scheduled.',
        startDate: '2026-11-11',
        endDate: '2026-11-11',
        type: 'holiday'
      }
    ];
    localStorage.setItem('mock_calendar_events', JSON.stringify(defaultEvents));
  }
};

initMockDB();

// Mock users database mapping
const MOCK_USERS: Record<string, { user: User; passwordHash: string; mfaSecret?: string }> = {
  'platformadmin': {
    passwordHash: 'supersecurepassword',
    user: {
      id: 1,
      tenantId: 1,
      username: 'platformadmin',
      email: 'admin@platform.com',
      firstName: 'Jane',
      lastName: 'Doe',
      isActive: true,
      mfaEnabled: false,
      roles: ['super_admin']
    }
  },
  'collegeadmin': {
    passwordHash: 'collegepassword',
    user: {
      id: 2,
      tenantId: 1,
      username: 'collegeadmin',
      email: 'admin@exemplar.edu',
      firstName: 'Robert',
      lastName: 'Smith',
      isActive: true,
      mfaEnabled: false,
      roles: ['college_admin']
    }
  },
  'principal': {
    passwordHash: 'principalpassword',
    user: {
      id: 3,
      tenantId: 1,
      username: 'principal',
      email: 'principal@exemplar.edu',
      firstName: 'Dr. Arthur',
      lastName: 'Pendelton',
      isActive: true,
      mfaEnabled: false,
      roles: ['principal']
    }
  },
  'hod': {
    passwordHash: 'hodpassword',
    user: {
      id: 4,
      tenantId: 1,
      username: 'hod',
      email: 'cs_hod@exemplar.edu',
      firstName: 'Prof. Sarah',
      lastName: 'Connor',
      isActive: true,
      mfaEnabled: false,
      roles: ['hod', 'faculty'] // Multi-role support!
    }
  },
  'faculty': {
    passwordHash: 'facultypassword',
    user: {
      id: 5,
      tenantId: 1,
      username: 'faculty',
      email: 'faculty_member@exemplar.edu',
      firstName: 'Dr. Charles',
      lastName: 'Xavier',
      isActive: true,
      mfaEnabled: false,
      roles: ['faculty']
    }
  },
  'student': {
    passwordHash: 'studentpassword',
    user: {
      id: 6,
      tenantId: 1,
      username: 'student',
      email: 'student_user@exemplar.edu',
      firstName: 'Peter',
      lastName: 'Parker',
      isActive: true,
      mfaEnabled: false,
      roles: ['student']
    }
  },
  'parent': {
    passwordHash: 'parentpassword',
    user: {
      id: 7,
      tenantId: 1,
      username: 'parent',
      email: 'parent_user@outlook.com',
      firstName: 'May',
      lastName: 'Parker',
      isActive: true,
      mfaEnabled: false,
      roles: ['parent']
    }
  },
  'accountant': {
    passwordHash: 'accountantpassword',
    user: {
      id: 8,
      tenantId: 1,
      username: 'accountant',
      email: 'finance@exemplar.edu',
      firstName: 'Tony',
      lastName: 'Stark',
      isActive: true,
      mfaEnabled: false,
      roles: ['accountant']
    }
  },
  'librarian': {
    passwordHash: 'librarianpassword',
    user: {
      id: 9,
      tenantId: 1,
      username: 'librarian',
      email: 'library@exemplar.edu',
      firstName: 'Giles',
      lastName: 'Rupert',
      isActive: true,
      mfaEnabled: false,
      roles: ['librarian']
    }
  }
};

export const MockApiService = {
  // --- AUTH OPERATIONS ---
  login: async (usernameOrEmail: string, password: string): Promise<{ user: User; token?: string; mfaRequired: boolean }> => {
    await delay(800);
    const mockRecord = MOCK_USERS[usernameOrEmail.toLowerCase()];
    if (!mockRecord || mockRecord.passwordHash !== password) {
      throw new Error('Invalid username or password credentials.');
    }

    if (mockRecord.user.mfaEnabled) {
      return { user: mockRecord.user, mfaRequired: true };
    }

    const token = 'mock_jwt_token_for_' + mockRecord.user.username;
    return { user: mockRecord.user, token, mfaRequired: false };
  },

  setupMfa: async (userId: number): Promise<{ secret: string; qrCodeUri: string }> => {
    await delay(500);
    const secret = 'MOCKTOTPSECRETKEY1234567890';
    const userRecord = Object.values(MOCK_USERS).find(u => u.user.id === userId);
    const email = userRecord ? userRecord.user.email : 'user@exemplar.edu';
    const qrCodeUri = `otpauth://totp/Exemplar%20ERP:${email}?secret=${secret}&issuer=Exemplar%20ERP`;
    return { secret, qrCodeUri };
  },

  verifyAndEnableMfa: async (userId: number, code: string): Promise<{ success: boolean; token?: string; user?: User }> => {
    await delay(600);
    if (code === '123456') {
      const userRecord = Object.values(MOCK_USERS).find(u => u.user.id === userId);
      if (userRecord) {
        userRecord.user.mfaEnabled = true;
        const token = 'mock_jwt_token_for_' + userRecord.user.username;
        return { success: true, token, user: userRecord.user };
      }
    }
    return { success: false };
  },

  requestPasswordReset: async (email: string): Promise<boolean> => {
    await delay(800);
    const userRecord = Object.values(MOCK_USERS).find(u => u.user.email.toLowerCase() === email.toLowerCase());
    return !!userRecord;
  },

  resetPassword: async (_token: string, _newPassword: string): Promise<boolean> => {
    await delay(700);
    // Dummy verification
    return true;
  },

  // --- TENANT MANAGEMENT ---
  getTenantProfile: async (): Promise<Tenant> => {
    await delay(300);
    return JSON.parse(localStorage.getItem('mock_tenant') || '{}');
  },

  updateTenantProfile: async (data: Partial<Tenant>): Promise<Tenant> => {
    await delay(600);
    const current = JSON.parse(localStorage.getItem('mock_tenant') || '{}');
    const updated = { ...current, ...data, config: { ...current.config, ...data.config } };
    localStorage.setItem('mock_tenant', JSON.stringify(updated));
    return updated;
  },

  // --- CAMPUS CRUD ---
  getCampuses: async (): Promise<Campus[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem('mock_campuses') || '[]');
  },

  createCampus: async (data: Omit<Campus, 'id' | 'tenantId'>): Promise<Campus> => {
    await delay(500);
    const campuses = JSON.parse(localStorage.getItem('mock_campuses') || '[]');
    const newCampus: Campus = {
      ...data,
      id: campuses.length > 0 ? Math.max(...campuses.map((c: Campus) => c.id)) + 1 : 1,
      tenantId: 1
    };
    campuses.push(newCampus);
    localStorage.setItem('mock_campuses', JSON.stringify(campuses));
    return newCampus;
  },

  updateCampus: async (id: number, data: Partial<Campus>): Promise<Campus> => {
    await delay(500);
    const campuses = JSON.parse(localStorage.getItem('mock_campuses') || '[]');
    const index = campuses.findIndex((c: Campus) => c.id === id);
    if (index === -1) throw new Error('Campus not found.');
    const updated = { ...campuses[index], ...data };
    campuses[index] = updated;
    localStorage.setItem('mock_campuses', JSON.stringify(campuses));
    return updated;
  },

  deleteCampus: async (id: number): Promise<boolean> => {
    await delay(400);
    const campuses = JSON.parse(localStorage.getItem('mock_campuses') || '[]');
    const filtered = campuses.filter((c: Campus) => c.id !== id);
    localStorage.setItem('mock_campuses', JSON.stringify(filtered));
    return true;
  },

  // --- CALENDAR EVENTS ---
  getCalendarEvents: async (): Promise<AcademicCalendarEvent[]> => {
    await delay(300);
    return JSON.parse(localStorage.getItem('mock_calendar_events') || '[]');
  },

  createCalendarEvent: async (data: Omit<AcademicCalendarEvent, 'id' | 'tenantId'>): Promise<AcademicCalendarEvent> => {
    await delay(500);
    const events = JSON.parse(localStorage.getItem('mock_calendar_events') || '[]');
    const newEvent: AcademicCalendarEvent = {
      ...data,
      id: events.length > 0 ? Math.max(...events.map((e: AcademicCalendarEvent) => e.id)) + 1 : 1,
      tenantId: 1
    };
    events.push(newEvent);
    localStorage.setItem('mock_calendar_events', JSON.stringify(events));
    return newEvent;
  },

  deleteCalendarEvent: async (id: number): Promise<boolean> => {
    await delay(400);
    const events = JSON.parse(localStorage.getItem('mock_calendar_events') || '[]');
    const filtered = events.filter((e: AcademicCalendarEvent) => e.id !== id);
    localStorage.setItem('mock_calendar_events', JSON.stringify(filtered));
    return true;
  }
};
