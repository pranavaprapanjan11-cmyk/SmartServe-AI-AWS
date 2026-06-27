import 'dotenv/config';
import { Pool as PGPool } from 'pg';
import { Signer } from "@aws-sdk/rds-signer";

const useAuroraIAM = process.env.USE_AURORA_IAM_AUTH === 'true';

// AWS RDS Signer client configuration
const signer = new Signer({
  hostname: process.env.AURORA_ENDPOINT || "",
  port: parseInt(process.env.AURORA_PORT || "5432"),
  username: process.env.AURORA_USER || "postgres",
  region: process.env.AWS_REGION || "us-east-1",
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  } : {})
});

if (useAuroraIAM) {
  console.log(`[AURORA] Initializing Shared Pool with IAM Database Authentication on ${process.env.AURORA_ENDPOINT}:${process.env.AURORA_PORT}`);
}

export class Pool {
  private localPool: PGPool;

  constructor(config?: any) {
    if (useAuroraIAM) {
      this.localPool = new PGPool({
        host: process.env.AURORA_ENDPOINT,
        port: parseInt(process.env.AURORA_PORT || "5432"),
        database: process.env.AURORA_DB_NAME || "smartserve",
        user: process.env.AURORA_USER || "postgres",
        // Dynamic password generator returning the short-lived IAM token
        password: () => signer.getAuthToken(),
        ssl: {
          rejectUnauthorized: false // AWS RDS requires SSL for IAM DB authentication
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000
      });
    } else {
      this.localPool = new PGPool(config || { connectionString: process.env.DATABASE_URL });
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
