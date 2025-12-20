# Feature Matrix: new/ vs project-aarav/

## Overview

This document provides a detailed feature-by-feature comparison between the two codebases, showing what exists where and what needs to be ported.

**Legend:**
- ✅ Feature exists and is complete
- ⚠️ Feature exists but differs
- ❌ Feature does not exist
- 🔄 Feature needs to be merged/consolidated

---

## 1. Data Models

### 1.1 User Management

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **User Model** | ✅ | ✅ | Base model identical |
| User.role = 'internal' | ✅ | ✅ | Both have |
| User.role = 'portal' | ✅ | ✅ | Both have |
| User.role = 'vendor' | ❌ | ✅ | **ADD to new/** |
| User.address field | ✅ | ❌ | **KEEP in new/** |
| User.city field | ✅ | ✅ | Both have |
| User.state field | ✅ | ✅ | Both have |
| User.pincode field | ✅ | ✅ | Both have |
| User.mobile field | ✅ | ✅ | Both have |
| **Contact Model** | ✅ | ✅ | Identical |
| Contact.type = 'customer' | ✅ | ✅ | Both have |
| Contact.type = 'vendor' | ✅ | ✅ | Both have |
| Contact.type = 'both' | ✅ | ✅ | Both have |

### 1.2 Product Management

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **Product Model** | ✅ | ✅ | Identical |
| Product.product_name | ✅ | ✅ | Both have |
| Product.product_category | ✅ | ✅ | Both have |
| Product.product_type | ✅ | ✅ | Both have |
| Product.material | ✅ | ✅ | Both have |
| Product.sales_price | ✅ | ✅ | Both have |
| Product.purchase_price | ✅ | ✅ | Both have |
| Product.current_stock | ✅ | ✅ | Both have |
| Product.published | ✅ | ✅ | Both have |
| **ProductColor Model** | ✅ | ✅ | Identical |

### 1.3 Shopping Cart

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **Cart Model** | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| Cart.user (OneToOne) | ✅ | ❌ | **KEEP in new/** |
| Cart.get_total() | ✅ | ❌ | **KEEP in new/** |
| Cart.get_item_count() | ✅ | ❌ | **KEEP in new/** |
| **CartItem Model** | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| CartItem.cart | ✅ | ❌ | **KEEP in new/** |
| CartItem.product | ✅ | ❌ | **KEEP in new/** |
| CartItem.quantity | ✅ | ❌ | **KEEP in new/** |
| CartItem.get_total() | ✅ | ❌ | **KEEP in new/** |

### 1.4 Payment Terms

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **PaymentTerm Model** | ✅ | ✅ | Identical |
| PaymentTerm.name | ✅ | ✅ | Both have |
| PaymentTerm.early_payment_discount | ✅ | ✅ | Both have |
| PaymentTerm.discount_percentage | ✅ | ✅ | Both have |
| PaymentTerm.discount_days | ✅ | ✅ | Both have |
| PaymentTerm.is_default | ✅ | ✅ | Both have |

### 1.5 Discounts and Coupons

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **DiscountOffer Model** | ✅ | ✅ | Identical |
| DiscountOffer.name | ✅ | ✅ | Both have |
| DiscountOffer.discount_percentage | ✅ | ✅ | Both have |
| DiscountOffer.start_date | ✅ | ✅ | Both have |
| DiscountOffer.end_date | ✅ | ✅ | Both have |
| DiscountOffer.available_on | ✅ | ✅ | Both have |
| **Coupon Model** | ✅ | ✅ | Identical |
| Coupon.code | ✅ | ✅ | Both have |
| Coupon.status | ✅ | ✅ | Both have |
| Coupon.expiration_date | ✅ | ✅ | Both have |
| Coupon.contact (optional) | ✅ | ✅ | Both have |
| Coupon.discount_offer | ✅ | ✅ | Both have |

### 1.6 Sales Orders

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **SaleOrder Model** | ⚠️ | ⚠️ | **DIFFERENT** |
| SaleOrder.customer | ✅ | ✅ | Both have |
| SaleOrder.order_date | ✅ | ✅ | Both have |
| SaleOrder.status | ✅ | ✅ | Both have |
| SaleOrder.subtotal | ✅ | ✅ | Both have |
| SaleOrder.discount_amount | ✅ | ✅ | Both have |
| SaleOrder.total_amount | ✅ | ✅ | Both have |
| SaleOrder.applied_coupon | ✅ | ✅ | Both have |
| **SaleOrder.payment_term** | ✅ | ❌ | **KEEP in new/** |
| **SaleOrderLine Model** | ✅ | ✅ | Identical |
| SaleOrderLine.order | ✅ | ✅ | Both have |
| SaleOrderLine.product | ✅ | ✅ | Both have |
| SaleOrderLine.quantity | ✅ | ✅ | Both have |
| SaleOrderLine.unit_price | ✅ | ✅ | Both have |
| SaleOrderLine.line_total | ✅ | ✅ | Both have |

### 1.7 Customer Invoices

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **CustomerInvoice Model** | ✅ | ✅ | Identical |
| CustomerInvoice.order | ✅ | ✅ | Both have |
| CustomerInvoice.invoice_date | ✅ | ✅ | Both have |
| CustomerInvoice.due_date | ✅ | ✅ | Both have |
| CustomerInvoice.total_amount | ✅ | ✅ | Both have |
| CustomerInvoice.status | ✅ | ✅ | Both have |

### 1.8 Purchase Orders (Vendor Management)

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **PurchaseOrder Model** | ❌ | ✅ | **ADD to new/** |
| PurchaseOrder.vendor | ❌ | ✅ | **ADD to new/** |
| PurchaseOrder.order_date | ❌ | ✅ | **ADD to new/** |
| PurchaseOrder.status | ❌ | ✅ | **ADD to new/** |
| PurchaseOrder.subtotal | ❌ | ✅ | **ADD to new/** |
| PurchaseOrder.tax_amount | ❌ | ✅ | **ADD to new/** |
| PurchaseOrder.total_amount | ❌ | ✅ | **ADD to new/** |
| **PurchaseOrderLine Model** | ❌ | ✅ | **ADD to new/** |
| PurchaseOrderLine.purchase_order | ❌ | ✅ | **ADD to new/** |
| PurchaseOrderLine.product | ❌ | ✅ | **ADD to new/** |
| PurchaseOrderLine.quantity | ❌ | ✅ | **ADD to new/** |
| PurchaseOrderLine.unit_price | ❌ | ✅ | **ADD to new/** |
| PurchaseOrderLine.tax_percentage | ❌ | ✅ | **ADD to new/** |
| PurchaseOrderLine.line_subtotal | ❌ | ✅ | **ADD to new/** |
| PurchaseOrderLine.line_tax | ❌ | ✅ | **ADD to new/** |
| PurchaseOrderLine.line_total | ❌ | ✅ | **ADD to new/** |

### 1.9 Vendor Bills

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **VendorBill Model** | ⚠️ Stub | ✅ Full | **REPLACE in new/** |
| VendorBill.purchase_order | ❌ | ✅ | **ADD to new/** |
| VendorBill.vendor | ❌ | ✅ | **ADD to new/** |
| VendorBill.bill_date | ❌ | ✅ | **ADD to new/** |
| VendorBill.due_date | ❌ | ✅ | **ADD to new/** |
| VendorBill.total_amount | ✅ | ✅ | Both have (stub vs full) |
| VendorBill.status | ❌ | ✅ | **ADD to new/** |

### 1.10 Payments

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **Payment Model** | ✅ | ✅ | Identical |
| Payment.amount | ✅ | ✅ | Both have |
| Payment.payment_date | ✅ | ✅ | Both have |
| Payment.method | ✅ | ✅ | Both have |
| Payment.customer_invoice | ✅ | ✅ | Both have |
| Payment.vendor_bill | ✅ | ✅ | Both have |
| Payment.razorpay_order_id | ✅ | ✅ | Both have |
| Payment.razorpay_payment_id | ✅ | ✅ | Both have |
| Payment.razorpay_signature | ✅ | ✅ | Both have |

### 1.11 System Settings

| Model/Feature | new/ | project-aarav/ | Notes |
|---------------|------|----------------|-------|
| **SystemSettings Model** | ❌ | ✅ | **ADD to new/** |
| SystemSettings.automatic_invoicing | ❌ | ✅ | **ADD to new/** |
| SystemSettings.load() classmethod | ❌ | ✅ | **ADD to new/** |
| Singleton pattern enforcement | ❌ | ✅ | **ADD to new/** |

---

## 2. API Endpoints

### 2.1 Customer APIs

| Endpoint | new/ | project-aarav/ | Notes |
|----------|------|----------------|-------|
| **Product Endpoints** | | | |
| GET /api/products/ | ✅ | ✅ | Both have (different implementations) |
| GET /api/products/{id}/ | ✅ | ✅ | Both have (different implementations) |
| GET /api/products/categories/ | ✅ | ❌ | **KEEP in new/** |
| GET /api/products/catalog/ | ❌ | ✅ | **ADD to new/** |
| **Cart Endpoints** | | | |
| GET /api/products/cart/ | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| POST /api/products/cart/add/ | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| PUT /api/products/cart/items/{id}/ | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| DELETE /api/products/cart/items/{id}/remove/ | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| POST /api/products/cart/clear/ | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| **Order Endpoints** | | | |
| GET /api/products/orders/ | ✅ | ✅ | Both have (different implementations) |
| GET /api/products/orders/{id}/ | ✅ | ✅ | Both have (different implementations) |
| POST /api/products/checkout/ | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| POST /api/products/orders/ | ❌ | ✅ | **ADD to new/** |
| **Invoice Endpoints** | | | |
| GET /api/products/invoices/ | ✅ | ✅ | Both have (different implementations) |
| GET /api/products/invoices/{id}/ | ✅ | ✅ | Both have (different implementations) |
| **Payment Endpoints** | | | |
| POST /api/products/payments/create-order/ | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| POST /api/products/payments/verify/ | ✅ | ❌ | **KEEP in new/** (frontend dependency) |
| GET /api/products/payments/{id}/ | ✅ | ✅ | Both have (different implementations) |
| **Coupon Endpoints** | | | |
| GET /api/products/coupons/ | ❌ | ✅ | **ADD to new/** |
| POST /api/products/coupons/ | ❌ | ✅ | **ADD to new/** |
| **Discount Offer Endpoints** | | | |
| GET /api/products/offers/ | ❌ | ✅ | **ADD to new/** |
| **Payment Term Endpoints** | | | |
| GET /api/products/payment-terms/ | ❌ | ✅ | **ADD to new/** |

### 2.2 Admin APIs

| Endpoint | new/ | project-aarav/ | Notes |
|----------|------|----------------|-------|
| **Product Management** | | | |
| GET /api/admin/products/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/products/ | ❌ | ✅ | **ADD to new/** |
| GET /api/admin/products/{id}/ | ❌ | ✅ | **ADD to new/** |
| PUT /api/admin/products/{id}/ | ❌ | ✅ | **ADD to new/** |
| DELETE /api/admin/products/{id}/ | ❌ | ✅ | **ADD to new/** |
| **Vendor Management** | | | |
| GET /api/admin/vendors/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/vendors/ | ❌ | ✅ | **ADD to new/** |
| GET /api/admin/vendors/{id}/ | ❌ | ✅ | **ADD to new/** |
| PUT /api/admin/vendors/{id}/ | ❌ | ✅ | **ADD to new/** |
| DELETE /api/admin/vendors/{id}/ | ❌ | ✅ | **ADD to new/** |
| **Purchase Order Management** | | | |
| GET /api/admin/purchase-orders/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/purchase-orders/ | ❌ | ✅ | **ADD to new/** |
| GET /api/admin/purchase-orders/{id}/ | ❌ | ✅ | **ADD to new/** |
| PUT /api/admin/purchase-orders/{id}/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/purchase-orders/{id}/confirm/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/purchase-orders/{id}/cancel/ | ❌ | ✅ | **ADD to new/** |
| **Purchase Order Line Management** | | | |
| GET /api/admin/purchase-order-lines/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/purchase-order-lines/ | ❌ | ✅ | **ADD to new/** |
| GET /api/admin/purchase-order-lines/{id}/ | ❌ | ✅ | **ADD to new/** |
| PUT /api/admin/purchase-order-lines/{id}/ | ❌ | ✅ | **ADD to new/** |
| DELETE /api/admin/purchase-order-lines/{id}/ | ❌ | ✅ | **ADD to new/** |
| **Vendor Bill Management** | | | |
| GET /api/admin/vendor-bills/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/vendor-bills/ | ❌ | ✅ | **ADD to new/** |
| GET /api/admin/vendor-bills/{id}/ | ❌ | ✅ | **ADD to new/** |
| PUT /api/admin/vendor-bills/{id}/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/vendor-bills/{id}/confirm/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/vendor-bills/{id}/cancel/ | ❌ | ✅ | **ADD to new/** |
| **Vendor Payment Management** | | | |
| GET /api/admin/vendor-payments/ | ❌ | ✅ | **ADD to new/** |
| POST /api/admin/vendor-payments/ | ❌ | ✅ | **ADD to new/** |
| GET /api/admin/vendor-payments/{id}/ | ❌ | ✅ | **ADD to new/** |

### 2.3 Vendor APIs

| Endpoint | new/ | project-aarav/ | Notes |
|----------|------|----------------|-------|
| **Vendor Product Access** | | | |
| GET /api/vendor/products/ | ❌ | ✅ | **ADD to new/** |
| GET /api/vendor/products/{id}/ | ❌ | ✅ | **ADD to new/** |
| **Vendor Purchase Orders** | | | |
| GET /api/vendor/purchase-orders/ | ❌ | ✅ | **ADD to new/** |
| GET /api/vendor/purchase-orders/{id}/ | ❌ | ✅ | **ADD to new/** |
| **Vendor Bills** | | | |
| GET /api/vendor/vendor-bills/ | ❌ | ✅ | **ADD to new/** |
| GET /api/vendor/vendor-bills/{id}/ | ❌ | ✅ | **ADD to new/** |
| **Vendor Payments** | | | |
| GET /api/vendor/payments/ | ❌ | ✅ | **ADD to new/** |
| GET /api/vendor/payments/{id}/ | ❌ | ✅ | **ADD to new/** |
| **Vendor Self-Service** | | | |
| GET /api/vendor/me/ | ❌ | ✅ | **ADD to new/** |

### 2.4 System Settings APIs

| Endpoint | new/ | project-aarav/ | Notes |
|----------|------|----------------|-------|
| GET /api/products/settings/ | ❌ | ✅ | **ADD to new/** |
| PUT /api/products/settings/ | ❌ | ✅ | **ADD to new/** |

---

## 3. Business Logic and Services

### 3.1 Service Functions

| Service | new/ | project-aarav/ | Notes |
|---------|------|----------------|-------|
| Order creation service | ✅ | ✅ | 🔄 **COMPARE and MERGE** |
| Invoice generation service | ✅ | ✅ | 🔄 **COMPARE and MERGE** |
| Payment processing service | ✅ | ✅ | 🔄 **COMPARE and MERGE** |
| Coupon validation service | ✅ | ✅ | 🔄 **COMPARE and MERGE** |
| Stock management service | ⚠️ | ⚠️ | 🔄 **COMPARE and MERGE** |
| Purchase order service | ❌ | ✅ | **ADD to new/** |
| Vendor bill service | ❌ | ✅ | **ADD to new/** |

---

## 4. Permissions and Authorization

### 4.1 Permission Classes

| Permission | new/ | project-aarav/ | Notes |
|------------|------|----------------|-------|
| IsAuthenticated | ✅ | ✅ | Both use DRF default |
| IsAdminUser | ✅ | ✅ | Both use DRF default |
| Custom IsInternalUser | ❌ | ✅ | **ADD to new/** |
| Custom IsVendorUser | ❌ | ✅ | **ADD to new/** |
| Custom IsAdminOrVendor | ❌ | ✅ | **ADD to new/** |
| Admin-specific permissions | ❌ | ✅ | **ADD to new/** |
| Vendor-specific permissions | ❌ | ✅ | **ADD to new/** |

---

## 5. Reporting and Analytics

### 5.1 Reporting Features

| Report | new/ | project-aarav/ | Notes |
|--------|------|----------------|-------|
| Sales reports | ❌ | ✅ | **ADD to new/** |
| Purchase reports | ❌ | ✅ | **ADD to new/** |
| Inventory reports | ❌ | ✅ | **ADD to new/** |
| Payment reports | ❌ | ✅ | **ADD to new/** |
| Vendor performance reports | ❌ | ✅ | **ADD to new/** |

---

## 6. Testing Infrastructure

### 6.1 Test Coverage

| Test Type | new/ | project-aarav/ | Notes |
|-----------|------|----------------|-------|
| **Property-Based Tests** | ✅ | ✅ | Both have Hypothesis tests |
| Coupon property tests | ✅ | ✅ | Both have |
| Discount offer property tests | ✅ | ✅ | Both have |
| Invoice property tests | ✅ | ✅ | Both have |
| Payment term property tests | ✅ | ✅ | Both have |
| Sale order property tests | ✅ | ✅ | Both have |
| **Unit Tests** | ✅ | ✅ | Both have |
| Coupon unit tests | ✅ | ✅ | Both have |
| Discount offer unit tests | ✅ | ✅ | Both have |
| Sale order unit tests | ✅ | ✅ | Both have |
| Sale order line unit tests | ✅ | ✅ | Both have |
| **Integration Tests** | ⚠️ | ✅ | project-aarav/ has more |
| API integration tests | ❌ | ✅ | **ADD to new/** |
| E2E order flow tests | ✅ | ✅ | Both have |
| **Test Factories** | ✅ | ✅ | Both have |
| Factory Boy factories | ✅ | ✅ | Both have |

---

## 7. Configuration and Settings

### 7.1 Django Settings

| Setting | new/ | project-aarav/ | Notes |
|---------|------|----------------|-------|
| INSTALLED_APPS | ⚠️ | ⚠️ | 🔄 **COMPARE and MERGE** |
| MIDDLEWARE | ⚠️ | ⚠️ | 🔄 **COMPARE and MERGE** |
| REST_FRAMEWORK config | ⚠️ | ⚠️ | 🔄 **COMPARE and MERGE** |
| CORS configuration | ⚠️ | ⚠️ | 🔄 **COMPARE and MERGE** |
| JWT authentication | ⚠️ | ⚠️ | 🔄 **COMPARE and MERGE** |
| Razorpay configuration | ⚠️ | ⚠️ | 🔄 **COMPARE and MERGE** |

### 7.2 Dependencies

| Package | new/ | project-aarav/ | Notes |
|---------|------|----------------|-------|
| Django | ⚠️ | ⚠️ | 🔄 **COMPARE versions** |
| djangorestframework | ⚠️ | ⚠️ | 🔄 **COMPARE versions** |
| hypothesis | ✅ | ✅ | Both have |
| pytest | ✅ | ✅ | Both have |
| pytest-django | ✅ | ✅ | Both have |
| factory-boy | ✅ | ✅ | Both have |
| razorpay | ✅ | ✅ | Both have |
| drf-spectacular | ⚠️ | ⚠️ | 🔄 **COMPARE versions** |

---

## 8. Frontend Integration

### 8.1 Frontend Dependencies

| Feature | new/ Frontend | Backend Support in new/ | Backend Support in project-aarav/ |
|---------|---------------|-------------------------|-----------------------------------|
| Product browsing | ✅ | ✅ | ✅ |
| Shopping cart | ✅ | ✅ | ❌ |
| Checkout | ✅ | ✅ | ⚠️ Different |
| Order history | ✅ | ✅ | ✅ |
| Invoice viewing | ✅ | ✅ | ✅ |
| Payment processing | ✅ | ✅ | ✅ |
| User profile | ✅ | ✅ | ✅ |

**CRITICAL:** All backend endpoints used by the frontend in `new/` must be preserved during the merge.

---

## 9. Summary Statistics

### 9.1 Model Count

| Category | new/ | project-aarav/ | To Add | To Keep |
|----------|------|----------------|--------|---------|
| User models | 2 | 2 | 0 | 2 |
| Product models | 2 | 2 | 0 | 2 |
| Cart models | 2 | 0 | 0 | 2 |
| Order models | 4 | 2 | 0 | 4 |
| Purchase models | 0 | 3 | 3 | 0 |
| Payment models | 4 | 4 | 0 | 4 |
| Settings models | 0 | 1 | 1 | 0 |
| **TOTAL** | **14** | **14** | **4** | **14** |

### 9.2 API Endpoint Count

| Category | new/ | project-aarav/ | To Add | To Keep |
|----------|------|----------------|--------|---------|
| Customer APIs | ~15 | ~20 | ~5 | ~15 |
| Admin APIs | 0 | ~30 | ~30 | 0 |
| Vendor APIs | 0 | ~15 | ~15 | 0 |
| **TOTAL** | **~15** | **~65** | **~50** | **~15** |

### 9.3 File Count

| Category | new/ | project-aarav/ | To Add | To Keep |
|----------|------|----------------|--------|---------|
| Model files | 2 | 2 | 0 | 2 |
| View files | 2 | 4 | 2 | 2 |
| Serializer files | 2 | 4 | 2 | 2 |
| URL files | 2 | 3 | 1 | 2 |
| Permission files | 0 | 2 | 2 | 0 |
| Service files | 2 | 2 | 0 | 2 |
| Test files | 14 | ~20 | ~6 | 14 |
| **TOTAL** | **24** | **37** | **13** | **24** |

---

## 10. Merge Priority

### 10.1 Critical (Must Have)

1. ✅ PurchaseOrder and PurchaseOrderLine models
2. ✅ Full VendorBill implementation
3. ✅ SystemSettings model
4. ✅ Vendor role in User model
5. ✅ Admin ViewSets (views_admin.py)
6. ✅ Vendor ViewSets (views_vendor.py)
7. ✅ Permission classes

### 10.2 High Priority (Should Have)

1. ✅ Admin serializers
2. ✅ Vendor serializers
3. ✅ Admin/Vendor URL patterns
4. ✅ Reporting module
5. ✅ Exception handling classes
6. ✅ Additional test coverage

### 10.3 Medium Priority (Nice to Have)

1. ⚠️ Enhanced service layer functions
2. ⚠️ Additional API endpoints
3. ⚠️ Documentation improvements

### 10.4 Low Priority (Optional)

1. ⚠️ Code style improvements
2. ⚠️ Performance optimizations
3. ⚠️ Additional utility functions

---

**End of Feature Matrix**
