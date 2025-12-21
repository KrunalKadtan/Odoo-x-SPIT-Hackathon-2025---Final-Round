# Database Setup and Population Guide

This guide will help you set up and populate your ApparelDesk database with sample data.

## Prerequisites

1. PostgreSQL installed and running
2. Python virtual environment activated
3. All dependencies installed from `requirements.txt`

## Step 1: Configure Environment Variables

Make sure your `.env` file has the correct database credentials:

```env
# Database Configuration
DB_NAME=appareldesk_db
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432

# Django Configuration
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Razorpay Configuration (optional for testing)
RAZORPAY_API_KEY=your_test_key
RAZORPAY_API_SECRET=your_test_secret
RAZORPAY_TEST_MODE=True
```

## Step 2: Create PostgreSQL Database

Open PostgreSQL command line or pgAdmin and create the database:

```sql
CREATE DATABASE appareldesk_db;
```

Or use the command line:

```bash
# Windows (using psql)
psql -U postgres -c "CREATE DATABASE appareldesk_db;"

# You'll be prompted for the postgres password
```

## Step 3: Run Django Migrations

Navigate to the backend directory and run migrations to create all database tables:

```bash
cd backend

# Create migration files (if not already created)
python manage.py makemigrations

# Apply migrations to create database schema
python manage.py migrate
```

This will create all the necessary tables:
- users
- contacts
- products
- product_colors
- carts
- cart_items
- payment_terms
- discount_offers
- coupons
- sale_orders
- sale_order_lines
- customer_invoices
- payments
- purchase_orders
- purchase_order_lines
- vendor_bills
- system_settings

## Step 4: Create Superuser (Admin Account)

Create an admin account to access Django admin panel:

```bash
python manage.py createsuperuser
```

Follow the prompts:
- Email: admin@appareldesk.com
- Name: Admin User
- Password: (choose a secure password)

## Step 5: Populate Database with Sample Data

You have three options for populating the database:

### Option A: Quick Test Data (Minimal)

```bash
python create_test_data.py
```

This creates:
- 1 test user (test@example.com / testpassword123)
- 1 payment term
- 1 product
- 1 sale order
- 1 invoice

### Option B: Basic Sample Data (Recommended)

```bash
python seed_data.py
```

This creates:
- 1 test user with complete profile
- Default payment term
- 2 sample products
- 2 sale orders with invoices

### Option C: Complete Sample Data (Full Demo)

```bash
python seed_complete_data.py
```

This creates:
- 1 test user with complete profile
- Payment terms
- 5 diverse products with colors
- Shopping cart with items
- 2 complete orders with line items
- 2 invoices

**Recommended:** Use Option C for the most comprehensive demo data.

## Step 6: Verify Database Population

Check if data was created successfully:

```bash
python manage.py shell
```

Then run these commands in the Django shell:

```python
from accounts.models import User
from products.models import Product, SaleOrder, CustomerInvoice

# Check user count
print(f"Users: {User.objects.count()}")

# Check products
print(f"Products: {Product.objects.count()}")

# Check orders
print(f"Orders: {SaleOrder.objects.count()}")

# Check invoices
print(f"Invoices: {CustomerInvoice.objects.count()}")

# Exit shell
exit()
```

## Step 7: Start the Development Server

```bash
python manage.py runserver
```

The API will be available at: http://localhost:8000

## Step 8: Access Django Admin Panel

1. Navigate to: http://localhost:8000/admin
2. Login with your superuser credentials
3. You can view and manage all data through the admin interface

## Test Credentials

After running the seed scripts, you can use these credentials:

**Test User (Portal):**
- Email: test@example.com
- Password: testpassword123

**Admin User:**
- Email: (the one you created in Step 4)
- Password: (the one you set in Step 4)

## API Endpoints

Once the server is running, you can test these endpoints:

### Authentication
- POST `/api/accounts/signup/` - Register new user
- POST `/api/accounts/login/` - Login
- POST `/api/accounts/token/refresh/` - Refresh JWT token

### Products
- GET `/api/products/` - List all products
- GET `/api/products/{id}/` - Get product details

### Cart
- GET `/api/cart/` - View cart
- POST `/api/cart/items/` - Add item to cart
- PUT `/api/cart/items/{id}/` - Update cart item
- DELETE `/api/cart/items/{id}/` - Remove from cart

### Orders
- GET `/api/orders/` - List user's orders
- POST `/api/orders/` - Create new order
- GET `/api/orders/{id}/` - Get order details

### Invoices
- GET `/api/invoices/` - List user's invoices
- GET `/api/invoices/{id}/` - Get invoice details

## Troubleshooting

### Database Connection Error

If you get a connection error:

1. Check PostgreSQL is running:
   ```bash
   # Windows
   services.msc
   # Look for "postgresql" service
   ```

2. Verify credentials in `.env` file
3. Test connection manually:
   ```bash
   psql -U postgres -d appareldesk_db
   ```

### Migration Errors

If migrations fail:

1. Delete all migration files except `__init__.py` in `accounts/migrations/` and `products/migrations/`
2. Drop and recreate the database:
   ```sql
   DROP DATABASE appareldesk_db;
   CREATE DATABASE appareldesk_db;
   ```
3. Run migrations again:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

### Import Errors

If you get import errors when running seed scripts:

1. Make sure you're in the backend directory
2. Activate your virtual environment:
   ```bash
   # Windows
   venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Next Steps

After setting up the database:

1. **Test the API**: Use Postman or curl to test API endpoints
2. **Start Frontend**: Navigate to frontend directory and run `npm run dev`
3. **Test Full Flow**: 
   - Browse products
   - Add to cart
   - Create order
   - View invoices

## Database Schema Overview

```
users (accounts)
├── contacts (one-to-one with users)
├── carts (one-to-one with users)
│   └── cart_items (many-to-one with carts)
├── sale_orders (many-to-one with users)
│   ├── sale_order_lines (many-to-one with orders)
│   └── customer_invoices (many-to-one with orders)
│       └── payments (many-to-one with invoices)
└── coupons (many-to-one with users)

products
├── product_colors (many-to-one with products)
├── cart_items (many-to-one with products)
├── sale_order_lines (many-to-one with products)
└── purchase_order_lines (many-to-one with products)

payment_terms
├── sale_orders (many-to-one with payment_terms)

discount_offers
└── coupons (many-to-one with discount_offers)

purchase_orders (vendor orders)
├── purchase_order_lines
└── vendor_bills
    └── payments
```

## Additional Resources

- Django Documentation: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
