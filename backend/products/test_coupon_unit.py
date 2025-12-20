"""
Unit tests for Coupon model.
Tests specific examples, edge cases, and model behaviors.
"""
import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from decimal import Decimal
from products.models import Coupon, DiscountOffer
from accounts.models import User
from datetime import date, timedelta


@pytest.mark.django_db
class TestCouponModel:
    """Unit tests for Coupon model creation and validation."""
    
    def test_coupon_creation_with_valid_data(self):
        """Test creating a coupon with all valid data."""
        # Create a discount offer
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Create a coupon
        coupon = Coupon.objects.create(
            code="TESTCODE123",
            expiration_date=date.today() + timedelta(days=30),
            discount_offer=offer
        )
        
        assert coupon.code == "TESTCODE123"
        assert coupon.status == 'active'  # Default status
        assert coupon.discount_offer == offer
        assert coupon.contact is None  # Nullable
        assert coupon.is_usable() is True
        
    def test_coupon_code_uniqueness_constraint(self):
        """Test that duplicate coupon codes are rejected."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Create first coupon
        Coupon.objects.create(
            code="DUPLICATE",
            expiration_date=date.today() + timedelta(days=30),
            discount_offer=offer
        )
        
        # Attempt to create second coupon with same code
        with pytest.raises(IntegrityError):
            Coupon.objects.create(
                code="DUPLICATE",
                expiration_date=date.today() + timedelta(days=30),
                discount_offer=offer
            )
    
    def test_coupon_code_format_validation_alphanumeric(self):
        """Test that coupon codes accept alphanumeric characters."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Valid alphanumeric code
        coupon = Coupon.objects.create(
            code="ABC123",
            expiration_date=date.today() + timedelta(days=30),
            discount_offer=offer
        )
        assert coupon.code == "ABC123"
    
    def test_coupon_code_format_validation_hyphens(self):
        """Test that coupon codes accept hyphens."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Valid code with hyphens
        coupon = Coupon.objects.create(
            code="TEST-CODE-123",
            expiration_date=date.today() + timedelta(days=30),
            discount_offer=offer
        )
        assert coupon.code == "TEST-CODE-123"
    
    def test_coupon_code_format_validation_underscores(self):
        """Test that coupon codes accept underscores."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Valid code with underscores
        coupon = Coupon.objects.create(
            code="TEST_CODE_123",
            expiration_date=date.today() + timedelta(days=30),
            discount_offer=offer
        )
        assert coupon.code == "TEST_CODE_123"
    
    def test_coupon_code_format_validation_invalid_characters(self):
        """Test that coupon codes reject invalid characters."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Invalid code with special characters
        with pytest.raises(ValidationError):
            Coupon.objects.create(
                code="TEST@CODE!",
                expiration_date=date.today() + timedelta(days=30),
                discount_offer=offer
            )
    
    def test_coupon_status_choices_active(self):
        """Test that 'active' is a valid status."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="ACTIVE",
            expiration_date=date.today() + timedelta(days=30),
            status='active',
            discount_offer=offer
        )
        assert coupon.status == 'active'
    
    def test_coupon_status_choices_used(self):
        """Test that 'used' is a valid status."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="USED",
            expiration_date=date.today() + timedelta(days=30),
            status='used',
            discount_offer=offer
        )
        assert coupon.status == 'used'
    
    def test_coupon_status_choices_expired(self):
        """Test that 'expired' is a valid status."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="EXPIRED",
            expiration_date=date.today() + timedelta(days=30),
            status='expired',
            discount_offer=offer
        )
        assert coupon.status == 'expired'
    
    def test_coupon_status_choices_cancelled(self):
        """Test that 'cancelled' is a valid status."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="CANCELLED",
            expiration_date=date.today() + timedelta(days=30),
            status='cancelled',
            discount_offer=offer
        )
        assert coupon.status == 'cancelled'
    
    def test_coupon_status_default_value(self):
        """Test that status defaults to 'active'."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="DEFAULT",
            expiration_date=date.today() + timedelta(days=30),
            discount_offer=offer
        )
        assert coupon.status == 'active'
    
    def test_coupon_expiration_date_validation_past(self):
        """Test that past expiration dates are rejected on creation."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Attempt to create coupon with past expiration date
        with pytest.raises(ValidationError):
            Coupon.objects.create(
                code="PASTDATE",
                expiration_date=date.today() - timedelta(days=1),
                discount_offer=offer
            )
    
    def test_coupon_expiration_date_validation_today(self):
        """Test that today's date is valid for expiration."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Today's date should be valid
        coupon = Coupon.objects.create(
            code="TODAY",
            expiration_date=date.today(),
            discount_offer=offer
        )
        assert coupon.expiration_date == date.today()
    
    def test_coupon_contact_foreign_key_nullable(self):
        """Test that contact field is nullable."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Create coupon without contact
        coupon = Coupon.objects.create(
            code="NOCONTACT",
            expiration_date=date.today() + timedelta(days=30),
            discount_offer=offer
        )
        assert coupon.contact is None
    
    def test_coupon_contact_foreign_key_with_user(self):
        """Test that contact can be assigned to a user."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # Create a user
        user = User.objects.create_user(
            email="test@example.com",
            password="testpass123"
        )
        
        # Create coupon with contact
        coupon = Coupon.objects.create(
            code="WITHCONTACT",
            expiration_date=date.today() + timedelta(days=30),
            contact=user,
            discount_offer=offer
        )
        assert coupon.contact == user
    
    def test_coupon_discount_offer_foreign_key_required(self):
        """Test that discount_offer is required."""
        # Attempt to create coupon without discount_offer
        with pytest.raises((IntegrityError, ValidationError)):
            Coupon.objects.create(
                code="NOOFFER",
                expiration_date=date.today() + timedelta(days=30)
            )
    
    def test_coupon_is_expired_method_not_expired(self):
        """Test is_expired() returns False for future expiration."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="FUTURE",
            expiration_date=date.today() + timedelta(days=30),
            discount_offer=offer
        )
        assert coupon.is_expired() is False
    
    def test_coupon_is_expired_method_expired(self):
        """Test is_expired() returns True for past expiration."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today() - timedelta(days=30),
            end_date=date.today() - timedelta(days=20)
        )
        
        # Create coupon with past expiration (bypass validation for testing)
        coupon = Coupon(
            code="PAST",
            expiration_date=date.today() - timedelta(days=1),
            discount_offer=offer
        )
        coupon.save(force_insert=True)
        
        assert coupon.is_expired() is True
    
    def test_coupon_is_usable_method_active_not_expired(self):
        """Test is_usable() returns True for active, non-expired coupon."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="USABLE",
            expiration_date=date.today() + timedelta(days=30),
            status='active',
            discount_offer=offer
        )
        assert coupon.is_usable() is True
    
    def test_coupon_is_usable_method_used(self):
        """Test is_usable() returns False for used coupon."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="USEDCOUPON",
            expiration_date=date.today() + timedelta(days=30),
            status='used',
            discount_offer=offer
        )
        assert coupon.is_usable() is False
    
    def test_coupon_is_usable_method_expired_status(self):
        """Test is_usable() returns False for expired status."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="EXPIREDSTATUS",
            expiration_date=date.today() + timedelta(days=30),
            status='expired',
            discount_offer=offer
        )
        assert coupon.is_usable() is False
    
    def test_coupon_str_method(self):
        """Test __str__ method returns the code."""
        offer = DiscountOffer.objects.create(
            name="Test Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        coupon = Coupon.objects.create(
            code="STRTEST",
            expiration_date=date.today() + timedelta(days=30),
            discount_offer=offer
        )
        assert str(coupon) == "STRTEST"
