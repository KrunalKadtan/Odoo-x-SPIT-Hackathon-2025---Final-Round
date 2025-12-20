# API Endpoints Comparison

## Overview

This document provides a detailed comparison of all API endpoints between the two codebases, showing the URL patterns, HTTP methods, and implementation status.

---

## 1. Customer-Facing APIs

### 1.1 Product Endpoints

#### new/ Implementation

```
GET    /api/products/                      - List all published products
GET    /api/products/{id}/                 - Get product detail
GET    /api/products/categories/           - List product categories
```

**Implementation:** Function-based views in `views.py`

#### project-aarav/ Implementation

```
GET    /api/products/products/             - List all products (ViewSet)
POST   /api/products/products/             - Create product (admin only)
GET    /api/products/products/{id}/        - Get product detail
PUT    /api/products/products/{id}/        - Update product (admin only)
DELETE /api/products/products/{id}/        - Delete product (admin only)

GET    /api/products/catalog/              - Public product catalog
GET    /api/products/catalog/{id}/         - Public product detail
```

**Implementation:** ViewSets with DRF Router

**Merge Strategy:** Keep both implementations. `new/` endpoints for frontend compatibility, add `project-aarav/` ViewSets for admin functionality.

---

### 1.2 Shopping Cart Endpoints (new/ ONLY)

```
GET    /api/products/cart/                 - Get user's cart
POST   /api/products/cart/add/             - Add item to cart
PUT    /api/products/cart/items/{id}/      - Update cart item quantity
DELETE /api/products/cart/items/{id}/remove/ - Remove item from cart
POST   /api/products/cart/clear/           - Clear entire cart
```

**Implementation:** Class-based views in `views.py`

**Status:** ⚠️ **MUST PRESERVE** - Required by frontend

---

### 1.3 Order Endpoints

#### new/ Implementation

```
GET    /api/products/orders/               - List user's orders
GET    /api/products/orders/{id}/          - Get order detail
POST   /api/products/checkout/             - Create order from cart
```

**Implementation:** Class-based views in `views.py`

#### project-aarav/ Implementation

```
GET    /api/products/orders/               - List orders (ViewSet)
POST   /api/products/orders/               - Create order
GET    /api/products/orders/{id}/          - Get order detail
PUT    /api/products/orders/{id}/          - Update order
DELETE /api/products/orders/{id}/          - Delete order
POST   /api/products/orders/{id}/confirm/  - Confirm order
POST   /api/products/orders/{id}/cancel/   - Cancel order
```

**Implementation:** ViewSets with DRF Router

**Merge Strategy:** Keep `new/` checkout endpoint for frontend. Add `project-aarav/` ViewSet for additional functionality.

---

### 1.4 Invoice Endpoints

#### new/ Implementation

```
GET    /api/products/invoices/             - List user's invoices
GET    /api/products/invoices/{id}/        - Get invoice detail
```

**Implementation:** Class-based views in `views.py`

#### project-aarav/ Implementation

```
GET    /api/products/invoices/             - List invoices (ViewSet)
POST   /api/products/invoices/             - Create invoice
GET    /api/products/invoices/{id}/        - Get invoice detail
PUT    /api/products/invoices/{id}/        - Update invoice
POST   /api/products/invoices/{id}/confirm/ - Confirm invoice
POST   /api/products/invoices/{id}/cancel/ - Cancel invoice
```

**Implementation:** ViewSets with DRF Router

**Merge Strategy:** Keep both. `new/` for frontend, `project-aarav/` for admin functionality.

---

### 1.5 Payment Endpoints

#### new/ Implementation

```
POST   /api/products/payments/create-order/ - Create Razorpay order
POST   /api/products/payments/verify/       - Verify Razorpay payment
GET    /api/products/payments/{id}/         - Get payment detail
```

**Implementation:** Class-based views in `views.py`

#### project-aarav/ Implementation

```
GET    /api/products/payments/             - List payments (ViewSet)
POST   /api/products/payments/             - Create payment
GET    /api/products/payments/{id}/        - Get payment detail
PUT    /api/products/payments/{id}/        - Update payment
DELETE /api/products/payments/{id}/        - Delete payment
```

**Implementation:** ViewSets with DRF Router

**Merge Strategy:** Keep `new/` Razorpay-specific endpoints for frontend. Add `project-aarav/` ViewSet for admin functionality.

---

### 1.6 Coupon Endpoints (project-aarav/ ONLY)

```
GET    /api/products/coupons/              - List available coupons
POST   /api/products/coupons/              - Create coupon (admin only)
GET    /api/products/coupons/{id}/         - Get coupon detail
PUT    /api/products/coupons/{id}/         - Update coupon (admin only)
DELETE /api/products/coupons/{id}/         - Delete coupon (admin only)
POST   /api/products/coupons/{id}/apply/   - Apply coupon to order
```

**Status:** ✅ **ADD to new/**

---

### 1.7 Discount Offer Endpoints (project-aarav/ ONLY)

```
GET    /api/products/offers/               - List active offers
POST   /api/products/offers/               - Create offer (admin only)
GET    /api/products/offers/{id}/          - Get offer detail
PUT    /api/products/offers/{id}/          - Update offer (admin only)
DELETE /api/products/offers/{id}/          - Delete offer (admin only)
```

**Status:** ✅ **ADD to new/**

---

### 1.8 Payment Term Endpoints (project-aarav/ ONLY)

```
GET    /api/products/payment-terms/        - List payment terms
POST   /api/products/payment-terms/        - Create term (admin only)
GET    /api/products/payment-terms/{id}/   - Get term detail
PUT    /api/products/payment-terms/{id}/   - Update term (admin only)
DELETE /api/products/payment-terms/{id}/   - Delete term (admin only)
```

**Status:** ✅ **ADD to new/**

---

### 1.9 System Settings Endpoints (project-aarav/ ONLY)

```
GET    /api/products/settings/             - Get system settings
PUT    /api/products/settings/             - Update settings (admin only)
```

**Status:** ✅ **ADD to new/**

---

## 2. Admin APIs (project-aarav/ ONLY)

### 2.1 Admin Product Management

```
GET    /api/admin/products/                - List all products
POST   /api/admin/products/                - Create product
GET    /api/admin/products/{id}/           - Get product detail
PUT    /api/admin/products/{id}/           - Update product
PATCH  /api/admin/products/{id}/           - Partial update product
DELETE /api/admin/products/{id}/           - Delete product
POST   /api/admin/products/{id}/publish/   - Publish product
POST   /api/admin/products/{id}/unpublish/ - Unpublish product
```

**Permissions:** IsAuthenticated + IsInternalUser (role='internal')

**Status:** ✅ **ADD to new/**

---

### 2.2 Admin Vendor Management

```
GET    /api/admin/vendors/                 - List all vendors
POST   /api/admin/vendors/                 - Create vendor
GET    /api/admin/vendors/{id}/            - Get vendor detail
PUT    /api/admin/vendors/{id}/            - Update vendor
PATCH  /api/admin/vendors/{id}/            - Partial update vendor
DELETE /api/admin/vendors/{id}/            - Delete vendor
POST   /api/admin/vendors/{id}/create-user/ - Create portal user for vendor
```

**Permissions:** IsAuthenticated + IsInternalUser

**Status:** ✅ **ADD to new/**

---

### 2.3 Admin Purchase Order Management

```
GET    /api/admin/purchase-orders/         - List all purchase orders
POST   /api/admin/purchase-orders/         - Create purchase order
GET    /api/admin/purchase-orders/{id}/    - Get PO detail
PUT    /api/admin/purchase-orders/{id}/    - Update PO
PATCH  /api/admin/purchase-orders/{id}/    - Partial update PO
DELETE /api/admin/purchase-orders/{id}/    - Delete PO (draft only)
POST   /api/admin/purchase-orders/{id}/confirm/ - Confirm PO
POST   /api/admin/purchase-orders/{id}/cancel/  - Cancel PO
GET    /api/admin/purchase-orders/{id}/lines/   - Get PO lines
```

**Permissions:** IsAuthenticated + IsInternalUser

**Status:** ✅ **ADD to new/**

---

### 2.4 Admin Purchase Order Line Management

```
GET    /api/admin/purchase-order-lines/    - List all PO lines
POST   /api/admin/purchase-order-lines/    - Create PO line
GET    /api/admin/purchase-order-lines/{id}/ - Get PO line detail
PUT    /api/admin/purchase-order-lines/{id}/ - Update PO line
PATCH  /api/admin/purchase-order-lines/{id}/ - Partial update PO line
DELETE /api/admin/purchase-order-lines/{id}/ - Delete PO line
```

**Permissions:** IsAuthenticated + IsInternalUser

**Status:** ✅ **ADD to new/**

---

### 2.5 Admin Vendor Bill Management

```
GET    /api/admin/vendor-bills/            - List all vendor bills
POST   /api/admin/vendor-bills/            - Create vendor bill
GET    /api/admin/vendor-bills/{id}/       - Get bill detail
PUT    /api/admin/vendor-bills/{id}/       - Update bill
PATCH  /api/admin/vendor-bills/{id}/       - Partial update bill
DELETE /api/admin/vendor-bills/{id}/       - Delete bill (draft only)
POST   /api/admin/vendor-bills/{id}/confirm/ - Confirm bill (updates stock)
POST   /api/admin/vendor-bills/{id}/cancel/  - Cancel bill
```

**Permissions:** IsAuthenticated + IsInternalUser

**Status:** ✅ **ADD to new/**

---

### 2.6 Admin Vendor Payment Management

```
GET    /api/admin/vendor-payments/         - List all vendor payments
POST   /api/admin/vendor-payments/         - Create vendor payment
GET    /api/admin/vendor-payments/{id}/    - Get payment detail
PUT    /api/admin/vendor-payments/{id}/    - Update payment
DELETE /api/admin/vendor-payments/{id}/    - Delete payment
```

**Permissions:** IsAuthenticated + IsInternalUser

**Status:** ✅ **ADD to new/**

---

## 3. Vendor APIs (project-aarav/ ONLY)

### 3.1 Vendor Product Access

```
GET    /api/vendor/products/               - List products (read-only)
GET    /api/vendor/products/{id}/          - Get product detail (read-only)
```

**Permissions:** IsAuthenticated + IsVendorUser (role='vendor')

**Status:** ✅ **ADD to new/**

---

### 3.2 Vendor Purchase Orders

```
GET    /api/vendor/purchase-orders/        - List vendor's POs
GET    /api/vendor/purchase-orders/{id}/   - Get PO detail
GET    /api/vendor/purchase-orders/{id}/lines/ - Get PO lines
```

**Permissions:** IsAuthenticated + IsVendorUser

**Filtering:** Automatically filtered to show only POs for the logged-in vendor

**Status:** ✅ **ADD to new/**

---

### 3.3 Vendor Bills

```
GET    /api/vendor/vendor-bills/           - List vendor's bills
GET    /api/vendor/vendor-bills/{id}/      - Get bill detail
```

**Permissions:** IsAuthenticated + IsVendorUser

**Filtering:** Automatically filtered to show only bills for the logged-in vendor

**Status:** ✅ **ADD to new/**

---

### 3.4 Vendor Payments

```
GET    /api/vendor/payments/               - List vendor's payments
GET    /api/vendor/payments/{id}/          - Get payment detail
```

**Permissions:** IsAuthenticated + IsVendorUser

**Filtering:** Automatically filtered to show only payments for the logged-in vendor

**Status:** ✅ **ADD to new/**

---

### 3.5 Vendor Self-Service

```
GET    /api/vendor/me/                     - Get vendor's own contact info
PUT    /api/vendor/me/                     - Update vendor's own contact info
```

**Permissions:** IsAuthenticated + IsVendorUser

**Status:** ✅ **ADD to new/**

---

## 4. URL Pattern Summary

### 4.1 new/ URL Structure

```
/api/products/
├── (empty)                     → Product list
├── {id}/                       → Product detail
├── categories/                 → Product categories
├── cart/                       → Cart operations
│   ├── add/                    → Add to cart
│   ├── items/{id}/             → Update cart item
│   └── items/{id}/remove/      → Remove from cart
├── orders/                     → Order list
│   └── {id}/                   → Order detail
├── checkout/                   → Checkout
├── invoices/                   → Invoice list
│   └── {id}/                   → Invoice detail
└── payments/                   → Payment operations
    ├── create-order/           → Create Razorpay order
    ├── verify/                 → Verify payment
    └── {id}/                   → Payment detail
```

**Total Endpoints:** ~15

---

### 4.2 project-aarav/ URL Structure

```
/api/products/
├── products/                   → Product ViewSet (CRUD)
├── catalog/                    → Public catalog ViewSet
├── orders/                     → Order ViewSet (CRUD + actions)
├── coupons/                    → Coupon ViewSet (CRUD)
├── offers/                     → Discount Offer ViewSet (CRUD)
├── invoices/                   → Invoice ViewSet (CRUD + actions)
├── payments/                   → Payment ViewSet (CRUD)
├── payment-terms/              → Payment Term ViewSet (CRUD)
└── settings/                   → System Settings ViewSet

/api/admin/
├── products/                   → Admin Product ViewSet
├── vendors/                    → Admin Vendor ViewSet
├── purchase-orders/            → Admin PO ViewSet
├── purchase-order-lines/       → Admin PO Line ViewSet
├── vendor-bills/               → Admin Vendor Bill ViewSet
└── vendor-payments/            → Admin Vendor Payment ViewSet

/api/vendor/
├── products/                   → Vendor Product ViewSet (read-only)
├── purchase-orders/            → Vendor PO ViewSet (read-only)
├── vendor-bills/               → Vendor Bill ViewSet (read-only)
├── payments/                   → Vendor Payment ViewSet (read-only)
└── me/                         → Vendor Self ViewSet
```

**Total Endpoints:** ~65

---

## 5. Merge Strategy

### 5.1 Preserve from new/

✅ All cart endpoints (frontend dependency)
✅ Checkout endpoint (frontend dependency)
✅ Razorpay-specific payment endpoints (frontend dependency)
✅ Product categories endpoint (frontend dependency)

### 5.2 Add from project-aarav/

✅ All admin endpoints (/api/admin/*)
✅ All vendor endpoints (/api/vendor/*)
✅ ViewSet-based customer endpoints for additional functionality
✅ Coupon, offer, payment term endpoints

### 5.3 Consolidate

🔄 Product listing (keep both implementations)
🔄 Order management (keep both implementations)
🔄 Invoice viewing (keep both implementations)
🔄 Payment processing (keep both implementations)

### 5.4 URL Routing Strategy

```python
# Main URL configuration
urlpatterns = [
    # Customer APIs (preserve new/ implementation)
    path('api/products/', include('products.urls')),
    
    # Admin and Vendor APIs (add from project-aarav/)
    path('api/', include('products.urls_admin_vendor')),
    
    # ViewSet-based APIs (add from project-aarav/)
    path('api/products/', include('products.urls_viewsets')),
]
```

**Note:** Need to ensure no URL conflicts between implementations.

---

## 6. Authentication and Permissions

### 6.1 Permission Requirements

| Endpoint Type | Authentication | Authorization |
|---------------|----------------|---------------|
| Public catalog | None | None |
| Customer APIs | JWT Token | IsAuthenticated |
| Admin APIs | JWT Token | IsAuthenticated + IsInternalUser |
| Vendor APIs | JWT Token | IsAuthenticated + IsVendorUser |

### 6.2 Role-Based Access

| Role | Access |
|------|--------|
| **internal** | All admin APIs, all customer APIs |
| **portal** | Customer APIs only |
| **vendor** | Vendor APIs only, limited customer APIs |

---

## 7. API Response Formats

### 7.1 new/ Response Format

```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2"
}
```

**Pagination:** Custom pagination in views

### 7.2 project-aarav/ Response Format

```json
{
  "count": 100,
  "next": "http://api/endpoint/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "field1": "value1",
      "field2": "value2"
    }
  ]
}
```

**Pagination:** DRF PageNumberPagination

**Merge Strategy:** Maintain both formats for backward compatibility. Use DRF pagination for new ViewSet-based endpoints.

---

## 8. Testing Requirements

### 8.1 API Tests to Add

- Admin product management API tests
- Admin vendor management API tests
- Admin purchase order API tests
- Admin vendor bill API tests
- Vendor portal API tests
- Permission-based access tests
- Role-based filtering tests

### 8.2 API Tests to Preserve

- Cart API tests (frontend dependency)
- Checkout API tests (frontend dependency)
- Razorpay payment API tests (frontend dependency)
- Customer order API tests
- Customer invoice API tests

---

**End of API Endpoints Document**
