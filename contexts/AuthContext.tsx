import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, ProfileCompletion, DEFAULT_BADGES, DEFAULT_GOALS } from '@/types';
import {
  getCurrentUser,
  setCurrentUser,
  createUser,
  loginUser as loginUserStorage,
  logoutUser as logoutUserStorage,
  initializeStorage,
  updateUser,
  devAutoLogin,
} from '@/utils/storage';

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

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeStorage();
        // Force logout on web to show login screen
        await setCurrentUser(null);
        setUser(null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
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
    setIsLoading(true);
    try {
      const loggedInUser = await loginUserStorage(email, password);
      const updatedUser = ensureUserHasNewFields(loggedInUser);
      setUser(updatedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: UserRole) => {
    setIsLoading(true);
    try {
      const newUser = await createUser({ 
        email, 
        password, 
        name, 
        role,
        roles: [role],
        activeRole: role,
        searchRadius: 50,
        level: role === 'worker' ? 1 : undefined,
        producerLevel: role === 'producer' ? 1 : undefined,
        badges: [],
        goals: DEFAULT_GOALS.map(g => ({ ...g })),
      });
      await setCurrentUser(newUser);
      const updatedUser = ensureUserHasNewFields(newUser);
      setUser(updatedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await logoutUserStorage();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
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
      const updatedUser = await updateUser(user.id, updates);
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
      const updatedUser = await updateUser(user.id, { activeRole: role, role });
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
      const updatedUser = await updateUser(user.id, updates);
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
