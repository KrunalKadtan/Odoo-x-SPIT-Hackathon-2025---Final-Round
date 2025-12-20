"""
Test that database constraints are enforced (with test data setup).
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
    
    # Setup test data
    print("\nSetting up test data...")
    
    # Create or get a portal user
    portal_user, created = User.objects.get_or_create(
        email='test_portal@example.com',
        defaults={
            'name': 'Test Portal User',
            'role': 'portal'
        }
    )
    if created:
        portal_user.set_password('testpass123')
        portal_user.save()
        print(f"   Created portal user: {portal_user.email}")
    else:
        print(f"   Using existing portal user: {portal_user.email}")
    
    # Create or get a product
    product, created = Product.objects.get_or_create(
        product_name='Test Product for Constraints',
        defaults={
            'product_category': 'Test',
            'product_type': 'storable',
            'sales_price': Decimal('50.00'),
            'purchase_price': Decimal('30.00'),
            'published': True,
            'current_stock': 100
        }
    )
    if created:
        print(f"   Created test product: {product.product_name}")
    else:
        print(f"   Using existing product: {product.product_name}")
    
    # Test 1: Verify quantity CHECK constraint
    print("\n1. Testing quantity CHECK constraint (quantity > 0)...")
    
    # Create a valid order first
    order = SaleOrder.objects.create(
        customer=portal_user,
        subtotal=Decimal('100.00'),
        total_amount=Decimal('100.00'),
        status='draft'
    )
    print(f"   Created test order: #{order.id}")
    
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
    except Exception as e:
        print(f"   ⚠ Unexpected error: {e}")
    
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
    except Exception as e:
        print(f"   ⚠ Unexpected error: {e}")
    
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
    
    # Clean up
    print("\nCleaning up test data...")
    order.delete()
    if created:
        product.delete()
        portal_user.delete()
    print("   Cleanup complete")
    
    print("\n" + "=" * 80)
    print("CONSTRAINT VERIFICATION COMPLETE")
    print("=" * 80)

if __name__ == '__main__':
    test_constraints()
