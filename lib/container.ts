// Dependency Injection Container
import { SealDatabase, MockDatabase } from './database';
import { SealService } from './sealService';
import { AuditLogger } from './auditLogger';
import { createStorage } from './storage';
import type { D1Database } from '@cloudflare/workers-types';

interface CloudflareEnv {
  DB?: D1Database;
  MASTER_ENCRYPTION_KEY?: string;
}

export interface Container {
  sealService: SealService;
  storage: any;
  database: any;
  auditLogger: AuditLogger | undefined;
}

export function createContainer(env?: CloudflareEnv): Container {
  const masterKey = env?.MASTER_ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('MASTER_ENCRYPTION_KEY not configured in environment');
  }

  const storage = createStorage(env);
  const database = env?.DB ? new SealDatabase(env.DB) : new MockDatabase();
  const auditLogger = env?.DB ? new AuditLogger(env.DB) : undefined;
  const sealService = new SealService(storage, database, masterKey, auditLogger);

  return {
    sealService,
    storage,
    database,
    auditLogger,
  };
}
