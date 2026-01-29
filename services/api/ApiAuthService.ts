import { User } from '@/types';
import { IAuthService, LoginCredentials, RegisterData, AuthResult } from '../interfaces/IAuthService';
import { getApiAdapter } from '../common/ApiAdapter';
import { sessionManager } from '../common/SessionManager';

interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

interface RegisterResponse {
  success: boolean;
  user: User;
  token: string;
}

interface MeResponse {
  user: User;
}

interface UserResponse {
  user: User;
}

interface UsersResponse {
  users: User[];
}

export class ApiAuthService implements IAuthService {
  private api = getApiAdapter();

  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const result = await this.api.post<LoginResponse>('/auth/login', credentials);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Erro ao fazer login',
      };
    }

    await sessionManager.saveSession(result.data.token, result.data.user.id);
    this.api.setAuthToken(result.data.token);

    return {
      success: true,
      user: result.data.user,
      token: result.data.token,
    };
  }

  async register(data: RegisterData): Promise<AuthResult> {
    const result = await this.api.post<RegisterResponse>('/auth/register', data);

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Erro ao criar conta',
      };
    }

    await sessionManager.saveSession(result.data.token, result.data.user.id);
    this.api.setAuthToken(result.data.token);

    return {
      success: true,
      user: result.data.user,
      token: result.data.token,
    };
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } catch {
    }

    await sessionManager.clearSession();
    this.api.setAuthToken(null);
  }

  async getCurrentUser(): Promise<User | null> {
    const token = await sessionManager.getToken();
    if (!token) {
      return null;
    }

    this.api.setAuthToken(token);
    const result = await this.api.get<MeResponse>('/auth/me');

    if (!result.success || !result.data) {
      await sessionManager.clearSession();
      this.api.setAuthToken(null);
      return null;
    }

    return result.data.user;
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await sessionManager.getToken();
    if (!token) {
      return false;
    }

    this.api.setAuthToken(token);
    const result = await this.api.get<{ valid: boolean }>('/auth/verify');
    return result.success && result.data?.valid === true;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const result = await this.api.patch<UserResponse>('/users/me', updates);

    if (!result.success || !result.data) {
      return null;
    }

    return result.data.user;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.api.get<UserResponse>(`/users/${id}`);

    if (!result.success || !result.data) {
      return null;
    }

    return result.data.user;
  }

  async getUsers(filters?: { role?: string; verified?: boolean }): Promise<User[]> {
    const result = await this.api.get<UsersResponse>('/users', filters);

    if (!result.success || !result.data) {
      return [];
    }

    return result.data.users;
  }

  async initializeSession(): Promise<User | null> {
    const token = await sessionManager.getToken();
    if (token) {
      this.api.setAuthToken(token);
      return this.getCurrentUser();
    }
    return null;
  }

  async googleLogin(idToken: string): Promise<AuthResult> {
    const result = await this.api.post<LoginResponse>('/auth/google', { idToken });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Erro ao entrar com Google',
      };
    }

    await sessionManager.saveSession(result.data.token, result.data.user.id);
    this.api.setAuthToken(result.data.token);

    return {
      success: true,
      user: result.data.user,
      token: result.data.token,
    };
  }
}
