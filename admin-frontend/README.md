# ApparelDesk Admin Frontend

This is the admin panel for ApparelDesk, built with React, Vite, and Tailwind CSS.

## Features

- **Product Management**: Create, edit, and manage product catalog
- **Billing & Payments**: Handle invoices and payment tracking
- **Terms & Offers**: Manage pricing terms and promotional offers
- **Users & Contacts**: Manage portal users and contact requests
- **Reports & Analytics**: View business insights and performance metrics
- **Profile Management**: Admin account settings and security

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:8000`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The admin panel will be available at `http://localhost:3001`

### Default Admin Credentials

Use the admin credentials created in the backend to sign in.

## Project Structure

```
src/
├── components/          # Reusable components
│   └── AdminLayout.jsx  # Main layout wrapper
├── context/             # React contexts
│   └── NotificationContext.jsx
├── pages/               # Page components
│   ├── SignIn.jsx
│   ├── Products.jsx
│   ├── Billing.jsx
│   ├── Terms.jsx
│   ├── Users.jsx
│   ├── Reports.jsx
│   └── Profile.jsx
├── utils/               # Utility functions
│   └── api.js          # API client and auth utilities
├── App.jsx             # Main app component
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## API Integration

The admin frontend connects to the Django backend API at `http://localhost:8000/api/`. 

Key API endpoints:
- Authentication: `/api/token/`
- Products: `/api/products/admin/products/`
- User Profile: `/api/accounts/profile/`

## Authentication

- JWT-based authentication with automatic token refresh
- Role-based access control (internal users only)
- Secure token storage in localStorage

## Styling

- Tailwind CSS for utility-first styling
- Custom color palette matching the brand
- Responsive design for desktop and mobile
- Professional admin interface design

## Build

To build for production:

```bash
npm run build
```

The built files will be in the `dist/` directory.