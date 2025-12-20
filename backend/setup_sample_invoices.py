#!/usr/bin/env python
"""
Setup sample invoices for testing payment functionality.
"""

import os
import sys
import django
from decimal import Decimal
from datetime import date, timedelta

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import Product, SaleOrder, CustomerInvoice, PaymentTerm

def setup_sample_data():
    """Create sample data for testing payment functionality."""
    
    print("Setting up sample data for payment testing...")
    
    # Get or create test user
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
        print(f"✅ Created test user: {user.email}")
    else:
        print(f"✅ Using existing test user: {user.email}")
    
    # Get or create default payment term
    payment_term, created = PaymentTerm.objects.get_or_create(
        name='Immediate Payment',
        defaults={
            'early_payment_discount': False,
            'is_default': True,
            'example_preview': 'Payment due immediately upon invoice generation.'
        }
    )
    
    if created:
        print(f"✅ Created payment term: {payment_term.name}")
    else:
        print(f"✅ Using existing payment term: {payment_term.name}")
    
    # Create sample products if they don't exist
    products_data = [
        {
            'product_name': 'Red Shirt',
            'product_category': 'Shirts',
            'product_type': 'storable',
            'material': 'Cotton',
            'sales_price': Decimal('600.00'),
            'purchase_price': Decimal('400.00'),
            'current_stock': 50,
            'published': True
        },
        {
            'product_name': 'Premium Cotton Kurta',
            'product_category': 'Kurtas',
            'product_type': 'storable',
            'material': 'Premium Cotton',
            'sales_price': Decimal('2499.00'),
            'purchase_price': Decimal('1500.00'),
            'current_stock': 25,
            'published': True
        }
    ]
    
    products = []
    for product_data in products_data:
        product, created = Product.objects.get_or_create(
            product_name=product_data['product_name'],
            defaults=product_data
        )
        products.append(product)
        if created:
            print(f"✅ Created product: {product.product_name}")
        else:
            print(f"✅ Using existing product: {product.product_name}")
    
    # Create sample sale orders and invoices
    orders_data = [
        {
            'customer': user,
            'total_amount': Decimal('1200.00'),
            'status': 'confirmed',
            'payment_term': payment_term,
            'products': [{'product': products[0], 'quantity': 2, 'unit_price': Decimal('600.00')}]
        },
        {
            'customer': user,
            'total_amount': Decimal('2499.00'),
            'status': 'confirmed',
            'payment_term': payment_term,
            'products': [{'product': products[1], 'quantity': 1, 'unit_price': Decimal('2499.00')}]
        }
    ]
    
    invoices_created = 0
    for i, order_data in enumerate(orders_data):
        # Create sale order
        order, created = SaleOrder.objects.get_or_create(
            customer=order_data['customer'],
            total_amount=order_data['total_amount'],
            defaults={
                'status': order_data['status'],
                'payment_term': order_data['payment_term']
            }
        )
        
        if created:
            print(f"✅ Created sale order: {order.id}")
        else:
            print(f"✅ Using existing sale order: {order.id}")
        
        # Create invoice for the order
        invoice, created = CustomerInvoice.objects.get_or_create(
            order=order,
            defaults={
                'due_date': date.today() + timedelta(days=30),
                'total_amount': order.total_amount,
                'status': 'confirmed'
            }
        )
        
        if created:
            invoices_created += 1
            print(f"✅ Created invoice: INV/{str(invoice.id).zfill(4)} for ₹{invoice.total_amount}")
        else:
            print(f"✅ Using existing invoice: INV/{str(invoice.id).zfill(4)} for ₹{invoice.total_amount}")
    
    print(f"\n🎉 Sample data setup completed!")
    print(f"📊 Summary:")
    print(f"   - Test user: {user.email}")
    print(f"   - Products: {len(products)}")
    print(f"   - Sale orders: {SaleOrder.objects.filter(customer=user).count()}")
    print(f"   - Invoices: {CustomerInvoice.objects.filter(order__customer=user).count()}")
    print(f"\n💡 You can now test the payment functionality with these invoices!")
    print(f"   - Sign in with: {user.email} / testpassword123")
    print(f"   - Go to My Account → Invoices to see the sample invoices")

if __name__ == "__main__":
    setup_sample_data()