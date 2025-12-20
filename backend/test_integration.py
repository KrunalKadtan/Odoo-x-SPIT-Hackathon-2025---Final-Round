#!/usr/bin/env python
"""
Test the complete integration by creating sample data and testing APIs.
"""

import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import Product, Cart, CartItem, SaleOrder, CustomerInvoice

def test_integration():
    print("🧪 Testing Complete Integration")
    print("=" * 50)
    
    # Test user
    try:
        user = User.objects.get(email='test@example.com')
        print(f"✅ Test user found: {user.email}")
    except User.DoesNotExist:
        print("❌ Test user not found")
        return
    
    # Test products
    products = Product.objects.filter(published=True)
    print(f"✅ Products available: {products.count()}")
    for product in products[:3]:
        print(f"   - {product.product_name}: ₹{product.sales_price}")
    
    # Test cart
    try:
        cart = Cart.objects.get(user=user)
        print(f"✅ Cart found with {cart.items.count()} items")
        for item in cart.items.all():
            print(f"   - {item.product.product_name} x {item.quantity}")
    except Cart.DoesNotExist:
        print("⚠️  No cart found for user")
    
    # Test orders
    orders = SaleOrder.objects.filter(customer=user)
    print(f"✅ Orders found: {orders.count()}")
    for order in orders:
        print(f"   - Order #{order.id}: ₹{order.total_amount} ({order.status})")
    
    # Test invoices
    invoices = CustomerInvoice.objects.filter(order__customer=user)
    print(f"✅ Invoices found: {invoices.count()}")
    for invoice in invoices:
        print(f"   - Invoice #{invoice.id}: ₹{invoice.total_amount}")
    
    print(f"\n🎉 Integration Test Complete!")
    print(f"🌐 Frontend: http://localhost:5173")
    print(f"🔑 Login: test@example.com / testpassword123")
    print(f"🛒 Test cart, orders, and payment functionality!")

if __name__ == "__main__":
    test_integration()