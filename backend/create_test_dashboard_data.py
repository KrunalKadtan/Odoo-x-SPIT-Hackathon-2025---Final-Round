#!/usr/bin/env python
"""
Create test data for admin dashboard metrics.
Run this script to populate the database with sample data.
"""

import os
import sys
import django
from decimal import Decimal
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import Product, SaleOrder, SaleOrderLine, PaymentTerm


def create_test_data():
    """Create test data for dashboard metrics."""
    
    print("Creating test data for admin dashboard...")
    
    # Create payment term first (required for orders)
    payment_term, created = PaymentTerm.objects.get_or_create(
        name="Net 30",
        defaults={
            'is_default': True,
            'early_payment_discount': False,
            'example_preview': 'Payment due within 30 days'
        }
    )
    if created:
        print(f"✓ Created payment term: {payment_term.name}")
    
    # Create test users
    users_data = [
        {'name': 'John Customer', 'email': 'john@customer.com', 'role': 'portal'},
        {'name': 'Jane Customer', 'email': 'jane@customer.com', 'role': 'portal'},
        {'name': 'Bob Customer', 'email': 'bob@customer.com', 'role': 'portal'},
        {'name': 'Alice Vendor', 'email': 'alice@vendor.com', 'role': 'vendor'},
        {'name': 'Charlie Vendor', 'email': 'charlie@vendor.com', 'role': 'vendor'},
        {'name': 'Admin User', 'email': 'admin@appareldesk.com', 'role': 'internal'},
    ]
    
    created_users = []
    for user_data in users_data:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                'name': user_data['name'],
                'role': user_data['role'],
                'is_active': True
            }
        )
        if created:
            user.set_password('password123')
            user.save()
            print(f"✓ Created user: {user.name} ({user.role})")
        created_users.append(user)
    
    # Create test products
    products_data = [
        {'name': 'Cotton T-Shirt', 'category': 'Apparel', 'price': 25.99},
        {'name': 'Denim Jeans', 'category': 'Apparel', 'price': 59.99},
        {'name': 'Leather Jacket', 'category': 'Outerwear', 'price': 199.99},
        {'name': 'Running Shoes', 'category': 'Footwear', 'price': 89.99},
        {'name': 'Baseball Cap', 'category': 'Accessories', 'price': 19.99},
        {'name': 'Wool Sweater', 'category': 'Apparel', 'price': 79.99},
    ]
    
    created_products = []
    for product_data in products_data:
        product, created = Product.objects.get_or_create(
            product_name=product_data['name'],
            defaults={
                'product_category': product_data['category'],
                'product_type': 'storable',
                'material': 'Cotton',
                'sales_price': Decimal(str(product_data['price'])),
                'purchase_price': Decimal(str(product_data['price'] * 0.6)),
                'current_stock': 100,
                'published': True
            }
        )
        if created:
            print(f"✓ Created product: {product.product_name} - ${product.sales_price}")
        created_products.append(product)
    
    # Create test orders
    portal_users = [u for u in created_users if u.role == 'portal']
    
    orders_data = [
        {'customer_idx': 0, 'products': [0, 1], 'quantities': [2, 1], 'status': 'confirmed'},
        {'customer_idx': 1, 'products': [2], 'quantities': [1], 'status': 'confirmed'},
        {'customer_idx': 2, 'products': [3, 4], 'quantities': [1, 2], 'status': 'draft'},
        {'customer_idx': 0, 'products': [5], 'quantities': [1], 'status': 'confirmed'},
        {'customer_idx': 1, 'products': [0, 3], 'quantities': [3, 1], 'status': 'draft'},
    ]
    
    for i, order_data in enumerate(orders_data):
        if order_data['customer_idx'] < len(portal_users):
            customer = portal_users[order_data['customer_idx']]
            
            # Create order
            order, created = SaleOrder.objects.get_or_create(
                customer=customer,
                status=order_data['status'],
                payment_term=payment_term,
                defaults={
                    'subtotal': Decimal('0.00'),
                    'total_amount': Decimal('0.00')
                }
            )
            
            if created:
                # Add order lines
                subtotal = Decimal('0.00')
                for j, product_idx in enumerate(order_data['products']):
                    if product_idx < len(created_products):
                        product = created_products[product_idx]
                        quantity = order_data['quantities'][j]
                        unit_price = product.sales_price
                        line_total = unit_price * quantity
                        
                        SaleOrderLine.objects.create(
                            order=order,
                            product=product,
                            quantity=quantity,
                            unit_price=unit_price,
                            line_total=line_total
                        )
                        subtotal += line_total
                
                # Update order totals
                order.subtotal = subtotal
                order.total_amount = subtotal
                order.save()
                
                print(f"✓ Created order #{order.id} for {customer.name} - ${order.total_amount} ({order.status})")
    
    # Create some older data for recent activity
    old_date = datetime.now() - timedelta(days=2)
    old_user, created = User.objects.get_or_create(
        email='old@customer.com',
        defaults={
            'name': 'Old Customer',
            'role': 'portal',
            'is_active': True
        }
    )
    if created:
        old_user.set_password('password123')
        old_user.created_at = old_date
        old_user.save()
        print(f"✓ Created old user: {old_user.name}")
    
    print("\n🎉 Test data creation completed!")
    print("\nDashboard should now show:")
    print(f"- Total Users: {User.objects.count()}")
    print(f"- Portal Users (Customers): {User.objects.filter(role='portal').count()}")
    print(f"- Vendor Users: {User.objects.filter(role='vendor').count()}")
    print(f"- Total Products: {Product.objects.count()}")
    print(f"- Published Products: {Product.objects.filter(published=True).count()}")
    print(f"- Total Orders: {SaleOrder.objects.count()}")
    print(f"- Confirmed Orders: {SaleOrder.objects.filter(status='confirmed').count()}")
    print(f"- Draft Orders: {SaleOrder.objects.filter(status='draft').count()}")
    
    total_revenue = SaleOrder.objects.filter(status='confirmed').aggregate(
        total=django.db.models.Sum('total_amount')
    )['total'] or 0
    print(f"- Total Revenue: ${total_revenue}")


if __name__ == '__main__':
    create_test_data()