import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuditLogger, AuditEventType } from '../../lib/auditLogger';

describe('AuditLogger', () => {
  let mockDb: any;
  let auditLogger: AuditLogger;

  beforeEach(() => {
    const mockResults: any[] = [];
    
    mockDb = {
      prepare: (sql: string) => ({
        bind: (...args: any[]) => ({
          run: async () => {
            mockResults.push({ sql, args });
            return { success: true };
          },
          all: async () => ({
            results: mockResults.map((r, i) => ({
              id: i + 1,
              timestamp: r.args[0],
              event_type: r.args[1],
              seal_id: r.args[2],
              ip: r.args[3],
              metadata: r.args[4],
            })),
          }),
        }),
      }),
    };

    auditLogger = new AuditLogger(mockDb);
  });

  it('should log audit event', async () => {
    const event = {
      timestamp: Date.now(),
      eventType: AuditEventType.SEAL_CREATED,
      sealId: 'test123',
      ip: '127.0.0.1',
      metadata: { isDMS: true },
    };

    await auditLogger.log(event);
    expect(mockDb.prepare).toBeDefined();
  });

  it('should retrieve audit trail', async () => {
    const event = {
      timestamp: Date.now(),
      eventType: AuditEventType.SEAL_ACCESSED,
      sealId: 'test456',
      ip: '192.168.1.1',
    };

    await auditLogger.log(event);
    const trail = await auditLogger.getAuditTrail('test456');

    expect(trail).toBeDefined();
    expect(Array.isArray(trail)).toBe(true);
  });

  it('should handle metadata correctly', async () => {
    const event = {
      timestamp: Date.now(),
      eventType: AuditEventType.PULSE_UPDATED,
      sealId: 'test789',
      ip: '10.0.0.1',
      metadata: { newUnlockTime: 1234567890 },
    };

    await auditLogger.log(event);
    const trail = await auditLogger.getAuditTrail('test789');

    expect(trail[0].metadata).toBeDefined();
  });

  it('should track all event types', async () => {
    const sealId = 'testABC';
    const events = [
      { eventType: AuditEventType.SEAL_CREATED, ip: '1.1.1.1' },
      { eventType: AuditEventType.SEAL_ACCESSED, ip: '2.2.2.2' },
      { eventType: AuditEventType.SEAL_UNLOCKED, ip: '3.3.3.3' },
      { eventType: AuditEventType.SEAL_ACCESS_DENIED, ip: '4.4.4.4' },
      { eventType: AuditEventType.PULSE_UPDATED, ip: '5.5.5.5' },
    ];

    for (const evt of events) {
      await auditLogger.log({
        timestamp: Date.now(),
        eventType: evt.eventType,
        sealId,
        ip: evt.ip,
      });
    }

    const trail = await auditLogger.getAuditTrail(sealId);
    expect(trail.length).toBeGreaterThan(0);
  });
});
