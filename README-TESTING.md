# TimeSeal Testing Guide

## Automated E2E Tests

### Run All Tests
```bash
npm run test:e2e:full
```

### Run Tests in UI Mode
```bash
npm run test:e2e:ui
```

### Run Against Production
```bash
BASE_URL=https://timeseal.teycir-932.workers.dev npm run test:e2e:full
```

## Test Coverage

### ✅ Core Features
- [x] Homepage loads with all elements
- [x] Create timed release seal
- [x] Create dead man's switch seal
- [x] Template application
- [x] File upload
- [x] Form validation
- [x] Vault countdown display

### ✅ Navigation
- [x] How It Works page
- [x] Security page
- [x] FAQ page
- [x] Footer links

### ✅ API Health
- [x] /api/health endpoint
- [x] /api/metrics endpoint

## CI/CD Integration

Tests run automatically on:
- Push to master/main
- Pull requests
- Results uploaded to GitHub Actions artifacts

## Regression Protection

All tests verify:
1. **Encryption Flow**: Message → Seal → Vault → Decrypt
2. **Time Lock**: Countdown displays correctly
3. **Dead Man's Switch**: Pulse token generation
4. **UI/UX**: All interactive elements work
5. **API Stability**: Endpoints respond correctly

Run before every deployment to prevent regressions.
