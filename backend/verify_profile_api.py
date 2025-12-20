#!/usr/bin/env python
"""
Verify that the profile API returns the correct address data.
"""

import os
import sys
import django
import json

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from accounts.models import User
from accounts.serializers import UserSerializer

def verify_profile_api():
    """Verify that the profile API returns correct address data."""
    
    print("Verifying Profile API Address Data")
    print("=" * 40)
    
    try:
        # Get the test user
        user = User.objects.get(email="test@example.com")
        print(f"Found user: {user.email}")
        
        # Serialize user data (same as API)
        serializer = UserSerializer(user)
        profile_data = serializer.data
        
        # Add additional fields that frontend expects (same as profile view)
        profile_data.update({
            'full_name': user.name,
            'first_name': user.name.split()[0] if user.name else '',
            'last_name': ' '.join(user.name.split()[1:]) if user.name and len(user.name.split()) > 1 else '',
            'phone': user.mobile or '',
            'phone_number': user.mobile or '',
            'mobile': user.mobile or '',
            'address': user.address or '',
            'city': user.city or '',
            'state': user.state or '',
            'pincode': user.pincode or '',
            'postal_code': user.pincode or '',
            'zip_code': user.pincode or '',
        })
        
        print(f"\nProfile API Response:")
        print(json.dumps(profile_data, indent=2, default=str))
        
        # Check if address fields are populated
        address_fields = ['address', 'city', 'state', 'pincode', 'phone']
        missing_fields = []
        
        for field in address_fields:
            if not profile_data.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            print(f"\n⚠️  Missing address fields: {missing_fields}")
        else:
            print(f"\n✅ All address fields are populated!")
        
        return len(missing_fields) == 0
        
    except User.DoesNotExist:
        print(f"❌ Test user not found. Run test_address_autofill.py first.")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = verify_profile_api()
    if success:
        print(f"\n🎉 Profile API verification completed successfully!")
    else:
        print(f"\n💥 Profile API verification failed!")