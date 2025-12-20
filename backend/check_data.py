import os
import django
from decimal import Decimal
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import CustomerInvoice, SaleOrder, Product, PaymentTerm

# Check if test user exists
try:
    user = User.objects.get(email='test@example.com')
    print(f"✅ User exists: {user.email}")
except User.DoesNotExist:
    print("❌ Creating test user...")
    user = User.objects.create_user(
        email='test@example.com',
        password='testpassword123',
        name='Test User',
        mobile='9876543210'
    )
    print(f"✅ Created user: {user.email}")

# Check invoices
invoices = CustomerInvoice.objects.filter(order__customer=user)
print(f"📄 Current invoices: {invoices.count()}")

if invoices.count() == 0:
    print("🔧 Creating sample invoice...")
    
    # Create payment term
    payment_term, _ = PaymentTerm.objects.get_or_create(
        name='Net 30',
        defaults={'early_payment_discount': False, 'is_default': True}
    )
    
    # Create product
    product, _ = Product.objects.get_or_create(
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
    
    print(f"✅ Created invoice: INV/{str(invoice.id).zfill(4)} for ₹{invoice.total_amount}")

# Final summary
final_invoices = CustomerInvoice.objects.filter(order__customer=user)
print(f"\n📊 Final Summary:")
print(f"   User: {user.email}")
print(f"   Invoices: {final_invoices.count()}")
for inv in final_invoices:
    print(f"   - INV/{str(inv.id).zfill(4)}: ₹{inv.total_amount}")

print(f"\n🌐 Access the app at: http://localhost:5173")
print(f"🔑 Login: test@example.com / testpassword123")
print(f"💳 Go to: My Account → Invoices → Click 'Payment' to see Razorpay interface")