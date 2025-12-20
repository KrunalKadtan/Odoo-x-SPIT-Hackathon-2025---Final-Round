"""
Test that database constraints are enforced.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.db import IntegrityError, transaction
from products.models import SaleOrder, SaleOrderLine, Product
from accounts.models import User
from decimal import Decimal

def test_constraints():
    """Test that database constraints are properly enforced."""
    
    print("=" * 80)
    print("DATABASE CONSTRAINT VERIFICATION")
    print("=" * 80)
    
    # Test 1: Verify quantity CHECK constraint
    print("\n1. Testing quantity CHECK constraint (quantity > 0)...")
    try:
        # Create test data
        portal_user = User.objects.filter(role='portal').first()
        if not portal_user:
            print("   ⚠ No portal user found, skipping constraint tests")
            return
        
        product = Product.objects.filter(published=True).first()
        if not product:
            print("   ⚠ No published product found, skipping constraint tests")
            return
        
        # Create a valid order first
        order = SaleOrder.objects.create(
            customer=portal_user,
            subtotal=Decimal('100.00'),
            total_amount=Decimal('100.00'),
            status='draft'
        )
        
        # Try to create a line with quantity = 0 (should fail)
        try:
            with transaction.atomic():
                line = SaleOrderLine.objects.create(
                    order=order,
                    product=product,
                    quantity=0,  # Invalid!
                    unit_price=Decimal('50.00'),
                    line_total=Decimal('0.00')
                )
            print("   ❌ FAILED: Quantity = 0 was allowed (constraint not enforced)")
        except IntegrityError as e:
            if 'valid_line_quantity' in str(e) or 'quantity' in str(e).lower():
                print("   ✅ PASSED: Quantity = 0 rejected by CHECK constraint")
            else:
                print(f"   ⚠ Different error: {e}")
        
        # Try to create a line with negative quantity (should fail)
        try:
            with transaction.atomic():
                line = SaleOrderLine.objects.create(
                    order=order,
                    product=product,
                    quantity=-5,  # Invalid!
                    unit_price=Decimal('50.00'),
                    line_total=Decimal('-250.00')
                )
            print("   ❌ FAILED: Negative quantity was allowed (constraint not enforced)")
        except IntegrityError as e:
            if 'valid_line_quantity' in str(e) or 'quantity' in str(e).lower():
                print("   ✅ PASSED: Negative quantity rejected by CHECK constraint")
            else:
                print(f"   ⚠ Different error: {e}")
        
        # Create a valid line (should succeed)
        try:
            line = SaleOrderLine.objects.create(
                order=order,
                product=product,
                quantity=5,  # Valid!
                unit_price=Decimal('50.00'),
                line_total=Decimal('250.00')
            )
            print("   ✅ PASSED: Valid quantity = 5 accepted")
            line.delete()
        except Exception as e:
            print(f"   ❌ FAILED: Valid quantity rejected: {e}")
        
        # Clean up
        order.delete()
        
    except Exception as e:
        print(f"   ❌ Test setup failed: {e}")
    
    # Test 2: Verify indexes exist
    print("\n2. Verifying indexes exist...")
    from django.db import connection
    with connection.cursor() as cursor:
        # Check SaleOrder indexes
        cursor.execute("""
            SELECT COUNT(*) FROM pg_indexes 
            WHERE tablename = 'sale_orders' 
            AND indexname IN ('sale_order_customer_idx', 'sale_order_date_idx', 'sale_order_status_idx');
        """)
        count = cursor.fetchone()[0]
        if count == 3:
            print("   ✅ PASSED: All 3 SaleOrder indexes exist")
        else:
            print(f"   ❌ FAILED: Expected 3 indexes, found {count}")
        
        # Check SaleOrderLine indexes
        cursor.execute("""
            SELECT COUNT(*) FROM pg_indexes 
            WHERE tablename = 'sale_order_lines' 
            AND indexname IN ('sale_line_order_idx', 'sale_line_product_idx');
        """)
        count = cursor.fetchone()[0]
        if count == 2:
            print("   ✅ PASSED: All 2 SaleOrderLine indexes exist")
        else:
            print(f"   ❌ FAILED: Expected 2 indexes, found {count}")
    
    print("\n" + "=" * 80)
    print("CONSTRAINT VERIFICATION COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    test_constraints()
