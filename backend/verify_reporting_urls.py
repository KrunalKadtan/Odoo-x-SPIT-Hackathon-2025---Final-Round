"""
Verify that reporting endpoints are properly registered.
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'appareldesk.settings')
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

def print_urls(urlpatterns, prefix=''):
    """Recursively print all URL patterns."""
    for pattern in urlpatterns:
        if isinstance(pattern, URLResolver):
            print_urls(pattern.url_patterns, prefix + str(pattern.pattern))
        elif isinstance(pattern, URLPattern):
            print(f"{prefix}{pattern.pattern}")

def check_reporting_urls():
    """Check if reporting URLs are registered."""
    resolver = get_resolver()
    
    print("Checking for reporting endpoints...")
    print("\nLooking for patterns matching 'admin/reports':\n")
    
    reporting_urls = []
    
    def find_reporting_urls(urlpatterns, prefix=''):
        for pattern in urlpatterns:
            if isinstance(pattern, URLResolver):
                find_reporting_urls(pattern.url_patterns, prefix + str(pattern.pattern))
            elif isinstance(pattern, URLPattern):
                full_pattern = prefix + str(pattern.pattern)
                if 'admin/reports' in full_pattern or 'admin-reports' in str(pattern.name):
                    reporting_urls.append({
                        'pattern': full_pattern,
                        'name': pattern.name,
                        'callback': pattern.callback
                    })
    
    find_reporting_urls(resolver.url_patterns)
    
    if reporting_urls:
        print(f"✅ Found {len(reporting_urls)} reporting endpoint(s):\n")
        for url in reporting_urls:
            print(f"  Pattern: {url['pattern']}")
            print(f"  Name: {url['name']}")
            print(f"  Callback: {url['callback']}")
            print()
    else:
        print("❌ No reporting endpoints found!")
        print("\nShowing all admin URLs for debugging:")
        
        def find_admin_urls(urlpatterns, prefix=''):
            for pattern in urlpatterns:
                if isinstance(pattern, URLResolver):
                    find_admin_urls(pattern.url_patterns, prefix + str(pattern.pattern))
                elif isinstance(pattern, URLPattern):
                    full_pattern = prefix + str(pattern.pattern)
                    if 'admin/' in full_pattern and 'admin.site' not in str(pattern.callback):
                        print(f"  {full_pattern} -> {pattern.name}")
        
        find_admin_urls(resolver.url_patterns)
    
    return len(reporting_urls) > 0

if __name__ == '__main__':
    success = check_reporting_urls()
    
    if success:
        print("\n✅ Reporting endpoints are properly registered!")
        print("\nAvailable reporting endpoints:")
        print("  - GET /api/admin/reports/sales-dashboard/")
        print("  - GET /api/admin/reports/sales-by-product/")
        print("  - GET /api/admin/reports/sales-by-customer/")
        print("  - GET /api/admin/reports/sales-summary/")
        print("  - GET /api/admin/reports/purchase-dashboard/")
        print("  - GET /api/admin/reports/purchases-by-product/")
        print("  - GET /api/admin/reports/purchases-by-vendor/")
        print("  - GET /api/admin/reports/purchase-summary/")
    else:
        print("\n❌ Reporting endpoints are NOT registered!")
        print("Please check the URL configuration.")
