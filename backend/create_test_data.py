import os
import django
from decimal import Decimal
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import Product, SaleOrder, CustomerInvoice, PaymentTerm

# Create test user
user, created = User.objects.get_or_create(
    email='test@example.com',
    defaults={
        'name': 'Test User',
        'mobile': '9876543210',
        'address': '401, Tower-3 Infocity',
        'city': 'Gandhinagar',
        'state': 'Gujarat',
        'pincode': '382421'
    }
)

if created:
    user.set_password('testpassword123')
    user.save()

print(f"User created/exists: {user.email}")

# Create payment term
payment_term, created = PaymentTerm.objects.get_or_create(
    name='Immediate Payment',
    defaults={
        'early_payment_discount': False,
        'is_default': True,
        'example_preview': 'Payment due immediately upon invoice generation.'
    }
)

print(f"Payment term: {payment_term.name}")

# Create products
product1, created = Product.objects.get_or_create(
    product_name='Red Cotton Shirt',
    defaults={
        'product_category': 'Shirts',
        'product_type': 'storable',
        'material': 'Cotton',
        'sales_price': Decimal('1200.00'),
        'purchase_price': Decimal('800.00'),
        'current_stock': 50,
        'published': True
    }
)

print(f"Product 1: {product1.product_name}")

# Create sale order
order1, created = SaleOrder.objects.get_or_create(
    customer=user,
    total_amount=Decimal('1200.00'),
    defaults={
        'status': 'confirmed',
        'payment_term': payment_term
    }
)

print(f"Order: {order1.id}")

# Create invoice
invoice1, created = CustomerInvoice.objects.get_or_create(
    order=order1,
    defaults={
        'due_date': date.today() + timedelta(days=30),
        'total_amount': order1.total_amount,
        'status': 'confirmed'
    }
)

print(f"Invoice created: INV/{str(invoice1.id).zfill(4)} - ₹{invoice1.total_amount}")
print(f"Total invoices for user: {CustomerInvoice.objects.filter(order__customer=user).count()}")