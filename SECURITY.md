# 🚨 Security Alert - Action Required

## Critical Issue Fixed: Exposed Supabase Credentials

Your Supabase credentials were previously hardcoded in `embed.js` and `widget.html`, making them publicly visible to anyone who visited your deployed website. This has been fixed, but you must take immediate action.

---

## Immediate Actions Required

### 1. Rotate Your Supabase Keys (DO THIS FIRST)

Your old keys are already compromised. Generate new ones immediately:

1. Go to https://supabase.com and log into your project
2. Navigate to: **Settings → API**
3. Look for the **"Project API keys"** section
4. Click **"Reset project API keys"** or generate new ones
5. Copy the NEW keys:
   - `URL` (e.g., `https://xxxxx.supabase.co`)
   - `anon` key (public key)

### 2. Update Your Code

Replace the placeholder values in these files with your NEW keys:

**File: `embed.js` (line ~22-23)**
```javascript
const SUPABASE_URL = 'YOUR_NEW_SUPABASE_URL';  // Replace this
const SUPABASE_KEY = 'YOUR_NEW_ANON_KEY';      // Replace this
```

**File: `widget.html` (line ~266-267)**
```javascript
const SUPABASE_URL = 'YOUR_NEW_SUPABASE_URL';  // Replace this
const SUPABASE_KEY = 'YOUR_NEW_ANON_KEY';      // Replace this
```

### 3. Enable Row Level Security (RLS) in Supabase

The `anon` key is meant to be public, BUT only if you have Row Level Security enabled. Without RLS, anyone can read/write your entire database.

1. In Supabase, go to: **Authentication → Policies**
2. For each table (`tasks`, `submissions`, `customers`, `brands`):
   - Click **"Enable RLS"**
   - Add policies to restrict access (see examples below)

**Example RLS Policy for `submissions` table:**
```sql
-- Allow users to insert their own submissions
CREATE POLICY "Users can create submissions"
ON submissions FOR INSERT
WITH CHECK (true);

-- Only allow brands to read their own submissions
CREATE POLICY "Brands can view their submissions"
ON submissions FOR SELECT
USING (auth.uid() = (SELECT id FROM brands WHERE brand_id = submissions.task_id));
```

### 4. Deploy Your Changes

After updating the code with new keys:

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Update Supabase credentials after rotation"
   ```

2. Push to GitHub:
   ```bash
   git push origin main
   ```

3. Vercel will automatically redeploy your site

### 5. Revoke Old Keys

After deploying with new keys:

1. Go back to Supabase: **Settings → API**
2. If there's an option to **revoke old keys**, do it
3. This prevents anyone who copied your old keys from using them

---

## Why Was This a Problem?

### What Happened
- Your Supabase keys were visible in JavaScript files served to browsers
- Anyone could open Chrome DevTools → Sources → view `embed.js`
- They could copy your database credentials
- Without RLS, they could access ALL your data

### What Could Attackers Do
- Read all campaign data, submissions, customer emails
- Insert fake submissions
- Delete database records
- Impersonate customers
- Access payment information

---

## Understanding Supabase Security Model

**Anon Key (Public)**:
- ✅ Safe to expose in client-side code
- ✅ IF Row Level Security is properly configured
- ❌ Dangerous if RLS is disabled

**Service Role Key (Secret)**:
- ❌ NEVER expose in client-side code
- ❌ Bypasses ALL security policies
- ✅ Only use in backend/server code

---

## Verification Checklist

- [ ] Generated NEW Supabase credentials
- [ ] Updated `embed.js` with new URL and anon key
- [ ] Updated `widget.html` with new URL and anon key
- [ ] Enabled RLS on all database tables
- [ ] Created appropriate RLS policies
- [ ] Tested widget still works with new keys
- [ ] Committed and pushed changes
- [ ] Verified deployment on Vercel
- [ ] Revoked old Supabase keys

---

## Need Help?

If you're not sure how to:
- Set up RLS policies → [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- Test security → Try accessing your database with old vs new keys
- Implement proper auth → Consider moving to authenticated user flows

---

## Additional Security Recommendations

1. **Fix Hardcoded Test Email**: All submissions currently use `test@example.com` instead of actual user emails (see `widget.html` lines 626, 730, 1006, 1197, 1385)

2. **Add PostMessage Origin Validation**: Currently allows messages from any origin (security risk)

3. **Implement Input Sanitization**: Campaign descriptions rendered without escaping (XSS risk)

4. **Add Rate Limiting**: No protection against spam submissions

5. **Use HTTPS Only**: Ensure widget only loads on HTTPS sites
