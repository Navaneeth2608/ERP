export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  status: 'active' | 'inactive' | 'suspended';
  subscriptionTier: 'standard' | 'premium' | 'enterprise';
  config: {
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
}

export type UserRoleType = 
  | 'super_admin' | 'college_admin' | 'principal' | 'hod' 
  | 'faculty' | 'student' | 'parent' | 'accountant' 
  | 'librarian' | 'support_staff';

export interface User {
  id: number;
  tenantId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  mfaEnabled: boolean;
  phone?: string;
  address?: string;
  roles: UserRoleType[];
}

export interface Department {
  id: number;
  tenantId: number;
  code: string;
  name: string;
  hodId?: number;
}

export interface Program {
  id: number;
  tenantId: number;
  departmentId: number;
  code: string;
  name: string;
  durationYears: number;
  totalCredits: number;
}

export interface Course {
  id: number;
  tenantId: number;
  subjectId: number;
  academicYear: string;
  semester: number;
  sectionId: number;
  facultyId: number;
}

export interface AttendanceRecord {
  id: number;
  tenantId: number;
  sessionId: number;
  studentId: number;
  status: 'present' | 'absent' | 'late';
  markedMethod: 'manual' | 'nfc' | 'biometric' | 'gps';
  markedAt: string;
}

export interface FeeStructure {
  id: number;
  tenantId: number;
  name: string;
  amount: number;
  academicYear: string;
  dueDate: string;
}

export interface Campus {
  id: number;
  tenantId: number;
  name: string;
  code: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
}

export interface AcademicCalendarEvent {
  id: number;
  tenantId: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  type: 'holiday' | 'exam' | 'term_start' | 'term_end' | 'event';
}
