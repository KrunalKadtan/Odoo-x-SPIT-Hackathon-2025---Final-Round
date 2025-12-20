#!/usr/bin/env python
"""
Test the payment API endpoints.
"""

import os
import sys
import django
import requests
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import CustomerInvoice
from django.contrib.auth import authenticate

def test_payment_api():
    """Test the payment API endpoints."""
    
    print("Testing Payment API Endpoints")
    print("=" * 40)
    
    # Base URL for API
    base_url = "http://localhost:8000/api"
    
    # Test user credentials
    email = "test@example.com"
    password = "testpassword123"
    
    try:
        # 1. Get authentication token
        print("1. Getting authentication token...")
        auth_response = requests.post(f"{base_url}/token/", {
            "email": email,
            "password": password
        })
        
        if auth_response.status_code == 200:
            token_data = auth_response.json()
            access_token = token_data['access']
            print(f"✅ Authentication successful")
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # 2. Test invoices list endpoint
            print("\n2. Testing invoices list endpoint...")
            invoices_response = requests.get(f"{base_url}/products/invoices/", headers=headers)
            
            if invoices_response.status_code == 200:
                invoices = invoices_response.json()
                print(f"✅ Invoices endpoint working - Found {len(invoices)} invoices")
                
                if invoices:
                    # 3. Test invoice detail endpoint
                    print("\n3. Testing invoice detail endpoint...")
                    first_invoice = invoices[0]
                    invoice_id = first_invoice['id'].replace('INV/', '')
                    
                    detail_response = requests.get(f"{base_url}/products/invoices/{invoice_id}/", headers=headers)
                    
                    if detail_response.status_code == 200:
                        invoice_detail = detail_response.json()
                        print(f"✅ Invoice detail endpoint working")
                        print(f"   Invoice: {invoice_detail.get('id', 'N/A')}")
                        print(f"   Amount: ₹{invoice_detail.get('total_amount', 'N/A')}")
                        print(f"   Status: {invoice_detail.get('payment_status', 'N/A')}")
                        
                        # 4. Test payment order creation (only for unpaid invoices)
                        if invoice_detail.get('amount_due', 0) > 0:
                            print("\n4. Testing payment order creation...")
                            payment_order_response = requests.post(
                                f"{base_url}/products/payments/create-order/",
                                headers=headers,
                                json={
                                    "invoice_id": int(invoice_id),
                                    "amount": float(invoice_detail.get('amount_due', 0))
                                }
                            )
                            
                            if payment_order_response.status_code == 201:
                                payment_order = payment_order_response.json()
                                print(f"✅ Payment order creation successful")
                                print(f"   Payment ID: {payment_order.get('payment_id')}")
                                print(f"   Razorpay Order ID: {payment_order.get('razorpay_order_id')}")
                                print(f"   Amount: ₹{payment_order.get('amount')}")
                            else:
                                print(f"❌ Payment order creation failed: {payment_order_response.status_code}")
                                print(f"   Error: {payment_order_response.text}")
                        else:
                            print("\n4. Skipping payment order creation - Invoice already paid")
                    else:
                        print(f"❌ Invoice detail endpoint failed: {detail_response.status_code}")
                        print(f"   Error: {detail_response.text}")
                else:
                    print("⚠️  No invoices found - run setup_sample_invoices.py first")
            else:
                print(f"❌ Invoices endpoint failed: {invoices_response.status_code}")
                print(f"   Error: {invoices_response.text}")
        else:
            print(f"❌ Authentication failed: {auth_response.status_code}")
            print(f"   Error: {auth_response.text}")
            print(f"   Make sure the test user exists - run setup_sample_invoices.py first")
    
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - Make sure Django server is running on localhost:8000")
        print("   Run: python manage.py runserver")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

if __name__ == "__main__":
    test_payment_api()