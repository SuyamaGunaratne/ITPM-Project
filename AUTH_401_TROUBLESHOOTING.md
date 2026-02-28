# 401 Unauthorized Error - Troubleshooting Guide

## Error You're Seeing
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
```

This happens when trying to access `/api/registration/admin/all` on the Boarding Registration Requests page.

## Root Causes & Solutions

### **Issue 1: Token Not Being Sent (Most Common)**

**What was happening:**
- Frontend code was looking for token at: `localStorage.getItem('token')`
- But token is actually stored inside `localStorage.getItem('unihub_user')` as `unihub_user.token`
- So it was sending `Authorization: Bearer null`, which causes 401

**Status:** ✅ FIXED

The following files have been updated:
- `frontend/src/pages/AdminPages/BoardingRegistrationRequests.jsx`
- `frontend/src/pages/BoardingPages/BoardingRegistrationRequests.jsx`

### **Issue 2: Admin User Doesn't Have Admin Role**

**What could happen:**
- Admin user exists but `role` field is not set to 'admin'
- Even with correct token, the backend rejects with "Only admins can access"

**How to check & fix:**

```bash
cd backend
node checkAdmin.js
```

This script will:
1. Check if admin user exists
2. Verify its role is 'admin'
3. Fix it if needed
4. Show all users in database

### **Issue 3: Token Expired**

**Possible but less likely:**
- Token expires after 7 days (see `backend/utils/generateToken.js`)
- If logged in more than 7 days ago, token is invalid

**Solution:** Logout and login again

---

## Step-by-Step Fix

### Step 1: Verify Admin User
```bash
cd backend
node checkAdmin.js
```

Expected output:
```
✓ Connected to MongoDB
✓ Admin user found:
  - Email: suyamagunaratne@gmail.com
  - Role: admin
  - ID: ...

📋 All Users in Database:
  - Super Admin (suyamagunaratne@gmail.com) - Role: admin
```

### Step 2: Clear Browser Cache
1. Open Developer Tools (F12)
2. Go to Application → Local Storage
3. Delete entries with 'unihub' key
4. Close tab and reopen

### Step 3: Login Fresh
1. Go to http://localhost:5173/login
2. Enter credentials:
   - Email: `suyamagunaratne@gmail.com`
   - Password: `password123`
3. Should redirect to Admin Dashboard

### Step 4: Check Token in Browser
1. Open Developer Tools (F12)
2. Go to Console tab
3. Paste this command:
```javascript
console.log(JSON.parse(localStorage.getItem('unihub_user')))
```

You should see:
```
{
  _id: "...",
  name: "Super Admin",
  email: "suyamagunaratne@gmail.com",
  role: "admin",
  token: "eyJhbGciOiJIUzI1NiIs..."
}
```

### Step 5: Navigate to Boarding Registrations
1. Click "Boarding Owner Requests" in Admin Dashboard
2. Check browser console (should see logs like "Fetching registrations...")
3. Should see registrations list

---

## What Each Fix Does

### Frontend Fix
**File:** `BoardingRegistrationRequests.jsx`

**Before:**
```javascript
const token = localStorage.getItem('token'); // ❌ Returns null
```

**After:**
```javascript
const getToken = () => {
  const stored = localStorage.getItem('unihub_user');
  if (!stored) return null;
  try {
    const user = JSON.parse(stored);
    return user.token; // ✅ Returns actual token
  } catch {
    return null;
  }
};

const token = getToken();
```

### Backend Improvements
**File:** `registrationController.js`

**Now logs:**
```
getAllRegistrations - User: [userid] Role: admin
Fetching registrations with filter: {}
Found 3 registrations
```

**Better error messages:**
```json
{
  "message": "Only admins can access registration requests. Your role: teacher"
}
```

---

## Verification Checklist

- [ ] `node checkAdmin.js` shows admin user with role 'admin'
- [ ] Browser localStorage has 'unihub_user' with token
- [ ] Can login as admin successfully
- [ ] Admin Dashboard loads without errors
- [ ] "Boarding Owner Requests" page shows registrations
- [ ] Browser console shows "Registrations loaded: X"
- [ ] No 401 errors in Network tab

---

## Quick Debugging Commands

### Check if registrations exist in database
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const BoardingOwnerRegistration = require('./models/BoardingOwnerRegistration');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(() => {
  BoardingOwnerRegistration.find().then(regs => {
    console.log('Total registrations:', regs.length);
    regs.forEach(r => console.log('- ', r.firstName, r.lastName, r.status));
    process.exit(0);
  });
});
"
```

### Test the API endpoint directly
```bash
# 1. Get a valid token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"suyamagunaratne@gmail.com","password":"password123"}'

# Copy the token from response

# 2. Test the registrations endpoint
curl -X GET http://localhost:5000/api/registration/admin/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Should return array of registrations, not 401/403
```

---

## What Each Status Code Means

| Code | Meaning | Solution |
|------|---------|----------|
| 200 | ✅ Success | Should see registrations |
| 401 | Missing/Invalid token | Login again, check localStorage |
| 403 | Token valid but not admin | Check user role in database |
| 500 | Server error | Check backend logs |

---

## If Still Not Working

### Check Backend Logs
```bash
cd backend
npm start
# Should show logs when API is called
```

### Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try accessing Boarding Registrations page
4. Look for request to `api/registration/admin/all`
5. Click on it and check:
   - **Headers** → Authorization header should be present
   - **Response** → Should show JSON array or error message

### Reset Everything
```bash
# 1. Clear database users
cd backend
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
  await User.deleteMany({});
  console.log('Users cleared');
  process.exit(0);
});
"

# 2. Seed new users
node seed.js

# 3. Clear browser storage
# In browser console:
# localStorage.clear()

# 4. Login fresh
```

---

## Key Points to Remember

1. **Token is inside `unihub_user` object**, not separate
2. **Admin role must be exactly 'admin'** in database
3. **Token expires after 7 days** - need to login again
4. **CORS must allow your frontend URL** - already configured
5. **Password is auto-hashed** - don't hash twice

---

**Status:** All fixes have been applied. Follow the verification checklist above to confirm everything works.
