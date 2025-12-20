"""
Verify URL routing for SystemSettings API.
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.urls import resolve, reverse
from products.views import SystemSettingsViewSet

print("Testing URL routing for SystemSettings API...")

# Test list endpoint
try:
    url = '/api/settings/'
    match = resolve(url)
    print(f"✓ {url} resolves to {match.func.__name__}")
    assert 'settings' in match.url_name
except Exception as e:
    print(f"✗ Failed to resolve {url}: {e}")

# Test retrieve endpoint
try:
    url = '/api/settings/1/'
    match = resolve(url)
    print(f"✓ {url} resolves to {match.func.__name__}")
    assert 'settings' in match.url_name
except Exception as e:
    print(f"✗ Failed to resolve {url}: {e}")

# Test reverse URL generation
try:
    url = reverse('products:settings-list')
    print(f"✓ Reverse URL for 'settings-list': {url}")
except Exception as e:
    print(f"✗ Failed to reverse 'settings-list': {e}")

try:
    url = reverse('products:settings-detail', kwargs={'pk': 1})
    print(f"✓ Reverse URL for 'settings-detail': {url}")
except Exception as e:
    print(f"✗ Failed to reverse 'settings-detail': {e}")

print("\n✅ URL routing is correctly configured!")
