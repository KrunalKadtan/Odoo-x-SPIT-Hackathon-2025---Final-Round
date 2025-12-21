#!/usr/bin/env python
"""
Complete database setup script for ApparelDesk.
This script will:
1. Check database connection
2. Run migrations
3. Create superuser (if needed)
4. Populate with comprehensive sample data
5. Verify setup
"""

import os
import sys
import django
from decimal import Decimal
from datetime import date, timedelta
import subprocess

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.core.management import execute_from_command_line
from django.db import connection
from django.contrib.auth import get_user_model
from accounts.models import User, Contact
from products.models import (
    Product, ProductColor, PaymentTerm, SaleOrder, SaleOrderLine, 
    CustomerInvoice, Cart, CartItem, DiscountOffer, Coupon, SystemSettings
)

def print_header(title):
    """Print a formatted header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_step(step, description):
    """Print a formatted step."""
    print(f"\n🔄 Step {step}: {description}")

def print_success(message):
    """Print a success message."""
    print(f"✅ {message}")

def print_error(message):
    """Print an error message."""
    print(f"❌ {message}")

def print_info(message):
    """Print an info message."""
    print(f"ℹ️  {message}")

def check_database_connection():
    """Check if database connection is working."""
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        print_success("Database connection successful")
        return True
    except Exception as e:
        print_error(f"Database connection failed: {e}")
        print_info("Please check your database configuration in .env file")
        return False

def run_migrations():
    """Run Django migrations."""
    try:
        print_info("Creating migration files...")
        execute_from_command_line(['manage.py', 'makemigrations'])
        
        print_info("Applying migrations...")
        execute_from_command_line(['manage.py', 'migrate'])
        
        print_success("Migrations completed successfully")
        return True
    except Exception as e:
        print_error(f"Migration failed: {e}")
        return False

def create_superuser():
    """Create superuser if it doesn't exist."""
    try:
        User = get_user_model()
        
        # Check if any superuser exists
        if User.objects.filter(is_superuser=True).exists():
            print_success("Superuser already exists")
            return True
        
        # Create default superuser
        admin_email = "admin@appareldesk.com"
        admin_password = "admin123"
        
        admin_user = User.objects.create_superuser(
            email=admin_email,
            password=admin_password,
            name="Admin User"
        )
        
        print_success(f"Superuser created: {admin_email} / {admin_password}")
        print_info("⚠️  Please change the default password after first login!")
        return True
        
    except Exception as e:
        print_error(f"Failed to create superuser: {e}")
        return False

def create_system_settings():
    """Create system settings."""
    try:
        settings = SystemSettings.load()
        settings.automatic_invoicing = True
        settings.save()
        print_success("System settings configured")
        return True
    except Exception as e:
        print_error(f"Failed to create system settings: {e}")
        return False

def create_sample_data():
    """Create comprehensive sample data."""
    try:
        print_info("Creating sample data...")
        
        # Create test user
        user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={
                'name': 'Test User',
                'mobile': '9876543210',
                'address': '401, Tower-3 Infocity',
                'city': 'Gandhinagar',
                'state': 'Gujarat',
                'pincode': '382421',
                'role': 'portal'
            }
        )
        
        if created:
            user.set_password('testpassword123')
            user.save()
            print_success(f"Created test user: {user.email}")
        else:
            print_success(f"Test user exists: {user.email}")
        
        # Create vendor user
        vendor_user, created = User.objects.get_or_create(
            email='vendor@example.com',
            defaults={
                'name': 'Vendor User',
                'mobile': '9876543211',
                'address': '123 Vendor Street',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': '400001',
                'role': 'vendor'
            }
        )
        
        if created:
            vendor_user.set_password('vendorpassword123')
            vendor_user.save()
            print_success(f"Created vendor user: {vendor_user.email}")
        
        # Create vendor contact
        vendor_contact, created = Contact.objects.get_or_create(
            email='vendor@example.com',
            defaults={
                'name': 'Vendor Company',
                'type': 'vendor',
                'mobile': '9876543211',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': '400001',
                'user': vendor_user
            }
        )
        
        # Create payment terms
        payment_term, created = PaymentTerm.objects.get_or_create(
            name='Net 30',
            defaults={
                'early_payment_discount': True,
                'discount_percentage': Decimal('2.00'),
                'discount_days': 10,
                'early_pay_discount_computation': 'percentage_of_total',
                'is_default': True,
                'example_preview': '2% discount if paid within 10 days, otherwise net 30 days.'
            }
        )
        
        immediate_term, created = PaymentTerm.objects.get_or_create(
            name='Immediate Payment',
            defaults={
                'early_payment_discount': False,
                'is_default': False,
                'example_preview': 'Payment due immediately upon invoice generation.'
            }
        )
        
        print_success("Payment terms created")
        
        # Create discount offer
        discount_offer, created = DiscountOffer.objects.get_or_create(
            name='New Year Sale',
            defaults={
                'discount_percentage': Decimal('15.00'),
                'start_date': date.today(),
                'end_date': date.today() + timedelta(days=30),
                'available_on': 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday'
            }
        )
        
        # Create coupon
        coupon, created = Coupon.objects.get_or_create(
            code='NEWYEAR15',
            defaults={
                'expiration_date': date.today() + timedelta(days=30),
                'status': 'active',
                'contact': user,
                'discount_offer': discount_offer
            }
        )
        
        print_success("Discount offers and coupons created")
        
        # Create sample products with colors
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
                'colors': ['Red', 'Blue', 'White', 'Black', 'Green']
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
                'colors': ['White', 'Light Blue', 'Pink', 'Grey']
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
                'colors': ['Cream', 'Gold', 'Maroon', 'Navy']
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
                'colors': ['Blue', 'Black', 'Grey', 'Dark Blue']
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
                'colors': ['Black', 'Grey', 'Navy', 'Red', 'White']
            },
            {
                'product_name': 'Summer Shorts',
                'product_category': 'Shorts',
                'product_type': 'storable',
                'material': 'Cotton',
                'sales_price': Decimal('899.00'),
                'purchase_price': Decimal('450.00'),
                'current_stock': 40,
                'published': True,
                'colors': ['Khaki', 'Navy', 'Black', 'Olive']
            },
            {
                'product_name': 'Polo Shirt',
                'product_category': 'Polo',
                'product_type': 'storable',
                'material': 'Cotton Pique',
                'sales_price': Decimal('999.00'),
                'purchase_price': Decimal('500.00'),
                'current_stock': 45,
                'published': True,
                'colors': ['White', 'Navy', 'Red', 'Green', 'Yellow']
            },
            {
                'product_name': 'Winter Jacket',
                'product_category': 'Jackets',
                'product_type': 'storable',
                'material': 'Polyester',
                'sales_price': Decimal('3499.00'),
                'purchase_price': Decimal('2000.00'),
                'current_stock': 15,
                'published': True,
                'colors': ['Black', 'Navy', 'Grey', 'Brown']
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
                print_success(f"Created product: {product.product_name}")
            else:
                print_success(f"Product exists: {product.product_name}")
            
            created_products.append(product)
        
        # Create shopping cart with items
        cart, created = Cart.objects.get_or_create(user=user)
        if created or cart.items.count() == 0:
            # Clear existing items
            cart.items.all().delete()
            
            # Add some items to cart
            CartItem.objects.create(
                cart=cart,
                product=created_products[0],  # T-shirt
                quantity=2
            )
            CartItem.objects.create(
                cart=cart,
                product=created_products[1],  # Shirt
                quantity=1
            )
            CartItem.objects.create(
                cart=cart,
                product=created_products[3],  # Jeans
                quantity=1
            )
            print_success(f"Created cart with {cart.items.count()} items")
        
        # Create sample orders and invoices
        existing_orders = SaleOrder.objects.filter(customer=user).count()
        if existing_orders == 0:
            # Order 1 - Completed
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
            
            # Order 2 - With discount
            order2 = SaleOrder.objects.create(
                customer=user,
                subtotal=Decimal('3798.00'),
                discount_amount=Decimal('569.70'),  # 15% discount
                total_amount=Decimal('3228.30'),
                payment_term=payment_term,
                status='confirmed',
                applied_coupon=coupon
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
            
            # Order 3 - Draft (in progress)
            order3 = SaleOrder.objects.create(
                customer=user,
                subtotal=Decimal('2698.00'),
                discount_amount=Decimal('0.00'),
                total_amount=Decimal('2698.00'),
                payment_term=immediate_term,
                status='draft'
            )
            
            # Order lines for order 3
            SaleOrderLine.objects.create(
                order=order3,
                product=created_products[3],  # Jeans
                quantity=1,
                unit_price=created_products[3].sales_price,
                line_total=created_products[3].sales_price
            )
            SaleOrderLine.objects.create(
                order=order3,
                product=created_products[4],  # Hoodie
                quantity=1,
                unit_price=created_products[4].sales_price,
                line_total=created_products[4].sales_price
            )
            
            print_success("Created 3 sample orders with invoices")
        else:
            print_success(f"{existing_orders} orders already exist")
        
        return True
        
    except Exception as e:
        print_error(f"Failed to create sample data: {e}")
        import traceback
        traceback.print_exc()
        return False

def verify_setup():
    """Verify that everything was set up correctly."""
    try:
        print_info("Verifying database setup...")
        
        # Check counts
        user_count = User.objects.count()
        product_count = Product.objects.filter(published=True).count()
        order_count = SaleOrder.objects.count()
        invoice_count = CustomerInvoice.objects.count()
        cart_count = Cart.objects.count()
        
        print_success(f"Users: {user_count}")
        print_success(f"Published Products: {product_count}")
        print_success(f"Orders: {order_count}")
        print_success(f"Invoices: {invoice_count}")
        print_success(f"Carts: {cart_count}")
        
        # Check test user
        test_user = User.objects.filter(email='test@example.com').first()
        if test_user:
            user_orders = SaleOrder.objects.filter(customer=test_user).count()
            user_invoices = CustomerInvoice.objects.filter(order__customer=test_user).count()
            cart_items = CartItem.objects.filter(cart__user=test_user).count()
            
            print_success(f"Test user orders: {user_orders}")
            print_success(f"Test user invoices: {user_invoices}")
            print_success(f"Test user cart items: {cart_items}")
        
        return True
        
    except Exception as e:
        print_error(f"Verification failed: {e}")
        return False

def main():
    """Main setup function."""
    print_header("ApparelDesk Database Setup")
    
    success = True
    
    # Step 1: Check database connection
    print_step(1, "Checking database connection")
    if not check_database_connection():
        return False
    
    # Step 2: Run migrations
    print_step(2, "Running migrations")
    if not run_migrations():
        success = False
    
    # Step 3: Create superuser
    print_step(3, "Creating superuser")
    if not create_superuser():
        success = False
    
    # Step 4: Create system settings
    print_step(4, "Configuring system settings")
    if not create_system_settings():
        success = False
    
    # Step 5: Create sample data
    print_step(5, "Creating sample data")
    if not create_sample_data():
        success = False
    
    # Step 6: Verify setup
    print_step(6, "Verifying setup")
    if not verify_setup():
        success = False
    
    # Final summary
    print_header("Setup Complete!")
    
    if success:
        print_success("Database setup completed successfully!")
        print_info("\n🌐 Next Steps:")
        print_info("1. Start the Django server: python manage.py runserver")
        print_info("2. Access Django Admin: http://localhost:8000/admin")
        print_info("3. Test API endpoints: http://localhost:8000/api/")
        print_info("4. Start frontend: cd ../frontend && npm run dev")
        
        print_info("\n🔑 Test Credentials:")
        print_info("Admin: admin@appareldesk.com / admin123")
        print_info("Test User: test@example.com / testpassword123")
        print_info("Vendor: vendor@example.com / vendorpassword123")
        
        print_info("\n📋 Available Test Data:")
        print_info("- 8 products with colors")
        print_info("- Shopping cart with 3 items")
        print_info("- 3 orders (2 confirmed, 1 draft)")
        print_info("- 2 invoices")
        print_info("- Payment terms with early payment discount")
        print_info("- Active coupon: NEWYEAR15 (15% off)")
        
    else:
        print_error("Setup completed with some errors. Please check the logs above.")
        return False
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)