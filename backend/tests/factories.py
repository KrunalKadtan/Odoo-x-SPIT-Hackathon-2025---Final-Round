"""
Test factories for ApparelDesk models using factory_boy.
Provides reusable factories for generating valid test data.
"""
import factory
from factory.django import DjangoModelFactory
from faker import Faker
from accounts.models import User, Contact


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
