# Changelog

All notable changes to Time-Seal will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Professional test suite with Jest, Playwright, and Testing Library
- Unit tests for crypto library (key generation, encryption/decryption)
- Integration tests for API endpoints (seal creation, status checks)
- E2E tests for complete seal workflows
- Mock fixtures for Cloudflare services (D1, R2)
- GitHub Actions CI/CD workflow for automated testing
- Test coverage thresholds (80% across all metrics)
- Test documentation in `__tests__/README.md`

## [0.1.0] - 2024-01-XX

### Added
- Initial release of Time-Seal
- Cryptographically enforced time-locked vault system
- Split-key architecture (Key A + Key B)
- Cloudflare R2 Object Lock integration (WORM compliance)
- Cloudflare D1 database for metadata storage
- Dead Man's Switch functionality with pulse mechanism
- AES-GCM encryption using Web Crypto API
- Next.js 14 frontend with App Router
- Tailwind CSS cipher-punk themed UI
- Countdown timer for locked seals
- Automatic unlock at specified time
- Public vault links with hash-based Key A
- Private pulse links for DMS resets

### Security
- Zero-trust architecture
- Client-side encryption
- Server cannot decrypt without user's Key A
- Immutable storage prevents early access
- No single point of failure

[Unreleased]: https://github.com/teycir/timeseal/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/teycir/timeseal/releases/tag/v0.1.0
