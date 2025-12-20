from django.db import models
from django.db.models import CheckConstraint, Q
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

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
