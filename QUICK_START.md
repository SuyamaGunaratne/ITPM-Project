# Quick Start Guide - Admin Registration Management

## Default Admin Credentials
```
Email:    suyamagunaratne@gmail.com
Password: password123
```

## Database Test Commands

### 1. Check if registrations exist in database
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const BoardingOwnerRegistration = require('./models/BoardingOwnerRegistration');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(() => {
  BoardingOwnerRegistration.countDocuments().then(count => {
    console.log('Total registrations:', count);
    BoardingOwnerRegistration.find({ status: 'pending' }).then(regs => {
      console.log('Pending registrations:', regs.length);
      regs.forEach(r => console.log('- ', r.firstName, r.lastName, r.email));
      process.exit(0);
    });
  });
});
"
```

### 2. Create test registration data
```bash
cd backend
node testFullFlow.js
```

### 3. Seed initial users (admin, teacher, student)
```bash
cd backend
node seed.js
```

## Running the Application

### Step 1: Start Backend
```bash
cd backend
npm install  # if not already done
npm start
# Should show: "✓ MongoDB Connected Successfully" and "Server running on port 5000"
```

### Step 2: Start Frontend
```bash
cd frontend
npm install  # if not already done
npm run dev
# Should show: "VITE v..." and "Local: http://localhost:5173"
```

### Step 3: Access Admin Panel
1. Open browser: `http://localhost:5173`
2. Click Login
3. Enter credentials above
4. Should see Admin Dashboard
5. Click "Boarding Owner Requests"
6. View all pending registrations

## API Endpoints Reference

### Authentication
```
POST /api/auth/login
Body: { "email": "...", "password": "..." }
Returns: { "token": "...", "role": "...", ... }
```

### Registrations (Admin Only - Requires Token)
```
GET /api/registration/admin/all
Headers: { "Authorization": "Bearer {token}" }
Returns: [ { _id, firstName, lastName, email, status, ... } ]

PUT /api/registration/{id}/approve
Headers: { "Authorization": "Bearer {token}" }
Body: { "adminNotes": "..." }
Returns: { "message": "...", "user": { ... } }

PUT /api/registration/{id}/reject
Headers: { "Authorization": "Bearer {token}" }
Body: { "rejectionReason": "...", "adminNotes": "..." }
Returns: { "message": "...", "registration": { ... } }
```

### Public Endpoints
```
POST /api/registration/register
Body: { firstName, lastName, email, password, idFrontImage, idBackImage, ... }
Returns: { message, registrationId }

GET /api/registration/status?email={email}
Returns: { status: "pending|approved|rejected", message: "...", registrationId }
```

## Common Admin Tasks

### Approve a Registration
1. Login as admin
2. Go to "Boarding Owner Requests"
3. Click "View & Review"
4. Click "✓ Approve" button
5. User account is created and can login

### Reject a Registration
1. Login as admin
2. Go to "Boarding Owner Requests"
3. Click "View & Review"
4. Enter rejection reason in text area
5. Click "✗ Reject" button
6. User receives notification (will be implemented)

### Filter Registrations
1. Use "Filter by Status" dropdown
2. Select: All, Pending, Approved, or Rejected
3. List updates instantly

## Status Indicators

| Status | Meaning | Admin Action |
|--------|---------|--------------|
| Pending | Awaiting admin review | Approve or Reject |
| Approved | Boarding owner can login | None (completed) |
| Rejected | Application denied | None (completed) |

## What Gets Created on Approval

When admin approves a registration:
1. New User account created with role: `boardingOwner`
2. Account marked as approved (`isApproved: true`)
3. Boarding owner can now login with same email/password
4. Registration record updated with approval timestamp and admin ID

## Data Persisted in Registration

Each registration stores:
- **Personal**: First name, last name, email, ID number, password (hashed)
- **ID Verification**: Front and back ID images (base64)
- **Business**: Name, address, city, district, capacity, available rooms
- **Amenities**: WiFi, Electricity, Water, Security, etc.
- **Metadata**: Created date, status, reviewed by (admin ID), review date

## Troubleshooting Commands

### Check MongoDB Connection
```bash
cd backend
node testConnection.js
```

### View All Database Users
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(() => {
  User.find({}, 'fullName email role').then(users => {
    users.forEach(u => console.log(u.fullName, '-', u.email, '(' + u.role + ')'));
    process.exit(0);
  });
});
"
```

### Reset Database (⚠️ Deletes all data)
```bash
cd backend
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
const BoardingOwnerRegistration = require('./models/BoardingOwnerRegistration');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await User.deleteMany({});
  await BoardingOwnerRegistration.deleteMany({});
  console.log('✓ Database cleared');
  process.exit(0);
});
"
```

## Success Indicators

✓ Registration data visible in admin panel  
✓ Admin can approve/reject  
✓ Approved users can login  
✓ No console errors  
✓ No server 500 errors  
✓ Database shows created records  
✓ Timestamps are accurate  
