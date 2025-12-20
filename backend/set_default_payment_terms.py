#!/usr/bin/env python
"""
Set default payment terms for existing orders.
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from products.models import PaymentTerm, SaleOrder

def set_default_payment_terms():
    print("Setting default payment terms for existing orders...")
    
    # Get or create default payment term
    payment_term, created = PaymentTerm.objects.get_or_create(
        name='Immediate Payment',
        defaults={
            'early_payment_discount': False,
            'is_default': True,
            'example_preview': 'Payment due immediately upon invoice generation.'
        }
    )
    
    if created:
        print(f"✅ Created default payment term: {payment_term.name}")
    else:
        print(f"✅ Using existing payment term: {payment_term.name}")
    
    # Update orders without payment terms
    orders_without_terms = SaleOrder.objects.filter(payment_term__isnull=True)
    count = orders_without_terms.count()
    
    if count > 0:
        orders_without_terms.update(payment_term=payment_term)
        print(f"✅ Updated {count} orders with default payment term")
    else:
        print("✅ All orders already have payment terms")
    
    print("✅ Default payment terms setup completed!")

if __name__ == "__main__":
    set_default_payment_terms()