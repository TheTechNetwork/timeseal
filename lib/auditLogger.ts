// Audit Logging Service
export enum AuditEventType {
  SEAL_CREATED = 'SEAL_CREATED',
  SEAL_ACCESSED = 'SEAL_ACCESSED',
  SEAL_UNLOCKED = 'SEAL_UNLOCKED',
  SEAL_ACCESS_DENIED = 'SEAL_ACCESS_DENIED',
  SEAL_DELETED = 'SEAL_DELETED',
  PULSE_UPDATED = 'PULSE_UPDATED',
  PULSE_EXPIRED = 'PULSE_EXPIRED',
}

export interface AuditEvent {
  timestamp: number;
  eventType: AuditEventType;
  sealId: string;
  ip: string;
  metadata?: Record<string, any>;
}

export interface IAuditLogger {
  log(event: AuditEvent): Promise<void>;
  getAuditTrail(sealId: string): Promise<AuditEvent[]>;
}

export class AuditLogger implements IAuditLogger {
  constructor(private db: any) {}

  async log(event: AuditEvent): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO audit_logs (timestamp, event_type, seal_id, ip, metadata)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        event.timestamp,
        event.eventType,
        event.sealId,
        event.ip,
        JSON.stringify(event.metadata || {})
      )
      .run();
  }

  async getAuditTrail(sealId: string): Promise<AuditEvent[]> {
    const result = await this.db
      .prepare('SELECT * FROM audit_logs WHERE seal_id = ? ORDER BY timestamp DESC')
      .bind(sealId)
      .all();

    return result.results.map((row: any) => ({
      timestamp: row.timestamp,
      eventType: row.event_type,
      sealId: row.seal_id,
      ip: row.ip,
      metadata: JSON.parse(row.metadata || '{}'),
    }));
  }
}
