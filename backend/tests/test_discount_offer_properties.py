"""
Property-based tests for DiscountOffer model using Hypothesis.
Tests universal properties that should hold across all valid inputs.
"""
import pytest
import uuid
from hypothesis import given, strategies as st, settings
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError
from decimal import Decimal
from products.models import DiscountOffer
from datetime import date, timedelta


# Feature: discounts-coupons, Property 1: Discount Offer Name Uniqueness
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    name=st.text(min_size=1, max_size=255, alphabet=st.characters(blacklist_categories=('Cs', 'Cc'))),
    discount_percentage=st.decimals(min_value=Decimal('0.00'), max_value=Decimal('100.00'), places=2)
)
def test_discount_offer_name_uniqueness(name, discount_percentage):
    """
    Property 1: Discount Offer Name Uniqueness
    
    For any two discount offer creation attempts with the same name, 
    the second attempt should fail with an integrity error, ensuring 
    no duplicate names exist in the database.
    
    Validates: Requirements 2.1, 2.2
    """
    # Set up valid date range
    start_date = date.today()
    end_date = start_date + timedelta(days=7)
    
    # Create first discount offer with the given name
    try:
        with transaction.atomic():
            first_offer = DiscountOffer.objects.create(
                name=name,
                discount_percentage=discount_percentage,
                start_date=start_date,
                end_date=end_date
            )
        
        # Attempt to create second discount offer with the same name
        # This should fail due to UNIQUE constraint
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                DiscountOffer.objects.create(
                    name=name,
                    discount_percentage=discount_percentage,
                    start_date=start_date,
                    end_date=end_date + timedelta(days=1)
                )
        
        # Clean up
        first_offer.delete()
    except (ValidationError, IntegrityError):
        # If the first creation fails due to validation, that's acceptable
        # (e.g., invalid characters in name)
        pass


# Feature: discounts-coupons, Property 2: Discount Percentage Range Validation
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    discount_percentage=st.one_of(
        # Test values below 0
        st.decimals(min_value=-1000, max_value=Decimal('-0.01'), places=2),
        # Test values above 100
        st.decimals(min_value=Decimal('100.01'), max_value=1000, places=2)
    )
)
def test_discount_percentage_range_validation(discount_percentage):
    """
    Property 2: Discount Percentage Range Validation
    
    For any discount offer creation or update attempt with a discount_percentage 
    value outside the range 0-100, the operation should fail at the database 
    level with a constraint violation error.
    
    Validates: Requirements 3.1, 3.2, 3.3
    """
    # Generate a unique name for this test run
    unique_name = f"test_offer_{uuid.uuid4().hex[:20]}"
    
    # Set up valid date range
    start_date = date.today()
    end_date = start_date + timedelta(days=7)
    
    # Attempt to create a discount offer with invalid percentage
    # This should fail at the database level due to CHECK constraint
    with pytest.raises((IntegrityError, ValidationError)):
        with transaction.atomic():
            DiscountOffer.objects.create(
                name=unique_name,
                discount_percentage=discount_percentage,
                start_date=start_date,
                end_date=end_date
            )


# Feature: discounts-coupons, Property 3: Date Range Consistency
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    days_difference=st.integers(min_value=1, max_value=365)
)
def test_date_range_consistency(days_difference):
    """
    Property 3: Date Range Consistency
    
    For any discount offer, if start_date is after end_date, the creation 
    or update should fail at the database level with a constraint violation error.
    
    Validates: Requirements 4.1, 4.2
    """
    # Generate a unique name for this test run
    unique_name = f"test_offer_{uuid.uuid4().hex[:20]}"
    
    # Set up invalid date range (start_date > end_date)
    end_date = date.today()
    start_date = end_date + timedelta(days=days_difference)
    
    # Attempt to create a discount offer with invalid date range
    # This should fail at the database level due to CHECK constraint
    with pytest.raises((IntegrityError, ValidationError)):
        with transaction.atomic():
            DiscountOffer.objects.create(
                name=unique_name,
                discount_percentage=Decimal('10.00'),
                start_date=start_date,
                end_date=end_date
            )


# Feature: discounts-coupons, Property 4: Date Range Equality
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    discount_percentage=st.decimals(min_value=Decimal('0.00'), max_value=Decimal('100.00'), places=2),
    days_offset=st.integers(min_value=0, max_value=365)
)
def test_date_range_equality(discount_percentage, days_offset):
    """
    Property 4: Date Range Equality
    
    For any discount offer where start_date equals end_date, the offer 
    should be valid and represent a single-day campaign.
    
    Validates: Requirements 4.3
    """
    # Generate a unique name for this test run
    unique_name = f"test_offer_{uuid.uuid4().hex[:20]}"
    
    # Set up single-day campaign (start_date == end_date)
    campaign_date = date.today() + timedelta(days=days_offset)
    
    # Create a discount offer with equal start and end dates
    # This should succeed
    with transaction.atomic():
        offer = DiscountOffer.objects.create(
            name=unique_name,
            discount_percentage=discount_percentage,
            start_date=campaign_date,
            end_date=campaign_date
        )
        
        # Verify the offer was created successfully
        assert offer.start_date == offer.end_date
        assert offer.is_active_on_date(campaign_date)
        
        # Clean up
        offer.delete()


# Feature: discounts-coupons, Property 5: Available Days Validation
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    days=st.lists(
        st.sampled_from(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
        min_size=1,
        max_size=7,
        unique=True
    )
)
def test_available_days_validation(days):
    """
    Property 5: Available Days Validation
    
    For any discount offer with available_on specified, all day names 
    should be valid (Monday-Sunday) and normalized to title case.
    
    Validates: Requirements 5.2, 5.5
    """
    # Generate a unique name for this test run
    unique_name = f"test_offer_{uuid.uuid4().hex[:20]}"
    
    # Set up valid date range
    start_date = date.today()
    end_date = start_date + timedelta(days=7)
    
    # Create available_on string with various cases
    available_on_input = ','.join([day.lower() if i % 2 == 0 else day.upper() for i, day in enumerate(days)])
    
    # Create a discount offer with available_on
    with transaction.atomic():
        offer = DiscountOffer.objects.create(
            name=unique_name,
            discount_percentage=Decimal('10.00'),
            start_date=start_date,
            end_date=end_date,
            available_on=available_on_input
        )
        
        # Verify days are normalized to title case
        normalized_days = [day.strip() for day in offer.available_on.split(',')]
        for day in normalized_days:
            assert day in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            assert day[0].isupper()  # First letter is uppercase
            assert day[1:].islower()  # Rest are lowercase
        
        # Verify is_available_on_day works correctly
        for day in days:
            assert offer.is_available_on_day(day)
        
        # Clean up
        offer.delete()
