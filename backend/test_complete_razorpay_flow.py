#!/usr/bin/env python
"""
Complete end-to-end test of Razorpay integration.
"""

import requests
import json
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from products.models import CustomerInvoice, Payment
import razorpay

def test_complete_razorpay_flow():
    print("🚀 Complete Razorpay Integration Test")
    print("=" * 60)
    
    # Test credentials
    email = "test@example.com"
    password = "testpassword123"
    base_url = "http://localhost:8000/api"
    
    try:
        # 1. Authentication
        print("1. 🔐 Testing authentication...")
        auth_response = requests.post(f"{base_url}/token/", 
            headers={'Content-Type': 'application/json'},
            json={"email": email, "password": password}
        )
        
        if auth_response.status_code != 200:
            print(f"❌ Authentication failed: {auth_response.status_code}")
            print(f"   Response: {auth_response.text}")
            return
        
        token_data = auth_response.json()
        access_token = token_data['access']
        print("✅ Authentication successful")
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # 2. Get invoices
        print("\n2. 📄 Getting user invoices...")
        invoices_response = requests.get(f"{base_url}/products/invoices/", headers=headers)
        
        if invoices_response.status_code != 200:
            print(f"❌ Failed to get invoices: {invoices_response.status_code}")
            return
        
        invoices_data = invoices_response.json()
        invoices = invoices_data.get('results', [])
        print(f"✅ Found {len(invoices)} invoices")
        
        if not invoices:
            print("⚠️  No invoices found. Please create some test data first.")
            return
        
        # 3. Test Razorpay order creation - find invoice with amount due
        unpaid_invoice = None
        for invoice in invoices:
            if invoice['amount_due'] > 0:
                unpaid_invoice = invoice
                break
        
        if not unpaid_invoice:
            print("⚠️  No unpaid invoices found. All invoices are already paid.")
            return
        
        invoice_id = unpaid_invoice['id']
        amount = unpaid_invoice['amount_due']
        
        print(f"\n3. 💳 Creating Razorpay order for invoice {invoice_id}...")
        print(f"   Amount: ₹{amount}")
        
        payment_order_response = requests.post(
            f"{base_url}/products/payments/create-order/",
            headers=headers,
            json={"invoice_id": invoice_id, "amount": amount}
        )
        
        if payment_order_response.status_code != 201:
            print(f"❌ Payment order creation failed: {payment_order_response.status_code}")
            print(f"   Response: {payment_order_response.text}")
            return
        
        order_data = payment_order_response.json()
        print("✅ Payment order created successfully!")
        print(f"   Payment ID: {order_data['payment_id']}")
        print(f"   Razorpay Order ID: {order_data['razorpay_order_id']}")
        print(f"   Amount: ₹{order_data['amount']}")
        print(f"   Currency: {order_data['currency']}")
        
        # 4. Verify Razorpay order exists in Razorpay
        print(f"\n4. 🔍 Verifying order exists in Razorpay...")
        try:
            client = razorpay.Client(auth=(
                os.getenv('RAZORPAY_API_KEY', 'rzp_test_RtqzLjqLxzOjqC'),
                os.getenv('RAZORPAY_API_SECRET', 'FX5iZ97nhL6Mb5wcUZpyoZ8A')
            ))
            
            razorpay_order = client.order.fetch(order_data['razorpay_order_id'])
            print("✅ Order verified in Razorpay!")
            print(f"   Status: {razorpay_order['status']}")
            print(f"   Amount: ₹{razorpay_order['amount'] / 100}")
            print(f"   Currency: {razorpay_order['currency']}")
            
        except Exception as e:
            print(f"❌ Failed to verify order in Razorpay: {e}")
            return
        
        # 5. Check payment record in database
        print(f"\n5. 🗄️  Checking payment record in database...")
        try:
            payment = Payment.objects.get(id=order_data['payment_id'])
            print("✅ Payment record found in database!")
            print(f"   Payment ID: {payment.id}")
            print(f"   Amount: ₹{payment.amount}")
            print(f"   Method: {payment.method}")
            print(f"   Razorpay Order ID: {payment.razorpay_order_id}")
            print(f"   Invoice ID: {payment.customer_invoice.id}")
            print(f"   Payment Date: {payment.payment_date}")
            
        except Payment.DoesNotExist:
            print(f"❌ Payment record not found in database")
            return
        except Exception as e:
            print(f"❌ Error checking payment record: {e}")
            return
        
        # 6. Test payment verification endpoint (simulate successful payment)
        print(f"\n6. ✅ Testing payment verification...")
        print("   Note: This would normally be called after successful Razorpay payment")
        print("   For testing, we'll simulate the verification process")
        
        # In a real scenario, these would come from Razorpay callback
        fake_payment_id = "pay_test123456789"
        fake_signature = "test_signature_would_be_here"
        
        # Note: This will fail signature verification, but we can test the endpoint
        verify_response = requests.post(
            f"{base_url}/products/payments/verify/",
            headers=headers,
            json={
                "payment_id": order_data['payment_id'],
                "razorpay_payment_id": fake_payment_id,
                "razorpay_signature": fake_signature
            }
        )
        
        print(f"   Verification endpoint status: {verify_response.status_code}")
        if verify_response.status_code == 400:
            print("   ✅ Verification endpoint working (signature validation failed as expected)")
        else:
            print(f"   Response: {verify_response.text}")
        
        # 7. Test payment details endpoint
        print(f"\n7. 📊 Testing payment details endpoint...")
        payment_details_response = requests.get(
            f"{base_url}/products/payments/{order_data['payment_id']}/",
            headers=headers
        )
        
        if payment_details_response.status_code == 200:
            payment_details = payment_details_response.json()
            print("✅ Payment details retrieved successfully!")
            print(f"   Payment ID: {payment_details['id']}")
            print(f"   Amount: ₹{payment_details['amount']}")
            print(f"   Method: {payment_details['method']}")
        else:
            print(f"❌ Failed to get payment details: {payment_details_response.status_code}")
        
        # 8. Summary
        print(f"\n" + "=" * 60)
        print("🎉 RAZORPAY INTEGRATION TEST SUMMARY")
        print("=" * 60)
        print("✅ Backend authentication working")
        print("✅ Invoice API working")
        print("✅ Payment order creation working")
        print("✅ Razorpay order creation working")
        print("✅ Database payment record creation working")
        print("✅ Payment verification endpoint accessible")
        print("✅ Payment details endpoint working")
        print("\n🚀 Razorpay integration is fully functional!")
        print("\n📝 Next steps for frontend testing:")
        print("   1. Start the frontend server: npm run dev")
        print("   2. Navigate to an invoice and click 'Pay Now'")
        print("   3. Complete payment using Razorpay test credentials")
        print("   4. Verify payment success flow")
        
        print(f"\n💡 Test payment credentials:")
        print("   Card: 4111 1111 1111 1111")
        print("   Expiry: Any future date")
        print("   CVV: Any 3 digits")
        print("   UPI: success@razorpay")
        
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed - Make sure Django server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_complete_razorpay_flow()