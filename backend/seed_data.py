#!/usr/bin/env python
"""
Simple script to seed sample data for testing.
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

def main():
    print("🚀 Starting data seeding...")
    
    # Check database connection
    try:
        user_count = User.objects.count()
        print(f"✅ Database connected. Current users: {user_count}")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return
    
    # Create test user
    try:
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
            print(f"✅ Test user exists: {user.email}")
    except Exception as e:
        print(f"❌ Error creating user: {e}")
        return
    
    # Create payment term
    try:
        payment_term, created = PaymentTerm.objects.get_or_create(
            name='Immediate Payment',
            defaults={
                'early_payment_discount': False,
                'is_default': True,
                'example_preview': 'Payment due immediately upon invoice generation.'
            }
        )
        print(f"✅ Payment term ready: {payment_term.name}")
    except Exception as e:
        print(f"❌ Error creating payment term: {e}")
        return
    
    # Create sample products
    try:
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
        
        product2, created = Product.objects.get_or_create(
            product_name='Premium Kurta',
            defaults={
                'product_category': 'Kurtas',
                'product_type': 'storable',
                'material': 'Premium Cotton',
                'sales_price': Decimal('2500.00'),
                'purchase_price': Decimal('1500.00'),
                'current_stock': 25,
                'published': True
            }
        )
        print(f"✅ Products ready: {product1.product_name}, {product2.product_name}")
    except Exception as e:
        print(f"❌ Error creating products: {e}")
        return
    
    # Create sale orders and invoices
    try:
        # Order 1
        order1, created = SaleOrder.objects.get_or_create(
            customer=user,
            total_amount=Decimal('1200.00'),
            defaults={
                'status': 'confirmed',
                'payment_term': payment_term
            }
        )
        
        # Invoice 1
        invoice1, created = CustomerInvoice.objects.get_or_create(
            order=order1,
            defaults={
                'due_date': date.today() + timedelta(days=30),
                'total_amount': order1.total_amount,
                'status': 'confirmed'
            }
        )
        
        # Order 2
        order2, created = SaleOrder.objects.get_or_create(
            customer=user,
            total_amount=Decimal('2500.00'),
            defaults={
                'status': 'confirmed',
                'payment_term': payment_term
            }
        )
        
        # Invoice 2
        invoice2, created = CustomerInvoice.objects.get_or_create(
            order=order2,
            defaults={
                'due_date': date.today() + timedelta(days=15),
                'total_amount': order2.total_amount,
                'status': 'confirmed'
            }
        )
        
        print(f"✅ Created invoices:")
        print(f"   - INV/{str(invoice1.id).zfill(4)}: ₹{invoice1.total_amount}")
        print(f"   - INV/{str(invoice2.id).zfill(4)}: ₹{invoice2.total_amount}")
        
    except Exception as e:
        print(f"❌ Error creating orders/invoices: {e}")
        return
    
    # Final summary
    try:
        total_users = User.objects.count()
        total_invoices = CustomerInvoice.objects.filter(order__customer=user).count()
        print(f"\n🎉 Data seeding completed!")
        print(f"📊 Summary:")
        print(f"   - Total users: {total_users}")
        print(f"   - Test user invoices: {total_invoices}")
        print(f"   - Login: test@example.com / testpassword123")
    except Exception as e:
        print(f"❌ Error getting summary: {e}")

if __name__ == "__main__":
    main()