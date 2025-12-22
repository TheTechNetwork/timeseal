# Innovation Analysis: What's Worth Building?

## TL;DR

**Build Now:** Post-Quantum Cryptography (PQC)  
**Maybe Later:** Decentralized Storage  
**Skip:** SSI and ZKPs (wrong problems)

## Quick Evaluation

### 1. Self-Sovereign Identity (SSI) 🔴 SKIP

**Problem it solves:** Lost vault links  
**Why skip:**
- Breaks "anyone with link = access" model (kills whistleblower use case)
- Adds authentication layer (contradicts zero-trust design)
- Requires wallet (huge UX barrier)
- Massive complexity for small benefit

**Better solution:** Optional password-encrypted link backup in localStorage

### 2. Zero-Knowledge Proofs (ZKPs) 🟡 SKIP (FOR NOW)

**Problem it solves:** Key A visible in URL  
**Why skip:**
- Key A already never sent to server (problem doesn't exist)
- 1-5 second proof generation = terrible UX
- Still need to distribute Key A somehow (defeats purpose)
- You already have memory obfuscation (v0.6.0)

**When to revisit:** If ZK tech gets 100x faster (2027+)

### 3. Post-Quantum Cryptography (PQC) 🟢 BUILD THIS

**Problem it solves:** Quantum computers will break AES-256 (2030-2035)  
**Why build:**
- Seals can be locked for decades (quantum threat is real)
- NIST-approved algorithms ready now (CRYSTALS-Kyber)
- Only 5x slower, +50KB bundle (acceptable)
- Huge marketing value ("quantum-resistant vaults")

**Implementation:**
```typescript
// Hybrid mode: AES + Kyber
import { kyber1024 } from '@noble/post-quantum/kyber';

// 1. Encrypt with AES (fast)
const aesEncrypted = await aesEncrypt(data, aesKey);

// 2. Protect AES key with Kyber (quantum-safe)
const { ciphertext, sharedSecret } = kyber1024.encapsulate(publicKey);
const protectedKey = xor(aesKey, sharedSecret);
```

**Timeline:** 2-3 months to production

### 4. Decentralized Storage + MPC 🟡 MAYBE LATER

**Problem it solves:** Cloudflare single point of failure  
**Why wait:**
- 10x slower (500ms vs 50ms)
- 100x more expensive ($500/mo vs $5/mo)
- Massive operational complexity (5 servers, consensus, Byzantine failures)
- IPFS is slow (2-5 seconds per fetch)

**When to build:** 
- Enterprise tier (customers pay for censorship resistance)
- Self-hosting guide (let others run MPC networks)
- 2026+ when you have revenue to support infrastructure

## What to Build

**Now (Q1 2025):** Post-Quantum Cryptography
- 2-3 months effort
- Use `@noble/post-quantum/kyber`
- Hybrid mode (AES + Kyber)
- Huge marketing win

**Later (2026+):** MPC for enterprise tier
- Only if you have paying customers
- Document self-hosting approach
- Let others run their own networks

**Never:** SSI and ZKPs
- Wrong problems
- Too much complexity
- Conflicts with design

---

**Bottom line:** Build PQC. Skip the rest.
