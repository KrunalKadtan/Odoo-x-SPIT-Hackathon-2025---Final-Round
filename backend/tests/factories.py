"""
Test factories for ApparelDesk models using factory_boy.
Provides reusable factories for generating valid test data.
"""
import factory
from factory.django import DjangoModelFactory
from faker import Faker
from accounts.models import User, Contact
from products.models import PaymentTerm


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
