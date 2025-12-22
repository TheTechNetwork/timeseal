# TimeSeal Trust Assumptions

## Overview

TimeSeal is designed to minimize trust requirements, but no system can eliminate trust entirely. This document explicitly states what you must trust when using TimeSeal.

---

## What You MUST Trust

### 1. Cloudflare Infrastructure

**Assumption**: Cloudflare's infrastructure is secure and honest.

**Why**: TimeSeal runs on Cloudflare Workers and D1 database.

**Risks if compromised**:
- ❌ Cloudflare could manipulate server time to unlock seals early
- ❌ Cloudflare could access encrypted Key B from database
- ❌ Cloudflare could modify or delete sealed content

**Mitigation**: 
- Cloudflare is a publicly traded company with strong security practices
- Infrastructure is audited and certified (SOC 2, ISO 27001)
- Time synchronized via NTP across global network
- This is an accepted trade-off for edge computing benefits

**Alternative**: Self-host on your own infrastructure (requires code modification)

---

### 2. TimeSeal Code & Operators

**Assumption**: The TimeSeal codebase is secure and operators are honest.

**Why**: The server controls Key B release and time validation.

**Risks if compromised**:
- ❌ Malicious code could leak Key B early
- ❌ Operators could modify database to change unlock times
- ❌ Backdoors could be introduced in updates

**Mitigation**:
- ✅ **Open Source**: Code is publicly auditable on GitHub
- ✅ **Business Source License**: Source available for inspection
- ✅ **Immutable Audit Logs**: All access attempts are logged
- ✅ **Split-Key Architecture**: Operators cannot decrypt without Key A (in your URL)

**Verification**: Review the source code at https://github.com/teycir/timeseal

---

### 3. Your Browser & Device

**Assumption**: Your browser and device are not compromised.

**Why**: Encryption/decryption happens client-side in your browser.

**Risks if compromised**:
- ❌ Malware could steal Key A from URL or memory
- ❌ Browser extensions could intercept decrypted content
- ❌ Keyloggers could capture sensitive data

**Mitigation**:
- Use updated browsers (Chrome, Firefox, Safari, Edge)
- Avoid browser extensions when accessing sensitive seals
- Use incognito/private mode for sensitive content
- Clear browser history after accessing vault links
- Use trusted, malware-free devices

---

### 4. Cryptographic Primitives

**Assumption**: AES-GCM-256 and Web Crypto API are secure.

**Why**: Content security depends on encryption strength.

**Risks if broken**:
- ❌ Quantum computers could break AES-256 (future threat)
- ❌ Implementation bugs in Web Crypto API

**Mitigation**:
- AES-256 is NIST-approved and industry standard
- Web Crypto API is maintained by browser vendors
- Quantum resistance is a future concern (10+ years)

**Post-Quantum**: TimeSeal will migrate to quantum-resistant algorithms when standardized

---

### 5. Network Security (HTTPS)

**Assumption**: TLS/HTTPS connections are secure.

**Why**: Data transmitted between browser and server.

**Risks if compromised**:
- ❌ Man-in-the-middle attacks could intercept Key B
- ❌ Certificate authority compromise

**Mitigation**:
- ✅ HTTPS enforced by Cloudflare
- ✅ HSTS headers prevent downgrade attacks
- ✅ Certificate pinning (browser-enforced)

**Verification**: Check for valid SSL certificate in browser

---

## What You DO NOT Need to Trust

### ❌ Server Cannot Decrypt Your Content

**Why**: Key A is stored in URL hash and never sent to server.

Even if the server is compromised:
- Server has Key B but not Key A
- Both keys required for decryption
- Server cannot combine keys without your URL

### ❌ Operators Cannot Read Your Sealed Content

**Why**: Split-key architecture prevents single-party decryption.

Even with database access:
- Key B is encrypted with master key
- Key A is never stored on server
- Encrypted blob is meaningless without both keys

### ❌ Time Manipulation by Client

**Why**: Server validates time using `Date.now()`.

Even if you change your device clock:
- Server checks its own time, not yours
- Key B is withheld until server time >= unlock time
- Client countdown is cosmetic only

---

## Threat Model Boundaries

### ✅ Protected Against

| Attack | Protection |
|--------|-----------|
| Early access attempts | Server-side time validation |
| Client time manipulation | Server uses Date.now() |
| Brute force attacks | AES-256 + rate limiting |
| Server compromise | Split-key architecture |
| Data tampering | Database integrity + AEAD |
| Replay attacks | Nonce validation |
| Automated abuse | Turnstile CAPTCHA |

### ⚠️ Partially Protected

| Attack | Limitation |
|--------|-----------|
| Cloudflare compromise | Must trust infrastructure provider |
| Operator malice | Open source + audit logs reduce risk |
| Browser compromise | User responsibility |

### ❌ NOT Protected Against

| Attack | Why |
|--------|-----|
| Loss of vault link | Key A is in URL hash (no recovery) |
| Quantum computing | AES-256 vulnerable to quantum (future) |
| Cloudflare infrastructure failure | Service depends on Cloudflare uptime |
| Physical device compromise | Client-side encryption requires secure device |
| Social engineering | User must protect vault links |

---

## Trust Minimization Strategies

### For Maximum Security

1. **Verify Source Code**
   ```bash
   git clone https://github.com/teycir/timeseal
   # Review lib/crypto.ts, lib/sealService.ts
   ```

2. **Self-Host** (Advanced)
   - Deploy on your own Cloudflare account
   - Control master encryption key
   - Audit all code changes

3. **Use Incognito Mode**
   - Prevents browser history leaks
   - Isolates from extensions
   - Clears data on close

4. **Verify HTTPS**
   - Check SSL certificate
   - Look for padlock icon
   - Verify domain matches

5. **Save Links Securely**
   - Use password manager
   - Encrypt vault links
   - Never share over unencrypted channels

---

## Comparison with Alternatives

### Traditional "Future Message" Apps
- ❌ Trust the company not to read your messages
- ❌ Trust they won't unlock early
- ❌ No cryptographic enforcement
- ❌ Closed source

### TimeSeal
- ✅ Split-key prevents single-party decryption
- ✅ Server-side time validation
- ✅ Open source for audit
- ⚠️ Must trust Cloudflare infrastructure

### Self-Hosted Solutions
- ✅ Full control over infrastructure
- ✅ No third-party trust
- ❌ Requires technical expertise
- ❌ Maintenance burden
- ❌ No edge computing benefits

---

## Transparency Commitments

### What We Promise

1. **Open Source**: All code is publicly available
2. **No Backdoors**: No hidden decryption mechanisms
3. **Audit Logs**: Immutable access trail
4. **No Data Mining**: We don't analyze your content
5. **Minimal Data**: Only store encrypted blobs + metadata

### What We Log

**Stored**:
- Seal ID (random, not linked to identity)
- Unlock time
- Encrypted Key B
- Encrypted blob
- Creation timestamp

**Audit Logs**:
- Access timestamps
- IP addresses (for rate limiting)
- Event types (created, accessed, unlocked)

**NOT Stored**:
- Key A (never sent to server)
- Decrypted content
- User identity
- Email addresses
- Payment information

---

## Acceptable Use

### TimeSeal is Suitable For:

✅ Crypto inheritance (seed phrases)  
✅ Whistleblower evidence  
✅ Product launches  
✅ Birthday messages  
✅ Legal documents  
✅ Time-sensitive information  

### TimeSeal is NOT Suitable For:

❌ Life-or-death situations (trust Cloudflare uptime)  
❌ Nation-state level secrets (use air-gapped systems)  
❌ Illegal content (violates Terms of Service)  
❌ Content requiring quantum resistance (future threat)  

---

## Questions to Ask Yourself

Before using TimeSeal, consider:

1. **Do I trust Cloudflare?**
   - If no: Self-host or use alternative

2. **Is my device secure?**
   - If no: Clean device before accessing seals

3. **Can I safely store the vault link?**
   - If no: Use password manager or encrypted storage

4. **What happens if I lose the link?**
   - Answer: Content is lost forever (no recovery)

5. **What if Cloudflare goes down?**
   - Answer: Seal remains locked until service resumes

6. **Can the creator decrypt my seal early?**
   - Answer: No, not even the creator can decrypt early

---

## Trust Hierarchy

```
┌─────────────────────────────────────┐
│  You (Key A in URL)                 │  ← Full Control
├─────────────────────────────────────┤
│  Your Browser & Device              │  ← Your Responsibility
├─────────────────────────────────────┤
│  HTTPS/TLS (Certificate Authority)  │  ← Industry Standard
├─────────────────────────────────────┤
│  TimeSeal Code (Open Source)        │  ← Auditable
├─────────────────────────────────────┤
│  Cloudflare Infrastructure          │  ← Must Trust
├─────────────────────────────────────┤
│  Cryptographic Primitives (AES-256) │  ← NIST Approved
└─────────────────────────────────────┘
```

---

## Conclusion

TimeSeal minimizes trust through:
- **Split-key architecture** (no single point of failure)
- **Open source code** (public audit)
- **Server-side time validation** (cryptographic enforcement)
- **Immutable audit logs** (transparency)

However, you must still trust:
- Cloudflare infrastructure
- Your own device security
- Cryptographic primitives

**If these trust assumptions are acceptable, TimeSeal provides strong time-lock guarantees. If not, consider self-hosting or alternative solutions.**

---

## Further Reading

- [SECURITY.md](./SECURITY.md) - Security controls and threat model
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design and patterns
- [API.md](./API.md) - API documentation
- [Source Code](https://github.com/teycir/timeseal) - Full implementation

---

**Last Updated**: 2025-12-22  
**Version**: 0.2.0
