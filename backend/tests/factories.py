"""
Test factories for ApparelDesk models using factory_boy.
Provides reusable factories for generating valid test data.
"""
import factory
from factory.django import DjangoModelFactory
from faker import Faker
from decimal import Decimal
import datetime
from accounts.models import User, Contact
from products.models import (
    PaymentTerm, Product, DiscountOffer, Coupon, 
    SaleOrder, SaleOrderLine, CustomerInvoice, Payment, VendorBill, PurchaseOrder
)


fake = Faker()


class UserFactory(DjangoModelFactory):
    """
    Factory for creating User instances with valid test data.
    
    Usage:
        # Create a portal user with default values
        user = UserFactory()
        
        # Create a user with specific values
        user = UserFactory(email='custom@example.com', name='Custom Name')
        
        # Create an internal user using trait
        internal_user = UserFactory.internal()
        
        # Create a portal user using trait
        portal_user = UserFactory.portal()
        
        # Create multiple users
        users = UserFactory.create_batch(5)
    """
    
    class Meta:
        model = User
        django_get_or_create = ('email',)
        skip_postgeneration_save = True
    
    # Identity fields
    name = factory.Faker('name')
    email = factory.Faker('email')
    password = factory.PostGenerationMethodCall('set_password', 'testpass123')
    
    # Role field (default to portal)
    role = 'portal'
    
    # Contact fields (optional)
    mobile = factory.LazyFunction(lambda: fake.numerify(text='+##########'))
    
    # Location fields (optional)
    city = factory.Faker('city')
    state = factory.Faker('state')
    pincode = factory.LazyFunction(lambda: fake.numerify(text='######'))
    
    # Django admin fields
    is_active = True
    is_staff = False
    is_superuser = False
    
    class Params:
        """
        Traits for creating specific user types.
        """
        # Trait for internal staff users
        internal = factory.Trait(
            role='internal',
            is_staff=True,
            is_superuser=False,
        )
        
        # Trait for portal users (default, but explicit)
        portal = factory.Trait(
            role='portal',
            is_staff=False,
            is_superuser=False,
        )
        
        # Trait for superuser
        superuser = factory.Trait(
            role='internal',
            is_staff=True,
            is_superuser=True,
        )
        
        # Trait for inactive users
        inactive = factory.Trait(
            is_active=False,
        )
        
        # Trait for users without optional fields
        minimal = factory.Trait(
            mobile=None,
            city=None,
            state=None,
            pincode=None,
        )


class ContactFactory(DjangoModelFactory):
    """
    Factory for creating Contact instances with valid test data.
    
    Usage:
        # Create a customer contact
        contact = ContactFactory()
        
        # Create a vendor contact using trait
        vendor = ContactFactory.vendor()
        
        # Create a contact with portal access
        contact_with_user = ContactFactory(user=UserFactory())
        
        # Create multiple contacts
        contacts = ContactFactory.create_batch(5)
    """
    
    class Meta:
        model = Contact
        django_get_or_create = ('email',)
    
    # Identity fields
    name = factory.Faker('company')
    type = 'customer'
    email = factory.Faker('company_email')
    mobile = factory.LazyFunction(lambda: fake.numerify(text='+##########'))
    
    # Location fields (optional)
    city = factory.Faker('city')
    state = factory.Faker('state')
    pincode = factory.LazyFunction(lambda: fake.numerify(text='######'))
    
    # User relationship (optional)
    user = None
    
    class Params:
        """
        Traits for creating specific contact types.
        """
        # Trait for customer contacts
        customer = factory.Trait(
            type='customer',
        )
        
        # Trait for vendor contacts
        vendor = factory.Trait(
            type='vendor',
        )
        
        # Trait for contacts that are both customer and vendor
        both = factory.Trait(
            type='both',
        )
        
        # Trait for contacts with portal access
        with_portal = factory.Trait(
            user=factory.SubFactory(UserFactory, role='portal'),
        )
        
        # Trait for contacts without optional fields
        minimal = factory.Trait(
            mobile=None,
            city=None,
            state=None,
            pincode=None,
        )



class PaymentTermFactory(DjangoModelFactory):
    """
    Factory for creating PaymentTerm instances with valid test data.
    
    Usage:
        # Create a basic payment term without discount
        term = PaymentTermFactory()
        
        # Create a payment term with specific values
        term = PaymentTermFactory(name='Net 30', discount_days=30)
        
        # Create a payment term with early payment discount using trait
        discount_term = PaymentTermFactory.with_discount()
        
        # Create a payment term without discount using trait
        no_discount_term = PaymentTermFactory.no_discount()
        
        # Create the default payment term using trait
        default_term = PaymentTermFactory.default_term()
        
        # Create multiple payment terms
        terms = PaymentTermFactory.create_batch(5)
    """
    
    class Meta:
        model = PaymentTerm
        django_get_or_create = ('name',)
    
    # Core fields
    name = factory.Sequence(lambda n: f'Payment Term {n}')
    
    # Early payment discount configuration (default: no discount)
    early_payment_discount = False
    discount_percentage = 0.00
    discount_days = 0
    early_pay_discount_computation = None
    
    # Preview and documentation
    example_preview = factory.LazyAttribute(
        lambda obj: f'Payment term: {obj.name}' if not obj.early_payment_discount 
        else f'{obj.discount_percentage}% discount if paid within {obj.discount_days} days'
    )
    
    # Default term flag
    is_default = False
    
    class Params:
        """
        Traits for creating specific payment term types.
        """
        # Trait for payment terms with early payment discount
        with_discount = factory.Trait(
            early_payment_discount=True,
            discount_percentage=factory.LazyFunction(lambda: fake.pydecimal(left_digits=2, right_digits=2, positive=True, min_value=1, max_value=20)),
            discount_days=factory.LazyFunction(lambda: fake.random_int(min=1, max=60)),
            early_pay_discount_computation='percentage_of_total',
        )
        
        # Trait for payment terms without discount (explicit, but this is the default)
        no_discount = factory.Trait(
            early_payment_discount=False,
            discount_percentage=0.00,
            discount_days=0,
            early_pay_discount_computation=None,
        )
        
        # Trait for the default payment term
        default_term = factory.Trait(
            name='Immediate Payment',
            early_payment_discount=False,
            discount_percentage=0.00,
            discount_days=0,
            early_pay_discount_computation=None,
            example_preview='Payment is due immediately upon invoice receipt.',
            is_default=True,
        )


class ProductFactory(DjangoModelFactory):
    """
    Factory for creating Product instances with valid test data.
    
    Usage:
        # Create a published product
        product = ProductFactory()
        
        # Create an unpublished product
        unpublished = ProductFactory(published=False)
        
        # Create a product with specific values
        product = ProductFactory(product_name='T-Shirt', sales_price=29.99)
        
        # Create multiple products
        products = ProductFactory.create_batch(5)
    """
    
    class Meta:
        model = Product
    
    # Core fields
    product_name = factory.Faker('word')
    product_category = factory.Faker('word')
    product_type = 'storable'
    material = factory.Faker('word')
    
    # Pricing
    sales_price = factory.LazyFunction(lambda: fake.pydecimal(left_digits=3, right_digits=2, positive=True, min_value=10, max_value=999))
    sales_tax_percentage = Decimal('0.00')
    purchase_price = factory.LazyFunction(lambda: fake.pydecimal(left_digits=3, right_digits=2, positive=True, min_value=5, max_value=500))
    purchase_tax_percentage = Decimal('0.00')
    
    # Stock
    current_stock = factory.LazyFunction(lambda: fake.random_int(min=0, max=100))
    
    # Availability
    published = True
    
    class Params:
        """
        Traits for creating specific product types.
        """
        # Trait for unpublished products
        unpublished = factory.Trait(
            published=False,
        )
        
        # Trait for out of stock products
        out_of_stock = factory.Trait(
            current_stock=0,
        )


class DiscountOfferFactory(DjangoModelFactory):
    """
    Factory for creating DiscountOffer instances with valid test data.
    
    Usage:
        # Create a discount offer
        offer = DiscountOfferFactory()
        
        # Create an offer with specific dates
        offer = DiscountOfferFactory(start_date=date(2024, 1, 1), end_date=date(2024, 12, 31))
        
        # Create an offer available on specific days
        offer = DiscountOfferFactory(available_on='Monday,Friday')
        
        # Create multiple offers
        offers = DiscountOfferFactory.create_batch(5)
    """
    
    class Meta:
        model = DiscountOffer
        django_get_or_create = ('name',)
    
    # Core fields
    name = factory.Sequence(lambda n: f'Discount Offer {n}')
    discount_percentage = factory.LazyFunction(lambda: fake.pydecimal(left_digits=2, right_digits=2, positive=True, min_value=5, max_value=50))
    
    # Date range (default to current year)
    start_date = factory.LazyFunction(lambda: datetime.date.today())
    end_date = factory.LazyFunction(lambda: datetime.date.today() + datetime.timedelta(days=30))
    
    # Availability (default to all days)
    available_on = None
    
    class Params:
        """
        Traits for creating specific offer types.
        """
        # Trait for weekend-only offers
        weekend_only = factory.Trait(
            available_on='Saturday,Sunday',
        )
        
        # Trait for weekday-only offers
        weekday_only = factory.Trait(
            available_on='Monday,Tuesday,Wednesday,Thursday,Friday',
        )


class CouponFactory(DjangoModelFactory):
    """
    Factory for creating Coupon instances with valid test data.
    
    Usage:
        # Create an active coupon
        coupon = CouponFactory()
        
        # Create a coupon assigned to a user
        coupon = CouponFactory(contact=UserFactory())
        
        # Create an expired coupon
        expired = CouponFactory.expired()
        
        # Create a used coupon
        used = CouponFactory.used()
        
        # Create multiple coupons
        coupons = CouponFactory.create_batch(5)
    """
    
    class Meta:
        model = Coupon
        django_get_or_create = ('code',)
    
    # Core fields
    code = factory.Sequence(lambda n: f'COUPON{n:04d}')
    expiration_date = factory.LazyFunction(lambda: datetime.date.today() + datetime.timedelta(days=30))
    status = 'active'
    
    # Relationships
    contact = None  # Optional: can be assigned to specific user
    discount_offer = factory.SubFactory(DiscountOfferFactory)
    
    class Params:
        """
        Traits for creating specific coupon types.
        """
        # Trait for expired coupons
        expired = factory.Trait(
            status='expired',
            expiration_date=factory.LazyFunction(lambda: datetime.date.today() - datetime.timedelta(days=1)),
        )
        
        # Trait for used coupons
        used = factory.Trait(
            status='used',
        )
        
        # Trait for cancelled coupons
        cancelled = factory.Trait(
            status='cancelled',
        )
        
        # Trait for coupons assigned to a user
        assigned = factory.Trait(
            contact=factory.SubFactory(UserFactory, role='portal'),
        )


class SaleOrderFactory(DjangoModelFactory):
    """
    Factory for creating SaleOrder instances with valid test data.
    
    Usage:
        # Create a draft order with default values
        order = SaleOrderFactory()
        
        # Create an order with specific customer
        order = SaleOrderFactory(customer=UserFactory())
        
        # Create a confirmed order using trait
        confirmed_order = SaleOrderFactory.confirmed()
        
        # Create a cancelled order using trait
        cancelled_order = SaleOrderFactory.cancelled()
        
        # Create an order with a coupon using trait
        order_with_coupon = SaleOrderFactory.with_coupon()
        
        # Create multiple orders
        orders = SaleOrderFactory.create_batch(5)
    """
    
    class Meta:
        model = SaleOrder
        skip_postgeneration_save = True
    
    # Customer relationship (must be portal user)
    customer = factory.SubFactory(UserFactory, role='portal')
    
    # Payment term relationship (required)
    payment_term = factory.SubFactory(PaymentTermFactory)
    
    # Order status (default to draft)
    status = 'draft'
    
    # Monetary fields (calculated server-side, but set defaults for testing)
    subtotal = factory.LazyFunction(lambda: fake.pydecimal(left_digits=4, right_digits=2, positive=True, min_value=100, max_value=9999))
    discount_amount = Decimal('0.00')
    total_amount = factory.LazyAttribute(lambda obj: obj.subtotal - obj.discount_amount)
    
    # Coupon relationship (optional)
    applied_coupon = None
    
    class Params:
        """
        Traits for creating specific order types.
        """
        # Trait for confirmed orders
        confirmed = factory.Trait(
            status='confirmed',
        )
        
        # Trait for cancelled orders
        cancelled = factory.Trait(
            status='cancelled',
        )
        
        # Trait for orders with applied coupon
        with_coupon = factory.Trait(
            applied_coupon=factory.SubFactory(CouponFactory),
            discount_amount=factory.LazyAttribute(
                lambda obj: (obj.subtotal * obj.applied_coupon.discount_offer.discount_percentage / Decimal('100.00')).quantize(Decimal('0.01'))
            ),
            total_amount=factory.LazyAttribute(lambda obj: obj.subtotal - obj.discount_amount),
        )


class SaleOrderLineFactory(DjangoModelFactory):
    """
    Factory for creating SaleOrderLine instances with valid test data.
    
    Usage:
        # Create a line item with default values
        line = SaleOrderLineFactory()
        
        # Create a line item for a specific order
        line = SaleOrderLineFactory(order=SaleOrderFactory())
        
        # Create a line item with specific quantity
        line = SaleOrderLineFactory(quantity=5)
        
        # Create multiple line items
        lines = SaleOrderLineFactory.create_batch(3)
    """
    
    class Meta:
        model = SaleOrderLine
        skip_postgeneration_save = True
    
    # Relationships
    order = factory.SubFactory(SaleOrderFactory)
    product = factory.SubFactory(ProductFactory, published=True)
    
    # Quantity
    quantity = factory.LazyFunction(lambda: fake.random_int(min=1, max=10))
    
    # Pricing (captured from product at order time)
    unit_price = factory.LazyAttribute(lambda obj: obj.product.sales_price)
    
    # Line total (calculated)
    line_total = factory.LazyAttribute(lambda obj: Decimal(str(obj.quantity)) * obj.unit_price)
    
    @factory.post_generation
    def calculate_line_total(obj, create, extracted, **kwargs):
        """
        Post-generation hook to recalculate line_total after creation.
        This ensures line_total is always consistent with quantity * unit_price.
        """
        if create:
            obj.line_total = obj.calculate_line_total()
            obj.save()



class CustomerInvoiceFactory(DjangoModelFactory):
    """
    Factory for creating CustomerInvoice instances with valid test data.
    
    Usage:
        # Create a draft invoice with default values
        invoice = CustomerInvoiceFactory()
        
        # Create an invoice for a specific order
        invoice = CustomerInvoiceFactory(order=SaleOrderFactory.confirmed())
        
        # Create a confirmed invoice using trait
        confirmed_invoice = CustomerInvoiceFactory.confirmed()
        
        # Create a cancelled invoice using trait
        cancelled_invoice = CustomerInvoiceFactory.cancelled()
        
        # Create multiple invoices
        invoices = CustomerInvoiceFactory.create_batch(5)
    """
    
    class Meta:
        model = CustomerInvoice
        skip_postgeneration_save = True
    
    # Order relationship (must be confirmed order)
    order = factory.SubFactory(SaleOrderFactory, status='confirmed')
    
    # Invoice dates
    # invoice_date is auto_now_add, so it's set automatically
    due_date = factory.LazyFunction(lambda: datetime.date.today() + datetime.timedelta(days=30))
    
    # Total amount (copied from order)
    total_amount = factory.LazyAttribute(lambda obj: obj.order.total_amount)
    
    # Status (default to draft)
    status = 'draft'
    
    @factory.post_generation
    def ensure_valid_due_date(obj, create, extracted, **kwargs):
        """
        Post-generation hook to ensure due_date is after invoice_date.
        """
        if create and obj.invoice_date:
            # Ensure due_date is at least 1 day after invoice_date
            if obj.due_date <= obj.invoice_date:
                obj.due_date = obj.invoice_date + datetime.timedelta(days=1)
                obj.save()
    
    class Params:
        """
        Traits for creating specific invoice types.
        """
        # Trait for confirmed invoices
        confirmed = factory.Trait(
            status='confirmed',
        )
        
        # Trait for cancelled invoices
        cancelled = factory.Trait(
            status='cancelled',
        )


class PurchaseOrderFactory(DjangoModelFactory):
    """
    Factory for creating PurchaseOrder instances with valid test data.
    
    Usage:
        # Create a purchase order with default values
        order = PurchaseOrderFactory()
        
        # Create a confirmed purchase order using trait
        confirmed_order = PurchaseOrderFactory(confirmed=True)
        
        # Create multiple purchase orders
        orders = PurchaseOrderFactory.create_batch(5)
    """
    
    class Meta:
        model = PurchaseOrder
    
    # Vendor relationship (Contact with vendor type)
    vendor = factory.SubFactory(ContactFactory, type='vendor')
    
    # Order status (default to draft)
    status = 'draft'
    
    # Monetary fields
    subtotal = factory.LazyFunction(lambda: fake.pydecimal(left_digits=4, right_digits=2, positive=True, min_value=100, max_value=9999))
    total_amount = factory.LazyAttribute(lambda obj: obj.subtotal)
    
    class Params:
        """
        Traits for creating specific purchase order types.
        """
        # Trait for confirmed orders
        confirmed = factory.Trait(
            status='confirmed',
        )
        
        # Trait for cancelled orders
        cancelled = factory.Trait(
            status='cancelled',
        )


class VendorBillFactory(DjangoModelFactory):
    """
    Factory for creating VendorBill instances with valid test data.
    
    Usage:
        # Create a vendor bill with default values
        bill = VendorBillFactory()
        
        # Create a vendor bill with specific amount
        bill = VendorBillFactory(total_amount=Decimal('1500.00'))
        
        # Create multiple vendor bills
        bills = VendorBillFactory.create_batch(5)
    """
    
    class Meta:
        model = VendorBill
    
    # Purchase order relationship (required)
    purchase_order = factory.SubFactory('tests.factories.PurchaseOrderFactory')
    
    # Vendor relationship (required, should match purchase order vendor)
    vendor = factory.LazyAttribute(lambda obj: obj.purchase_order.vendor)
    
    # Total amount
    total_amount = factory.LazyFunction(
        lambda: fake.pydecimal(left_digits=4, right_digits=2, positive=True, min_value=100, max_value=9999)
    )


class PaymentFactory(DjangoModelFactory):
    """
    Factory for creating Payment instances with valid test data.
    Ensures FK exclusivity constraint is satisfied.
    
    Usage:
        # Create a payment for a customer invoice (default)
        payment = PaymentFactory()
        
        # Create a payment for a vendor bill using trait
        vendor_payment = PaymentFactory(for_vendor_bill=True)
        
        # Create a Razorpay payment using trait
        razorpay_payment = PaymentFactory(razorpay=True)
        
        # Create a manual payment (cash) using trait
        cash_payment = PaymentFactory(cash=True)
        
        # Create a bank transfer payment using trait
        bank_payment = PaymentFactory(bank_transfer=True)
        
        # Create a cheque payment using trait
        cheque_payment = PaymentFactory(cheque=True)
        
        # Create a payment with specific invoice
        payment = PaymentFactory(customer_invoice=CustomerInvoiceFactory())
        
        # Create multiple payments
        payments = PaymentFactory.create_batch(5)
    """
    
    class Meta:
        model = Payment
        skip_postgeneration_save = True
    
    # Payment details
    amount = factory.LazyFunction(
        lambda: fake.pydecimal(left_digits=4, right_digits=2, positive=True, min_value=0.01, max_value=9999.99)
    )
    
    payment_date = factory.LazyFunction(lambda: fake.date_time_this_year(tzinfo=datetime.timezone.utc))
    
    method = 'cash'  # Default to cash for manual payments
    
    # Foreign keys (default to customer_invoice, vendor_bill is None)
    customer_invoice = factory.SubFactory(CustomerInvoiceFactory)
    vendor_bill = None
    
    # Razorpay fields (default to None for manual payments)
    razorpay_order_id = None
    razorpay_payment_id = None
    razorpay_signature = None
    
    class Params:
        """
        Traits for creating specific payment types.
        """
        # Trait for vendor bill payments
        for_vendor_bill = factory.Trait(
            customer_invoice=None,
            vendor_bill=factory.SubFactory(VendorBillFactory),
        )
        
        # Trait for Razorpay payments (with order_id)
        razorpay = factory.Trait(
            method='razorpay',
            razorpay_order_id=factory.Sequence(lambda n: f'order_{fake.uuid4()}'),
            razorpay_payment_id=factory.Sequence(lambda n: f'pay_{fake.uuid4()}'),
            razorpay_signature=factory.LazyFunction(lambda: fake.sha256()),
        )
        
        # Trait for cash payments
        cash = factory.Trait(
            method='cash',
            razorpay_order_id=None,
            razorpay_payment_id=None,
            razorpay_signature=None,
        )
        
        # Trait for bank transfer payments
        bank_transfer = factory.Trait(
            method='bank_transfer',
            razorpay_order_id=None,
            razorpay_payment_id=None,
            razorpay_signature=None,
        )
        
        # Trait for cheque payments
        cheque = factory.Trait(
            method='cheque',
            razorpay_order_id=None,
            razorpay_payment_id=None,
            razorpay_signature=None,
        )
