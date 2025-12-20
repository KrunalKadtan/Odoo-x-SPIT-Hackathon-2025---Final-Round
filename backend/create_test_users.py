#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User

def create_test_users():
    print("Creating test users...")
    
    # Create admin user (internal)
    admin_email = "admin@appareldesk.com"
    if not User.objects.filter(email=admin_email).exists():
        admin_user = User.objects.create_user(
            email=admin_email,
            password="admin123",
            name="Admin User",
            role="internal"
        )
        print(f"✅ Created admin user: {admin_email}")
    else:
        print(f"ℹ️  Admin user already exists: {admin_email}")
    
    # Create customer user (external)
    customer_email = "customer@example.com"
    if not User.objects.filter(email=customer_email).exists():
        customer_user = User.objects.create_user(
            email=customer_email,
            password="customer123",
            name="Customer User",
            role="external"
        )
        print(f"✅ Created customer user: {customer_email}")
    else:
        print(f"ℹ️  Customer user already exists: {customer_email}")
    
    # Create vendor user
    vendor_email = "vendor@example.com"
    if not User.objects.filter(email=vendor_email).exists():
        vendor_user = User.objects.create_user(
            email=vendor_email,
            password="vendor123",
            name="Vendor User",
            role="vendor"
        )
        print(f"✅ Created vendor user: {vendor_email}")
    else:
        print(f"ℹ️  Vendor user already exists: {vendor_email}")
    
    print("\n📊 User Summary:")
    print(f"Total users: {User.objects.count()}")
    print(f"Internal users: {User.objects.filter(role='internal').count()}")
    print(f"External users: {User.objects.filter(role='external').count()}")
    print(f"Vendor users: {User.objects.filter(role='vendor').count()}")

if __name__ == "__main__":
    create_test_users()