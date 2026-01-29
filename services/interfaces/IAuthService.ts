/**
 * LidaCacau - Interface de Serviço de Autenticação
 * 
 * Define o contrato para implementações de autenticação.
 * Pode ser implementado com AsyncStorage (mock) ou API real.
 */

import { User } from '@/types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'producer' | 'worker';
  phone?: string;
  location?: string;
  bio?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

export interface IAuthService {
  /**
   * Autentica um usuário com email e senha
   */
  login(credentials: LoginCredentials): Promise<AuthResult>;

  /**
   * Registra um novo usuário
   */
  register(data: RegisterData): Promise<AuthResult>;

  /**
   * Desconecta o usuário atual
   */
  logout(): Promise<void>;

  /**
   * Obtém o usuário atualmente logado
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Verifica se há uma sessão ativa
   */
  isAuthenticated(): Promise<boolean>;

  /**
   * Atualiza dados do usuário
   */
  updateUser(userId: string, updates: Partial<User>): Promise<User | null>;

  /**
   * Obtém um usuário por ID
   */
  getUserById(id: string): Promise<User | null>;

  /**
   * Lista todos os usuários (para admin/busca)
   */
  getUsers(filters?: { role?: string; verified?: boolean }): Promise<User[]>;

  /**
   * Autentica via Google (Social Login)
   */
  googleLogin(idToken: string): Promise<AuthResult>;
}
