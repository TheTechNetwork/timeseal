# URGENT: Rotate Turnstile Widget - Step by Step

## Problem
Leaked Turnstile keys are causing 1-minute load delays. Cloudflare is likely throttling the compromised widget.

**Current leaked keys:**
- Site Key: `0x4AAAAAACHzq8TngxZwCTuD`
- Secret Key: `0x4AAAAAACHzq-2YjQt7pL5TPWWo9bbwthM`

---

## Step 1: Create New Turnstile Widget in Cloudflare Dashboard

### 1.1 Login to Cloudflare
1. Go to https://dash.cloudflare.com
2. Login with your Cloudflare account

### 1.2 Navigate to Turnstile
1. Click on your account name (top left)
2. Select "Turnstile" from the left sidebar
3. Click "Add Site" or "Create Widget" button

### 1.3 Configure New Widget
Fill in the form:

**Widget Name:** `TimeSeal Production v2`

**Domains:** Add both:
- `timeseal.online`
- `www.timeseal.online`

**Widget Mode:** Select `Managed` (recommended for best UX)
- Managed = Cloudflare decides when to show challenge
- Non-Interactive = Invisible, no user interaction
- Invisible = Always runs in background

**Pre-Clearance:** Leave unchecked (default)

**Security Level:** Select `Normal` (default)

Click **"Create"**

### 1.4 Copy New Keys
After creation, you'll see:
- **Site Key** (starts with `0x4...`) - Copy this
- **Secret Key** (starts with `0x4...`) - Copy this

**IMPORTANT:** Keep these keys secure. Do NOT commit to git.

---

## Step 2: Update Local Environment Files

### 2.1 Update .env.local (for development)
```bash
# Open .env.local
nano .env.local

# Replace with NEW keys:
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<NEW_SITE_KEY_HERE>
TURNSTILE_SECRET_KEY=<NEW_SECRET_KEY_HERE>
```

### 2.2 Update .env.production (for build)
```bash
# Open .env.production
nano .env.production

# Add NEW site key:
NEXT_PUBLIC_APP_URL=https://timeseal.online
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<NEW_SITE_KEY_HERE>
```

### 2.3 Verify .gitignore
```bash
# Check .gitignore includes:
cat .gitignore | grep -E "\.env|\.vars"

# Should show:
# .env*.local
# .dev.vars
# .prod.vars
```

---

## Step 3: Deploy New Secret Key to Cloudflare Workers

### 3.1 Deploy Secret
```bash
# Deploy NEW secret key
echo "<NEW_SECRET_KEY_HERE>" | npx wrangler secret put TURNSTILE_SECRET_KEY

# Verify it's deployed
npx wrangler secret list
```

Expected output:
```
[
  {
    "name": "MASTER_ENCRYPTION_KEY",
    "type": "secret_text"
  },
  {
    "name": "TURNSTILE_SECRET_KEY",
    "type": "secret_text"
  }
]
```

---

## Step 4: Rebuild and Deploy Application

### 4.1 Clean Build
```bash
# Remove old build artifacts
rm -rf .next .open-next

# Rebuild with new site key
npm run build
```

### 4.2 Deploy to Production
```bash
# Deploy to Cloudflare Workers
npm run deploy:prod
```

### 4.3 Verify Deployment
Check deployment output shows:
```
env.TURNSTILE_SECRET_KEY                     Secret Variable
env.APP_URL ("https://timeseal.online")      Environment Variable
```

---

## Step 5: Test New Widget

### 5.1 Clear Browser Cache
```bash
# In browser:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
```

### 5.2 Test Seal Creation
1. Go to https://timeseal.online
2. Enter test message
3. **Turnstile should load in < 5 seconds** (not 1 minute!)
4. Complete Turnstile challenge
5. Create seal
6. Verify success

### 5.3 Check Browser Console
```
# Should NOT see:
- Turnstile errors
- 403 errors
- Rate limit errors

# Should see:
- Turnstile loaded successfully
- Challenge completed
- Seal created
```

---

## Step 6: Delete Old Widget (Optional but Recommended)

### 6.1 Delete Compromised Widget
1. Go back to Cloudflare Dashboard → Turnstile
2. Find old widget (with leaked keys)
3. Click "Delete" or "Remove"
4. Confirm deletion

**Why delete?**
- Prevents accidental use
- Removes compromised keys from system
- Clean security posture

---

## Step 7: Update Documentation

### 7.1 Update Security Incident Report
```bash
# Edit SECURITY-INCIDENT-2025-01-26.md
# Change status to:
**Incident Status:** RESOLVED
**Actions Taken:**
- ✅ New Turnstile widget created
- ✅ New keys deployed
- ✅ Old widget deleted
- ✅ Performance restored (< 5s load time)
```

---

## Verification Checklist

- [ ] New Turnstile widget created in Cloudflare dashboard
- [ ] New site key added to `.env.production`
- [ ] New secret key deployed via `wrangler secret put`
- [ ] Application rebuilt with new keys
- [ ] Deployed to production
- [ ] Turnstile loads in < 5 seconds (not 1 minute)
- [ ] Seal creation works end-to-end
- [ ] Old widget deleted from Cloudflare dashboard
- [ ] `.env.local` updated for local development
- [ ] Security incident report updated

---

## Troubleshooting

### Turnstile Still Slow
- Clear browser cache completely
- Check browser console for errors
- Verify new site key in deployed bundle:
  ```bash
  curl -s https://timeseal.online | grep -o "0x4[A-Za-z0-9]*" | head -1
  ```
- Should show NEW site key, not old `0x4AAAAAACHzq8TngxZwCTuD`

### "Invalid Site Key" Error
- Verify site key in `.env.production` matches Cloudflare dashboard
- Rebuild application: `rm -rf .next .open-next && npm run build`
- Redeploy: `npm run deploy:prod`

### "Invalid Secret Key" Error
- Verify secret deployed: `npx wrangler secret list`
- Redeploy secret: `echo "NEW_SECRET" | npx wrangler secret put TURNSTILE_SECRET_KEY`

### Widget Not Rendering
- Check browser console for errors
- Verify domains in Cloudflare dashboard include `timeseal.online`
- Check CSP headers allow Cloudflare Turnstile scripts

---

## Expected Results

**Before (with leaked keys):**
- Turnstile load time: 60+ seconds
- User experience: Unusable
- Cloudflare throttling: Active

**After (with new keys):**
- Turnstile load time: < 5 seconds
- User experience: Normal
- Cloudflare throttling: None

---

## Security Notes

1. **Never commit Turnstile keys to git**
2. **Store secret key only in Cloudflare Workers secrets**
3. **Site key is public but should still be protected**
4. **Rotate keys quarterly as best practice**
5. **Monitor for unusual Turnstile failures**

---

## Next Steps After Rotation

1. Test seal creation thoroughly
2. Monitor Turnstile performance for 24 hours
3. Update security documentation
4. Implement quarterly key rotation schedule
5. Add pre-commit hooks to prevent future leaks
