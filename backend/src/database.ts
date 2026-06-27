import 'dotenv/config';
import { Pool as PGPool } from 'pg';

export class Pool {
  private localPool: PGPool;

  constructor(config?: any) {
    if (config) {
      this.localPool = new PGPool(config);
    } else if (process.env.DATABASE_URL) {
      this.localPool = new PGPool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      });
    } else {
      this.localPool = new PGPool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'smartserve',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      });
    }
  }

  async connect(): Promise<any> {
    return this.localPool.connect();
  }

  async query(sql: string, params?: any[]): Promise<{ rows: any[], rowCount: number }> {
    const res = await this.localPool.query(sql, params);
    return {
      rows: res.rows,
      rowCount: res.rowCount || 0
    };
  }

  async end(): Promise<void> {
    await this.localPool.end();
  }
}

export const pool = new Pool();

export class AuroraClient {
  async query(sql: string, params?: any[]) {
    return { rows: [], rowCount: 0 };
  }
  release() {}
}
