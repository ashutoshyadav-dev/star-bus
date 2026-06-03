# AP Star Bus — Frontend (`ap-star-bus`)

## Project Structure

```
src/
├── api/               # Axios API layer (per domain)
│   ├── client.js      # Axios instance with token refresh interceptor
│   ├── auth.js        # Authentication endpoints
│   ├── users.js       # User management endpoints
│   ├── booking.js     # Booking endpoints
│   ├── route.js       # Route endpoints
│   ├── station.js     # Station endpoints
│   ├── roles.js       # Roles/permissions endpoints
│   └── audit.js       # Audit log endpoints
│
├── assets/            # Static images and assets
│
├── components/
│   ├── common/        # Reusable UI components
│   │   ├── Modal.jsx
│   │   ├── PageHeader.jsx
│   │   ├── PageLoader.jsx  ← NEW
│   │   ├── Pagination.jsx
│   │   ├── Spinner.jsx
│   │   ├── StatCard.jsx
│   │   └── Table.jsx
│   ├── customer/      # Passenger portal components
│   ├── layout/        # Admin layout (Sidebar, Navbar, AppLayout)
│   └── Website/       # Public website components
│
├── constants/
│   └── roles.js       # Role names and permission constants ← NEW
│
├── context/
│   └── AuthContext.jsx # Auth state, saveTokens, logout ← IMPROVED
│
├── hooks/
│   ├── useOtpTimer.js  # OTP countdown timer hook ← NEW
│   └── usePermission.js # Permission check hook ← NEW
│
├── pages/
│   ├── auth/
│   │   └── LoginPage.jsx  # Combined login + register + staff ← REWRITTEN
│   ├── dashboard/
│   ├── users/
│   ├── roles/
│   ├── booking/
│   ├── payment/
│   ├── refund/
│   ├── wallet/
│   ├── audit/
│   ├── NotFound.jsx        ← NEW
│   └── Unauthorized.jsx    ← NEW
│
├── utils/
│   ├── jwt.js          # JWT decode + expiry check ← NEW
│   └── format.js       # Phone, date, currency formatters ← NEW
│
├── App.jsx             # Routes + Guards ← IMPROVED
└── main.jsx            # Entry point (QueryClient + Toaster)
```

## Authentication Flow

### Passenger (OTP Login)
1. Enter 10-digit mobile number
2. Click **Send OTP** → `POST /auth/otp/request` (purpose: "login")
3. Enter OTP → `POST /auth/otp/verify/login`
4. If user doesn't exist yet → auto-creates via `POST /auth/otp/verify/register`, then re-logs in
5. Tokens saved, redirected to `/user/dashboard`

### Passenger Registration
1. Switch to **Register** tab
2. Enter mobile → Send OTP (purpose: "registration")
3. Enter OTP → `POST /auth/otp/verify/register`
4. Tokens saved, redirected to `/user/dashboard`

### Staff / Admin Login
1. Switch to **Staff / Admin** tab
2. Enter mobile + password → `POST /auth/staff/login`
3. Redirected to `/admin/dashboard` based on role

### Token Refresh
- On 401 response, the axios interceptor silently calls `POST /auth/token/refresh`
- Updates localStorage tokens
- Queues pending requests and retries them
- On refresh failure → clears storage + redirects to `/login`

## Environment Variables

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## Getting Started

```bash
npm install
npm run dev
```

Backend must be running at `http://localhost:8080`.
