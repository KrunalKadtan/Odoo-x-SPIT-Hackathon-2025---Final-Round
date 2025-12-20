#!/usr/bin/env python
"""
Test the portal signup API endpoint.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.test import Client
from accounts.models import User, Contact
import json


def test_signup_api():
    """Test the portal signup API endpoint."""
    
    print("=" * 80)
    print("PORTAL SIGNUP API TEST")
    print("=" * 80)
    
    client = Client()
    
    # Test 1: Successful signup
    print("\n1. Testing successful signup...")
    signup_data = {
        'name': 'API Test User',
        'email': 'apitest@example.com',
        'password': 'securepass123',
        'mobile': '+1234567890',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pincode': '400001'
    }
    
    response = client.post(
        '/api/accounts/signup/',
        data=json.dumps(signup_data),
        content_type='application/json'
    )
    
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 201:
        print("   ✓ Signup successful (201 Created)")
        
        data = response.json()
        
        # Verify response structure
        if 'user' in data and 'contact' in data and 'tokens' in data:
            print("   ✓ Response has correct structure")
        else:
            print("   ✗ Response missing required fields")
            return False
        
        # Verify user data
        user_data = data['user']
        if user_data['email'] == signup_data['email']:
            print(f"   ✓ User email correct: {user_data['email']}")
        if user_data['role'] == 'portal':
            print(f"   ✓ User role correct: {user_data['role']}")
        
        # Verify contact data
        contact_data = data['contact']
        if contact_data['type'] == 'customer':
            print(f"   ✓ Contact type correct: {contact_data['type']}")
        if contact_data['email'] == signup_data['email']:
            print(f"   ✓ Contact email correct: {contact_data['email']}")
        
        # Verify tokens
        if 'access' in data['tokens'] and 'refresh' in data['tokens']:
            print("   ✓ JWT tokens generated")
        
        # Verify database
        user = User.objects.get(email=signup_data['email'])
        contact = Contact.objects.get(email=signup_data['email'])
        
        if user.role == 'portal':
            print("   ✓ User in database with role='portal'")
        if contact.type == 'customer':
            print("   ✓ Contact in database with type='customer'")
        if contact.user == user:
            print("   ✓ Contact linked to user in database")
    else:
        print(f"   ✗ Signup failed with status {response.status_code}")
        print(f"   Response: {response.content.decode()}")
        return False
    
    # Test 2: Duplicate email
    print("\n2. Testing duplicate email rejection...")
    response = client.post(
        '/api/accounts/signup/',
        data=json.dumps(signup_data),
        content_type='application/json'
    )
    
    if response.status_code == 400:
        print("   ✓ Duplicate email rejected (400 Bad Request)")
        data = response.json()
        if 'errors' in data:
            print(f"   ✓ Error message provided: {data['errors']}")
    else:
        print(f"   ✗ Expected 400, got {response.status_code}")
        return False
    
    # Test 3: Missing required fields
    print("\n3. Testing missing required fields...")
    incomplete_data = {
        'name': 'Incomplete User',
        'email': 'incomplete@example.com'
        # Missing password
    }
    
    response = client.post(
        '/api/accounts/signup/',
        data=json.dumps(incomplete_data),
        content_type='application/json'
    )
    
    if response.status_code == 400:
        print("   ✓ Missing fields rejected (400 Bad Request)")
        data = response.json()
        if 'errors' in data and 'password' in data['errors']:
            print("   ✓ Password error message provided")
    else:
        print(f"   ✗ Expected 400, got {response.status_code}")
        return False
    
    # Test 4: Invalid email format
    print("\n4. Testing invalid email format...")
    invalid_email_data = {
        'name': 'Invalid Email User',
        'email': 'not-an-email',
        'password': 'securepass123'
    }
    
    response = client.post(
        '/api/accounts/signup/',
        data=json.dumps(invalid_email_data),
        content_type='application/json'
    )
    
    if response.status_code == 400:
        print("   ✓ Invalid email rejected (400 Bad Request)")
    else:
        print(f"   ✗ Expected 400, got {response.status_code}")
        return False
    
    # Test 5: Short password
    print("\n5. Testing short password...")
    short_pass_data = {
        'name': 'Short Pass User',
        'email': 'shortpass@example.com',
        'password': 'short'
    }
    
    response = client.post(
        '/api/accounts/signup/',
        data=json.dumps(short_pass_data),
        content_type='application/json'
    )
    
    if response.status_code == 400:
        print("   ✓ Short password rejected (400 Bad Request)")
        data = response.json()
        if 'errors' in data and 'password' in data['errors']:
            print("   ✓ Password length error message provided")
    else:
        print(f"   ✗ Expected 400, got {response.status_code}")
        return False
    
    # Cleanup
    print("\n6. Cleaning up test data...")
    User.objects.filter(email='apitest@example.com').delete()
    Contact.objects.filter(email='apitest@example.com').delete()
    print("   ✓ Test data cleaned up")
    
    print("\n" + "=" * 80)
    print("✓ ALL API TESTS PASSED")
    print("=" * 80)
    
    return True


if __name__ == '__main__':
    try:
        success = test_signup_api()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
