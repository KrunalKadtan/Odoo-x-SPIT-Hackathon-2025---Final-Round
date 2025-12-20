# Admin + Vendor User APIs Implementation

## Overview

This document describes the implementation of Admin and Vendor User APIs for the ApparelDesk backend. The implementation provides secure, role-based access control for product management, purchase workflows, vendor billing, and payments.

## Models Created

### 1. PurchaseOrder
- Tracks vendor purchase orders
- Fields: vendor, order_date, status, subtotal, tax_amount, total_amount
- Status flow: draft → confirmed → cancelled
- Related to Contact (vendor)

### 2. PurchaseOrderLine
- Individual line items in purchase orders
- Fields: purchase_order, product, quantity, unit_price, tax_percentage, line_subtotal, line_tax, line_total
- Auto-calculates totals

### 3. VendorBill (Enhanced)
- Enhanced from stub to full model
- Fields: purchase_order, vendor, bill_date, due_date, total_amount, status
- Status flow: draft → confirmed → cancelled
- Confirmation updates product stock

### 4. User Role Enhancement
- Added 'vendor' role to User model
- Roles: 'internal' (admin), 'portal' (customer), 'vendor' (vendor user)

## Permissions Implemented

### IsAdminUserRole
- Allows only users with role='internal'
- Full access to all admin endpoints

### IsVendorUserRole
- Allows only users with role='vendor'
- Access to vendor-specific endpoints

### IsVendorObjectOwner
- Ensures vendor users can only access their own data
- Checks vendor relationship through Contact model
- Admins bypass this check

## API Endpoints

### Admin APIs (role='internal')

#### Product Management
- `POST /api/admin/products/` - Create product
- `GET /api/admin/products/` - List all products
- `GET /api/admin/products/{id}/` - Product detail
- `PUT /api/admin/products/{id}/` - Update product
- `PATCH /api/admin/products/{id}/publish/` - Publish/unpublish product
- `GET /api/admin/products/{id}/stock/` - View stock (read-only)

#### Vendor Management
- `POST /api/admin/vendors/` - Create vendor contact
- `GET /api/admin/vendors/` - List all vendors
- `GET /api/admin/vendors/{id}/` - Vendor detail
- `PUT /api/admin/vendors/{id}/` - Update vendor
- `DELETE /api/admin/vendors/{id}/` - Delete vendor

#### Purchase Order Management
- `POST /api/admin/purchase-orders/` - Create purchase order with lines
- `GET /api/admin/purchase-orders/` - List all purchase orders
- `GET /api/admin/purchase-orders/{id}/` - Purchase order detail
- `PUT /api/admin/purchase-orders/{id}/` - Update purchase order
- `DELETE /api/admin/purchase-orders/{id}/` - Delete purchase order

#### Purchase Order Line Management
- `POST /api/admin/purchase-order-lines/` - Add line to purchase order
- `PUT /api/admin/purchase-order-lines/{line_id}/` - Update line
- `DELETE /api/admin/purchase-order-lines/{line_id}/` - Delete line

#### Vendor Bill Management
- `POST /api/admin/vendor-bills/` - Create vendor bill from PO
- `GET /api/admin/vendor-bills/` - List all vendor bills
- `GET /api/admin/vendor-bills/{id}/` - Vendor bill detail
- `PUT /api/admin/vendor-bills/{id}/` - Update vendor bill
- `POST /api/admin/vendor-bills/{id}/confirm/` - Confirm bill and update stock

#### Vendor Payment Management
- `POST /api/admin/vendor-payments/` - Create vendor payment
- `GET /api/admin/vendor-payments/` - List all vendor payments
- `GET /api/admin/vendor-payments/{id}/` - Vendor payment detail

### Vendor APIs (role='vendor')

#### Product Reference (Read-Only)
- `GET /api/vendor/products/` - List products
- `GET /api/vendor/products/{id}/` - Product detail

#### Purchase Order Viewing (Read-Only)
- `GET /api/vendor/purchase-orders/` - List vendor's own purchase orders
- `GET /api/vendor/purchase-orders/{id}/` - Purchase order detail

#### Vendor Bill Viewing (Read-Only)
- `GET /api/vendor/vendor-bills/` - List vendor's own bills
- `GET /api/vendor/vendor-bills/{id}/` - Vendor bill detail

#### Payment Viewing (Read-Only)
- `GET /api/vendor/payments/` - List vendor's own payments
- `GET /api/vendor/payments/{id}/` - Payment detail

#### Self Information
- `GET /api/vendor/me/` - Get vendor's own contact and user info

## Key Features

### 1. Role-Based Access Control
- Admin users (role='internal') have full access
- Vendor users (role='vendor') have restricted, read-only access to their own data
- All access enforced server-side through permissions

### 2. Atomic Transactions
- All mutating operations wrapped in `@transaction.atomic`
- Stock updates use row-level locking (`select_for_update()`)
- Prevents race conditions and ensures data consistency

### 3. Automatic Calculations
- Purchase order totals calculated from line items
- Line totals include subtotal, tax, and total
- Vendor bill totals copied from purchase order

### 4. Stock Management
- Vendor bill confirmation increases product stock
- Uses existing Product.current_stock field
- Atomic updates with locking

### 5. Data Filtering
- Vendor users automatically filtered to see only their data
- Filtering based on Contact relationship
- Admins see all data

## File Structure

```
backend/
├── products/
│   ├── models.py (enhanced with PurchaseOrder, PurchaseOrderLine, VendorBill)
│   ├── admin_vendor_permissions.py (permission classes)
│   ├── serializers_admin.py (admin serializers)
│   ├── serializers_vendor.py (vendor serializers)
│   ├── views_admin.py (admin viewsets)
│   ├── views_vendor.py (vendor viewsets)
│   ├── urls_admin_vendor.py (URL routing)
│   └── migrations/
│       └── 0009_add_purchase_orders_and_enhance_vendor_bill.py
├── accounts/
│   ├── models.py (User model with vendor role)
│   └── migrations/
│       └── 0004_add_vendor_role.py
└── appareldesk/
    └── urls.py (main URL configuration)
```

## Usage Examples

### Admin: Create Purchase Order

```bash
POST /api/admin/purchase-orders/
Authorization: Bearer <admin_jwt_token>

{
  "vendor": 1,
  "lines": [
    {
      "product": 1,
      "quantity": 100,
      "unit_price": "50.00",
      "tax_percentage": "18.00"
    },
    {
      "product": 2,
      "quantity": 50,
      "unit_price": "100.00",
      "tax_percentage": "18.00"
    }
  ]
}
```

### Admin: Confirm Vendor Bill (Updates Stock)

```bash
POST /api/admin/vendor-bills/1/confirm/
Authorization: Bearer <admin_jwt_token>

Response:
{
  "message": "Vendor bill confirmed successfully and stock updated",
  "vendor_bill": {
    "id": 1,
    "status": "confirmed",
    ...
  }
}
```

### Vendor: View Own Purchase Orders

```bash
GET /api/vendor/purchase-orders/
Authorization: Bearer <vendor_jwt_token>

Response: Only purchase orders where vendor matches the user's contact
```

### Vendor: View Self Information

```bash
GET /api/vendor/me/
Authorization: Bearer <vendor_jwt_token>

Response:
{
  "id": 1,
  "name": "ABC Suppliers",
  "type": "vendor",
  "email": "vendor@example.com",
  "user_email": "vendor.user@example.com",
  "user_name": "Vendor User",
  ...
}
```

## Security Considerations

1. **Authentication Required**: All endpoints require JWT authentication
2. **Role Validation**: Permissions check user role on every request
3. **Object-Level Permissions**: Vendor users can only access their own objects
4. **No Direct Stock Editing**: Stock can only be updated through bill confirmation
5. **Atomic Operations**: All database operations are atomic to prevent inconsistencies

## Testing

To test the APIs:

1. Create admin user: `role='internal'`
2. Create vendor contact with `type='vendor'`
3. Create vendor user: `role='vendor'`, link to vendor contact
4. Obtain JWT tokens for both users
5. Test admin endpoints with admin token
6. Test vendor endpoints with vendor token
7. Verify vendor users cannot access other vendors' data

## Next Steps

1. Add comprehensive unit tests for all endpoints
2. Add property-based tests for business logic
3. Implement additional filtering and search capabilities
4. Add bulk operations for admin users
5. Implement vendor bill approval workflow
6. Add email notifications for vendors
7. Implement reporting endpoints

## Notes

- All monetary calculations use Decimal for precision
- Stock updates are atomic with row-level locking
- Vendor bills can only be confirmed once (idempotent)
- Purchase orders and vendor bills follow draft → confirmed → cancelled flow
- Vendor users have read-only access to all their data
