# Secure Authentication & User Data Persistence Implementation

## Overview

This implementation adds a complete secure authentication system with backend database persistence to **Finance Compass**. Users can now create unique accounts, securely log in, and have all their financial data automatically persisted and retrieved across multiple logins and devices.

## Key Features

### ✅ Security Features
- **Encrypted Passwords**: Passwords are hashed using bcryptjs with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication with 7-day expiry
- **Session Management**: Database-tracked sessions with validation and expiration
- **Token Hashing**: JWT tokens are hashed in the database for additional security
- **CORS Protection**: Configurable cross-origin security
- **Secure Logout**: Single session logout and logout from all devices
- **Inactive User Handling**: Users can be soft-deleted (marked inactive)

### 👤 User Management
- **Unique Accounts**: Email uniqueness validation ensures each user has one account
- **Profile Management**: Users can update name, currency, and monthly budget
- **Password Management**: Secure password change with current password verification
- **Account Deletion**: Password-protected account deletion (soft delete)

### 💾 Data Persistence
- **SQLite Database**: Persistent local database with foreign key constraints
- **User-Specific Data**: All data is tied to user ID with access controls
- **Data Integrity**: Automatic timestamp tracking (created_at, updated_at)
- **Transaction Support**: Database transactions ensure data consistency

### 🔄 Automatic Data Retrieval
When a user logs in:
1. Authentication token is validated against stored session
2. User profile is fetched from database
3. All user settings are retrieved
4. Previously stored financial data (transactions, EMIs, etc.) is accessible

## Technical Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: SQLite3 with sqlite package
- **Authentication**: JWT (jsonwebtoken) + Bcryptjs
- **CORS**: Cross-origin resource sharing

### Frontend
- **API Client**: Axios with interceptors for token management
- **State Management**: React Context API
- **Authentication Middleware**: JWT validation and session checking

## Project Structure

```
finance-compass/
├── server/
│   ├── config/
│   │   ├── database.ts          # Database initialization & schema
│   │   └── auth.ts              # JWT & password hashing utilities
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── routes/
│   │   └── auth.ts              # Auth endpoints
│   └── index.ts                 # Server entry point
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx       # Updated with backend integration
│   ├── lib/
│   │   └── api-client.ts         # API client with token management
│   ├── pages/
│   │   ├── Login.tsx             # Login page
│   │   ├── Register.tsx          # Registration page
│   │   └── Profile.tsx           # Profile management
│   └── components/
│       └── ProtectedRoute.tsx    # Route protection
├── .env.example                  # Environment configuration
├── package.json                  # Updated dependencies
└── README.md                     # This file
```

## Database Schema

### Users Table
- `id` (TEXT, PRIMARY KEY): Unique user identifier
- `name` (TEXT): User's full name
- `email` (TEXT, UNIQUE): Email address
- `password_hash` (TEXT): Hashed password
- `currency` (TEXT): Default currency (USD, EUR, etc.)
- `monthly_budget` (REAL): Budget limit
- `created_at` (TEXT): Account creation timestamp
- `updated_at` (TEXT): Last update timestamp
- `is_active` (BOOLEAN): Account status (soft delete)

### Sessions Table
- `id` (TEXT, PRIMARY KEY): Session ID
- `user_id` (TEXT, FK): Reference to user
- `token_hash` (TEXT): Hashed JWT token
- `created_at` (TEXT): Session creation time
- `expires_at` (TEXT): Session expiration time
- `is_active` (BOOLEAN): Session status

### Other Tables
- **transactions**: Income/expense records (linked to user_id)
- **emis**: EMI management (linked to user_id)
- **money_lent**: Lending records (linked to user_id)
- **money_borrowed**: Borrowing records (linked to user_id)
- **reminders**: User reminders (linked to user_id)
- **user_settings**: Theme, notifications, 2FA settings (linked to user_id)

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create environment file**:
   ```bash
   cp .env.example .env
   ```

3. **Update `.env` with your settings**:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   JWT_SECRET=your-very-secure-secret-key-here
   DB_PATH=./data/finance.db
   NODE_ENV=development
   ```

4. **Create data directory**:
   ```bash
   mkdir -p data
   ```

### Development

**Run both frontend and backend concurrently**:
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173 (Vite)
- Backend: http://localhost:3001 (Express)

**Or run separately**:
- Frontend only: `npm run dev -- --filter=vite`
- Backend only: `npm run server`

## API Endpoints

All endpoints are prefixed with `/api/auth`

### Authentication

#### Register User
```
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}

Response (201):
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "currency": "USD",
    "createdAt": "2026-06-09T10:00:00Z"
  },
  "token": "eyJhbGc...",
  "sessionId": "uuid"
}
```

#### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}

Response (200):
{
  "success": true,
  "user": { ... },
  "token": "eyJhbGc...",
  "sessionId": "uuid"
}
```

#### Get Current User
```
GET /auth/me
Authorization: Bearer <token>

Response (200):
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "currency": "USD",
    "monthlyBudget": 5000,
    "createdAt": "2026-06-09T10:00:00Z"
  },
  "settings": { ... }
}
```

#### Update Profile
```
PUT /auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Jane Doe",
  "currency": "EUR",
  "monthlyBudget": 6000
}

Response (200):
{
  "success": true,
  "user": { ... }
}
```

#### Change Password
```
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456",
  "confirmPassword": "newPassword456"
}

Response (200):
{
  "success": true,
  "message": "Password changed successfully. Please log in again."
}
```

#### Delete Account
```
DELETE /auth/account
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "currentPassword123"
}

Response (200):
{
  "success": true,
  "message": "Account deleted successfully"
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### Logout from All Devices
```
POST /auth/logout-all
Authorization: Bearer <token>

Response (200):
{
  "success": true,
  "message": "Logged out from all devices"
}
```

## Security Best Practices

### Frontend
- ✅ Tokens stored in localStorage (consider using secure cookies for production)
- ✅ Auto-logout on 401 errors
- ✅ Protected routes requiring authentication
- ✅ Resource ownership validation

### Backend
- ✅ Password hashing with bcryptjs (10 rounds)
- ✅ JWT tokens with 7-day expiry
- ✅ Database session tracking and validation
- ✅ Foreign key constraints for data integrity
- ✅ Soft deletes for audit trails
- ✅ CORS protection
- ✅ Secure password verification

### Production Recommendations
1. **Use HTTPS**: Always use HTTPS in production
2. **Secure JWT Secret**: Use a strong, randomly generated secret
3. **Database Encryption**: Enable SQLite encryption in production
4. **Rate Limiting**: Add rate limiting to auth endpoints
5. **CORS Configuration**: Restrict to specific domains
6. **Token Refresh**: Implement refresh token rotation
7. **Secure Cookies**: Store tokens in httpOnly, secure cookies
8. **CSP Headers**: Implement Content Security Policy
9. **Monitoring**: Log authentication events
10. **2FA**: Consider implementing two-factor authentication

## Data Flow

### Registration
```
User → Frontend Form → Validation → API Client → Backend
→ Password Hashing → User Creation → Session Creation → DB
→ Response with JWT → Frontend stores token → Redirect to Dashboard
```

### Login with Previous Data
```
User → Frontend Form → API Client → Backend
→ User lookup → Password verification → Session Creation → DB
→ Response with JWT + User data → Frontend stores token
→ Fetch all user data from DB → Display on Dashboard
```

### Data Persistence
```
User adds expense → Frontend → API Client (with JWT)
→ Backend middleware validates JWT & session
→ User ID extracted from JWT → Database INSERT with user_id
→ Data saved permanently linked to user
→ On next login: all data retrieved automatically
```

## Troubleshooting

### Database Connection Issues
- Ensure `/data` directory exists: `mkdir -p data`
- Check database path in `.env`
- Verify database file permissions

### JWT Token Errors
- Token expired: User needs to login again
- Invalid signature: Check JWT_SECRET matches
- Missing token: Ensure Authorization header is sent

### CORS Issues
- Verify FRONTEND_URL in `.env` matches your frontend URL
- Check browser console for specific CORS error

### Password Verification Fails
- Ensure password hash is correct in database
- Verify bcryptjs version compatibility

## Future Enhancements

1. **Two-Factor Authentication (2FA)**: SMS or TOTP-based
2. **OAuth Integration**: Google, GitHub login
3. **Email Verification**: Verify email on registration
4. **Password Reset**: Forgot password flow
5. **Refresh Tokens**: Implement token refresh mechanism
6. **Rate Limiting**: Prevent brute force attacks
7. **Audit Logging**: Track all auth events
8. **Data Export**: Allow users to export their data
9. **Encryption at Rest**: Encrypt sensitive data in database
10. **Multi-Device Management**: View and revoke active sessions

## Testing

### Manual Testing Checklist
- [ ] Register new user
- [ ] Login with existing user
- [ ] Logout user
- [ ] Update profile information
- [ ] Change password
- [ ] Verify data persists after logout/login
- [ ] Test logout from all devices
- [ ] Delete account
- [ ] Add financial data and verify persistence

## Support & Contributing

For issues, questions, or contributions, please refer to the main repository documentation.

---

**Last Updated**: June 2026
**Security Review**: Recommended for production deployment
