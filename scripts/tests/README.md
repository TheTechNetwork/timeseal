# TimeSeal Test Scripts

Local testing scripts to validate all major functions without deploying.

## Setup

1. Start dev server: `npm run dev`
2. Initialize local database: `npx wrangler d1 execute time-seal-db --local --file=./scripts/init-db.sql`

## Test Scripts

### run-all-tests.sh
Run all tests in sequence.
```bash
./run-all-tests.sh [API_URL]
```

### test-health.sh
Test health check endpoint.
```bash
./test-health.sh [API_URL]
```

### test-seal-creation.sh
Create a basic timed seal.
```bash
./test-seal-creation.sh [API_URL] [UNLOCK_HOURS]
```

### test-seal-unlock.sh
Check seal status and unlock.
```bash
./test-seal-unlock.sh [API_URL] SEAL_ID
```

### test-dms-creation.sh
Create a Dead Man's Switch seal.
```bash
./test-dms-creation.sh [API_URL] [PULSE_HOURS]
```

### test-dms-pulse.sh
Pulse a DMS seal to extend unlock time.
```bash
./test-dms-pulse.sh [API_URL] PULSE_TOKEN
```

### test-dms-burn.sh
Permanently delete a DMS seal.
```bash
./test-dms-burn.sh [API_URL] PULSE_TOKEN
```

### test-ephemeral-seal.sh
Create a view-limited ephemeral seal.
```bash
./test-ephemeral-seal.sh [API_URL] [MAX_VIEWS]
```

### test-analytics.sh
Test analytics tracking endpoints.
```bash
./test-analytics.sh [API_URL]
```

### test-receipt-verify.sh
Verify a seal receipt signature.
```bash
./test-receipt-verify.sh [API_URL] RECEIPT_FILE
```

## Examples

```bash
# Run all tests locally
cd scripts/tests
./run-all-tests.sh

# Test against production
./run-all-tests.sh https://timeseal.teycir-932.workers.dev

# Create and test DMS workflow
./test-dms-creation.sh
# Copy pulse token from output
./test-dms-pulse.sh http://localhost:3000 "PULSE_TOKEN_HERE"
./test-dms-burn.sh http://localhost:3000 "PULSE_TOKEN_HERE"
```
