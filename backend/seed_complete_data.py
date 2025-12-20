#!/usr/bin/env python
"""
Seed complete sample data for testing cart, orders, and invoices functionality.
"""

import os
import django
from decimal import Decimal
from datetime import date, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import (
    Product, ProductColor, PaymentTerm, SaleOrder, SaleOrderLine, 
    CustomerInvoice, Cart, CartItem
)

def create_sample_data():
    print("🚀 Creating comprehensive sample data...")
    
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
        print(f"✅ Created test user: {user.email}")
    else:
        print(f"✅ Test user exists: {user.email}")
    
    # Create payment term
    payment_term, created = PaymentTerm.objects.get_or_create(
        name='Net 30',
        defaults={
            'early_payment_discount': False,
            'is_default': True,
            'example_preview': 'Payment due within 30 days of invoice date.'
        }
    )
    print(f"✅ Payment term ready: {payment_term.name}")
    
    # Create sample products
    products_data = [
        {
            'product_name': 'Premium Cotton T-Shirt',
            'product_category': 'T-shirts',
            'product_type': 'storable',
            'material': 'Cotton',
            'sales_price': Decimal('599.00'),
            'purchase_price': Decimal('300.00'),
            'current_stock': 50,
            'published': True,
            'colors': ['Red', 'Blue', 'White', 'Black']
        },
        {
            'product_name': 'Formal Cotton Shirt',
            'product_category': 'Shirts',
            'product_type': 'storable',
            'material': 'Cotton',
            'sales_price': Decimal('1299.00'),
            'purchase_price': Decimal('700.00'),
            'current_stock': 30,
            'published': True,
            'colors': ['White', 'Light Blue', 'Pink']
        },
        {
            'product_name': 'Traditional Kurta',
            'product_category': 'Kurtas',
            'product_type': 'storable',
            'material': 'Silk',
            'sales_price': Decimal('2499.00'),
            'purchase_price': Decimal('1500.00'),
            'current_stock': 20,
            'published': True,
            'colors': ['Cream', 'Gold', 'Maroon']
        },
        {
            'product_name': 'Casual Denim Jeans',
            'product_category': 'Jeans',
            'product_type': 'storable',
            'material': 'Denim',
            'sales_price': Decimal('1899.00'),
            'purchase_price': Decimal('1000.00'),
            'current_stock': 25,
            'published': True,
            'colors': ['Blue', 'Black', 'Grey']
        },
        {
            'product_name': 'Comfortable Hoodie',
            'product_category': 'Hoodies',
            'product_type': 'storable',
            'material': 'Cotton Blend',
            'sales_price': Decimal('1799.00'),
            'purchase_price': Decimal('900.00'),
            'current_stock': 35,
            'published': True,
            'colors': ['Black', 'Grey', 'Navy', 'Red']
        }
    ]
    
    created_products = []
    for product_data in products_data:
        colors = product_data.pop('colors')
        product, created = Product.objects.get_or_create(
            product_name=product_data['product_name'],
            defaults=product_data
        )
        
        if created:
            # Add colors
            for color in colors:
                ProductColor.objects.get_or_create(
                    product=product,
                    color=color
                )
            print(f"✅ Created product: {product.product_name}")
        else:
            print(f"✅ Product exists: {product.product_name}")
        
        created_products.append(product)
    
    # Create sample cart with items
    cart, created = Cart.objects.get_or_create(user=user)
    if created or cart.items.count() == 0:
        # Add some items to cart
        CartItem.objects.get_or_create(
            cart=cart,
            product=created_products[0],  # T-shirt
            defaults={'quantity': 2}
        )
        CartItem.objects.get_or_create(
            cart=cart,
            product=created_products[1],  # Shirt
            defaults={'quantity': 1}
        )
        print(f"✅ Created cart with {cart.items.count()} items")
    
    # Create sample orders and invoices
    existing_orders = SaleOrder.objects.filter(customer=user).count()
    if existing_orders == 0:
        # Order 1 - Delivered
        order1 = SaleOrder.objects.create(
            customer=user,
            subtotal=Decimal('1798.00'),
            discount_amount=Decimal('0.00'),
            total_amount=Decimal('1798.00'),
            payment_term=payment_term,
            status='confirmed'
        )
        
        # Order lines for order 1
        SaleOrderLine.objects.create(
            order=order1,
            product=created_products[0],  # T-shirt
            quantity=3,
            unit_price=created_products[0].sales_price,
            line_total=created_products[0].sales_price * 3
        )
        
        # Invoice for order 1
        invoice1 = CustomerInvoice.objects.create(
            order=order1,
            due_date=date.today() + timedelta(days=30),
            total_amount=order1.total_amount,
            status='confirmed'
        )
        
        # Order 2 - Processing
        order2 = SaleOrder.objects.create(
            customer=user,
            subtotal=Decimal('3798.00'),
            discount_amount=Decimal('0.00'),
            total_amount=Decimal('3798.00'),
            payment_term=payment_term,
            status='confirmed'
        )
        
        # Order lines for order 2
        SaleOrderLine.objects.create(
            order=order2,
            product=created_products[1],  # Shirt
            quantity=1,
            unit_price=created_products[1].sales_price,
            line_total=created_products[1].sales_price
        )
        SaleOrderLine.objects.create(
            order=order2,
            product=created_products[2],  # Kurta
            quantity=1,
            unit_price=created_products[2].sales_price,
            line_total=created_products[2].sales_price
        )
        
        # Invoice for order 2
        invoice2 = CustomerInvoice.objects.create(
            order=order2,
            due_date=date.today() + timedelta(days=30),
            total_amount=order2.total_amount,
            status='confirmed'
        )
        
        print(f"✅ Created 2 sample orders with invoices")
    else:
        print(f"✅ {existing_orders} orders already exist")
    
    # Final summary
    print(f"\n🎉 Sample data creation completed!")
    print(f"📊 Summary:")
    print(f"   - User: {user.email}")
    print(f"   - Products: {Product.objects.filter(published=True).count()}")
    print(f"   - Cart items: {cart.items.count()}")
    print(f"   - Orders: {SaleOrder.objects.filter(customer=user).count()}")
    print(f"   - Invoices: {CustomerInvoice.objects.filter(order__customer=user).count()}")
    print(f"\n🌐 Test the application:")
    print(f"   - Frontend: http://localhost:5173")
    print(f"   - Login: {user.email} / testpassword123")
    print(f"   - Shop: Browse products and add to cart")
    print(f"   - Cart: View cart items and checkout")
    print(f"   - My Account: View orders and invoices")

if __name__ == "__main__":
    create_sample_data()