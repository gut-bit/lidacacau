import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL nao configurada');
}

const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });

export async function testConnection() {
  try {
    await client`SELECT 1`;
    console.log('[Database] Conexao estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('[Database] Erro ao conectar:', error);
    return false;
  }
}
