# How to Add nodejs_compat Flag - Step by Step

## Step 1: Open the Settings Page

Click this link (or copy-paste into your browser):
```
https://dash.cloudflare.com/9325c2e52714914a91a29cde8e51096f/pages/view/time-seal/settings/functions
```

## Step 2: Find "Compatibility Flags" Section

Scroll down the page until you see a section titled **"Compatibility Flags"**

It will have two subsections:
- Production
- Preview

## Step 3: Check Production Flag

Under the **Production** section:
- You should already see `nodejs_compat` listed ✅
- If not, add it by typing `nodejs_compat` and pressing Enter

## Step 4: Skip Preview (Not Needed)

**Good news!** Preview doesn't need the flag. Production is what matters.

If you only see `nodejs_compat_do_not_populate_process_env` in Preview, that's fine - **don't add anything to Preview**.

## Step 5: Save (If You Made Changes)

If you added the flag to Production:
1. Click the **"Save"** button at the bottom

If Production already had it:
1. No need to save, just proceed to Step 6

## Step 6: Redeploy

1. Click on **"Deployments"** in the left sidebar
2. Find the most recent deployment (at the top)
3. Click the **"..."** menu button on that deployment
4. Click **"Retry deployment"**

## Done! ✅

Wait 1-2 minutes for the deployment to complete, then visit:
https://time-seal.pages.dev

Your app should now work!

---

## Alternative: If You Can't Find the Settings

If the URL doesn't work, try this:

1. Go to: https://dash.cloudflare.com
2. Click on **"Workers & Pages"** in the left sidebar
3. Click on **"time-seal"** in the list
4. Click **"Settings"** tab at the top
5. Click **"Functions"** in the settings menu
6. Follow steps 2-6 above
