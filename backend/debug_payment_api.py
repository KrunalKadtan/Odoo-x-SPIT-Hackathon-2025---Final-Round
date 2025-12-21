#!/usr/bin/env python
"""
Debug Razorpay payment API issues.
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

def debug_payment_api():
    print("🔍 Debugging Payment API")
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
            
            # 2. Get invoices
            print("\n2. Getting invoices...")
            invoices_response = requests.get(f"{base_url}/products/invoices/", headers=headers)
            
            if invoices_response.status_code == 200:
                invoices_data = invoices_response.json()
                print(f"✅ Invoices response received")
                print(f"   Response type: {type(invoices_data)}")
                print(f"   Response data: {json.dumps(invoices_data, indent=2, default=str)}")
                
                # Handle different response structures
                if isinstance(invoices_data, dict):
                    if 'results' in invoices_data:
                        invoices = invoices_data['results']
                    elif 'data' in invoices_data:
                        invoices = invoices_data['data']
                    else:
                        invoices = [invoices_data]  # Single invoice
                elif isinstance(invoices_data, list):
                    invoices = invoices_data
                else:
                    print(f"❌ Unexpected response structure")
                    return
                
                print(f"   Found {len(invoices)} invoices")
                
                if invoices:
                    first_invoice = invoices[0]
                    print(f"   First invoice: {first_invoice}")
                    
                    # Extract invoice ID properly
                    invoice_id = first_invoice['id']  # This is already an integer
                    invoice_display_id = first_invoice.get('invoice_number', f'INV/{invoice_id}')
                    
                    print(f"   Using invoice ID: {invoice_id}")
                    print(f"   Invoice display ID: {invoice_display_id}")
                    
                    # 3. Test payment order creation with detailed error handling
                    print(f"\n3. Testing payment order creation...")
                    payment_data = {
                        "invoice_id": invoice_id,
                        "amount": float(first_invoice.get('amount_due', first_invoice.get('total', 1000)))
                    }
                    
                    print(f"   Sending data: {payment_data}")
                    
                    payment_order_response = requests.post(
                        f"{base_url}/products/payments/create-order/",
                        headers=headers,
                        json=payment_data
                    )
                    
                    print(f"   Response status: {payment_order_response.status_code}")
                    print(f"   Response headers: {dict(payment_order_response.headers)}")
                    
                    try:
                        response_data = payment_order_response.json()
                        print(f"   Response data: {json.dumps(response_data, indent=2)}")
                    except:
                        print(f"   Response text: {payment_order_response.text}")
                    
                    if payment_order_response.status_code == 201:
                        print("✅ Payment order created successfully!")
                    else:
                        print(f"❌ Payment order creation failed")
                        
                        # Let's also check if the invoice exists in the database
                        print(f"\n4. Checking invoice in database...")
                        try:
                            invoice = CustomerInvoice.objects.get(id=invoice_id)
                            print(f"   ✅ Invoice found in DB: {invoice}")
                            print(f"   Invoice amount: {invoice.total_amount}")
                            print(f"   Invoice status: {invoice.status}")
                        except CustomerInvoice.DoesNotExist:
                            print(f"   ❌ Invoice {invoice_id} not found in database")
                        except Exception as e:
                            print(f"   ❌ Error checking invoice: {e}")
                
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
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_payment_api()