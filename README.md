# UniHub - Learning Management System

A comprehensive Learning Management System (LMS) for higher education institutes with integrated boarding management.

## Tech Stack

- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)

## Features

- Multi-role authentication (Student, Teacher, Admin, Boarding Owner)
- Student course enrollment and management
- Teacher course assignment and management
- Admin dashboard for system management
- Boarding owner registration and management
- Role-based access control

## Project Structure

```
ITPM-Project/
├── unihub/              # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # React context (AuthContext)
│   │   ├── utils/       # Utility functions (API)
│   │   └── App.js       # Main App component
│   └── package.json
├── server/              # Node.js/Express backend
│   ├── config/         # Database configuration
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   └── server.js       # Server entry point
└── README.md
```

## User Roles

### Student
- Institute ID (studentId)
- Course, batch, and year information
- Enrolled courses

### Teacher
- Teacher ID
- Department and qualifications
- Assigned subjects and courses

### Admin
- Admin ID
- System permissions
- Can approve boarding owners

### Boarding Owner
- Business information
- Boarding details (address, rent, facilities)
- Requires admin approval

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm (for backend)
- yarn (for frontend)

### Backend Setup

1. Navigate to the server directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/unihub
JWT_SECRET=your-secret-key-change-this-in-production
NODE_ENV=development
```

5. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the unihub directory:
```bash
cd frontend 
```

2. Install dependencies using yarn:
```bash
yarn install
```

3. Create a `.env` file (if not exists) and set the API URL:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
yarn start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login (all user types)
- `POST /api/auth/register` - Register (boarding owners only)
- `GET /api/auth/me` - Get current user (protected)

### Example Login Request:
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

### Example Registration Request (Boarding Owner):
```json
{
  "email": "owner@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0771234567",
  "businessName": "Sunset Boarding",
  "ownerNIC": "123456789V",
  "boardingAddress": "123 Main Street",
  "city": "Colombo",
  "district": "Colombo",
  "monthlyRent": 15000
}
```

## Authentication Flow

1. **Students, Teachers, and Admins**: These users are pre-registered by the system. They can only login using their credentials.

2. **Boarding Owners**: Must register first through the registration form. After registration, their account is pending admin approval (`isApproved: false`).

## Security Features

- Password hashing using bcrypt
- JWT token-based authentication
- Protected routes with role-based access control
- Input validation and sanitization

## Next Steps

- Add course management functionality
- Implement file uploads for boarding images
- Add notification system
- Create admin panel for user management
- Add boarding search and filtering features

## License

This project is part of an ITPM (IT Project Management) course project.
