"""
Verify that the default payment term exists and cannot be deleted.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from products.models import PaymentTerm
from django.core.exceptions import ValidationError

# Check if default term exists
print("Checking for default payment term...")
try:
    default_term = PaymentTerm.objects.get(name='Immediate Payment')
    print(f"✓ Default term exists: '{default_term.name}'")
    print(f"  - is_default: {default_term.is_default}")
    print(f"  - early_payment_discount: {default_term.early_payment_discount}")
    print(f"  - discount_percentage: {default_term.discount_percentage}")
    print(f"  - discount_days: {default_term.discount_days}")
except PaymentTerm.DoesNotExist:
    print("✗ Default term 'Immediate Payment' does not exist!")
    print("\nCreating default term...")
    default_term = PaymentTerm.objects.create(
        name='Immediate Payment',
        early_payment_discount=False,
        discount_percentage=0.00,
        discount_days=0,
        is_default=True,
        example_preview='Payment is due immediately upon invoice receipt.'
    )
    print(f"✓ Created default term: '{default_term.name}'")

# Test deletion protection
print("\nTesting deletion protection...")
try:
    default_term.delete()
    print("✗ Default term was deleted (should have been protected!)")
except ValidationError as e:
    print(f"✓ Default term deletion prevented: {e}")

print("\nVerification complete!")
