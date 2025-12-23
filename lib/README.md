# TimeSeal Libraries Architecture

## 🏗️ Library Structure

```
lib/
├── 🎨 UI Layer
│   ├── ui/
│   │   ├── textAnimation.ts    # Animation engine
│   │   ├── hooks.ts            # React animation hooks
│   │   └── index.ts            # Exports
│   └── hooks.ts                # General React hooks
│
├── 🌐 Network Layer
│   ├── http.ts                 # HTTP utilities
│   ├── middleware.ts           # Middleware composition
│   └── apiHandler.ts           # API route handlers
│
├── 🔐 Security Layer
│   ├── cryptoUtils.ts          # Crypto primitives
│   ├── security.ts             # Security utilities
│   └── validation.ts           # Input validation
│
├── 📊 Observability Layer
│   ├── logging.ts              # Unified logging
│   ├── metricsLib.ts           # Metrics collection
│   ├── auditLogger.ts          # Audit trails
│   └── errorLogger.ts          # Error tracking
│
├── 🔄 Resilience Layer
│   ├── resilience.ts           # Circuit breaker, retry
│   ├── circuitBreaker.ts       # Legacy circuit breaker
│   └── rateLimit.ts            # Rate limiting
│
├── ⏰ Time Layer
│   └── timeUtils.ts            # Time formatting, countdown
│
├── 🗂️ Data Layer
│   ├── dataStructures.ts       # Caches, queues, stacks
│   ├── database.ts             # Database abstraction
│   └── storage.ts              # Storage operations
│
└── 🛠️ Utilities
    ├── utils.ts                # General utilities
    ├── constants.ts            # Constants
    └── types.ts                # Type definitions
```

## 🔗 Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                     Application Layer                    │
│  (API Routes, React Components, Services)                │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Reusable Libraries                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │    UI    │  │   HTTP   │  │  Crypto  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       │             │              │                     │
│       ▼             ▼              ▼                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  Hooks   │  │Middleware│  │ Security │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│       │             │              │                     │
│       └─────────────┼──────────────┘                     │
│                     ▼                                     │
│  ┌─────────────────────────────────────────┐            │
│  │         Core Utilities Layer            │            │
│  │  (Logging, Metrics, Time, Data)         │            │
│  └─────────────────────────────────────────┘            │
│                     │                                     │
│                     ▼                                     │
│  ┌─────────────────────────────────────────┐            │
│  │         Platform APIs                    │            │
│  │  (Web Crypto, Fetch, Console)            │            │
│  └─────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

## 📦 Library Categories

### 1. Zero-Dependency Libraries
Pure JavaScript/TypeScript with no external dependencies:
- ✅ `http.ts`
- ✅ `middleware.ts`
- ✅ `cryptoUtils.ts`
- ✅ `timeUtils.ts`
- ✅ `dataStructures.ts`
- ✅ `logging.ts`
- ✅ `resilience.ts`
- ✅ `metricsLib.ts`

### 2. React-Dependent Libraries
Require React as peer dependency:
- ⚛️ `hooks.ts`
- ⚛️ `ui/hooks.ts`

### 3. Platform-Specific Libraries
Use Web APIs (browser/Workers):
- 🌐 `cryptoUtils.ts` (Web Crypto API)
- 🌐 `http.ts` (Fetch API)

## 🎯 Design Principles

### 1. Single Responsibility
Each library has one clear purpose:
```typescript
// ✅ Good: Focused on HTTP
import { jsonResponse } from '@/lib/http';

// ❌ Bad: Mixed concerns
import { jsonResponse, sha256, useCountdown } from '@/lib/utils';
```

### 2. Composability
Libraries work together seamlessly:
```typescript
import { createHandler } from '@/lib/apiHandler';
import { withRetry } from '@/lib/resilience';
import { logger } from '@/lib/logging';

export const POST = createHandler(async (ctx) => {
  const result = await withRetry(() => operation());
  logger.info('Success', { result });
  return jsonResponse(result);
});
```

### 3. Type Safety
Full TypeScript support:
```typescript
const cache = new LRUCache<string, User>(100);
const user: User | undefined = cache.get('id');
```

### 4. Tree Shakeable
Import only what you need:
```typescript
// Only bundles jsonResponse and errorResponse
import { jsonResponse, errorResponse } from '@/lib/http';
```

### 5. Testability
Pure functions, easy to test:
```typescript
expect(formatDuration(90000)).toBe('1m 30s');
expect(await sha256('test')).toBe('...');
```

## 🚀 Usage Patterns

### Pattern 1: API Handler
```typescript
import { createHandler, jsonResponse } from '@/lib/apiHandler';
import { withRetry } from '@/lib/resilience';
import { logger } from '@/lib/logging';
import { trackSealCreated } from '@/lib/metricsLib';

export const POST = createHandler(async (ctx) => {
  logger.info('Creating seal', { ip: ctx.ip });
  
  const seal = await withRetry(
    () => createSeal(data),
    { maxRetries: 3 }
  );
  
  trackSealCreated();
  return jsonResponse({ sealId: seal.id });
});
```

### Pattern 2: React Component
```typescript
import { useCountdown, useCopyToClipboard } from '@/lib/hooks';
import { formatDuration } from '@/lib/timeUtils';
import { useTextScramble } from '@/lib/ui/hooks';

function SealViewer({ unlockTime }: Props) {
  const { timeRemaining, isUnlocked } = useCountdown(unlockTime);
  const { displayText, scramble } = useTextScramble('TIME-SEAL');
  const [copy, copied] = useCopyToClipboard();
  
  return (
    <div>
      <h1 onMouseEnter={scramble}>{displayText}</h1>
      {!isUnlocked && <p>{formatDuration(timeRemaining)}</p>}
      <button onClick={() => copy(window.location.href)}>
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    </div>
  );
}
```

### Pattern 3: Service Layer
```typescript
import { CircuitBreaker } from '@/lib/resilience';
import { LRUCache } from '@/lib/dataStructures';
import { logger } from '@/lib/logging';
import { sha256 } from '@/lib/cryptoUtils';

const breaker = new CircuitBreaker();
const cache = new LRUCache<string, Seal>(1000);

export async function getSeal(id: string): Promise<Seal> {
  // Check cache
  const cached = cache.get(id);
  if (cached) {
    logger.debug('Cache hit', { sealId: id });
    return cached;
  }
  
  // Fetch with circuit breaker
  const seal = await breaker.execute(() => db.getSeal(id));
  
  // Cache result
  cache.set(id, seal);
  logger.info('Seal fetched', { sealId: id });
  
  return seal;
}
```

## 📚 Documentation

- **Quick Reference**: `docs/LIBRARIES-QUICK-REF.md`
- **Complete API**: `docs/REUSABLE-LIBRARIES.md`
- **Summary**: `docs/LIBRARIES-SUMMARY.md`
- **Examples**: `app/components/ExampleComponent.tsx`

## 🧪 Testing

All libraries have comprehensive tests:
```bash
npm test tests/unit/reusable-libraries.test.ts
```

## 📦 NPM Packages (Planned)

Future standalone packages:
1. `@timeseal/crypto-utils`
2. `@timeseal/http-utils`
3. `@timeseal/middleware`
4. `@timeseal/resilience`
5. `@timeseal/logging`
6. `@timeseal/metrics`
7. `@timeseal/text-animations`
8. `@timeseal/react-hooks`
9. `@timeseal/time-utils`
10. `@timeseal/data-structures`

## 🤝 Contributing

To add a new library:
1. Create file in appropriate category
2. Follow naming conventions
3. Add TypeScript types
4. Write unit tests
5. Update documentation
6. Add to `lib/index.ts`

---

**Built with 💚 by Teycir**
