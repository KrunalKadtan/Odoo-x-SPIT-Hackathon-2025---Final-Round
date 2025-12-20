#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User

def main():
    print("🚀 Setting up test data for ApparelDesk...")
    
    # Create customer user
    customer_email = "customer@example.com"
    try:
        if User.objects.filter(email=customer_email).exists():
            print(f"✅ Customer user already exists: {customer_email}")
        else:
            customer = User.objects.create_user(
                email=customer_email,
                password="customer123",
                name="Customer User",
                role="external"
            )
            print(f"✅ Created customer user: {customer_email}")
    except Exception as e:
        print(f"❌ Error creating customer: {e}")
    
    # Create admin user
    admin_email = "admin@appareldesk.com"
    try:
        if User.objects.filter(email=admin_email).exists():
            print(f"✅ Admin user already exists: {admin_email}")
        else:
            admin = User.objects.create_user(
                email=admin_email,
                password="admin123",
                name="Admin User",
                role="internal"
            )
            print(f"✅ Created admin user: {admin_email}")
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
    
    # Create vendor user
    vendor_email = "vendor@example.com"
    try:
        if User.objects.filter(email=vendor_email).exists():
            print(f"✅ Vendor user already exists: {vendor_email}")
        else:
            vendor = User.objects.create_user(
                email=vendor_email,
                password="vendor123",
                name="Vendor User",
                role="vendor"
            )
            print(f"✅ Created vendor user: {vendor_email}")
    except Exception as e:
        print(f"❌ Error creating vendor: {e}")
    
    # Display summary
    try:
        total_users = User.objects.count()
        print(f"\n📊 Database Summary:")
        print(f"Total users: {total_users}")
        
        for user in User.objects.all():
            print(f"  - {user.email} ({user.role})")
            
    except Exception as e:
        print(f"❌ Error reading users: {e}")
    
    print("\n🎉 Test data setup complete!")

if __name__ == "__main__":
    main()