/**
 * LidaCacau - Validation Utilities
 * 
 * Utilitarios para validacao de entrada de dados.
 * Inclui validadores para email, senha, telefone, CPF e nome.
 * Todas as mensagens de erro estao em portugues.
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(?:\(\d{2}\)\s?)?\d{4,5}-?\d{4}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s]+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  return EMAIL_REGEX.test(trimmed);
}

export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email é obrigatório' };
  }
  
  const trimmed = email.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Email é obrigatório' };
  }
  
  if (!trimmed.includes('@')) {
    return { isValid: false, error: 'Email deve conter @' };
  }
  
  const [localPart, domain] = trimmed.split('@');
  
  if (!localPart || localPart.length === 0) {
    return { isValid: false, error: 'Email inválido: parte antes do @ está vazia' };
  }
  
  if (!domain || domain.length === 0) {
    return { isValid: false, error: 'Email deve conter um domínio após @' };
  }
  
  if (!domain.includes('.')) {
    return { isValid: false, error: 'Domínio do email deve conter um ponto' };
  }
  
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Formato de email inválido' };
  }
  
  return { isValid: true };
}

export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') return false;
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}

export function validatePassword(password: string): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Senha é obrigatória' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Senha deve ter no mínimo 8 caracteres' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Senha deve conter pelo menos uma letra maiúscula' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Senha deve conter pelo menos uma letra minúscula' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Senha deve conter pelo menos um número' };
  }
  
  return { isValid: true };
}

function extractDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const digits = extractDigits(phone);
  return digits.length === 10 || digits.length === 11;
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }
  
  const digits = extractDigits(phone);
  
  if (digits.length === 0) {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }
  
  if (digits.length < 10) {
    return { isValid: false, error: 'Telefone deve ter pelo menos 10 dígitos' };
  }
  
  if (digits.length > 11) {
    return { isValid: false, error: 'Telefone deve ter no máximo 11 dígitos' };
  }
  
  return { isValid: true };
}

export function formatPhone(phone: string): string {
  const digits = extractDigits(phone);
  
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  
  return phone;
}

export function isValidCPF(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') return false;
  
  const digits = extractDigits(cpf);
  
  if (digits.length !== 11) return false;
  
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
}

export function validateCPF(cpf: string): ValidationResult {
  if (!cpf || typeof cpf !== 'string') {
    return { isValid: false, error: 'CPF é obrigatório' };
  }
  
  const digits = extractDigits(cpf);
  
  if (digits.length === 0) {
    return { isValid: false, error: 'CPF é obrigatório' };
  }
  
  if (digits.length !== 11) {
    return { isValid: false, error: 'CPF deve ter 11 dígitos' };
  }
  
  if (/^(\d)\1{10}$/.test(digits)) {
    return { isValid: false, error: 'CPF inválido: dígitos repetidos' };
  }
  
  if (!isValidCPF(cpf)) {
    return { isValid: false, error: 'CPF inválido: dígitos verificadores incorretos' };
  }
  
  return { isValid: true };
}

export function formatCPF(cpf: string): string {
  const digits = extractDigits(cpf);
  
  if (digits.length !== 11) {
    return cpf;
  }
  
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function isValidName(name: string): boolean {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  if (!NAME_REGEX.test(trimmed)) return false;
  return true;
}

export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Nome é obrigatório' };
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Nome é obrigatório' };
  }
  
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Nome deve ter no mínimo 2 caracteres' };
  }
  
  if (!NAME_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Nome deve conter apenas letras e espaços' };
  }
  
  return { isValid: true };
}

export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/\s+/g, ' ');
}

export function isNotEmpty(value: string | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
}
