from django.db import models
from django.db.models import CheckConstraint, Q
from django.core.validators import MinValueValidator, MaxValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from django.conf import settings
import datetime
from decimal import Decimal


def get_default_due_date():
    """Return default due date (30 days from today)"""
    return datetime.date.today() + datetime.timedelta(days=30)


class Cart(models.Model):
    """
    Shopping cart for users to store items before checkout.
    """
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart',
        help_text="User who owns this cart"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'carts'
        verbose_name = 'Cart'
        verbose_name_plural = 'Carts'
    
    def __str__(self):
        return f"Cart for {self.user.email}"
    
    def get_total(self):
        """Calculate total cart value."""
        return sum(item.get_total() for item in self.items.all())
    
    def get_item_count(self):
        """Get total number of items in cart."""
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    """
    Individual items in a shopping cart.
    """
    id = models.BigAutoField(primary_key=True)
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name='items',
        help_text="Cart this item belongs to"
    )
    product = models.ForeignKey(
        'Product',
        on_delete=models.CASCADE,
        help_text="Product in the cart"
    )
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Quantity of the product"
    )
    added_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'cart_items'
        verbose_name = 'Cart Item'
        verbose_name_plural = 'Cart Items'
        unique_together = ('cart', 'product')
        indexes = [
            models.Index(fields=['cart'], name='cart_item_cart_idx'),
            models.Index(fields=['product'], name='cart_item_product_idx'),
        ]
    
    def __str__(self):
        return f"{self.product.product_name} x {self.quantity}"
    
    def get_total(self):
        """Calculate total price for this cart item."""
        return self.product.sales_price * self.quantity

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
                    'discount_percentage': 
                        'Discount percentage must be greater than 0 when early payment discount is enabled.'
                })
            if self.discount_days is None or self.discount_days < 0:
                raise ValidationError({
                    'discount_days': 'Discount days must be specified when early payment discount is enabled.'
                })
            if not self.early_pay_discount_computation:
                raise ValidationError({
                    'early_pay_discount_computation': 
                        'Computation method must be specified when early payment discount is enabled.'
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


class SaleOrder(models.Model):
    """
    Sales order header containing customer information and order totals.
    All monetary calculations are performed server-side.
    """
    
    # Status choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Customer relationship
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='orders',
        db_index=True,
        help_text="Customer who placed the order (must be portal user)"
    )
    
    # Order details
    order_date = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Date and time when order was created"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,
        help_text="Current status of the order"
    )
    
    # Monetary fields (calculated server-side)
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Sum of all line item totals"
    )
    
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Discount amount from applied coupon"
    )
    
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Final total after discount"
    )
    
    # Coupon relationship
    applied_coupon = models.ForeignKey(
        'Coupon',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        help_text="Coupon applied to this order"
    )
    
    # Payment term relationship
    payment_term = models.ForeignKey(
        'PaymentTerm',
        on_delete=models.PROTECT,
        related_name='orders',
        help_text="Payment terms for this order"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'sale_orders'
        verbose_name = 'Sale Order'
        verbose_name_plural = 'Sale Orders'
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['customer'], name='sale_order_customer_idx'),
            models.Index(fields=['order_date'], name='sale_order_date_idx'),
            models.Index(fields=['status'], name='sale_order_status_idx'),
        ]
    
    def clean(self):
        """Validate model fields before saving."""
        super().clean()
        
        # Validate customer is a portal user
        if self.customer and self.customer.role != 'portal':
            raise ValidationError({
                'customer': 'Customer must be a portal user, not internal staff.'
            })
    
    def save(self, *args, **kwargs):
        """Override save to call clean()."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Order #{self.id} - {self.customer.email}"
    
    def can_transition_to(self, new_status):
        """
        Check if status transition is valid.
        Valid transitions:
        - draft -> confirmed
        - draft -> cancelled
        - confirmed -> cancelled
        """
        valid_transitions = {
            'draft': ['confirmed', 'cancelled'],
            'confirmed': ['cancelled'],
            'cancelled': [],  # Terminal state
        }
        return new_status in valid_transitions.get(self.status, [])
    
    def confirm(self):
        """Transition order to confirmed status."""
        if not self.can_transition_to('confirmed'):
            raise ValidationError(f"Cannot confirm order in {self.status} status")
        self.status = 'confirmed'
        self.save()
    
    def cancel(self):
        """Transition order to cancelled status."""
        if not self.can_transition_to('cancelled'):
            raise ValidationError(f"Cannot cancel order in {self.status} status")
        self.status = 'cancelled'
        self.save()


class SaleOrderLine(models.Model):
    """
    Individual line item within a sales order.
    Represents a product, quantity, and calculated totals.
    """
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Order relationship (CASCADE delete)
    order = models.ForeignKey(
        SaleOrder,
        on_delete=models.CASCADE,
        related_name='lines',
        db_index=True,
        help_text="Parent sale order"
    )
    
    # Product relationship (PROTECT delete)
    product = models.ForeignKey(
        'Product',
        on_delete=models.PROTECT,
        related_name='order_lines',
        db_index=True,
        help_text="Product being ordered"
    )
    
    # Quantity
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Quantity ordered (must be positive)"
    )
    
    # Pricing (captured at order time)
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Unit price at time of order (from Product.sales_price)"
    )
    
    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Line total (quantity * unit_price)"
    )
    
    class Meta:
        db_table = 'sale_order_lines'
        verbose_name = 'Sale Order Line'
        verbose_name_plural = 'Sale Order Lines'
        ordering = ['id']
        constraints = [
            models.CheckConstraint(
                check=models.Q(quantity__gt=0),
                name='valid_line_quantity'
            )
        ]
        indexes = [
            models.Index(fields=['order'], name='sale_line_order_idx'),
            models.Index(fields=['product'], name='sale_line_product_idx'),
        ]
    
    def __str__(self):
        return f"Order #{self.order.id} - {self.product.product_name} x {self.quantity}"
    
    def calculate_line_total(self):
        """Calculate line total from quantity and unit price."""
        return Decimal(str(self.quantity)) * self.unit_price


class CustomerInvoice(models.Model):
    """
    Customer invoice generated from a confirmed sales order.
    Supports confirmation with stock deduction and row-level locking.
    """
    
    # Status choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Order relationship
    order = models.ForeignKey(
        SaleOrder,
        on_delete=models.PROTECT,
        related_name='invoices',
        help_text="Source sale order for this invoice"
    )
    
    # Invoice details
    invoice_date = models.DateField(
        auto_now_add=True,
        db_index=True,
        help_text="Date when invoice was created"
    )
    
    due_date = models.DateField(
        help_text="Payment due date"
    )
    
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Total invoice amount (copied from order)"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,
        help_text="Current status of the invoice"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customer_invoices'
        verbose_name = 'Customer Invoice'
        verbose_name_plural = 'Customer Invoices'
        ordering = ['-invoice_date']
        indexes = [
            models.Index(fields=['invoice_date'], name='invoice_date_idx'),
            models.Index(fields=['status'], name='invoice_status_idx'),
        ]
    
    def clean(self):
        """Validate model fields before saving."""
        super().clean()
        
        # Validate due_date is after invoice_date
        if self.due_date and self.invoice_date:
            if self.due_date <= self.invoice_date:
                raise ValidationError({
                    'due_date': 'Due date must be after invoice date.'
                })
    
    def save(self, *args, **kwargs):
        """Override save to call clean()."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Invoice #{self.id} - Order #{self.order.id}"
    
    def can_transition_to(self, new_status):
        """
        Check if status transition is valid.
        Valid transitions:
        - draft -> confirmed
        - draft -> cancelled
        """
        valid_transitions = {
            'draft': ['confirmed', 'cancelled'],
            'confirmed': [],  # Terminal state
            'cancelled': [],  # Terminal state
        }
        return new_status in valid_transitions.get(self.status, [])


class Payment(models.Model):
    """
    Payment record for customer invoices or vendor bills.
    Supports multiple payment methods including Razorpay integration.
    """
    
    # Payment method choices
    METHOD_CHOICES = [
        ('razorpay', 'Razorpay'),
        ('cash', 'Cash'),
        ('bank_transfer', 'Bank Transfer'),
        ('cheque', 'Cheque'),
    ]
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Payment details
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        help_text="Payment amount (must be positive)"
    )
    
    payment_date = models.DateTimeField(
        db_index=True,
        help_text="Date and time when payment was made"
    )
    
    method = models.CharField(
        max_length=20,
        choices=METHOD_CHOICES,
        default='razorpay',
        help_text="Payment method used"
    )
    
    # Foreign keys (exactly one must be non-null)
    customer_invoice = models.ForeignKey(
        'CustomerInvoice',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='payments',
        help_text="Customer invoice this payment is for"
    )
    
    vendor_bill = models.ForeignKey(
        'VendorBill',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='payments',
        help_text="Vendor bill this payment is for"
    )
    
    # Razorpay fields
    razorpay_order_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Razorpay order ID"
    )
    
    razorpay_payment_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        unique=True,
        db_index=True,
        help_text="Razorpay payment ID"
    )
    
    razorpay_signature = models.CharField(
        max_length=512,
        null=True,
        blank=True,
        help_text="Razorpay signature for verification"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['payment_date'], name='payment_date_idx'),
            models.Index(fields=['razorpay_payment_id'], name='razorpay_payment_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(customer_invoice__isnull=False, vendor_bill__isnull=True) |
                    models.Q(customer_invoice__isnull=True, vendor_bill__isnull=False)
                ),
                name='payment_exactly_one_fk'
            ),
        ]
    
    def clean(self):
        """Validate model fields before saving."""
        super().clean()
        
        # Validate exactly one FK is set
        if not self.customer_invoice and not self.vendor_bill:
            raise ValidationError(
                "Payment must be linked to either a customer invoice or vendor bill."
            )
        
        if self.customer_invoice and self.vendor_bill:
            raise ValidationError(
                "Payment cannot be linked to both customer invoice and vendor bill."
            )
        
        # Validate Razorpay fields when method is razorpay
        if self.method == 'razorpay' and not self.razorpay_order_id:
            raise ValidationError({
                'razorpay_order_id': 'Razorpay order ID is required for Razorpay payments.'
            })
    
    def save(self, *args, **kwargs):
        """Override save to call clean()."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        target = self.customer_invoice or self.vendor_bill
        target_type = "Invoice" if self.customer_invoice else "Bill"
        return f"Payment #{self.id} - {target_type} #{target.id} - {self.amount}"


class PurchaseOrder(models.Model):
    """
    Purchase order for ordering products from vendors.
    Tracks vendor, order details, and status.
    """
    
    # Status choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Vendor relationship (Contact with type vendor or both)
    vendor = models.ForeignKey(
        'accounts.Contact',
        on_delete=models.PROTECT,
        related_name='purchase_orders',
        db_index=True,
        help_text="Vendor contact for this purchase order"
    )
    
    # Order details
    order_date = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Date and time when purchase order was created"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,
        help_text="Current status of the purchase order"
    )
    
    # Monetary fields (calculated server-side)
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Sum of all line item totals"
    )
    
    tax_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Total tax amount"
    )
    
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Final total including tax"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'purchase_orders'
        verbose_name = 'Purchase Order'
        verbose_name_plural = 'Purchase Orders'
        ordering = ['-order_date']
        indexes = [
            models.Index(fields=['vendor'], name='purchase_order_vendor_idx'),
            models.Index(fields=['order_date'], name='purchase_order_date_idx'),
            models.Index(fields=['status'], name='purchase_order_status_idx'),
        ]
    
    def clean(self):
        """Validate model fields before saving."""
        super().clean()
        
        # Validate vendor is a vendor or both type contact
        if self.vendor and self.vendor.type not in ['vendor', 'both']:
            raise ValidationError({
                'vendor': 'Contact must be a vendor or both type.'
            })
    
    def save(self, *args, **kwargs):
        """Override save to call clean()."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"PO #{self.id} - {self.vendor.name}"
    
    def can_transition_to(self, new_status):
        """
        Check if status transition is valid.
        Valid transitions:
        - draft -> confirmed
        - draft -> cancelled
        - confirmed -> cancelled
        """
        valid_transitions = {
            'draft': ['confirmed', 'cancelled'],
            'confirmed': ['cancelled'],
            'cancelled': [],  # Terminal state
        }
        return new_status in valid_transitions.get(self.status, [])
    
    def confirm(self):
        """Transition purchase order to confirmed status."""
        if not self.can_transition_to('confirmed'):
            raise ValidationError(f"Cannot confirm purchase order in {self.status} status")
        self.status = 'confirmed'
        self.save()
    
    def cancel(self):
        """Transition purchase order to cancelled status."""
        if not self.can_transition_to('cancelled'):
            raise ValidationError(f"Cannot cancel purchase order in {self.status} status")
        self.status = 'cancelled'
        self.save()


class PurchaseOrderLine(models.Model):
    """
    Individual line item within a purchase order.
    Represents a product, quantity, and calculated totals.
    """
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Purchase order relationship (CASCADE delete)
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.CASCADE,
        related_name='lines',
        db_index=True,
        help_text="Parent purchase order"
    )
    
    # Product relationship (PROTECT delete)
    product = models.ForeignKey(
        'Product',
        on_delete=models.PROTECT,
        related_name='purchase_order_lines',
        db_index=True,
        help_text="Product being ordered"
    )
    
    # Quantity
    quantity = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Quantity ordered (must be positive)"
    )
    
    # Pricing (captured at order time)
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Unit price at time of order (from Product.purchase_price)"
    )
    
    tax_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="Tax percentage for this line"
    )
    
    line_subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Line subtotal (quantity * unit_price)"
    )
    
    line_tax = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        help_text="Tax amount for this line"
    )
    
    line_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Line total (subtotal + tax)"
    )
    
    class Meta:
        db_table = 'purchase_order_lines'
        verbose_name = 'Purchase Order Line'
        verbose_name_plural = 'Purchase Order Lines'
        ordering = ['id']
        constraints = [
            models.CheckConstraint(
                check=models.Q(quantity__gt=0),
                name='valid_purchase_line_quantity'
            )
        ]
        indexes = [
            models.Index(fields=['purchase_order'], name='purchase_line_order_idx'),
            models.Index(fields=['product'], name='purchase_line_product_idx'),
        ]
    
    def __str__(self):
        return f"PO #{self.purchase_order.id} - {self.product.product_name} x {self.quantity}"
    
    def calculate_line_totals(self):
        """Calculate line subtotal, tax, and total from quantity and unit price."""
        self.line_subtotal = Decimal(str(self.quantity)) * self.unit_price
        self.line_tax = (self.line_subtotal * self.tax_percentage) / Decimal('100')
        self.line_total = self.line_subtotal + self.line_tax


class VendorBill(models.Model):
    """
    Vendor bill generated from a confirmed purchase order.
    Supports confirmation with stock update.
    """
    
    # Status choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Purchase order relationship
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        on_delete=models.PROTECT,
        related_name='vendor_bills',
        db_index=True,
        help_text="Source purchase order for this bill"
    )
    
    # Vendor relationship (denormalized for quick access)
    vendor = models.ForeignKey(
        'accounts.Contact',
        on_delete=models.PROTECT,
        related_name='vendor_bills',
        db_index=True,
        help_text="Vendor for this bill"
    )
    
    # Bill details
    bill_date = models.DateField(
        default=datetime.date.today,
        db_index=True,
        help_text="Date when bill was created"
    )
    
    due_date = models.DateField(
        default=get_default_due_date,
        help_text="Payment due date"
    )
    
    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Total bill amount (copied from purchase order)"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,
        help_text="Current status of the bill"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vendor_bills'
        verbose_name = 'Vendor Bill'
        verbose_name_plural = 'Vendor Bills'
        ordering = ['-bill_date']
        indexes = [
            models.Index(fields=['vendor'], name='vendor_bill_vendor_idx'),
            models.Index(fields=['bill_date'], name='vendor_bill_date_idx'),
            models.Index(fields=['status'], name='vendor_bill_status_idx'),
        ]
    
    def clean(self):
        """Validate model fields before saving."""
        super().clean()
        
        # Validate due_date is after bill_date
        if self.due_date and self.bill_date:
            if self.due_date <= self.bill_date:
                raise ValidationError({
                    'due_date': 'Due date must be after bill date.'
                })
        
        # Validate vendor matches purchase order vendor
        if self.purchase_order and self.vendor:
            if self.vendor != self.purchase_order.vendor:
                raise ValidationError({
                    'vendor': 'Vendor must match purchase order vendor.'
                })
    
    def save(self, *args, **kwargs):
        """Override save to call clean()."""
        self.full_clean()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Vendor Bill #{self.id} - PO #{self.purchase_order.id}"
    
    def can_transition_to(self, new_status):
        """
        Check if status transition is valid.
        Valid transitions:
        - draft -> confirmed
        - draft -> cancelled
        """
        valid_transitions = {
            'draft': ['confirmed', 'cancelled'],
            'confirmed': [],  # Terminal state
            'cancelled': [],  # Terminal state
        }
        return new_status in valid_transitions.get(self.status, [])


class SystemSettings(models.Model):
    """
    Singleton model for system-wide settings.
    Only one row is allowed in the database, enforced by CHECK constraint.
    """
    
    # Primary key (always 1 for singleton)
    id = models.IntegerField(
        primary_key=True,
        default=1,
        help_text="Always 1 for singleton pattern"
    )
    
    # Settings fields
    automatic_invoicing = models.BooleanField(
        default=False,
        help_text="Enable automatic invoice generation from confirmed orders"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Settings'
        verbose_name_plural = 'System Settings'
        constraints = [
            models.CheckConstraint(
                check=models.Q(id=1),
                name='system_settings_singleton'
            ),
        ]
    
    def save(self, *args, **kwargs):
        """Override save to enforce singleton pattern."""
        # Always use id=1
        self.id = 1
        self.pk = 1
        
        # If record exists, mark this as an update not an insert
        if SystemSettings.objects.filter(id=1).exists():
            self._state.adding = False
            # Don't update created_at on existing records
            if 'update_fields' not in kwargs:
                # Get all fields except id and created_at
                update_fields = [f.name for f in self._meta.fields 
                               if f.name not in ['id', 'created_at']]
                kwargs['update_fields'] = update_fields
        
        super().save(*args, **kwargs)
    
    def delete(self, *args, **kwargs):
        """Prevent deletion of singleton instance."""
        raise ValidationError("Cannot delete system settings. Modify the existing record instead.")
    
    @classmethod
    def load(cls):
        """
        Load the singleton instance, creating it if it doesn't exist.
        
        Returns:
            SystemSettings: The singleton instance
        """
        obj, created = cls.objects.get_or_create(id=1)
        return obj
    
    def __str__(self):
        return "System Settings"
