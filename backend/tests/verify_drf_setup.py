"""
Verification script for DRF infrastructure setup.
"""
from django.conf import settings


def verify_drf_setup():
    """Verify DRF configuration is properly set up."""
    
    print("Verifying DRF Infrastructure Setup...")
    print("=" * 60)
    
    # Check django_filters in INSTALLED_APPS
    if 'django_filters' in settings.INSTALLED_APPS:
        print("✓ django_filters is installed in INSTALLED_APPS")
    else:
        print("✗ django_filters is NOT in INSTALLED_APPS")
        return False
    
    # Check REST_FRAMEWORK settings
    rest_config = settings.REST_FRAMEWORK
    
    # Check authentication
    if 'rest_framework_simplejwt.authentication.JWTAuthentication' in rest_config.get('DEFAULT_AUTHENTICATION_CLASSES', []):
        print("✓ JWT Authentication is configured")
    else:
        print("✗ JWT Authentication is NOT configured")
        return False
    
    # Check permissions
    if 'rest_framework.permissions.IsAuthenticated' in rest_config.get('DEFAULT_PERMISSION_CLASSES', []):
        print("✓ Default permission class is configured")
    else:
        print("✗ Default permission class is NOT configured")
        return False
    
    # Check pagination
    if rest_config.get('DEFAULT_PAGINATION_CLASS') == 'rest_framework.pagination.PageNumberPagination':
        print("✓ Pagination is configured")
    else:
        print("✗ Pagination is NOT configured")
        return False
    
    if rest_config.get('PAGE_SIZE') == 20:
        print("✓ Page size is set to 20")
    else:
        print("✗ Page size is NOT set to 20")
        return False
    
    # Check filter backends
    filter_backends = rest_config.get('DEFAULT_FILTER_BACKENDS', [])
    if 'django_filters.rest_framework.DjangoFilterBackend' in filter_backends:
        print("✓ DjangoFilterBackend is configured")
    else:
        print("✗ DjangoFilterBackend is NOT configured")
        return False
    
    if 'rest_framework.filters.SearchFilter' in filter_backends:
        print("✓ SearchFilter is configured")
    else:
        print("✗ SearchFilter is NOT configured")
        return False
    
    if 'rest_framework.filters.OrderingFilter' in filter_backends:
        print("✓ OrderingFilter is configured")
    else:
        print("✗ OrderingFilter is NOT configured")
        return False
    
    # Check custom permissions exist
    try:
        from products.permissions import IsInternalUser, IsOwnerOrInternal
        print("✓ Custom permission classes (IsInternalUser, IsOwnerOrInternal) are available")
    except ImportError as e:
        print(f"✗ Custom permission classes are NOT available: {e}")
        return False
    
    print("=" * 60)
    print("✓ All DRF infrastructure checks passed!")
    return True


if __name__ == '__main__':
    import os
    import django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
    django.setup()
    verify_drf_setup()
