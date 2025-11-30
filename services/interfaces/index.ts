/**
 * LidaCacau - Exportação de Interfaces de Serviços
 * 
 * Ponto central de exportação para todas as interfaces.
 * 
 * Nota: Apenas IAuthService está implementado no MVP.
 * Outros serviços usam funções legacy em utils/storage.ts.
 * Consulte ARCHITECTURE.md para detalhes de migração.
 */

export * from './IAuthService';
