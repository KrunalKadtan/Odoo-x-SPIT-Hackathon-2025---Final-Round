#!/usr/bin/env python
"""
Test script to verify address auto-filling functionality.
This script will create/update a test user with address information.
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from django.contrib.auth import get_user_model

def test_address_autofill():
    """Test address auto-filling by creating/updating a user with address data."""
    
    print("Testing Address Auto-fill Functionality")
    print("=" * 50)
    
    # Test email
    test_email = "test@example.com"
    
    try:
        # Try to get existing user or create new one
        user, created = User.objects.get_or_create(
            email=test_email,
            defaults={
                'name': 'Test User',
                'mobile': '9876543210',
                'address': '123 Test Street, Test Area',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'pincode': '400001'
            }
        )
        
        if created:
            user.set_password('testpassword123')
            user.save()
            print(f"✅ Created new test user: {user.email}")
        else:
            # Update existing user with address data
            user.name = 'Test User Updated'
            user.mobile = '9876543210'
            user.address = '123 Test Street, Test Area, Updated'
            user.city = 'Mumbai'
            user.state = 'Maharashtra'
            user.pincode = '400001'
            user.save()
            print(f"✅ Updated existing test user: {user.email}")
        
        # Display user data
        print(f"\nUser Data:")
        print(f"Name: {user.name}")
        print(f"Email: {user.email}")
        print(f"Mobile: {user.mobile}")
        print(f"Address: {user.address}")
        print(f"City: {user.city}")
        print(f"State: {user.state}")
        print(f"Pincode: {user.pincode}")
        
        print(f"\n✅ Test user is ready for address auto-fill testing!")
        print(f"You can now:")
        print(f"1. Sign in with email: {test_email}")
        print(f"2. Password: testpassword123")
        print(f"3. Add items to cart and proceed to checkout")
        print(f"4. The address should auto-fill from the database")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_address_autofill()
    if success:
        print(f"\n🎉 Address auto-fill test setup completed successfully!")
    else:
        print(f"\n💥 Address auto-fill test setup failed!")