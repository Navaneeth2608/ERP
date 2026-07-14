import { create } from 'zustand';
import type { User, UserRoleType } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  mfaTempUser: User | null;
  activeRole: UserRoleType | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setMfaTempUser: (user: User | null) => void;
  setActiveRole: (role: UserRoleType) => void;
}

// Retrieve initial state from localStorage if available
const getStoredAuth = () => {
  try {
    const token = localStorage.getItem('erp_token');
    const userStr = localStorage.getItem('erp_user');
    const activeRole = localStorage.getItem('erp_active_role');
    
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
      activeRole: activeRole as UserRoleType | null,
    };
  } catch (error) {
    console.error('Failed to parse stored auth session:', error);
    return { token: null, user: null, activeRole: null };
  }
};

const stored = getStoredAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: stored.user,
  token: stored.token,
  mfaTempUser: null,
  activeRole: stored.activeRole,
  
  login: (user, token) => {
    localStorage.setItem('erp_token', token);
    localStorage.setItem('erp_user', JSON.stringify(user));
    
    // Default to the first role assigned to the user
    const defaultRole = user.roles[0] || null;
    if (defaultRole) {
      localStorage.setItem('erp_active_role', defaultRole);
    }
    
    set({
      user,
      token,
      mfaTempUser: null,
      activeRole: defaultRole,
    });
  },
  
  logout: () => {
    localStorage.removeItem('erp_token');
    localStorage.removeItem('erp_user');
    localStorage.removeItem('erp_active_role');
    set({
      user: null,
      token: null,
      mfaTempUser: null,
      activeRole: null,
    });
  },
  
  setMfaTempUser: (user) => set({ mfaTempUser: user }),
  
  setActiveRole: (role) => {
    localStorage.setItem('erp_active_role', role);
    set({ activeRole: role });
  },
}));
