# TIME-SEAL Deployment Guide

## ✅ Automated Setup Complete

All automated setup steps have been completed successfully:

### 1. D1 Database Setup ✅
```bash
./scripts/setup-d1.sh
```
- Database: `time-seal-db`
- Database ID: `07ad5c32-1de4-410f-aa5d-82366405fe66`
- Schema deployed with `seals` and `audit_logs` tables
- Using D1 for blob storage (no R2 required - no credit card needed!)

### 2. Production Secrets ✅
```bash
./scripts/setup-secrets.sh
```
- `MASTER_ENCRYPTION_KEY`: Set and uploaded to Cloudflare Pages

### 3. Deployment ✅
```bash
./scripts/deploy.sh
```
- Live at: https://time-seal.pages.dev
- Latest build: https://69bd2162.time-seal.pages.dev

## ⚠️ Required Manual Step (Cloudflare API Limitation)

Cloudflare's API does not currently support setting compatibility flags for Pages projects programmatically. You must complete this one-time manual step:

### Add nodejs_compat Compatibility Flag

1. Open: https://dash.cloudflare.com/9325c2e52714914a91a29cde8e51096f/pages/view/time-seal/settings/functions
2. Scroll to **"Compatibility Flags"** section
3. For **Production**:
   - Click "Add flag"
   - Type: `nodejs_compat`
   - Click "Save"
4. For **Preview**:
   - Click "Add flag"  
   - Type: `nodejs_compat`
   - Click "Save"
5. Go to **Deployments** tab
6. Click "Retry deployment" on the latest deployment

### Why This Step Is Necessary

Next.js on Cloudflare Pages requires Node.js compatibility for:
- Buffer operations
- Async hooks
- Other Node.js built-in modules

Without this flag, you'll see "nodejs_compat compatibility flag" errors.

## 🎉 After Completing the Manual Step

Your TIME-SEAL application will be fully functional with:

- ✅ Time-locked seals (encrypt files/messages for future unlock)
- ✅ Dead Man's Switch functionality
- ✅ D1 database storage (free, no credit card required)
- ✅ File uploads up to 10MB
- ✅ Audit logging for all operations
- ✅ Production-grade encryption (AES-GCM)

## 📝 Storage Solution

Since R2 requires a credit card, we're using **D1 Database** for blob storage:

- The `seals` table has an `encrypted_blob` TEXT column
- Encrypted data is stored as base64 in the database
- Maximum file size: 10MB (configurable in `lib/storage.ts`)
- Performance is excellent for typical use cases
- Completely free tier available

## 🔄 Future Deployments

After the initial setup, deployments are fully automated:

```bash
./scripts/deploy.sh
```

This will:
1. Build the Next.js application
2. Deploy to Cloudflare Pages
3. Use the existing D1 database and secrets
4. Apply the compatibility flags (once set manually)

## 🆘 Troubleshooting

### "nodejs_compat" Error
- Complete the manual compatibility flag step above

### Database Errors
- Verify D1 binding in wrangler.toml
- Check database ID matches: `07ad5c32-1de4-410f-aa5d-82366405fe66`

### Encryption Errors  
- Verify MASTER_ENCRYPTION_KEY is set in Cloudflare Pages secrets
- Check: https://dash.cloudflare.com/pages/time-seal/settings/environment-variables

## 📚 Additional Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [Next.js on Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

**Note**: The manual compatibility flag step is a one-time requirement due to Cloudflare API limitations. Once set, it persists across all future deployments.
