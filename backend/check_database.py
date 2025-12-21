#!/usr/bin/env python
"""
Quick database status check script.
Run this to verify your database setup and see current data.
"""

import os
import sys
import django
from datetime import date

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.db import connection
from accounts.models import User, Contact
from products.models import (
    Product, ProductColor, PaymentTerm, SaleOrder, SaleOrderLine, 
    CustomerInvoice, Cart, CartItem, DiscountOffer, Coupon, SystemSettings
)

def print_header(title):
    """Print a formatted header."""
    print(f"\n{'='*50}")
    print(f"  {title}")
    print(f"{'='*50}")

def print_section(title):
    """Print a section header."""
    print(f"\n📊 {title}")
    print("-" * 30)

def check_database_connection():
    """Check database connection."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT version()")
            version = cursor.fetchone()[0]
        print(f"✅ Database connected: {version}")
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False

def show_table_counts():
    """Show record counts for all main tables."""
    print_section("Table Record Counts")
    
    tables = [
        ("Users", User.objects.count()),
        ("Contacts", Contact.objects.count()),
        ("Products", Product.objects.count()),
        ("Published Products", Product.objects.filter(published=True).count()),
        ("Product Colors", ProductColor.objects.count()),
        ("Payment Terms", PaymentTerm.objects.count()),
        ("Discount Offers", DiscountOffer.objects.count()),
        ("Coupons", Coupon.objects.count()),
        ("Carts", Cart.objects.count()),
        ("Cart Items", CartItem.objects.count()),
        ("Sale Orders", SaleOrder.objects.count()),
        ("Sale Order Lines", SaleOrderLine.objects.count()),
        ("Customer Invoices", CustomerInvoice.objects.count()),
        ("System Settings", SystemSettings.objects.count()),
    ]
    
    for table_name, count in tables:
        print(f"  {table_name:<20}: {count:>5}")

def show_users():
    """Show all users."""
    print_section("Users")
    
    users = User.objects.all()
    if users:
        for user in users:
            role_display = user.get_role_display() if hasattr(user, 'get_role_display') else user.role
            print(f"  📧 {user.email:<25} | {user.name:<20} | {role_display}")
    else:
        print("  No users found")

def show_products():
    """Show published products."""
    print_section("Published Products")
    
    products = Product.objects.filter(published=True)[:10]  # Show first 10
    if products:
        for product in products:
            colors = product.colors.count()
            print(f"  🛍️  {product.product_name:<25} | ₹{product.sales_price:>8} | {colors} colors | Stock: {product.current_stock}")
        
        total_products = Product.objects.filter(published=True).count()
        if total_products > 10:
            print(f"  ... and {total_products - 10} more products")
    else:
        print("  No published products found")

def show_orders():
    """Show recent orders."""
    print_section("Recent Orders")
    
    orders = SaleOrder.objects.all().order_by('-created_at')[:5]
    if orders:
        for order in orders:
            status_emoji = {"draft": "📝", "confirmed": "✅", "cancelled": "❌"}.get(order.status, "❓")
            print(f"  {status_emoji} Order #{order.id:<5} | {order.customer.email:<25} | ₹{order.total_amount:>8} | {order.status}")
    else:
        print("  No orders found")

def show_invoices():
    """Show recent invoices."""
    print_section("Recent Invoices")
    
    invoices = CustomerInvoice.objects.all().order_by('-created_at')[:5]
    if invoices:
        for invoice in invoices:
            status_emoji = {"draft": "📝", "confirmed": "✅", "cancelled": "❌"}.get(invoice.status, "❓")
            days_until_due = (invoice.due_date - date.today()).days
            due_status = f"Due in {days_until_due} days" if days_until_due > 0 else f"Overdue by {abs(days_until_due)} days"
            print(f"  {status_emoji} Invoice #{invoice.id:<5} | Order #{invoice.order.id:<5} | ₹{invoice.total_amount:>8} | {due_status}")
    else:
        print("  No invoices found")

def show_carts():
    """Show cart information."""
    print_section("Shopping Carts")
    
    carts = Cart.objects.all()
    if carts:
        for cart in carts:
            item_count = cart.items.count()
            total_value = cart.get_total()
            print(f"  🛒 {cart.user.email:<25} | {item_count} items | ₹{total_value:>8}")
    else:
        print("  No carts found")

def show_test_credentials():
    """Show available test credentials."""
    print_section("Test Credentials")
    
    # Check for common test accounts
    test_accounts = [
        ("admin@appareldesk.com", "Admin User", "admin123"),
        ("test@example.com", "Test User", "testpassword123"),
        ("vendor@example.com", "Vendor User", "vendorpassword123"),
    ]
    
    for email, name, password in test_accounts:
        user = User.objects.filter(email=email).first()
        if user:
            print(f"  👤 {email:<25} | {name:<15} | Password: {password}")
        else:
            print(f"  ❌ {email:<25} | Not found")

def show_api_endpoints():
    """Show available API endpoints."""
    print_section("API Endpoints (when server is running)")
    
    endpoints = [
        "Authentication:",
        "  POST /api/accounts/signup/",
        "  POST /api/accounts/login/",
        "  POST /api/accounts/token/refresh/",
        "",
        "Products:",
        "  GET  /api/products/",
        "  GET  /api/products/{id}/",
        "",
        "Cart:",
        "  GET  /api/cart/",
        "  POST /api/cart/items/",
        "",
        "Orders:",
        "  GET  /api/orders/",
        "  POST /api/orders/",
        "",
        "Invoices:",
        "  GET  /api/invoices/",
        "  GET  /api/invoices/{id}/",
        "",
        "Admin Panel:",
        "  http://localhost:8000/admin/",
    ]
    
    for endpoint in endpoints:
        print(f"  {endpoint}")

def main():
    """Main function."""
    print_header("ApparelDesk Database Status")
    
    # Check database connection
    if not check_database_connection():
        return
    
    # Show all information
    show_table_counts()
    show_users()
    show_products()
    show_orders()
    show_invoices()
    show_carts()
    show_test_credentials()
    show_api_endpoints()
    
    print_header("Quick Start Commands")
    print("🚀 Start Django server:")
    print("   python manage.py runserver")
    print("")
    print("🌐 Start frontend (in frontend directory):")
    print("   npm run dev")
    print("")
    print("🔧 Django admin panel:")
    print("   http://localhost:8000/admin")
    print("")
    print("📡 API documentation:")
    print("   http://localhost:8000/api/schema/swagger-ui/")

if __name__ == "__main__":
    main()