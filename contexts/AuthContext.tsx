import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ProfileCompletion, DEFAULT_GOALS } from '@/types';
import { serviceFactory } from '@/services';
import { initializeStorage, updateUser } from '@/utils/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  activeRole: UserRole;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
  switchRole: (role: UserRole) => Promise<void>;
  canSwitchToRole: (role: UserRole) => boolean;
  enableRole: (role: UserRole) => Promise<void>;
  calculateProfileCompletion: (user: User) => ProfileCompletion;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function calculateProfileCompletion(user: User): ProfileCompletion {
  const checks = {
    hasAvatar: !!user.avatar,
    hasBio: !!(user.workerProfile?.bio || user.producerProfile?.bio),
    hasPhone: !!user.phone,
    hasLocation: !!user.location,
    hasProperties: !!(user.properties && user.properties.length > 0),
    hasSkills: !!(user.workerProfile?.skills && user.workerProfile.skills.length > 0),
    hasEquipment: !!(user.workerProfile?.equipment && user.workerProfile.equipment.length > 0),
    hasAvailability: !!user.workerProfile?.availability,
    hasSocialLinks: !!(user.socialLinks && (user.socialLinks.whatsapp || user.socialLinks.instagram || user.socialLinks.facebook)),
  };

  const totalChecks = Object.values(checks).length;
  const completedChecks = Object.values(checks).filter(Boolean).length;
  const percentage = Math.round((completedChecks / totalChecks) * 100);

  return {
    ...checks,
    percentage,
  };
}

// DEMO MODE: Enable this flag for investor presentation
const DEMO_MODE = true;

// Demo user for investor presentation
const DEMO_USER: User = {
  id: 'demo-user-001',
  email: 'helton@lidacacau.com',
  name: 'Helton Gutzeit Calasans',
  role: 'producer',
  roles: ['producer', 'worker'],
  activeRole: 'producer',
  avatar: undefined,
  phone: '(93) 99999-8888',
  location: 'Fazenda Panorama Cacau - Uruara, PA',
  createdAt: new Date().toISOString(),
  level: 5,
  totalReviews: 15,
  averageRating: 5.0,
  searchRadius: 100,
  badges: [],
  goals: DEFAULT_GOALS.map(g => ({ ...g })),
  workerProfile: {
    bio: 'Fundador da Qualitheo Agro Industria e Vibe Dev do LidaCacau',
    skills: ['gestao', 'cacau', 'tecnologia', 'agroindustria'],
    equipment: [],
    availability: 'full_time',
    totalJobs: 50,
    totalEarnings: 100000,
  },
  producerProfile: {
    bio: 'Fundador da Qualitheo Agro Industria | Fazenda Panorama Cacau | Vibe Dev LidaCacau',
    totalSpent: 250000,
    pixKey: 'helton@qualitheo.com',
    pixKeyType: 'email',
  },
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const authService = serviceFactory.getAuthService();

  useEffect(() => {
    const initialize = async () => {
      console.log('[AuthContext] Starting initialization...');
      try {
        await initializeStorage();
        console.log('[AuthContext] Storage initialized');
        
        // DEMO MODE: Skip auth check and use demo user directly
        if (DEMO_MODE) {
          console.log('[AuthContext] DEMO MODE ACTIVE - Using demo user');
          const demoUser = ensureUserHasNewFields(DEMO_USER);
          setUser(demoUser);
          setIsLoading(false);
          console.log('[AuthContext] Demo user loaded:', demoUser.name);
          return;
        }
        
        const currentUser = await authService.getCurrentUser();
        console.log('[AuthContext] getCurrentUser result:', currentUser ? `User: ${currentUser.email}` : 'null');
        if (currentUser) {
          const restoredUser = ensureUserHasNewFields(currentUser);
          setUser(restoredUser);
          console.log('[AuthContext] User restored:', restoredUser.email);
        } else {
          setUser(null);
          console.log('[AuthContext] No user to restore');
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        // In demo mode, still load demo user even on error
        if (DEMO_MODE) {
          const demoUser = ensureUserHasNewFields(DEMO_USER);
          setUser(demoUser);
        } else {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
        console.log('[AuthContext] Initialization complete, isLoading=false');
      }
    };
    initialize();
  }, []);

  const ensureUserHasNewFields = (u: User): User => {
    const roles = u.roles || [u.role];
    const activeRole = u.activeRole || u.role;
    return {
      ...u,
      roles,
      activeRole,
      searchRadius: u.searchRadius || 50,
      profileCompletion: calculateProfileCompletion(u),
      badges: u.badges || [],
      goals: u.goals || DEFAULT_GOALS.map(g => ({ ...g })),
    };
  };

  const login = async (email: string, password: string) => {
    console.log('[AuthContext] Login called for:', email);
    try {
      const result = await authService.login({ email, password });
      console.log('[AuthContext] Login result:', result.success ? 'SUCCESS' : `FAILED: ${result.error}`);
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao fazer login');
      }
      
      if (result.user) {
        const updatedUser = ensureUserHasNewFields(result.user);
        setUser(updatedUser);
        console.log('[AuthContext] User set after login:', updatedUser.email);
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      const result = await authService.register({
        email,
        password,
        name,
        role: role as 'producer' | 'worker',
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar conta');
      }
      
      if (result.user) {
        const updatedUser = ensureUserHasNewFields(result.user);
        setUser(updatedUser);
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        const updatedUser = ensureUserHasNewFields(currentUser);
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updatedUser = await authService.updateUser(user.id, updates);
      if (updatedUser) {
        const finalUser = ensureUserHasNewFields(updatedUser);
        setUser(finalUser);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const switchRole = async (role: UserRole) => {
    if (!user) return;
    if (!user.roles.includes(role)) {
      throw new Error('Role not enabled for this user');
    }
    try {
      const updatedUser = await authService.updateUser(user.id, { activeRole: role, role });
      if (updatedUser) {
        const finalUser = ensureUserHasNewFields(updatedUser);
        setUser(finalUser);
      }
    } catch (error) {
      console.error('Error switching role:', error);
      throw error;
    }
  };

  const canSwitchToRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.roles.includes(role);
  };

  const enableRole = async (role: UserRole) => {
    if (!user) return;
    if (user.roles.includes(role)) return;
    
    const newRoles = [...user.roles, role];
    const updates: Partial<User> = { 
      roles: newRoles,
      activeRole: role,
      role,
    };
    
    if (role === 'worker' && !user.level) {
      updates.level = 1;
    }
    if (role === 'producer' && !user.producerLevel) {
      updates.producerLevel = 1;
    }
    
    try {
      const updatedUser = await authService.updateUser(user.id, updates);
      if (updatedUser) {
        const finalUser = ensureUserHasNewFields(updatedUser);
        setUser(finalUser);
      }
    } catch (error) {
      console.error('Error enabling role:', error);
      throw error;
    }
  };

  const activeRole = user?.activeRole || user?.role || 'worker';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        activeRole,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
        setUser,
        switchRole,
        canSwitchToRole,
        enableRole,
        calculateProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
