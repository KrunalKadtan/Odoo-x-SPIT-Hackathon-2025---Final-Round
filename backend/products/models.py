from django.db import models
from django.db.models import CheckConstraint, Q
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from django.conf import settings
import datetime

class Product(models.Model):
    id = models.BigAutoField(primary_key=True)  # BigSerial is handled by BigAutoField
    product_name = models.CharField(max_length=255, db_index=True)
    product_category = models.CharField(max_length=100)
    product_type = models.CharField(max_length=50) # e.g., 'service', 'consuable', 'storable'
    material = models.CharField(max_length=100, blank=True, null=True)
    sales_price = models.DecimalField(max_digits=10, decimal_places=2)
    sales_tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2)
    purchase_tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    current_stock = models.IntegerField(default=0)
    published = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            CheckConstraint(check=Q(current_stock__gte=0), name='check_current_stock_non_negative')
        ]

    def __str__(self):
        return self.product_name

class ProductColor(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='colors')
    color = models.CharField(max_length=50)

    class Meta:
        indexes = [
            models.Index(fields=['product', 'color']),
        ]
        unique_together = ('product', 'color')

    def __str__(self):
        return f"{self.product.product_name} - {self.color}"


class PaymentTerm(models.Model):
    """
    Payment term configuration with early payment discount support.
    Defines payment conditions including discount rules and calculation methods.
    """
    
    # Computation method choices
    COMPUTATION_CHOICES = [
        ('percentage_of_total', 'Percentage of Total Amount'),
        ('fixed_amount', 'Fixed Amount Discount'),
    ]
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Core fields
    name = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Unique name for the payment term"
    )
    
    # Early payment discount configuration
    early_payment_discount = models.BooleanField(
        default=False,
        help_text="Whether this term offers early payment discounts"
    )
    
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        validators=[
            MinValueValidator(0.00),
            MaxValueValidator(100.00)
        ],
        help_text="Discount percentage (0-100)"
    )
    
    discount_days = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        help_text="Number of days to qualify for early payment discount"
    )
    
    early_pay_discount_computation = models.CharField(
        max_length=50,
        choices=COMPUTATION_CHOICES,
        blank=True,
        null=True,
        help_text="Method to calculate early payment discount"
    )
    
    # Preview and documentation
    example_preview = models.TextField(
        blank=True,
        null=True,
        help_text="Example showing how this payment term works"
    )
    
    # Default term flag
    is_default = models.BooleanField(
        default=False,
        help_text="Whether this is the default payment term"
    )
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_terms'
        verbose_name = 'Payment Term'
        verbose_name_plural = 'Payment Terms'
        ordering = ['name']
        constraints = [
            models.CheckConstraint(
                check=Q(discount_percentage__gte=0) & Q(discount_percentage__lte=100),
                name='valid_discount_percentage'
            ),
            models.CheckConstraint(
                check=Q(discount_days__gte=0),
                name='valid_discount_days'
            ),
        ]
        indexes = [
            models.Index(fields=['name'], name='payment_term_name_idx'),
            models.Index(fields=['is_default'], name='payment_term_default_idx'),
        ]
    
    def clean(self):
        """
        Validate model-level business rules.
        """
        super().clean()
        
        # Validate early payment discount logic
        if self.early_payment_discount:
            if self.discount_percentage <= 0:
                raise ValidationError({
                    'discount_percentage': 'Discount percentage must be greater than 0 when early payment discount is enabled.'
                })
            if self.discount_days is None or self.discount_days < 0:
                raise ValidationError({
                    'discount_days': 'Discount days must be specified when early payment discount is enabled.'
                })
            if not self.early_pay_discount_computation:
                raise ValidationError({
                    'early_pay_discount_computation': 'Computation method must be specified when early payment discount is enabled.'
                })
    
    def save(self, *args, **kwargs):
        """
        Override save to handle default term logic.
        """
        # Run model validation
        self.full_clean()
        
        # Handle default term logic
        if self.is_default:
            # Set all other terms to non-default
            PaymentTerm.objects.filter(is_default=True).exclude(pk=self.pk).update(is_default=False)
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """
        Override delete to prevent deletion of default term.
        """
        if self.is_default:
            raise ValidationError("Cannot delete the default payment term.")
        super().delete(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    def get_discount_description(self):
        """
        Return a human-readable description of the discount terms.
        """
        if not self.early_payment_discount:
            return "No early payment discount"
        
        return f"{self.discount_percentage}% discount if paid within {self.discount_days} days"


class DiscountOffer(models.Model):
    """
    Time-bound discount campaign with percentage discount and availability schedule.
    """
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Offer details
    name = models.CharField(
        max_length=255,
        unique=True,
        db_index=True,
        help_text="Unique name for the discount offer"
    )
    
    discount_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[
            MinValueValidator(0.00),
            MaxValueValidator(100.00)
        ],
        help_text="Discount percentage (0-100)"
    )
    
    # Date range
    start_date = models.DateField(
        db_index=True,
        help_text="Campaign start date"
    )
    
    end_date = models.DateField(
        db_index=True,
        help_text="Campaign end date"
    )
    
    # Availability
    available_on = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Comma-separated days: Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'discount_offers'
        verbose_name = 'Discount Offer'
        verbose_name_plural = 'Discount Offers'
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                check=Q(discount_percentage__gte=0) & Q(discount_percentage__lte=100),
                name='valid_discount_offer_percentage'
            ),
            models.CheckConstraint(
                check=Q(start_date__lte=models.F('end_date')),
                name='valid_discount_date_range'
            )
        ]
        indexes = [
            models.Index(fields=['name'], name='discount_offer_name_idx'),
            models.Index(fields=['start_date'], name='discount_offer_start_idx'),
            models.Index(fields=['end_date'], name='discount_offer_end_idx'),
        ]
    
    def clean(self):
        """Validate model fields before saving."""
        super().clean()
        
        # Validate date range
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError({
                'end_date': 'End date must be greater than or equal to start date.'
            })
        
        # Validate available_on format
        if self.available_on:
            valid_days = {'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'}
            days = [day.strip().title() for day in self.available_on.split(',')]
            invalid_days = set(days) - valid_days
            if invalid_days:
                raise ValidationError({
                    'available_on': f'Invalid day names: {", ".join(invalid_days)}'
                })
            # Normalize to title case
            self.available_on = ','.join(days)
    
    def save(self, *args, **kwargs):
        """Override save to call clean()."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    def is_active_on_date(self, check_date):
        """Check if offer is active on a specific date."""
        return self.start_date <= check_date <= self.end_date
    
    def is_available_on_day(self, day_name):
        """Check if offer is available on a specific day of the week."""
        if not self.available_on:
            return True  # Available all days if not specified
        available_days = [day.strip() for day in self.available_on.split(',')]
        return day_name in available_days


class Coupon(models.Model):
    """
    Individual discount code linked to a DiscountOffer.
    Can be assigned to specific contacts or available to all.
    """
    
    # Status choices
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('used', 'Used'),
        ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Validators
    code_validator = RegexValidator(
        regex=r'^[A-Za-z0-9_-]+$',
        message="Code must contain only alphanumeric characters, hyphens, and underscores."
    )
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Coupon details
    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        validators=[code_validator],
        help_text="Unique coupon code"
    )
    
    expiration_date = models.DateField(
        db_index=True,
        help_text="Date when coupon expires"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True,
        help_text="Current status of the coupon"
    )
    
    # Relationships
    contact = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='coupons',
        db_index=True,
        help_text="Optional: Assign coupon to specific contact"
    )
    
    discount_offer = models.ForeignKey(
        DiscountOffer,
        on_delete=models.PROTECT,
        related_name='coupons',
        db_index=True,
        help_text="Linked discount offer"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'coupons'
        verbose_name = 'Coupon'
        verbose_name_plural = 'Coupons'
        ordering = ['-created_at']
        constraints = [
            models.CheckConstraint(
                check=Q(status__in=['active', 'used', 'expired', 'cancelled']),
                name='valid_coupon_status'
            )
        ]
        indexes = [
            models.Index(fields=['code'], name='coupon_code_idx'),
            models.Index(fields=['status'], name='coupon_status_idx'),
            models.Index(fields=['expiration_date'], name='coupon_expiration_idx'),
            models.Index(fields=['contact'], name='coupon_contact_idx'),
            models.Index(fields=['discount_offer'], name='coupon_offer_idx'),
        ]
    
    def clean(self):
        """Validate model fields before saving."""
        super().clean()
        
        # Validate expiration date is not in the past (only on creation)
        if not self.pk and self.expiration_date < datetime.date.today():
            raise ValidationError({
                'expiration_date': 'Expiration date cannot be in the past.'
            })
    
    def save(self, *args, **kwargs):
        """Override save to call clean()."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.code
    
    def is_expired(self):
        """Check if coupon has expired."""
        return datetime.date.today() > self.expiration_date
    
    def is_usable(self):
        """Check if coupon can be used (active and not expired)."""
        return self.status == 'active' and not self.is_expired()
