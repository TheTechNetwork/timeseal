# Production Readiness TODO

## 🔴 Critical (Must Fix Before Launch)

- [ ] **Rate Limiting**: Implement Cloudflare Workers rate limiting
  - API endpoints: 10 req/min per IP
  - Pulse endpoints: 5 req/hour per token
  
- [ ] **R2 Object Lock**: Complete WORM compliance implementation
  - Enable retention mode on bucket
  - Set retention period based on unlock time
  - Test immutability guarantees

- [ ] **Error Handling**: User-friendly error messages
  - Replace generic errors with specific codes
  - Add retry logic for transient failures
  - Implement graceful degradation

- [ ] **Seal ID Security**: Use cryptographically random IDs
  - Replace sequential IDs with nanoid/uuid
  - Prevent enumeration attacks

## 🟡 High Priority (Should Fix Soon)

- [ ] **Authentication**: Optional auth for sensitive seals
  - Password-protected seals
  - Email verification for DMS

- [ ] **Request Signing**: Prevent pulse replay attacks
  - HMAC signatures on pulse requests
  - Timestamp validation

- [ ] **Input Validation**: Comprehensive sanitization
  - File type restrictions
  - Size limits (max 100MB)
  - Content scanning

- [ ] **Monitoring**: Production observability
  - Failed unlock attempt alerts
  - Pulse miss notifications
  - Performance metrics

## 🟢 Nice to Have (Future Enhancements)

- [ ] **Multi-Sig Unlocking**: M-of-N key requirement
- [ ] **Decentralized Backup**: Arweave/IPFS integration
- [ ] **Hardware Key Support**: YubiKey for pulse
- [ ] **Audit Logs**: Immutable access history
- [ ] **Email Notifications**: Unlock reminders
- [ ] **Mobile App**: Native iOS/Android clients

## 🐛 Known Bugs

- [ ] Tailwind border color missing (FIXED)
- [ ] Tests don't test actual crypto (FIXED)
- [ ] Playwright tests need debugging
- [ ] E2E tests fail without running dev server

## 📝 Documentation Needed

- [ ] API documentation (OpenAPI spec)
- [ ] Deployment guide (Cloudflare setup)
- [ ] User guide (how to create seals)
- [ ] Security model explanation
- [ ] Trust assumptions document
- [ ] Disaster recovery procedures
