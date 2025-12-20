# Complete List of APIs in ApparelDesk Backend

## Summary
Your backend currently has **3 API endpoints** implemented.

---

## 1. Authentication & User Management APIs

### 1.1 Portal Signup API
- **Endpoint**: `POST /api/accounts/signup/`
- **Authentication**: None required (public endpoint)
- **Purpose**: Register new portal users (customers)
- **Implementation**: `accounts/views.py::portal_signup()`
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123",
    "mobile": "+1234567890",      // optional
    "city": "Mumbai",              // optional
    "state": "Maharashtra",        // optional
    "pincode": "400001"            // optional
  }
  ```
- **Response** (201 Created):
  ```json
  {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "name": "John Doe",
      "role": "portal"
    },
    "contact": {
      "id": 1,
      "name": "John Doe",
      "type": "customer",
      "email": "john@example.com"
    },
    "tokens": {
      "refresh": "...",
      "access": "..."
    }
  }
  ```
- **Features**:
  - Creates User with role='portal'
  - Creates Contact with type='customer'
  - Both operations in atomic transaction
  - Returns JWT tokens for immediate login
  - Validates email uniqueness
  - Validates required fields

---

## 2. JWT Token APIs (Django REST Framework Simple JWT)

### 2.1 Token Obtain (Login)
- **Endpoint**: `POST /api/token/`
- **Authentication**: None required
- **Purpose**: Login and obtain JWT access/refresh tokens
- **Implementation**: `rest_framework_simplejwt.views.TokenObtainPairView`
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepass123"
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
  ```
- **Error Response** (401 Unauthorized):
  ```json
  {
    "detail": "No active account found with the given credentials"
  }
  ```

### 2.2 Token Refresh
- **Endpoint**: `POST /api/token/refresh/`
- **Authentication**: Refresh token required
- **Purpose**: Get new access token using refresh token
- **Implementation**: `rest_framework_simplejwt.views.TokenRefreshView`
- **Request Body**:
  ```json
  {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
  ```
- **Response** (200 OK):
  ```json
  {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
  ```
- **Error Response** (401 Unauthorized):
  ```json
  {
    "detail": "Token is invalid or expired",
    "code": "token_not_valid"
  }
  ```

---

## 3. Admin Interface
- **Endpoint**: `/admin/`
- **Purpose**: Django admin interface for managing models
- **Authentication**: Admin credentials required
- **Note**: This is not a REST API, but a web interface

---

## Database Models (No APIs Yet)

Your backend has these models defined but **no API endpoints** implemented for them yet:

### Products App Models
1. **Product** - Product catalog with pricing, stock, categories
2. **ProductColor** - Product color variants
3. **PaymentTerm** - Payment terms with early payment discounts
4. **DiscountOffer** - Time-bound discount campaigns
5. **Coupon** - Individual discount codes
6. **SaleOrder** - Sales order headers
7. **SaleOrderLine** - Sales order line items
8. **CustomerInvoice** - Customer invoices
9. **Payment** - Payment records (supports Razorpay)
10. **VendorBill** - Vendor bills (stub)
11. **SystemSettings** - System-wide settings (singleton)

### Accounts App Models
- **User** - Custom user model with roles
- **Contact** - Customer/vendor contact information

---

## APIs That Need to Be Implemented

Based on your models, here are the APIs you likely need:

### Product Management
- [ ] `GET /api/products/` - List all products
- [ ] `POST /api/products/` - Create product
- [ ] `GET /api/products/{id}/` - Get product details
- [ ] `PUT /api/products/{id}/` - Update product
- [ ] `DELETE /api/products/{id}/` - Delete product
- [ ] `GET /api/products/published/` - List published products (for customers)

### Order Management
- [ ] `POST /api/orders/` - Create order
- [ ] `GET /api/orders/` - List orders
- [ ] `GET /api/orders/{id}/` - Get order details
- [ ] `POST /api/orders/{id}/confirm/` - Confirm order
- [ ] `POST /api/orders/{id}/cancel/` - Cancel order
- [ ] `POST /api/orders/{id}/apply-coupon/` - Apply coupon to order

### Invoice Management
- [ ] `GET /api/invoices/` - List invoices
- [ ] `GET /api/invoices/{id}/` - Get invoice details
- [ ] `POST /api/invoices/{id}/confirm/` - Confirm invoice

### Payment Management
- [ ] `POST /api/payments/create-order/` - Create Razorpay order
- [ ] `POST /api/payments/verify/` - Verify Razorpay payment
- [ ] `GET /api/payments/` - List payments
- [ ] `GET /api/payments/{id}/` - Get payment details

### Coupon Management
- [ ] `POST /api/coupons/validate/` - Validate coupon code
- [ ] `GET /api/coupons/my-coupons/` - Get user's coupons

### Discount Offers
- [ ] `GET /api/offers/` - List active offers
- [ ] `GET /api/offers/{id}/` - Get offer details

### System Settings
- [ ] `GET /api/settings/` - Get system settings
- [ ] `PUT /api/settings/` - Update system settings (admin only)

---

## Testing Your Current APIs

### Quick Test Command
```cmd
cd Odoo-x-SPIT-Hackathon-2025---Final-Round\backend
venv\Scripts\activate
pytest tests/test_all_apis.py -v
```

### Manual Testing with cURL

#### Test Signup
```cmd
curl -X POST http://localhost:8000/api/accounts/signup/ ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"testpass123\"}"
```

#### Test Login
```cmd
curl -X POST http://localhost:8000/api/token/ ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"testpass123\"}"
```

#### Test Token Refresh
```cmd
curl -X POST http://localhost:8000/api/token/refresh/ ^
  -H "Content-Type: application/json" ^
  -d "{\"refresh\":\"YOUR_REFRESH_TOKEN\"}"
```

---

## URL Routing Structure

```
/admin/                          → Django Admin
/api/token/                      → JWT Token Obtain (Login)
/api/token/refresh/              → JWT Token Refresh
/api/accounts/signup/            → Portal Signup
```

---

## Next Steps

1. **Test existing APIs**: Run `pytest -v` to verify all 3 APIs work
2. **Implement product APIs**: Create views for product CRUD operations
3. **Implement order APIs**: Create views for order management
4. **Implement payment APIs**: Create Razorpay integration endpoints
5. **Add authentication**: Protect endpoints with JWT authentication
6. **Add permissions**: Implement role-based access control

---

## Summary

✅ **Implemented**: 3 APIs (Signup, Login, Token Refresh)
❌ **Not Implemented**: ~20+ APIs needed for full functionality

Your backend has a solid foundation with:
- User authentication (JWT)
- User registration
- Comprehensive data models
- Database constraints and validations

You need to implement the REST APIs for:
- Products
- Orders
- Invoices
- Payments
- Coupons
- System settings
