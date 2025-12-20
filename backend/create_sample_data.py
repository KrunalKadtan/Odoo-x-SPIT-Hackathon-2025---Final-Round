#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import Product, ProductColor

def create_sample_data():
    print("🚀 Creating sample data for ApparelDesk...")
    
    # Create users first
    try:
        # Create customer user
        customer_email = "customer@example.com"
        if not User.objects.filter(email=customer_email).exists():
            customer = User.objects.create_user(
                email=customer_email,
                password="customer123",
                name="Customer User",
                role="external"
            )
            print(f"✅ Created customer user: {customer_email}")
        else:
            customer = User.objects.get(email=customer_email)
            print(f"✅ Customer user exists: {customer_email}")
        
        # Create admin user
        admin_email = "admin@appareldesk.com"
        if not User.objects.filter(email=admin_email).exists():
            admin = User.objects.create_user(
                email=admin_email,
                password="admin123",
                name="Admin User",
                role="internal"
            )
            print(f"✅ Created admin user: {admin_email}")
        else:
            admin = User.objects.get(email=admin_email)
            print(f"✅ Admin user exists: {admin_email}")
            
    except Exception as e:
        print(f"❌ Error creating users: {e}")
        return
    
    # Create sample products
    sample_products = [
        {
            'product_name': 'Classic Cotton Shirt',
            'product_category': 'shirts',
            'product_type': 'casual',
            'material': 'cotton',
            'current_stock': 50,
            'sales_price': 1299.00,
            'purchase_price': 800.00,
            'published': True
        },
        {
            'product_name': 'Elegant Silk Kurta',
            'product_category': 'kurtas',
            'product_type': 'traditional',
            'material': 'silk',
            'current_stock': 30,
            'sales_price': 2499.00,
            'purchase_price': 1500.00,
            'published': True
        },
        {
            'product_name': 'Formal Blazer',
            'product_category': 'men',
            'product_type': 'formal',
            'material': 'wool',
            'current_stock': 25,
            'sales_price': 3999.00,
            'purchase_price': 2500.00,
            'published': True
        },
        {
            'product_name': 'Summer Dress',
            'product_category': 'women',
            'product_type': 'casual',
            'material': 'cotton',
            'current_stock': 40,
            'sales_price': 1899.00,
            'purchase_price': 1200.00,
            'published': True
        }
    ]
    
    try:
        for product_data in sample_products:
            product_name = product_data['product_name']
            if not Product.objects.filter(product_name=product_name).exists():
                product = Product.objects.create(**product_data)
                print(f"✅ Created product: {product_name}")
                
                # Add some colors
                colors = ['Blue', 'White', 'Black']
                for color in colors:
                    ProductColor.objects.create(
                        product=product,
                        color_name=color,
                        color_code=f"#{color.lower()[:3]}000"
                    )
            else:
                print(f"✅ Product exists: {product_name}")
                
    except Exception as e:
        print(f"❌ Error creating products: {e}")
        return
    
    # Display summary
    try:
        print(f"\n📊 Database Summary:")
        print(f"Total users: {User.objects.count()}")
        print(f"Total products: {Product.objects.count()}")
        print(f"Published products: {Product.objects.filter(published=True).count()}")
        
        print(f"\n👥 Users:")
        for user in User.objects.all():
            print(f"  - {user.email} ({user.role})")
            
        print(f"\n📦 Products:")
        for product in Product.objects.all():
            print(f"  - {product.product_name} (₹{product.sales_price}) - {'Published' if product.published else 'Draft'}")
            
    except Exception as e:
        print(f"❌ Error reading data: {e}")
    
    print("\n🎉 Sample data creation complete!")

if __name__ == "__main__":
    create_sample_data()