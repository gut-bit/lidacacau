import { db } from '../server/db/drizzle';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log('Testing connection to:', process.env.DATABASE_URL?.split('@')[1]); // Log host only for safety
        const result = await db.execute(sql`SELECT NOW() as time`);
        console.log('✅ Connection successful by 2321!', result);

        // Enabling Extensions
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
        console.log('✅ Extensions enabled');

        const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log('📊 Existing Tables:', tables.rows || tables);
    } catch (e) {
        console.error('❌ Connection failed:', e);
    }
    process.exit(0);
}

main();
