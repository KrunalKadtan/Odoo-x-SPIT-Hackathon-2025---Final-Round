"""
Integration test to verify Razorpay order creation with test credentials.
This test makes actual API calls to Razorpay test environment.
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from decimal import Decimal
from products.services import PaymentService
from products.models import CustomerInvoice, SaleOrder
from accounts.models import User


def test_razorpay_order_creation():
    """Test creating a Razorpay order with test credentials."""
    print("\n=== Testing Razorpay Order Creation ===\n")
    
    # Create test data
    print("1. Creating test customer...")
    customer, created = User.objects.get_or_create(
        email='test_razorpay@example.com',
        defaults={
            'name': 'Test Razorpay Customer',
            'role': 'portal'
        }
    )
    if created:
        print(f"   ✓ Customer created: {customer.email}")
    else:
        print(f"   ✓ Using existing customer: {customer.email}")
    
    print("\n2. Creating test sale order...")
    sale_order = SaleOrder.objects.create(
        customer=customer,
        subtotal=Decimal('1000.00'),
        discount_amount=Decimal('0.00'),
        total_amount=Decimal('1000.00'),
        status='confirmed'
    )
    print(f"   ✓ Sale order created: #{sale_order.id}")
    
    print("\n3. Creating test invoice...")
    from datetime import date, timedelta
    invoice = CustomerInvoice.objects.create(
        order=sale_order,
        due_date=date.today() + timedelta(days=30),
        total_amount=Decimal('1000.00'),
        status='draft'
    )
    print(f"   ✓ Invoice created: #{invoice.id}")
    
    print("\n4. Creating Razorpay order...")
    try:
        payment, razorpay_order = PaymentService.create_razorpay_order(
            invoice_id=invoice.id,
            amount=Decimal('100.00')  # Test with ₹100
        )
        
        print(f"   ✓ Razorpay order created successfully!")
        print(f"   - Order ID: {razorpay_order['id']}")
        print(f"   - Amount: ₹{payment.amount} (₹{razorpay_order['amount']/100})")
        print(f"   - Currency: {razorpay_order['currency']}")
        print(f"   - Payment ID: {payment.id}")
        print(f"   - Payment Method: {payment.method}")
        
        print("\n5. Verifying payment record...")
        assert payment.amount == Decimal('100.00')
        assert payment.method == 'razorpay'
        assert payment.customer_invoice == invoice
        assert payment.razorpay_order_id == razorpay_order['id']
        print("   ✓ Payment record verified")
        
        print("\n✅ Razorpay integration test PASSED!")
        print("\nNote: This order was created in Razorpay TEST mode.")
        print("You can verify it in your Razorpay dashboard: https://dashboard.razorpay.com/app/orders")
        
        return True
        
    except Exception as e:
        print(f"   ✗ Error creating Razorpay order: {e}")
        return False
    
    finally:
        # Cleanup
        print("\n6. Cleaning up test data...")
        try:
            # Delete in correct order due to foreign key constraints
            invoice.delete()
            sale_order.delete()
            customer.delete()
            print("   ✓ Test data cleaned up")
        except Exception as e:
            print(f"   ⚠ Cleanup warning: {e}")


if __name__ == '__main__':
    success = test_razorpay_order_creation()
    exit(0 if success else 1)
