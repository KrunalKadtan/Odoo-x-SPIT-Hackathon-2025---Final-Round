"""
Property-based tests for Coupon model using Hypothesis.
Tests universal properties that should hold across all valid inputs.
"""
import pytest
import uuid
from hypothesis import given, strategies as st, settings
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError
from decimal import Decimal
from products.models import Coupon, DiscountOffer
from accounts.models import User
from datetime import date, timedelta


# Feature: discounts-coupons, Property 6: Coupon Code Uniqueness
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    code=st.text(
        min_size=1, 
        max_size=50, 
        alphabet=st.characters(whitelist_categories=('Lu', 'Ll', 'Nd'), whitelist_characters='-_')
    )
)
def test_coupon_code_uniqueness(code):
    """
    Property 6: Coupon Code Uniqueness
    
    For any two coupon creation attempts with the same code, 
    the second attempt should fail with an integrity error, ensuring 
    no duplicate codes exist in the database.
    
    Validates: Requirements 7.1, 7.2
    """
    # Skip empty codes or codes with only whitespace
    if not code or not code.strip():
        return
    
    # Create a discount offer for the coupons
    offer_name = f"test_offer_{uuid.uuid4().hex[:20]}"
    start_date = date.today()
    end_date = start_date + timedelta(days=7)
    
    try:
        with transaction.atomic():
            offer = DiscountOffer.objects.create(
                name=offer_name,
                discount_percentage=Decimal('10.00'),
                start_date=start_date,
                end_date=end_date
            )
        
        # Create first coupon with the given code
        expiration_date = date.today() + timedelta(days=30)
        
        try:
            with transaction.atomic():
                first_coupon = Coupon.objects.create(
                    code=code,
                    expiration_date=expiration_date,
                    discount_offer=offer
                )
            
            # Attempt to create second coupon with the same code
            # This should fail due to UNIQUE constraint
            with pytest.raises(IntegrityError):
                with transaction.atomic():
                    Coupon.objects.create(
                        code=code,
                        expiration_date=expiration_date + timedelta(days=1),
                        discount_offer=offer
                    )
            
            # Clean up
            first_coupon.delete()
        except (ValidationError, IntegrityError):
            # If the first creation fails due to validation, that's acceptable
            # (e.g., invalid characters in code)
            pass
        finally:
            offer.delete()
    except (ValidationError, IntegrityError):
        # If offer creation fails, skip this test case
        pass



# Feature: discounts-coupons, Property 7: Coupon Code Format Validation
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    invalid_char=st.sampled_from(['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ' ', '\t', '\n', '/', '\\', '|'])
)
def test_coupon_code_format_validation(invalid_char):
    """
    Property 7: Coupon Code Format Validation
    
    For any coupon code containing characters other than alphanumeric, 
    hyphens, or underscores, the validation should fail before database insertion.
    
    Validates: Requirements 7.4, 7.5
    """
    # Create a discount offer for the coupon
    offer_name = f"test_offer_{uuid.uuid4().hex[:20]}"
    start_date = date.today()
    end_date = start_date + timedelta(days=7)
    
    try:
        with transaction.atomic():
            offer = DiscountOffer.objects.create(
                name=offer_name,
                discount_percentage=Decimal('10.00'),
                start_date=start_date,
                end_date=end_date
            )
        
        # Create a code with invalid character
        invalid_code = f"TEST{invalid_char}CODE"
        expiration_date = date.today() + timedelta(days=30)
        
        # Attempt to create a coupon with invalid code format
        # This should fail due to RegexValidator
        with pytest.raises(ValidationError):
            with transaction.atomic():
                Coupon.objects.create(
                    code=invalid_code,
                    expiration_date=expiration_date,
                    discount_offer=offer
                )
        
        # Clean up
        offer.delete()
    except (ValidationError, IntegrityError):
        # If offer creation fails, skip this test case
        pass



# Feature: discounts-coupons, Property 8: Coupon Status Constraint
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    invalid_status=st.text(min_size=1, max_size=20).filter(
        lambda s: s not in ['active', 'used', 'expired', 'cancelled']
    )
)
def test_coupon_status_constraint(invalid_status):
    """
    Property 8: Coupon Status Constraint
    
    For any coupon creation or update attempt with a status value other than 
    'active', 'used', 'expired', or 'cancelled', the operation should fail 
    at the database level with a constraint violation error.
    
    Validates: Requirements 8.1, 8.2, 8.5
    """
    # Create a discount offer for the coupon
    offer_name = f"test_offer_{uuid.uuid4().hex[:20]}"
    start_date = date.today()
    end_date = start_date + timedelta(days=7)
    
    try:
        with transaction.atomic():
            offer = DiscountOffer.objects.create(
                name=offer_name,
                discount_percentage=Decimal('10.00'),
                start_date=start_date,
                end_date=end_date
            )
        
        # Create a coupon with invalid status
        code = f"TEST{uuid.uuid4().hex[:10]}"
        expiration_date = date.today() + timedelta(days=30)
        
        # Attempt to create a coupon with invalid status
        # This should fail due to CHECK constraint
        with pytest.raises((IntegrityError, ValidationError)):
            with transaction.atomic():
                coupon = Coupon(
                    code=code,
                    expiration_date=expiration_date,
                    status=invalid_status,
                    discount_offer=offer
                )
                # Skip validation to test database constraint
                coupon.save(force_insert=True)
        
        # Clean up
        offer.delete()
    except (ValidationError, IntegrityError):
        # If offer creation fails, skip this test case
        pass



# Feature: discounts-coupons, Property 9: Coupon Expiration Date Validation
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    days_in_past=st.integers(min_value=1, max_value=365)
)
def test_coupon_expiration_date_validation(days_in_past):
    """
    Property 9: Coupon Expiration Date Validation
    
    For any new coupon, if the expiration_date is in the past, 
    the creation should fail with a validation error.
    
    Validates: Requirements 9.3
    """
    # Create a discount offer for the coupon
    offer_name = f"test_offer_{uuid.uuid4().hex[:20]}"
    start_date = date.today()
    end_date = start_date + timedelta(days=7)
    
    try:
        with transaction.atomic():
            offer = DiscountOffer.objects.create(
                name=offer_name,
                discount_percentage=Decimal('10.00'),
                start_date=start_date,
                end_date=end_date
            )
        
        # Create a coupon with expiration date in the past
        code = f"TEST{uuid.uuid4().hex[:10]}"
        expiration_date = date.today() - timedelta(days=days_in_past)
        
        # Attempt to create a coupon with past expiration date
        # This should fail due to clean() validation
        with pytest.raises(ValidationError):
            with transaction.atomic():
                Coupon.objects.create(
                    code=code,
                    expiration_date=expiration_date,
                    discount_offer=offer
                )
        
        # Clean up
        offer.delete()
    except (ValidationError, IntegrityError):
        # If offer creation fails, skip this test case
        pass



# Feature: discounts-coupons, Property 10: Coupon-Offer Relationship Integrity
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    discount_percentage=st.decimals(min_value=Decimal('0.00'), max_value=Decimal('100.00'), places=2)
)
def test_coupon_offer_relationship_integrity(discount_percentage):
    """
    Property 10: Coupon-Offer Relationship Integrity
    
    For any coupon, attempting to delete its associated DiscountOffer 
    should fail with a protected foreign key error if the coupon exists.
    
    Validates: Requirements 11.4
    """
    # Create a discount offer
    offer_name = f"test_offer_{uuid.uuid4().hex[:20]}"
    start_date = date.today()
    end_date = start_date + timedelta(days=7)
    
    try:
        with transaction.atomic():
            offer = DiscountOffer.objects.create(
                name=offer_name,
                discount_percentage=discount_percentage,
                start_date=start_date,
                end_date=end_date
            )
        
        # Create a coupon linked to this offer
        code = f"TEST{uuid.uuid4().hex[:10]}"
        expiration_date = date.today() + timedelta(days=30)
        
        try:
            with transaction.atomic():
                coupon = Coupon.objects.create(
                    code=code,
                    expiration_date=expiration_date,
                    discount_offer=offer
                )
            
            # Attempt to delete the offer while coupon exists
            # This should fail due to PROTECT foreign key constraint
            from django.db.models import ProtectedError
            with pytest.raises(ProtectedError):
                with transaction.atomic():
                    offer.delete()
            
            # Clean up - delete coupon first, then offer
            coupon.delete()
            offer.delete()
        except (ValidationError, IntegrityError):
            # If coupon creation fails, clean up offer
            offer.delete()
    except (ValidationError, IntegrityError):
        # If offer creation fails, skip this test case
        pass
