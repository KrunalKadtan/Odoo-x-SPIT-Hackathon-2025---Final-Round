"""
Unit tests for DiscountOffer model.
Tests specific examples, edge cases, and model methods.
"""
import pytest
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from decimal import Decimal
from products.models import DiscountOffer
from datetime import date, timedelta


@pytest.mark.django_db
class TestDiscountOfferModel:
    """Unit tests for DiscountOffer model creation and validation."""
    
    def test_create_discount_offer_with_valid_data(self):
        """Test creating a discount offer with all valid data."""
        offer = DiscountOffer.objects.create(
            name="Summer Sale 2024",
            discount_percentage=Decimal('25.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            available_on="Monday,Wednesday,Friday"
        )
        
        assert offer.id is not None
        assert offer.name == "Summer Sale 2024"
        assert offer.discount_percentage == Decimal('25.00')
        assert offer.available_on == "Monday,Wednesday,Friday"
        assert offer.created_at is not None
        assert offer.updated_at is not None
    
    def test_name_uniqueness_constraint(self):
        """Test that duplicate names are rejected."""
        DiscountOffer.objects.create(
            name="Unique Offer",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        # The model's save() calls full_clean() which raises ValidationError
        # before the database IntegrityError is hit
        with pytest.raises((IntegrityError, ValidationError)):
            DiscountOffer.objects.create(
                name="Unique Offer",
                discount_percentage=Decimal('20.00'),
                start_date=date.today(),
                end_date=date.today() + timedelta(days=14)
            )
    
    def test_discount_percentage_zero(self):
        """Test that 0% discount is allowed."""
        offer = DiscountOffer.objects.create(
            name="Zero Discount",
            discount_percentage=Decimal('0.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        assert offer.discount_percentage == Decimal('0.00')
    
    def test_discount_percentage_hundred(self):
        """Test that 100% discount is allowed."""
        offer = DiscountOffer.objects.create(
            name="Full Discount",
            discount_percentage=Decimal('100.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        assert offer.discount_percentage == Decimal('100.00')
    
    def test_discount_percentage_negative(self):
        """Test that negative discount is rejected."""
        with pytest.raises((IntegrityError, ValidationError)):
            DiscountOffer.objects.create(
                name="Negative Discount",
                discount_percentage=Decimal('-10.00'),
                start_date=date.today(),
                end_date=date.today() + timedelta(days=7)
            )
    
    def test_discount_percentage_over_hundred(self):
        """Test that discount over 100% is rejected."""
        with pytest.raises((IntegrityError, ValidationError)):
            DiscountOffer.objects.create(
                name="Over Hundred",
                discount_percentage=Decimal('150.00'),
                start_date=date.today(),
                end_date=date.today() + timedelta(days=7)
            )
    
    def test_date_range_validation_start_after_end(self):
        """Test that start_date after end_date is rejected."""
        with pytest.raises(ValidationError):
            DiscountOffer.objects.create(
                name="Invalid Date Range",
                discount_percentage=Decimal('10.00'),
                start_date=date.today() + timedelta(days=7),
                end_date=date.today()
            )
    
    def test_date_range_validation_equal_dates(self):
        """Test that equal start and end dates are allowed (single-day campaign)."""
        campaign_date = date.today()
        offer = DiscountOffer.objects.create(
            name="Single Day Sale",
            discount_percentage=Decimal('15.00'),
            start_date=campaign_date,
            end_date=campaign_date
        )
        
        assert offer.start_date == offer.end_date
    
    def test_available_on_normalization(self):
        """Test that day names are normalized to title case."""
        offer = DiscountOffer.objects.create(
            name="Normalized Days",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            available_on="monday,TUESDAY,WeDnEsDay"
        )
        
        assert offer.available_on == "Monday,Tuesday,Wednesday"
    
    def test_available_on_invalid_day_names(self):
        """Test that invalid day names are rejected."""
        with pytest.raises(ValidationError):
            DiscountOffer.objects.create(
                name="Invalid Days",
                discount_percentage=Decimal('10.00'),
                start_date=date.today(),
                end_date=date.today() + timedelta(days=7),
                available_on="Monday,InvalidDay,Friday"
            )
    
    def test_available_on_null(self):
        """Test that null available_on means always available."""
        offer = DiscountOffer.objects.create(
            name="Always Available",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            available_on=None
        )
        
        assert offer.available_on is None


@pytest.mark.django_db
class TestDiscountOfferMethods:
    """Unit tests for DiscountOffer model methods."""
    
    def test_is_active_on_date_within_range(self):
        """Test is_active_on_date returns True for dates within range."""
        start_date = date(2024, 1, 1)
        end_date = date(2024, 1, 31)
        
        offer = DiscountOffer.objects.create(
            name="January Sale",
            discount_percentage=Decimal('20.00'),
            start_date=start_date,
            end_date=end_date
        )
        
        assert offer.is_active_on_date(date(2024, 1, 15)) is True
        assert offer.is_active_on_date(date(2024, 1, 1)) is True
        assert offer.is_active_on_date(date(2024, 1, 31)) is True
    
    def test_is_active_on_date_outside_range(self):
        """Test is_active_on_date returns False for dates outside range."""
        start_date = date(2024, 1, 1)
        end_date = date(2024, 1, 31)
        
        offer = DiscountOffer.objects.create(
            name="January Sale",
            discount_percentage=Decimal('20.00'),
            start_date=start_date,
            end_date=end_date
        )
        
        assert offer.is_active_on_date(date(2023, 12, 31)) is False
        assert offer.is_active_on_date(date(2024, 2, 1)) is False
    
    def test_is_available_on_day_with_specific_days(self):
        """Test is_available_on_day with specific days configured."""
        offer = DiscountOffer.objects.create(
            name="Weekday Sale",
            discount_percentage=Decimal('15.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            available_on="Monday,Wednesday,Friday"
        )
        
        assert offer.is_available_on_day("Monday") is True
        assert offer.is_available_on_day("Wednesday") is True
        assert offer.is_available_on_day("Friday") is True
        assert offer.is_available_on_day("Tuesday") is False
        assert offer.is_available_on_day("Saturday") is False
    
    def test_is_available_on_day_always_available(self):
        """Test is_available_on_day returns True when available_on is null."""
        offer = DiscountOffer.objects.create(
            name="Everyday Sale",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7),
            available_on=None
        )
        
        assert offer.is_available_on_day("Monday") is True
        assert offer.is_available_on_day("Tuesday") is True
        assert offer.is_available_on_day("Sunday") is True
    
    def test_str_method(self):
        """Test __str__ method returns the name."""
        offer = DiscountOffer.objects.create(
            name="Test Offer Name",
            discount_percentage=Decimal('10.00'),
            start_date=date.today(),
            end_date=date.today() + timedelta(days=7)
        )
        
        assert str(offer) == "Test Offer Name"
