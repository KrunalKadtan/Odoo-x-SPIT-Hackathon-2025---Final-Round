"""
Tests for factory_boy factories.
Verifies that factories generate valid test data.
"""
import pytest
from django.db import IntegrityError
from accounts.models import User, Contact
from tests.factories import UserFactory, ContactFactory


@pytest.mark.django_db
class TestUserFactory:
    """Test UserFactory generates valid User instances."""
    
    def test_creates_portal_user_by_default(self):
        """Test that UserFactory creates a portal user by default."""
        user = UserFactory()
        
        assert user.id is not None
        assert user.email is not None
        assert user.name is not None
        assert user.role == 'portal'
        assert user.is_active is True
        assert user.is_staff is False
        assert user.is_superuser is False
    
    def test_creates_internal_user_with_trait(self):
        """Test that internal trait creates an internal staff user."""
        user = UserFactory(internal=True)
        
        assert user.role == 'internal'
        assert user.is_staff is True
        assert user.is_superuser is False
    
    def test_creates_portal_user_with_trait(self):
        """Test that portal trait creates a portal user."""
        user = UserFactory(portal=True)
        
        assert user.role == 'portal'
        assert user.is_staff is False
        assert user.is_superuser is False
    
    def test_creates_superuser_with_trait(self):
        """Test that superuser trait creates a superuser."""
        user = UserFactory(superuser=True)
        
        assert user.role == 'internal'
        assert user.is_staff is True
        assert user.is_superuser is True
    
    def test_creates_inactive_user_with_trait(self):
        """Test that inactive trait creates an inactive user."""
        user = UserFactory(inactive=True)
        
        assert user.is_active is False
    
    def test_creates_minimal_user_with_trait(self):
        """Test that minimal trait creates user without optional fields."""
        user = UserFactory(minimal=True)
        
        assert user.mobile is None
        assert user.city is None
        assert user.state is None
        assert user.pincode is None
    
    def test_password_is_hashed(self):
        """Test that password is properly hashed."""
        user = UserFactory()
        
        # Password should be hashed, not plaintext
        assert user.password != 'testpass123'
        assert user.check_password('testpass123')
    
    def test_creates_batch_of_users(self):
        """Test that create_batch creates multiple users."""
        users = UserFactory.create_batch(5)
        
        assert len(users) == 5
        assert all(isinstance(user, User) for user in users)
        # All should have unique emails
        emails = [user.email for user in users]
        assert len(emails) == len(set(emails))
    
    def test_custom_values_override_defaults(self):
        """Test that custom values override factory defaults."""
        custom_email = 'custom@example.com'
        custom_name = 'Custom Name'
        
        user = UserFactory(email=custom_email, name=custom_name)
        
        assert user.email == custom_email
        assert user.name == custom_name


@pytest.mark.django_db
class TestContactFactory:
    """Test ContactFactory generates valid Contact instances."""
    
    def test_creates_customer_contact_by_default(self):
        """Test that ContactFactory creates a customer contact by default."""
        contact = ContactFactory()
        
        assert contact.id is not None
        assert contact.name is not None
        assert contact.email is not None
        assert contact.type == 'customer'
        assert contact.user is None
    
    def test_creates_vendor_contact_with_trait(self):
        """Test that vendor trait creates a vendor contact."""
        contact = ContactFactory(vendor=True)
        
        assert contact.type == 'vendor'
    
    def test_creates_both_contact_with_trait(self):
        """Test that both trait creates a contact that is both customer and vendor."""
        contact = ContactFactory(both=True)
        
        assert contact.type == 'both'
    
    def test_creates_contact_with_portal_access(self):
        """Test that with_portal trait creates contact with user."""
        contact = ContactFactory(with_portal=True)
        
        assert contact.user is not None
        assert isinstance(contact.user, User)
        assert contact.user.role == 'portal'
    
    def test_creates_minimal_contact_with_trait(self):
        """Test that minimal trait creates contact without optional fields."""
        contact = ContactFactory(minimal=True)
        
        assert contact.mobile is None
        assert contact.city is None
        assert contact.state is None
        assert contact.pincode is None
    
    def test_creates_batch_of_contacts(self):
        """Test that create_batch creates multiple contacts."""
        contacts = ContactFactory.create_batch(5)
        
        assert len(contacts) == 5
        assert all(isinstance(contact, Contact) for contact in contacts)
        # All should have unique emails
        emails = [contact.email for contact in contacts]
        assert len(emails) == len(set(emails))
    
    def test_custom_values_override_defaults(self):
        """Test that custom values override factory defaults."""
        custom_name = 'Custom Company'
        custom_email = 'custom@company.com'
        
        contact = ContactFactory(name=custom_name, email=custom_email)
        
        assert contact.name == custom_name
        assert contact.email == custom_email
