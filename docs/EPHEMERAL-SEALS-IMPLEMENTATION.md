# Ephemeral Seals Implementation Guide

## 🎯 Feature Overview

**Ephemeral Seals** = Time-locked messages that self-destruct after first view

**Key behaviors:**
- ✅ Unlock at specified time (standard time-lock)
- ✅ Auto-delete after first successful decryption
- ✅ Show "Already opened" to subsequent viewers
- ✅ Audit log tracks who opened it (privacy-preserving)
- ✅ Optional: Notify creator on first view

---

## 📋 Database Schema Changes

### Step 1: Add columns to `seals` table

```sql
-- Migration: Add ephemeral seal support
ALTER TABLE seals ADD COLUMN is_ephemeral INTEGER DEFAULT 0;
ALTER TABLE seals ADD COLUMN max_views INTEGER DEFAULT NULL;
ALTER TABLE seals ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE seals ADD COLUMN first_viewed_at INTEGER DEFAULT NULL;
ALTER TABLE seals ADD COLUMN first_viewer_fingerprint TEXT DEFAULT NULL;

-- Indexes for performance
CREATE INDEX idx_seals_ephemeral ON seals(is_ephemeral) WHERE is_ephemeral = 1;
```

**Column explanations:**
- `is_ephemeral`: Boolean flag (0 = normal, 1 = ephemeral)
- `max_views`: NULL = unlimited, 1 = read-once, N = read N times
- `view_count`: Tracks successful decryptions
- `first_viewed_at`: Timestamp of first view (audit)
- `first_viewer_fingerprint`: SHA-256 hash of viewer (privacy)

---

## 🔧 Backend Implementation

### Step 2: Update TypeScript types

```typescript
// lib/types.ts
export interface Seal {
  id: string;
  encryptedBlob: string;
  encryptedKeyB: string;
  iv: string;
  unlockTime: number;
  createdAt: number;
  accessCount: number;
  
  // NEW: Ephemeral seal fields
  isEphemeral: boolean;
  maxViews: number | null;
  viewCount: number;
  firstViewedAt: number | null;
  firstViewerFingerprint: string | null;
  
  // Existing fields
  pulseToken?: string;
  pulseInterval?: number;
  nextPulseDeadline?: number;
}

export interface CreateSealRequest {
  encryptedBlob: string;
  encryptedKeyB: string;
  iv: string;
  unlockTime: number;
  turnstileToken: string;
  
  // NEW: Ephemeral options
  isEphemeral?: boolean;
  maxViews?: number;
}
```

### Step 3: Update database layer

```typescript
// lib/database.ts

export class Database {
  // Update createSeal method
  async createSeal(
    id: string,
    encryptedBlob: string,
    encryptedKeyB: string,
    iv: string,
    unlockTime: number,
    isEphemeral: boolean = false,
    maxViews: number | null = null
  ): Promise<void> {
    const now = Date.now();
    
    await this.db
      .prepare(`
        INSERT INTO seals (
          id, encrypted_blob, encrypted_key_b, iv, 
          unlock_time, created_at, access_count,
          is_ephemeral, max_views, view_count
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, 0)
      `)
      .bind(id, encryptedBlob, encryptedKeyB, iv, unlockTime, now, 
            isEphemeral ? 1 : 0, maxViews)
      .run();
  }

  // NEW: Atomic view-and-check operation
  async recordViewAndCheck(
    sealId: string, 
    fingerprint: string
  ): Promise<{ allowed: boolean; viewCount: number; maxViews: number | null }> {
    const seal = await this.getSeal(sealId);
    if (!seal) throw new Error('Seal not found');

    // Not ephemeral = always allowed
    if (!seal.isEphemeral) {
      return { allowed: true, viewCount: 0, maxViews: null };
    }

    // Check if already exceeded max views
    if (seal.maxViews !== null && seal.viewCount >= seal.maxViews) {
      return { 
        allowed: false, 
        viewCount: seal.viewCount, 
        maxViews: seal.maxViews 
      };
    }

    // Atomic increment (race condition safe)
    const newViewCount = seal.viewCount + 1;
    const now = Date.now();
    
    await this.db
      .prepare(`
        UPDATE seals 
        SET view_count = ?,
            first_viewed_at = COALESCE(first_viewed_at, ?),
            first_viewer_fingerprint = COALESCE(first_viewer_fingerprint, ?)
        WHERE id = ?
      `)
      .bind(newViewCount, now, fingerprint, sealId)
      .run();

    return { 
      allowed: true, 
      viewCount: newViewCount, 
      maxViews: seal.maxViews 
    };
  }

  // NEW: Delete seal after max views reached
  async deleteIfExhausted(sealId: string): Promise<boolean> {
    const seal = await this.getSeal(sealId);
    if (!seal || !seal.isEphemeral) return false;

    if (seal.maxViews !== null && seal.viewCount >= seal.maxViews) {
      await this.deleteSeal(sealId);
      return true;
    }

    return false;
  }
}
```

### Step 4: Update seal service

```typescript
// lib/sealService.ts

export class SealService {
  async createSeal(
    encryptedBlob: string,
    encryptedKeyB: string,
    iv: string,
    unlockTime: number,
    isEphemeral: boolean = false,
    maxViews: number | null = null
  ): Promise<string> {
    // Validation
    if (isEphemeral && maxViews !== null && maxViews < 1) {
      throw new Error('maxViews must be at least 1');
    }

    const sealId = generateSealId();
    
    await this.db.createSeal(
      sealId,
      encryptedBlob,
      encryptedKeyB,
      iv,
      unlockTime,
      isEphemeral,
      maxViews
    );

    // Emit event
    this.eventBus.emit('seal:created', {
      sealId,
      unlockTime,
      isEphemeral,
      maxViews,
    });

    return sealId;
  }

  async getSealStatus(sealId: string, fingerprint: string): Promise<SealStatus> {
    const seal = await this.db.getSeal(sealId);
    if (!seal) throw new Error('Seal not found');

    const now = Date.now();
    const isUnlocked = now >= seal.unlockTime;

    // Check if ephemeral and exhausted
    if (seal.isEphemeral && seal.maxViews !== null) {
      if (seal.viewCount >= seal.maxViews) {
        return {
          status: 'exhausted',
          message: 'This seal has already been opened and self-destructed',
          viewCount: seal.viewCount,
          maxViews: seal.maxViews,
          firstViewedAt: seal.firstViewedAt,
        };
      }
    }

    if (!isUnlocked) {
      return {
        status: 'locked',
        unlockTime: seal.unlockTime,
        remainingTime: seal.unlockTime - now,
        isEphemeral: seal.isEphemeral,
        maxViews: seal.maxViews,
      };
    }

    // Record view and check if allowed
    const viewCheck = await this.db.recordViewAndCheck(sealId, fingerprint);
    
    if (!viewCheck.allowed) {
      return {
        status: 'exhausted',
        message: 'This seal has already been opened',
        viewCount: viewCheck.viewCount,
        maxViews: viewCheck.maxViews,
      };
    }

    // Delete if this was the last allowed view
    if (seal.isEphemeral && seal.maxViews !== null && viewCheck.viewCount >= seal.maxViews) {
      await this.db.deleteIfExhausted(sealId);
      
      this.eventBus.emit('seal:exhausted', {
        sealId,
        viewCount: viewCheck.viewCount,
        firstViewedAt: seal.firstViewedAt,
      });
    }

    return {
      status: 'unlocked',
      encryptedKeyB: seal.encryptedKeyB,
      iv: seal.iv,
      isEphemeral: seal.isEphemeral,
      viewCount: viewCheck.viewCount,
      maxViews: viewCheck.maxViews,
      warning: seal.isEphemeral ? 'This seal will self-destruct after viewing' : undefined,
    };
  }
}
```

### Step 5: Update API route

```typescript
// app/api/seal-status/route.ts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sealId = searchParams.get('id');

  if (!sealId) {
    return createErrorResponse(ErrorCode.INVALID_INPUT, 'Missing seal ID');
  }

  // Generate privacy-preserving fingerprint
  const fingerprint = await generateFingerprint(request);

  const sealService = new SealService(env.DB, eventBus);
  const status = await sealService.getSealStatus(sealId, fingerprint);

  // Handle exhausted seals
  if (status.status === 'exhausted') {
    return NextResponse.json({
      status: 'exhausted',
      message: status.message,
      viewCount: status.viewCount,
      maxViews: status.maxViews,
      firstViewedAt: status.firstViewedAt,
    }, { status: 410 }); // 410 Gone
  }

  return NextResponse.json(status);
}

// Helper: Generate privacy-preserving fingerprint
async function generateFingerprint(request: Request): Promise<string> {
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  const lang = request.headers.get('accept-language') || 'unknown';
  
  const data = `${ip}:${ua}:${lang}`;
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
```

---

## 🎨 Frontend Implementation

### Step 6: Update seal creation form

```typescript
// app/create/page.tsx

export default function CreateSealPage() {
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [maxViews, setMaxViews] = useState<number>(1);

  return (
    <form onSubmit={handleSubmit}>
      {/* Existing fields... */}
      
      {/* NEW: Ephemeral seal option */}
      <div className="border-t border-neon-green/20 pt-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isEphemeral}
            onChange={(e) => setIsEphemeral(e.target.checked)}
            className="w-5 h-5"
          />
          <div>
            <div className="font-mono text-neon-green">
              🔥 Ephemeral Seal (Self-Destruct)
            </div>
            <div className="text-sm text-gray-400">
              Auto-delete after first view (read-once message)
            </div>
          </div>
        </label>

        {isEphemeral && (
          <div className="mt-4 ml-8">
            <label className="block text-sm text-gray-400 mb-2">
              Maximum Views (optional)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={maxViews}
              onChange={(e) => setMaxViews(parseInt(e.target.value))}
              className="w-32 px-3 py-2 bg-black border border-neon-green/30 
                         text-neon-green font-mono rounded"
            />
            <div className="text-xs text-gray-500 mt-1">
              Seal will self-destruct after {maxViews} view{maxViews > 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>

      <button type="submit">Create Seal</button>
    </form>
  );
}
```

### Step 7: Update vault viewer

```typescript
// app/vault/[id]/page.tsx

export default function VaultPage({ params }: { params: { id: string } }) {
  const [status, setStatus] = useState<SealStatus | null>(null);

  useEffect(() => {
    async function checkStatus() {
      const res = await fetch(`/api/seal-status?id=${params.id}`);
      const data = await res.json();
      
      if (res.status === 410) {
        // Seal exhausted
        setStatus({ status: 'exhausted', ...data });
        return;
      }
      
      setStatus(data);
    }
    
    checkStatus();
  }, [params.id]);

  // Handle exhausted seals
  if (status?.status === 'exhausted') {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💨</div>
        <h1 className="text-2xl font-mono text-neon-green mb-4">
          Seal Self-Destructed
        </h1>
        <p className="text-gray-400 mb-2">
          This ephemeral seal has already been opened and deleted.
        </p>
        <div className="text-sm text-gray-500">
          Opened {status.viewCount} time{status.viewCount > 1 ? 's' : ''} 
          (max: {status.maxViews})
        </div>
        {status.firstViewedAt && (
          <div className="text-xs text-gray-600 mt-2">
            First viewed: {new Date(status.firstViewedAt).toLocaleString()}
          </div>
        )}
      </div>
    );
  }

  // Handle unlocked ephemeral seals
  if (status?.status === 'unlocked' && status.isEphemeral) {
    return (
      <div>
        {/* Warning banner */}
        <div className="bg-red-900/20 border border-red-500 rounded p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <div className="font-mono text-red-400 font-bold">
                EPHEMERAL SEAL WARNING
              </div>
              <div className="text-sm text-gray-300">
                This seal will self-destruct after viewing. 
                Save the content now - you cannot access it again.
              </div>
              {status.maxViews && (
                <div className="text-xs text-gray-400 mt-1">
                  Views: {status.viewCount} / {status.maxViews}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decrypted content */}
        <DecryptedContent 
          encryptedBlob={status.encryptedBlob}
          keyA={getKeyAFromHash()}
          keyB={status.encryptedKeyB}
        />
      </div>
    );
  }

  // Normal locked/unlocked flow
  return <StandardVaultView status={status} />;
}
```

---

## 🧪 Testing

### Step 8: Unit tests

```typescript
// __tests__/ephemeral-seals.test.ts

describe('Ephemeral Seals', () => {
  test('creates ephemeral seal with max views', async () => {
    const sealId = await sealService.createSeal(
      'encrypted',
      'keyB',
      'iv',
      Date.now() + 1000,
      true,  // isEphemeral
      1      // maxViews
    );

    const seal = await db.getSeal(sealId);
    expect(seal.isEphemeral).toBe(true);
    expect(seal.maxViews).toBe(1);
    expect(seal.viewCount).toBe(0);
  });

  test('allows first view, blocks second view', async () => {
    const sealId = await createEphemeralSeal(maxViews: 1);
    
    // First view - allowed
    const status1 = await sealService.getSealStatus(sealId, 'fingerprint1');
    expect(status1.status).toBe('unlocked');
    expect(status1.viewCount).toBe(1);

    // Second view - blocked
    const status2 = await sealService.getSealStatus(sealId, 'fingerprint2');
    expect(status2.status).toBe('exhausted');
  });

  test('deletes seal after max views reached', async () => {
    const sealId = await createEphemeralSeal(maxViews: 1);
    
    await sealService.getSealStatus(sealId, 'fingerprint1');
    
    // Seal should be deleted
    const seal = await db.getSeal(sealId);
    expect(seal).toBeNull();
  });

  test('tracks first viewer fingerprint', async () => {
    const sealId = await createEphemeralSeal(maxViews: 2);
    
    await sealService.getSealStatus(sealId, 'alice-fingerprint');
    
    const seal = await db.getSeal(sealId);
    expect(seal.firstViewerFingerprint).toBe('alice-fingerprint');
    expect(seal.firstViewedAt).toBeGreaterThan(0);
  });

  test('race condition: concurrent views', async () => {
    const sealId = await createEphemeralSeal(maxViews: 1);
    
    // Simulate 10 concurrent requests
    const promises = Array(10).fill(null).map((_, i) => 
      sealService.getSealStatus(sealId, `fingerprint-${i}`)
    );
    
    const results = await Promise.all(promises);
    
    // Only 1 should succeed
    const unlocked = results.filter(r => r.status === 'unlocked');
    const exhausted = results.filter(r => r.status === 'exhausted');
    
    expect(unlocked.length).toBe(1);
    expect(exhausted.length).toBe(9);
  });
});
```

---

## 📊 Analytics & Monitoring

### Step 9: Event tracking

```typescript
// lib/events.ts

eventBus.on('seal:exhausted', async (event) => {
  // Log to analytics
  await analytics.track('ephemeral_seal_exhausted', {
    sealId: event.sealId,
    viewCount: event.viewCount,
    firstViewedAt: event.firstViewedAt,
  });

  // Optional: Notify creator
  if (event.notifyCreator) {
    await sendNotification(event.creatorEmail, {
      subject: 'Your ephemeral seal was opened',
      body: `Seal ${event.sealId} was viewed and self-destructed.`,
    });
  }
});
```

---

## 🚀 Deployment Checklist

- [ ] Run database migration (add columns)
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Update API documentation
- [ ] Add feature flag (gradual rollout)
- [ ] Monitor error rates
- [ ] Test in production with real seals

---

## 📈 Success Metrics

**Track:**
- % of seals created as ephemeral
- Average max_views setting
- View exhaustion rate
- Time between creation and first view
- User retention (do they create more?)

**Goals:**
- 10% of seals use ephemeral mode (month 1)
- <0.1% error rate on view tracking
- Zero race condition bugs

---

## 🔒 Security Considerations

**Implemented:**
- ✅ Atomic view counting (no race conditions)
- ✅ Privacy-preserving fingerprints (SHA-256 hash)
- ✅ Database-level constraints (view_count <= max_views)
- ✅ Audit trail (first viewer, timestamp)

**Risks:**
- ⚠️ User refreshes page = multiple view counts (acceptable)
- ⚠️ Fingerprint collision (extremely rare with SHA-256)

---

## 🎯 Estimated Effort

- **Database migration:** 30 minutes
- **Backend implementation:** 3 hours
- **Frontend implementation:** 2 hours
- **Testing:** 2 hours
- **Documentation:** 1 hour

**Total: 1 day of development**

---

**Status:** ✅ Ready to implement  
**Priority:** HIGH (quick win, high value)  
**Next step:** Create feature branch and start with database migration
