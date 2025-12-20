# Migration Analysis Report

## Overview
This document analyzes the migration files from both `new/` and `project-aarav/` codebases to identify conflicts, dependencies, and create a unified migration sequence.

## Migration Inventory

### Accounts App Migrations

#### new/ (4 migrations)
1. `0001_initial.py` - Initial User and Contact models
2. `0002_enhanced_user_model.py` - Enhanced User model fields
3. `0003_contact_contact_valid_contact_type.py` - Contact model with validation
4. `0004_user_address.py` - Adds address field to User model

#### project-aarav/ (4 migrations)
1. `0001_initial.py` - Initial User and Contact models
2. `0002_enhanced_user_model.py` - Enhanced User model fields
3. `0003_contact_contact_valid_contact_type.py` - Contact model with validation
4. `0004_add_vendor_role.py` - Adds 'vendor' role to User model

### Products App Migrations

#### new/ (9 migrations)
1. `0001_initial.py` - Initial Product models
2. `0002_paymentterm.py` - PaymentTerm model
3. `0003_discountoffer_and_more.py` - DiscountOffer model
4. `0004_coupon_coupon_valid_coupon_status.py` - Coupon model
5. `0005_saleorder_saleorderline_and_more.py` - SaleOrder models
6. `0006_customer_invoice.py` - Customer and Invoice models
7. `0007_vendorbill_payment_payment_payment_exactly_one_fk.py` - VendorBill and Payment models
8. `0008_cart_saleorder_payment_term_cartitem.py` - Cart models and payment_term field
9. `0009_alter_saleorder_payment_term.py` - Makes payment_term required

#### project-aarav/ (9 migrations)
1. `0001_initial.py` - Initial Product models
2. `0002_paymentterm.py` - PaymentTerm model
3. `0003_discountoffer_and_more.py` - DiscountOffer model
4. `0004_coupon_coupon_valid_coupon_status.py` - Coupon model
5. `0005_saleorder_saleorderline_and_more.py` - SaleOrder models
6. `0006_customer_invoice.py` - Customer and Invoice models
7. `0007_vendorbill_payment_payment_payment_exactly_one_fk.py` - VendorBill and Payment models
8. `0008_system_settings.py` - SystemSettings model
9. `0009_add_purchase_orders_and_enhance_vendor_bill.py` - PurchaseOrder models and VendorBill enhancements

## Conflicts Identified

### Accounts App - Migration 0004 Conflict

**Conflict Type:** Divergent migration paths after 0003

**new/ - 0004_user_address.py:**
- Adds `address` field to User model (TextField, blank=True, null=True)

**project-aarav/ - 0004_add_vendor_role.py:**
- Alters User.role field to include 'vendor' choice
- Updates role constraint to include 'vendor'

**Impact:** Both migrations depend on 0003 but make different changes. These are NOT conflicting changes (different fields), but they create a branching migration history.

### Products App - Migration 0008-0009 Conflict

**Conflict Type:** Completely different features after 0007

**new/ - 0008 & 0009:**
- Creates Cart and CartItem models
- Adds payment_term field to SaleOrder (nullable first, then required)

**project-aarav/ - 0008 & 0009:**
- Creates SystemSettings model
- Creates PurchaseOrder and PurchaseOrderLine models
- Enhances VendorBill with purchase_order, vendor, dates, and status fields

**Impact:** These are completely different features. Both sets of migrations are needed in the merged codebase.

## Dependencies Analysis

### Accounts App Dependencies
- Migrations 0001-0003 are identical in both codebases
- Migration 0004 in both codebases depends on 0003
- No cross-app dependencies in accounts migrations

### Products App Dependencies
- Migrations 0001-0007 are identical in both codebases
- Migration 0008 in both codebases depends on 0007
- project-aarav/0009 depends on accounts/0003 (for Contact model)
- new/0008 depends on AUTH_USER_MODEL (for Cart.user)

## Resolution Strategy

### Accounts App Resolution

**Approach:** Merge both 0004 migrations into a single migration

**Rationale:**
- Both changes are needed (address field AND vendor role)
- Changes don't conflict (different fields/constraints)
- Simpler to have one migration than branching history

**Action:**
1. Keep new/0004_user_address.py as-is
2. Create new/0005_add_vendor_role.py with vendor role changes from project-aarav/0004

### Products App Resolution

**Approach:** Renumber project-aarav migrations to follow new/ migrations

**Rationale:**
- All features from both codebases are needed
- No actual conflicts (different models/fields)
- Sequential numbering maintains clear history

**Action:**
1. Keep new/0008 and 0009 as-is (Cart models and payment_term)
2. Port project-aarav/0008 as new/0010_system_settings.py
3. Port project-aarav/0009 as new/0011_add_purchase_orders_and_enhance_vendor_bill.py
4. Update dependency in 0011 to point to 0010 instead of 0008

## Final Migration Sequence

### Accounts App (5 migrations)
1. `0001_initial.py` ✓ (existing)
2. `0002_enhanced_user_model.py` ✓ (existing)
3. `0003_contact_contact_valid_contact_type.py` ✓ (existing)
4. `0004_user_address.py` ✓ (existing)
5. `0005_add_vendor_role.py` ⚠️ (NEW - to be created)

### Products App (11 migrations)
1. `0001_initial.py` ✓ (existing)
2. `0002_paymentterm.py` ✓ (existing)
3. `0003_discountoffer_and_more.py` ✓ (existing)
4. `0004_coupon_coupon_valid_coupon_status.py` ✓ (existing)
5. `0005_saleorder_saleorderline_and_more.py` ✓ (existing)
6. `0006_customer_invoice.py` ✓ (existing)
7. `0007_vendorbill_payment_payment_payment_exactly_one_fk.py` ✓ (existing)
8. `0008_cart_saleorder_payment_term_cartitem.py` ✓ (existing)
9. `0009_alter_saleorder_payment_term.py` ✓ (existing)
10. `0010_system_settings.py` ⚠️ (NEW - to be created)
11. `0011_add_purchase_orders_and_enhance_vendor_bill.py` ⚠️ (NEW - to be created)

## Data Integrity Considerations

### Foreign Key Constraints
- PurchaseOrder.vendor → accounts.Contact (valid, Contact exists)
- VendorBill.purchase_order → products.PurchaseOrder (valid, will exist after 0011)
- VendorBill.vendor → accounts.Contact (valid, Contact exists)
- Cart.user → AUTH_USER_MODEL (valid, User exists)
- CartItem.cart → products.Cart (valid, Cart created in same migration)
- CartItem.product → products.Product (valid, Product exists)

### Unique Constraints
- SystemSettings: id=1 singleton constraint (valid)
- CartItem: unique_together (cart, product) (valid)

### Check Constraints
- User.role: includes 'vendor' after 0005 (valid)
- PurchaseOrderLine.quantity > 0 (valid)
- SystemSettings.id = 1 (valid)

## Migration Testing Plan

1. **Fresh Database Test:**
   - Apply all migrations in sequence to empty database
   - Verify no errors
   - Check all tables created correctly

2. **Incremental Test:**
   - Start with migrations 0001-0007 applied
   - Apply 0008-0011 incrementally
   - Verify each step succeeds

3. **Constraint Validation:**
   - Test foreign key constraints with sample data
   - Verify check constraints work
   - Test unique constraints

4. **Rollback Test:**
   - Test migration rollback for new migrations
   - Ensure data integrity maintained

## Risks and Mitigation

### Risk 1: VendorBill Enhancement Conflicts
**Description:** Migration 0011 adds fields to VendorBill that might conflict with existing data

**Mitigation:**
- Fields are added with null=True or defaults
- Existing VendorBill records will get default values
- No data loss expected

### Risk 2: Migration Dependency Chain
**Description:** Long chain of migrations could fail at any point

**Mitigation:**
- Test migrations incrementally
- Keep backups before applying
- Document rollback procedures

### Risk 3: Cross-App Dependencies
**Description:** Products 0011 depends on accounts Contact model

**Mitigation:**
- Dependency explicitly declared in migration
- Django will enforce correct order
- No manual intervention needed

## Recommendations

1. **Create New Migrations:** Generate the two new migration files (0005 for accounts, 0010-0011 for products)
2. **Test Thoroughly:** Run migration tests on a copy of production data
3. **Backup First:** Always backup database before applying migrations
4. **Monitor Closely:** Watch for errors during migration application
5. **Document Changes:** Update model documentation to reflect new fields/models

## Next Steps

1. ✅ Complete this analysis (DONE)
2. ⏭️ Create unified migration files (Task 3.2)
3. ⏭️ Verify data integrity constraints (Task 3.3)
4. ⏭️ Test migration application (Task 3.2)
