"""
Pytest configuration for Django tests.
This file configures pytest-django and provides shared fixtures.
"""
import pytest
from django.conf import settings
from hypothesis import settings as hypothesis_settings


# Configure Hypothesis for property-based testing
# Reduced to 10 examples for faster test execution
hypothesis_settings.register_profile(
    "default",
    max_examples=10,
    deadline=None,  # Disable deadline for database operations
)
hypothesis_settings.load_profile("default")


@pytest.fixture(scope='session')
def django_db_setup():
    """
    Configure the test database.
    Uses pytest-django's default behavior but can be customized here.
    """
    settings.DATABASES['default'] = {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': settings.DATABASES['default'].get('NAME', 'appareldesk_test'),
        'USER': settings.DATABASES['default'].get('USER', 'postgres'),
        'PASSWORD': settings.DATABASES['default'].get('PASSWORD', ''),
        'HOST': settings.DATABASES['default'].get('HOST', 'localhost'),
        'PORT': settings.DATABASES['default'].get('PORT', '5432'),
    }


@pytest.fixture
def user_data():
    """
    Fixture providing sample user data for tests.
    """
    return {
        'email': 'test@example.com',
        'name': 'Test User',
        'password': 'testpass123',
        'role': 'portal',
        'mobile': '+1234567890',
        'city': 'Mumbai',
        'state': 'Maharashtra',
        'pincode': '400001',
    }


@pytest.fixture
def internal_user_data():
    """
    Fixture providing sample internal user data for tests.
    """
    return {
        'email': 'staff@example.com',
        'name': 'Staff User',
        'password': 'staffpass123',
        'role': 'internal',
        'is_staff': True,
    }


@pytest.fixture
def superuser_data():
    """
    Fixture providing sample superuser data for tests.
    """
    return {
        'email': 'admin@example.com',
        'name': 'Admin User',
        'password': 'adminpass123',
        'role': 'internal',
        'is_staff': True,
        'is_superuser': True,
    }
