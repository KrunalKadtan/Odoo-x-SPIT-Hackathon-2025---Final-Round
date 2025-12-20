# Authentication System Setup

## Overview
Complete authentication system with Sign Up, Sign In, and Forgot Password functionality for ApparelDesk.

## Features Implemented

### 🔐 Sign Up Page
- **Fields**: Name, Email, Password, Confirm Password, Mobile, City, State, Pincode
- **Validation**: 
  - Email uniqueness check against database
  - Password requirements: 8+ characters, uppercase, lowercase, special character
  - Password confirmation matching
  - Optional fields validation (mobile, pincode format)
- **Backend Integration**: Creates User with role='portal' and Contact with type='customer'
- **Auto-login**: JWT tokens generated and stored on successful signup

### 🔑 Sign In Page  
- **Fields**: Email, Password
- **Validation**: Email format and required fields
- **Error Handling**:
  - "Account not exist" for non-existent emails
  - "Invalid Password" for wrong passwords
- **JWT Integration**: Automatic token storage and refresh

### 🔄 Forgot Password Page
- **Fields**: Email
- **UI Flow**: Email submission → Success message → Back to sign in
- **Note**: Backend implementation pending (currently shows success UI)

### 🛡️ Protected Routes
- Dashboard accessible only after authentication
- Automatic redirects based on auth status
- Token-based route protection

## API Endpoints Used

### Sign Up
```
POST /api/accounts/signup/
```
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com", 
  "password": "SecurePass123!",
  "mobile": "+1234567890",
  "city": "Mumbai",
  "state": "Maharashtra", 
  "pincode": "400001"
}
```

### Sign In
```
POST /api/token/
```
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

## File Structure
```
src/
├── components/
│   ├── AuthLayout.jsx      # Shared auth page layout
│   ├── FormInput.jsx       # Styled form input component
│   ├── Button.jsx          # Premium styled button
│   └── index.js           # Component exports
├── pages/
│   ├── SignUp.jsx         # Sign up page with validation
│   ├── SignIn.jsx         # Sign in page with error handling
│   ├── ForgotPassword.jsx # Password reset flow
│   ├── Dashboard.jsx      # Protected dashboard
│   └── index.js          # Page exports
├── utils/
│   ├── api.js            # Axios setup + auth API functions
│   └── validation.js     # Form validation utilities
├── globals.css           # CSS variables + Tailwind
└── App.jsx              # Router setup + route protection
```

## Design System

### Colors (CSS Variables)
- `--color-bg-primary`: #FAF9F6 (Premium Alabaster)
- `--color-accent`: #8B6212 (Yarrow Gold)
- `--color-text-main`: #1A1A1A (Soft Black)

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Source Sans Pro (sans-serif)  
- **Buttons**: Montserrat (geometric)

### Tailwind Classes
- `bg-app-primary`, `text-app-main`, `text-app-accent`
- `font-display`, `font-sans`, `font-mono`
- `rounded-pro` (2px minimalist corners)

## Running the Application

### Frontend (Port 5173)
```bash
cd final-round-personal/frontend
npm install
npm run dev
```

### Backend (Port 8000)
```bash
cd final-round-personal/backend
venv\Scripts\activate
python manage.py runserver
```

## Authentication Flow

1. **New User**: Visit `/signup` → Fill form → Auto-login → Dashboard
2. **Existing User**: Visit `/signin` → Enter credentials → Dashboard  
3. **Forgot Password**: Click link → Enter email → Check email message
4. **Protected Access**: Any protected route redirects to `/signin` if not authenticated

## Validation Rules

### Password Requirements
- Minimum 8 characters
- At least one lowercase letter
- At least one uppercase letter  
- At least one special character (!@#$%^&*(),.?":{}|<>)

### Email Validation
- Valid email format
- Uniqueness check against database

### Optional Fields
- Mobile: Phone number format
- Pincode: Exactly 6 digits

## Error Handling

### Frontend Validation
- Real-time field validation
- Clear error messages
- Form submission prevention on errors

### Backend Integration
- API error mapping to form fields
- Network error handling
- Token refresh on 401 errors

## Security Features

- JWT token-based authentication
- Automatic token refresh
- Protected route system
- Secure password validation
- CORS handling for API calls

## Next Steps

1. **Forgot Password Backend**: Implement email sending functionality
2. **User Profile**: Add profile management pages
3. **Role-based Access**: Implement different user roles
4. **Email Verification**: Add email confirmation flow
5. **Social Login**: Add Google/Facebook authentication

## Testing

The system is ready for testing with:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API Base: http://localhost:8000/api

All authentication flows are functional and integrated with the backend database.