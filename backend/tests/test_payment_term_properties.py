"""
Property-based tests for PaymentTerm model using Hypothesis.
Tests universal properties that should hold across all valid inputs.
"""
import pytest
import uuid
from hypothesis import given, strategies as st, settings
from hypothesis.extra.django import from_model
from django.utils import timezone
from datetime import timedelta
from products.models import PaymentTerm


# Feature: payment-terms, Property 12: Created Timestamp Immutability
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    discount_percentage=st.decimals(min_value=0, max_value=100, places=2),
    discount_days=st.integers(min_value=0, max_value=365),
)
def test_created_timestamp_immutability(discount_percentage, discount_days):
    """
    Property 12: Created Timestamp Immutability
    
    For any payment term, the created_at timestamp should be set automatically 
    on creation and should never change on subsequent updates.
    
    Validates: Requirements 7.1
    """
    # Generate a unique name for this test run
    unique_name = f"test_term_{uuid.uuid4().hex[:20]}"
    
    # Create a payment term
    payment_term = PaymentTerm.objects.create(
        name=unique_name,
        early_payment_discount=False,
        discount_percentage=discount_percentage,
        discount_days=discount_days,
    )
    
    # Capture the original created_at timestamp
    original_created_at = payment_term.created_at
    
    # Verify created_at was set
    assert original_created_at is not None
    
    # Wait a tiny bit to ensure time has passed
    # (In real tests, updates happen fast enough that we need to be careful)
    
    # Update the payment term with a new unique name
    payment_term.name = f"{unique_name}_updated"
    payment_term.discount_days = discount_days + 1
    payment_term.save()
    
    # Refresh from database
    payment_term.refresh_from_db()
    
    # Verify created_at has NOT changed
    assert payment_term.created_at == original_created_at, \
        "created_at timestamp should remain immutable after updates"
    
    # Cleanup
    payment_term.delete()


# Feature: payment-terms, Property 13: Updated Timestamp Modification
@pytest.mark.django_db(transaction=True)
@settings(max_examples=100)
@given(
    discount_percentage=st.decimals(min_value=0, max_value=100, places=2),
    discount_days=st.integers(min_value=0, max_value=365),
)
def test_updated_timestamp_modification(discount_percentage, discount_days):
    """
    Property 13: Updated Timestamp Modification
    
    For any payment term, the updated_at timestamp should change automatically 
    whenever the record is modified.
    
    Validates: Requirements 7.2
    """
    # Generate a unique name for this test run
    unique_name = f"test_term_{uuid.uuid4().hex[:20]}"
    
    # Create a payment term
    payment_term = PaymentTerm.objects.create(
        name=unique_name,
        early_payment_discount=False,
        discount_percentage=discount_percentage,
        discount_days=discount_days,
    )
    
    # Capture the original updated_at timestamp
    original_updated_at = payment_term.updated_at
    
    # Verify updated_at was set
    assert original_updated_at is not None
    
    # Small delay to ensure timestamp difference
    # Django's auto_now should handle this, but we want to be explicit
    import time
    time.sleep(0.01)  # 10ms delay
    
    # Update the payment term - modify discount_days instead to avoid range issues
    payment_term.discount_days = discount_days + 1
    payment_term.save()
    
    # Refresh from database
    payment_term.refresh_from_db()
    
    # Verify updated_at HAS changed
    assert payment_term.updated_at > original_updated_at, \
        "updated_at timestamp should change after updates"
    
    # Cleanup
    payment_term.delete()
