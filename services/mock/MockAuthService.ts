/**
 * LidaCacau - Implementação Mock do Serviço de Autenticação
 * 
 * Usa AsyncStorageAdapter para simular autenticação.
 * Para produção, substitua por ApiAuthService.
 */

import { User } from '@/types';
import { 
  IAuthService, 
  LoginCredentials, 
  RegisterData, 
  AuthResult 
} from '../interfaces/IAuthService';
import { storageAdapter, StorageKeys } from '../common/AsyncStorageAdapter';

export class MockAuthService implements IAuthService {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const users = await this.getUsers();
      const user = users.find(
        u => u.email === credentials.email && u.password === credentials.password
      );

      if (!user) {
        return {
          success: false,
          error: 'Email ou senha inválidos',
        };
      }

      await storageAdapter.setItem(StorageKeys.CURRENT_USER, user);
      
      return {
        success: true,
        user,
        token: `mock_token_${user.id}_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao fazer login',
      };
    }
  }

  async register(data: RegisterData): Promise<AuthResult> {
    try {
      const users = await this.getUsers();
      
      if (users.find(u => u.email === data.email)) {
        return {
          success: false,
          error: 'Email já cadastrado',
        };
      }

      const newUser: User = {
        id: this.generateId(),
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        roles: [data.role],
        activeRole: data.role,
        phone: data.phone,
        location: data.location,
        createdAt: new Date().toISOString(),
        level: data.role === 'worker' ? 1 : undefined,
        totalReviews: data.role === 'worker' ? 0 : undefined,
        averageRating: data.role === 'worker' ? 0 : undefined,
      };

      await storageAdapter.setItem(StorageKeys.USERS, [...users, newUser]);
      await storageAdapter.setItem(StorageKeys.CURRENT_USER, newUser);

      return {
        success: true,
        user: newUser,
        token: `mock_token_${newUser.id}_${Date.now()}`,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Erro ao criar conta',
      };
    }
  }

  async logout(): Promise<void> {
    await storageAdapter.removeItem(StorageKeys.CURRENT_USER);
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      return await storageAdapter.getItem<User>(StorageKeys.CURRENT_USER);
    } catch {
      return null;
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const users = await this.getUsers();
      const index = users.findIndex(u => u.id === userId);
      
      if (index === -1) return null;

      users[index] = { ...users[index], ...updates };
      await storageAdapter.setItem(StorageKeys.USERS, users);

      const currentUser = await this.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        await storageAdapter.setItem(StorageKeys.CURRENT_USER, users[index]);
      }

      return users[index];
    } catch {
      return null;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const users = await this.getUsers();
      return users.find(u => u.id === id) || null;
    } catch {
      return null;
    }
  }

  async getUsers(filters?: { role?: string; verified?: boolean }): Promise<User[]> {
    try {
      let users = await storageAdapter.getList<User>(StorageKeys.USERS);

      if (filters) {
        if (filters.role) {
          users = users.filter(u => u.role === filters.role);
        }
        if (filters.verified !== undefined) {
          users = users.filter(u => 
            filters.verified 
              ? u.verification?.status === 'approved'
              : !u.verification || u.verification.status !== 'approved'
          );
        }
      }

      return users;
    } catch {
      return [];
    }
  }
}

export const mockAuthService = new MockAuthService();
