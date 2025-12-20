import sys
import os
import django

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import CustomerInvoice, SaleOrder, Product, PaymentTerm
from decimal import Decimal
from datetime import date, timedelta

print("Starting simple test...")

# Check if test user exists
try:
    user = User.objects.get(email='test@example.com')
    print(f"Found test user: {user.email}")
except User.DoesNotExist:
    print("Creating test user...")
    user = User.objects.create_user(
        email='test@example.com',
        password='testpassword123',
        name='Test User',
        mobile='9876543210'
    )
    print(f"Created test user: {user.email}")

# Check invoices
invoice_count = CustomerInvoice.objects.filter(order__customer=user).count()
print(f"Current invoices for user: {invoice_count}")

if invoice_count == 0:
    print("Creating sample invoice...")
    
    # Create payment term
    payment_term, created = PaymentTerm.objects.get_or_create(
        name='Net 30',
        defaults={'early_payment_discount': False, 'is_default': True}
    )
    
    # Create product
    product, created = Product.objects.get_or_create(
        product_name='Sample Product',
        defaults={
            'product_category': 'Test',
            'product_type': 'storable',
            'sales_price': Decimal('1500.00'),
            'current_stock': 100,
            'published': True
        }
    )
    
    # Create order
    order = SaleOrder.objects.create(
        customer=user,
        total_amount=Decimal('1500.00'),
        status='confirmed',
        payment_term=payment_term
    )
    
    # Create invoice
    invoice = CustomerInvoice.objects.create(
        order=order,
        due_date=date.today() + timedelta(days=30),
        total_amount=Decimal('1500.00'),
        status='confirmed'
    )
    
    print(f"Created invoice: INV/{str(invoice.id).zfill(4)} for ₹{invoice.total_amount}")

# Final count
final_count = CustomerInvoice.objects.filter(order__customer=user).count()
print(f"Final invoice count: {final_count}")

print("Test completed successfully!")