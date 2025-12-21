#!/usr/bin/env python
"""
Test Razorpay connection and API endpoints.
"""

import requests
import json
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import CustomerInvoice

def test_razorpay_integration():
    print("🧪 Testing Razorpay Integration")
    print("=" * 50)
    
    # Test credentials
    email = "test@example.com"
    password = "testpassword123"
    base_url = "http://localhost:8000/api"
    
    try:
        # 1. Test authentication
        print("1. Testing authentication...")
        auth_response = requests.post(f"{base_url}/token/", 
            headers={'Content-Type': 'application/json'},
            json={
                "email": email,
                "password": password
            }
        )
        
        if auth_response.status_code == 200:
            token_data = auth_response.json()
            access_token = token_data['access']
            print("✅ Authentication successful")
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # 2. Check if user has invoices
            print("\n2. Checking user invoices...")
            invoices_response = requests.get(f"{base_url}/products/invoices/", headers=headers)
            
            if invoices_response.status_code == 200:
                invoices = invoices_response.json()
                print(f"✅ Found {len(invoices)} invoices")
                
                if len(invoices) == 0:
                    print("⚠️  No invoices found. Creating sample invoice...")
                    
                    # Create sample data using Django ORM
                    from decimal import Decimal
                    from datetime import date, timedelta
                    from products.models import Product, SaleOrder, PaymentTerm
                    
                    # Get user
                    user = User.objects.get(email=email)
                    
                    # Create payment term if not exists
                    payment_term, _ = PaymentTerm.objects.get_or_create(
                        name='Immediate Payment',
                        defaults={
                            'early_payment_discount': False,
                            'is_default': True,
                            'example_preview': 'Payment due immediately.'
                        }
                    )
                    
                    # Create product if not exists
                    product, _ = Product.objects.get_or_create(
                        product_name='Test Product',
                        defaults={
                            'product_category': 'Test',
                            'product_type': 'storable',
                            'material': 'Cotton',
                            'sales_price': Decimal('1000.00'),
                            'purchase_price': Decimal('600.00'),
                            'current_stock': 100,
                            'published': True
                        }
                    )
                    
                    # Create sale order
                    order = SaleOrder.objects.create(
                        customer=user,
                        total_amount=Decimal('1000.00'),
                        status='confirmed',
                        payment_term=payment_term
                    )
                    
                    # Create invoice
                    invoice = CustomerInvoice.objects.create(
                        order=order,
                        due_date=date.today() + timedelta(days=30),
                        total_amount=order.total_amount,
                        status='confirmed'
                    )
                    
                    print(f"✅ Created sample invoice: INV/{str(invoice.id).zfill(4)}")
                    
                    # Refresh invoices list
                    invoices_response = requests.get(f"{base_url}/products/invoices/", headers=headers)
                    invoices = invoices_response.json()
                
                # 3. Test payment order creation
                if invoices:
                    print(f"\n3. Testing payment order creation...")
                    first_invoice = invoices[0]
                    invoice_id = int(first_invoice['id'].replace('INV/', ''))
                    
                    payment_order_response = requests.post(
                        f"{base_url}/products/payments/create-order/",
                        headers=headers,
                        json={
                            "invoice_id": invoice_id,
                            "amount": float(first_invoice.get('amount_due', first_invoice.get('total', 1000)))
                        }
                    )
                    
                    if payment_order_response.status_code == 201:
                        payment_order = payment_order_response.json()
                        print("✅ Payment order created successfully!")
                        print(f"   Payment ID: {payment_order.get('payment_id')}")
                        print(f"   Razorpay Order ID: {payment_order.get('razorpay_order_id')}")
                        print(f"   Amount: ₹{payment_order.get('amount')}")
                        print(f"   Currency: {payment_order.get('currency')}")
                        print(f"   Razorpay Key: {payment_order.get('razorpay_key')[:10]}...")
                        
                        print("\n🎉 Razorpay backend integration is working!")
                        print("✅ Backend can create Razorpay orders")
                        print("✅ API endpoints are responding correctly")
                        print("✅ Authentication is working")
                        print("✅ Database has sample data")
                        
                    else:
                        print(f"❌ Payment order creation failed: {payment_order_response.status_code}")
                        print(f"   Response: {payment_order_response.text}")
                        
            else:
                print(f"❌ Failed to get invoices: {invoices_response.status_code}")
                print(f"   Response: {invoices_response.text}")
                
        else:
            print(f"❌ Authentication failed: {auth_response.status_code}")
            print(f"   Response: {auth_response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - Make sure Django server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    test_razorpay_integration()