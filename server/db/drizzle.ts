import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

// Detect if we are in Cloud Run and have a Cloud SQL instance configured
const isCloudRun = process.env.K_SERVICE !== undefined;
const cloudSqlInstance = connectionString?.match(/host=(\/cloudsql\/[^&?]+)/)?.[1] ||
  process.env.CLOUD_SQL_INSTANCE;

// Initializing postgres client with error handling
let client: ReturnType<typeof postgres>;

try {
  if (isCloudRun && cloudSqlInstance) {
    console.log(`[Database] Ambiente Cloud Run detectado. Conectando via Unix Socket: ${cloudSqlInstance}`);

    // Parse user, password and db from connection string if possible
    const urlPattern = /postgres(?:ql)?:\/\/(.*?):(.*?)@.*?\/(.*?)($|\?)/;
    const match = connectionString?.match(urlPattern);

    if (match) {
      const [, user, password, database] = match;
      client = postgres({
        host: cloudSqlInstance,
        user,
        password,
        database,
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
    } else {
      // Fallback to direct URL if parsing fails, but it usually shouldn't
      client = postgres(connectionString || '', {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
      });
    }
  } else {
    client = postgres(connectionString || 'postgres://placeholder:placeholder@localhost:5432/placeholder', {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }
} catch (error) {
  console.error('[Database] Erro ao inicializar cliente postgres:', error);
  // Last resort fallback
  client = postgres('postgres://placeholder:placeholder@localhost:5432/placeholder', {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export const db = drizzle(client, { schema });

export async function testConnection() {
  if (!process.env.DATABASE_URL) {
    console.warn('[Database] URL nao configurada, pulando teste de conexao.');
    return false;
  }
  try {
    await client`SELECT 1`;
    console.log('[Database] Conexao estabelecida com sucesso');
    return true;
  } catch (error) {
    console.error('[Database] Erro ao conectar:', error);
    return false;
  }
}
