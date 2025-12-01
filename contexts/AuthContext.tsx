import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ProfileCompletion, DEFAULT_GOALS } from '@/types';
import { serviceFactory } from '@/services';
import { initializeStorage, updateUser } from '@/utils/storage';
import { AppConfiguration } from '@/config';

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

// Use centralized config for environment detection
// This works correctly on both web and native builds
const ENABLE_DEV_FALLBACK = AppConfiguration.features.enableDevFallback;

// Fallback demo user ONLY for development when API is unavailable
// This user has NO token and cannot make authenticated API calls
// It's only used to allow UI testing in development
const DEV_FALLBACK_USER: User = {
  id: 'dev-demo-user',
  name: 'Usuario Demo (Dev)',
  email: 'demo@dev.local',
  role: 'producer',
  roles: ['producer', 'worker'],
  activeRole: 'producer',
  phone: '(00) 00000-0000',
  location: 'Desenvolvimento',
  level: 1,
  averageRating: 0,
  totalReviews: 0,
  createdAt: new Date().toISOString(),
  searchRadius: 50,
  badges: [],
  goals: DEFAULT_GOALS.map(g => ({ ...g })),
  verification: { status: 'none' },
  producerProfile: {
    bio: 'Usuario de demonstracao para desenvolvimento local.',
  },
  workerProfile: {
    bio: 'Usuario de demonstracao.',
    skills: [],
    equipment: [],
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
        
        // First try to restore existing session
        const currentUser = await authService.getCurrentUser();
        console.log('[AuthContext] getCurrentUser result:', currentUser ? `User: ${currentUser.email}` : 'null');
        
        if (currentUser) {
          const restoredUser = ensureUserHasNewFields(currentUser);
          setUser(restoredUser);
          console.log('[AuthContext] User restored:', restoredUser.email);
          setIsLoading(false);
          return;
        }
        
        // SECURITY: Only use fallback demo user when enableDevFallback is true (development only)
        // In production, this flag is false and users MUST authenticate via login screen
        if (ENABLE_DEV_FALLBACK) {
          console.log('[AuthContext] DEV MODE - Using fallback demo user for UI testing');
          console.log('[AuthContext] Note: enableDevFallback=true. API calls may fail.');
          const fallbackUser = ensureUserHasNewFields(DEV_FALLBACK_USER);
          setUser(fallbackUser);
        } else {
          // Production: no session, show login screen (user must authenticate)
          setUser(null);
          console.log('[AuthContext] No session found - showing login screen (production mode)');
        }
      } catch (error) {
        console.error('[AuthContext] Error initializing auth:', error);
        setUser(null);
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
