# Security Policy

## Threat Model

Time-Seal is designed to protect against:
- ✅ Server compromise (split-key architecture)
- ✅ Early access attempts (R2 Object Lock + time validation)
- ✅ Admin deletion (WORM compliance)
- ✅ Man-in-the-middle (HTTPS + client-side crypto)

## Known Limitations

### 🔴 Critical
1. **No Rate Limiting** - API endpoints vulnerable to brute-force attacks
2. **No Authentication** - Anyone with seal ID can check status

### 🟡 Medium
3. **Key A in URL Hash** - Visible in browser history, bookmarks, and referrer logs
4. **No Request Signing** - Pulse endpoints can be replayed

### 🟢 Low
5. **Seal ID Enumeration** - Sequential IDs could be guessed
6. **No CAPTCHA** - Automated seal creation possible

## Mitigations

### Implemented
- Client-side encryption (Key A never sent to server)
- Split-key architecture (no single point of failure)
- R2 Object Lock (immutable until unlock time)
- HTTPS-only (enforced by Cloudflare)

### Recommended
```typescript
// Rate limiting (Cloudflare Workers)
const rateLimiter = new RateLimit({
  limit: 10,
  window: 60000, // 1 minute
});

// Seal ID obfuscation
const sealId = nanoid(21); // Cryptographically random

// Request signing for pulse
const signature = await crypto.subtle.sign(
  'HMAC',
  key,
  new TextEncoder().encode(pulseToken)
);
```

## Reporting Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email: security@timeseal.dev (or create private security advisory)

Expected response time: 48 hours

## Disclosure Policy

- Report received → Acknowledged within 48h
- Fix developed → Coordinated disclosure timeline
- Patch released → Public disclosure + credit

## Security Checklist for Production

- [ ] Enable Cloudflare rate limiting
- [ ] Implement request signing for pulse endpoints
- [ ] Use cryptographically random seal IDs (nanoid/uuid)
- [ ] Add CAPTCHA to seal creation
- [ ] Monitor for suspicious access patterns
- [ ] Set up alerting for failed unlock attempts
- [ ] Implement IP-based throttling
- [ ] Add honeypot seals to detect enumeration
- [ ] Enable Cloudflare WAF rules
- [ ] Rotate encryption keys periodically

## Browser Security

Users should:
- Use incognito/private browsing for sensitive seals
- Clear browser history after accessing vault links
- Never share vault links over unencrypted channels
- Verify HTTPS certificate before entering data

## Cryptographic Details

- **Algorithm**: AES-GCM-256
- **Key Derivation**: PBKDF2 (100,000 iterations)
- **IV**: Random 12 bytes per encryption
- **Auth Tag**: 128 bits
- **Key Split**: XOR-based (Key A ⊕ Key B = Master Key)
