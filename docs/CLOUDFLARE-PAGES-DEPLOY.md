# Cloudflare Pages Deployment Guide

## Prerequisites

1. Cloudflare account
2. Wrangler CLI installed: `npm install -g wrangler`
3. Authenticated: `wrangler login`

## Step 1: Create Pages Project

```bash
# Create the Pages project
wrangler pages project create time-seal

# This will create: time-seal.pages.dev
```

## Step 2: Create R2 Bucket with Object Lock

```bash
# Create bucket with WORM compliance
wrangler r2 bucket create timeseal-vault --object-lock

# Verify it was created
wrangler r2 bucket list
```

## Step 3: Create D1 Database

```bash
# Create database
wrangler d1 create timeseal-db

# Note the database_id from output
# Copy it to wrangler.toml

# Initialize schema
wrangler d1 execute timeseal-db --file=./schema.sql
```

## Step 4: Set Secrets

```bash
# Generate a secure 32-byte key
openssl rand -base64 32

# Set master encryption key
wrangler secret put MASTER_ENCRYPTION_KEY
# Paste the generated key when prompted

# Optional: Turnstile (if using)
wrangler secret put TURNSTILE_SECRET_KEY
```

## Step 5: Configure wrangler.toml

```bash
# Copy example config
cp wrangler.toml.example wrangler.toml

# Edit wrangler.toml and update:
# - database_id (from Step 3)
# - bucket_name (timeseal-vault)
```

## Step 6: Build and Deploy

```bash
# Build Next.js for production
npm run build

# Deploy to Pages
npx @cloudflare/next-on-pages

# Or use wrangler
wrangler pages deploy .vercel/output/static --project-name=time-seal
```

## Step 7: Bind Resources

In Cloudflare Dashboard:
1. Go to Pages → time-seal → Settings → Functions
2. Add R2 bucket binding:
   - Variable name: `BUCKET`
   - R2 bucket: `timeseal-vault`
3. Add D1 database binding:
   - Variable name: `DB`
   - D1 database: `timeseal-db`

## Step 8: Verify Deployment

```bash
# Test the deployment
curl https://time-seal.pages.dev/api/health

# Should return:
# {"status":"healthy","timestamp":...}
```

## Continuous Deployment

Connect GitHub repo in Cloudflare Dashboard:
1. Pages → time-seal → Settings → Builds & deployments
2. Connect to Git
3. Select repository
4. Build command: `npm run build`
5. Build output directory: `.vercel/output/static`

## Environment Variables (Dashboard)

Set in Pages → Settings → Environment variables:
- `NODE_ENV` = `production`
- `MAX_FILE_SIZE_MB` = `10`
- `ENABLE_AUDIT_LOGS` = `true`

## Troubleshooting

**Build fails:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

**Database not found:**
```bash
# Check bindings
wrangler pages deployment list --project-name=time-seal
```

**R2 not accessible:**
```bash
# Verify bucket exists
wrangler r2 bucket list
```

## Production Checklist

- [ ] R2 bucket created with `--object-lock`
- [ ] D1 database created and schema loaded
- [ ] Master encryption key set
- [ ] All bindings configured
- [ ] Build successful
- [ ] Health endpoint returns 200
- [ ] Test seal creation
- [ ] Test seal unlock
- [ ] Monitor logs for errors

## Rollback

```bash
# List deployments
wrangler pages deployment list --project-name=time-seal

# Rollback to previous
wrangler pages deployment rollback <deployment-id>
```
