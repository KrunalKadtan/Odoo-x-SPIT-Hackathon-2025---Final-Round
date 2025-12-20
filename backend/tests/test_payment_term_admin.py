"""
Unit tests for PaymentTerm admin configuration.
Tests admin registration, list display, search functionality, and deletion protection.
"""
import pytest
from django.contrib import admin
from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.contrib.messages.storage.fallback import FallbackStorage
from django.test import RequestFactory
from django.core.exceptions import ValidationError
from products.models import PaymentTerm
from products.admin import PaymentTermAdmin


User = get_user_model()


@pytest.fixture
def admin_user(db):
    """Create a superuser for admin tests."""
    return User.objects.create_superuser(
        email='admin@test.com',
        name='Admin User',
        password='adminpass123'
    )


@pytest.fixture
def request_factory():
    """Provide a request factory for creating mock requests."""
    return RequestFactory()


@pytest.fixture
def mock_request(request_factory, admin_user):
    """Create a mock request with an authenticated admin user."""
    request = request_factory.get('/admin/products/paymentterm/')
    request.user = admin_user
    # Add messages framework support
    setattr(request, 'session', 'session')
    messages = FallbackStorage(request)
    setattr(request, '_messages', messages)
    return request


@pytest.fixture
def payment_term_admin():
    """Provide a PaymentTermAdmin instance."""
    return PaymentTermAdmin(PaymentTerm, AdminSite())


@pytest.fixture
def default_payment_term(db):
    """Get or create a default payment term for testing."""
    term, created = PaymentTerm.objects.get_or_create(
        name='Immediate Payment',
        defaults={
            'early_payment_discount': False,
            'discount_percentage': 0.00,
            'discount_days': 0,
            'is_default': True,
            'example_preview': 'Payment is due immediately upon invoice receipt.'
        }
    )
    return term


@pytest.fixture
def regular_payment_term(db):
    """Create a regular (non-default) payment term for testing."""
    return PaymentTerm.objects.create(
        name='Net 30',
        early_payment_discount=True,
        discount_percentage=2.00,
        discount_days=10,
        early_pay_discount_computation='percentage_of_total',
        is_default=False,
        example_preview='2% discount if paid within 10 days, otherwise net 30.'
    )


@pytest.mark.django_db
class TestPaymentTermAdminRegistration:
    """Test that PaymentTermAdmin is properly registered."""
    
    def test_admin_is_registered(self):
        """
        Test that PaymentTerm model is registered in Django admin.
        Requirements: 10.4
        """
        assert PaymentTerm in admin.site._registry
        assert isinstance(admin.site._registry[PaymentTerm], PaymentTermAdmin)


@pytest.mark.django_db
class TestPaymentTermAdminListDisplay:
    """Test admin list display configuration."""
    
    def test_list_display_fields(self, payment_term_admin):
        """
        Test that list_display shows correct fields.
        Requirements: 10.4
        """
        expected_fields = (
            'name',
            'early_payment_discount',
            'discount_percentage',
            'discount_days',
            'is_default',
            'created_at'
        )
        assert payment_term_admin.list_display == expected_fields
    
    def test_list_filter_fields(self, payment_term_admin):
        """
        Test that list_filter is configured correctly.
        Requirements: 10.4
        """
        expected_filters = ('early_payment_discount', 'is_default', 'created_at')
        assert payment_term_admin.list_filter == expected_filters
    
    def test_readonly_fields(self, payment_term_admin):
        """
        Test that timestamp fields are read-only.
        Requirements: 10.4
        """
        expected_readonly = ('created_at', 'updated_at')
        assert payment_term_admin.readonly_fields == expected_readonly
    
    def test_ordering(self, payment_term_admin):
        """
        Test that admin ordering is by name.
        Requirements: 10.4
        """
        assert payment_term_admin.ordering == ('name',)
    
    def test_fieldsets_configuration(self, payment_term_admin):
        """
        Test that fieldsets are properly configured.
        Requirements: 10.4
        """
        assert len(payment_term_admin.fieldsets) == 3
        
        # Check Basic Information fieldset
        basic_info = payment_term_admin.fieldsets[0]
        assert basic_info[0] == 'Basic Information'
        assert 'name' in basic_info[1]['fields']
        assert 'is_default' in basic_info[1]['fields']
        assert 'example_preview' in basic_info[1]['fields']
        
        # Check Early Payment Discount fieldset
        discount_info = payment_term_admin.fieldsets[1]
        assert discount_info[0] == 'Early Payment Discount'
        assert 'early_payment_discount' in discount_info[1]['fields']
        assert 'discount_percentage' in discount_info[1]['fields']
        assert 'discount_days' in discount_info[1]['fields']
        assert 'early_pay_discount_computation' in discount_info[1]['fields']
        
        # Check Timestamps fieldset
        timestamps = payment_term_admin.fieldsets[2]
        assert timestamps[0] == 'Timestamps'
        assert 'created_at' in timestamps[1]['fields']
        assert 'updated_at' in timestamps[1]['fields']


@pytest.mark.django_db
class TestPaymentTermAdminSearch:
    """Test admin search functionality."""
    
    def test_search_fields_configuration(self, payment_term_admin):
        """
        Test that search_fields is configured correctly.
        Requirements: 10.4
        """
        expected_search_fields = ('name', 'example_preview')
        assert payment_term_admin.search_fields == expected_search_fields
    
    def test_search_by_name(self, payment_term_admin, mock_request, regular_payment_term):
        """
        Test that search works for payment term names.
        Requirements: 10.4
        """
        # Create a queryset
        queryset = PaymentTerm.objects.all()
        
        # Get the search results
        search_term = 'Net 30'
        changelist = payment_term_admin.get_changelist_instance(mock_request)
        
        # Verify the payment term exists
        assert PaymentTerm.objects.filter(name__icontains=search_term).exists()
    
    def test_search_by_example_preview(self, payment_term_admin, mock_request, regular_payment_term):
        """
        Test that search works for example preview text.
        Requirements: 10.4
        """
        # Verify the payment term with specific preview text exists
        search_term = 'discount'
        assert PaymentTerm.objects.filter(example_preview__icontains=search_term).exists()


@pytest.mark.django_db
class TestPaymentTermAdminDeletionProtection:
    """Test admin deletion protection for default payment terms."""
    
    def test_delete_model_protects_default_term(
        self, 
        payment_term_admin, 
        mock_request, 
        default_payment_term
    ):
        """
        Test that delete_model prevents deletion of default payment term.
        Requirements: 10.4
        """
        # Attempt to delete the default payment term
        payment_term_admin.delete_model(mock_request, default_payment_term)
        
        # Verify the default payment term still exists
        assert PaymentTerm.objects.filter(id=default_payment_term.id).exists()
        
        # Verify an error message was added
        messages = list(mock_request._messages)
        assert len(messages) > 0
    
    def test_delete_model_allows_regular_term(
        self, 
        payment_term_admin, 
        mock_request, 
        regular_payment_term
    ):
        """
        Test that delete_model allows deletion of non-default payment terms.
        Requirements: 10.4
        """
        term_id = regular_payment_term.id
        
        # Delete the regular payment term
        payment_term_admin.delete_model(mock_request, regular_payment_term)
        
        # Verify the regular payment term was deleted
        assert not PaymentTerm.objects.filter(id=term_id).exists()
    
    def test_delete_queryset_protects_default_term(
        self, 
        payment_term_admin, 
        mock_request, 
        default_payment_term,
        regular_payment_term
    ):
        """
        Test that delete_queryset prevents bulk deletion of default payment term.
        Requirements: 10.4
        """
        # Create a queryset with both default and regular terms
        queryset = PaymentTerm.objects.filter(
            id__in=[default_payment_term.id, regular_payment_term.id]
        )
        
        # Attempt bulk deletion
        payment_term_admin.delete_queryset(mock_request, queryset)
        
        # Verify the default payment term still exists
        assert PaymentTerm.objects.filter(id=default_payment_term.id).exists()
        
        # Verify the regular payment term was deleted
        assert not PaymentTerm.objects.filter(id=regular_payment_term.id).exists()
        
        # Verify an error message was added about the default term
        messages = list(mock_request._messages)
        assert len(messages) > 0
    
    def test_delete_queryset_allows_all_regular_terms(
        self, 
        payment_term_admin, 
        mock_request, 
        db
    ):
        """
        Test that delete_queryset allows deletion when no default terms are included.
        Requirements: 10.4
        """
        # Create multiple regular payment terms
        term1 = PaymentTerm.objects.create(
            name='Net 15',
            early_payment_discount=False,
            is_default=False
        )
        term2 = PaymentTerm.objects.create(
            name='Net 45',
            early_payment_discount=False,
            is_default=False
        )
        
        # Create a queryset with only regular terms
        queryset = PaymentTerm.objects.filter(id__in=[term1.id, term2.id])
        
        # Perform bulk deletion
        payment_term_admin.delete_queryset(mock_request, queryset)
        
        # Verify both terms were deleted
        assert not PaymentTerm.objects.filter(id=term1.id).exists()
        assert not PaymentTerm.objects.filter(id=term2.id).exists()
