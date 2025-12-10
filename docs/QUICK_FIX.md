# 🚨 IMMEDIATE ACTION ITEMS

## The Root Problem
Your published app at `https://scriptforge-nine.vercel.app` is getting **HTTP 500** when users submit the form because the `N8N_WEBHOOK_URL` environment variable is missing from your Vercel backend.

---

## ⚡ QUICK FIX (Do This NOW - Takes 5 minutes)

### Step 1: Add Environment Variable to Vercel

1. Go to: **https://vercel.com/dashboard**
2. Click on your project: **scriptforge**
3. Go to: **Settings** tab → **Environment Variables** (left sidebar)
4. Click: **"Add Environment Variable"**
5. Fill in exactly:
   ```
   Name:  N8N_WEBHOOK_URL
   Value: https://n8n.alphabusinessdesigns.co.uk/webhook/script-forge
   Environments: Production (check the box)
   ```
6. Click: **"Save"**

### Step 2: Redeploy the Project

1. Go to: **Deployments** tab
2. Find your latest deployment
3. Click the **⋮ (three dots)** button
4. Click: **"Redeploy"**
5. Wait 2-3 minutes for it to finish

### Step 3: Test It

1. Go to: https://scriptforge-nine.vercel.app
2. Fill in the form (any values work)
3. Click: **"Generate Script"**
4. Open DevTools (F12) → **Network** tab
5. Look for `/api/submit` request
6. It should now show **200 OK** (not 500 error)

---

## ✅ After the Quick Fix

Once the form submits successfully:

1. **Check Supabase**: Should see a new row in the `submissions` table
   - Dashboard: https://supabase.com/dashboard
   - Project: scriptforge
   - Table: submissions

2. **Check n8n**: Should see workflow execution
   - Dashboard: https://n8n.alphabusinessdesigns.co.uk
   - Look at workflow execution history

3. **Wait for completion**: The workflow will generate the script (takes 30 seconds to 5 minutes)

4. **See results**: Once done, the app will display the generated script

---

## 📋 Verification Checklist

After redeploying, verify these:

- [ ] Form submission returns `200 OK` (not 500)
- [ ] New row appears in Supabase `submissions` table
- [ ] n8n workflow executes
- [ ] Workflow completes and updates Supabase row
- [ ] App displays generated script to user

---

## 🐛 If It Still Doesn't Work

### Check 1: Did you remember to redeploy?
- After adding env var, you MUST redeploy
- Go to Deployments → Redeploy the latest build
- Wait for the new deployment to finish (green checkmark)

### Check 2: Check Vercel logs while testing
```bash
# In PowerShell:
vercel logs --follow
```
Then submit a form and watch the logs. You'll see exactly what's failing.

### Check 3: Verify the variable was added correctly
- Go back to Settings → Environment Variables
- Make sure you see: `N8N_WEBHOOK_URL` with the correct value
- Make sure it's checked for "Production"

### Check 4: Hard refresh the browser
- Press: `Ctrl + Shift + Del` (or Cmd + Shift + Del on Mac)
- Clear cached files
- Refresh the page
- Try submitting again

---

## 📞 Need Help?

If you're getting errors even after these steps:

1. **Screenshot the error** (show Network tab with the failed request)
2. **Check Vercel logs**: `vercel logs --follow` and share any errors
3. **Check n8n logs**: Login to n8n and check execution history
4. **Check browser console**: F12 → Console → any red errors?

All three sources combined will tell you exactly what's wrong.

---

## Summary

**The Fix**: Add `N8N_WEBHOOK_URL` to Vercel environment variables  
**The Wait**: Redeploy (2-3 minutes)  
**The Test**: Submit form and check for 200 OK  

That's it. This one variable is blocking your entire app from functioning.

