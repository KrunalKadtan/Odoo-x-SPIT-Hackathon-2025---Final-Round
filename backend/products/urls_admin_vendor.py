"""
URL configuration for Admin and Vendor APIs.

Provides separate URL namespaces for:
- Admin APIs: /api/admin/
- Vendor APIs: /api/vendor/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views_admin, views_vendor

# Admin router
admin_router = DefaultRouter()
admin_router.register(r'products', views_admin.AdminProductViewSet, basename='admin-product')
admin_router.register(r'vendors', views_admin.AdminVendorViewSet, basename='admin-vendor')
admin_router.register(r'purchase-orders', views_admin.AdminPurchaseOrderViewSet, basename='admin-purchase-order')
admin_router.register(
    r'purchase-order-lines', 
    views_admin.AdminPurchaseOrderLineViewSet, 
    basename='admin-purchase-order-line'
)
admin_router.register(
    r'vendor-bills', 
    views_admin.AdminVendorBillViewSet, 
    basename='admin-vendor-bill'
)
admin_router.register(
    r'vendor-payments', 
    views_admin.AdminVendorPaymentViewSet, 
    basename='admin-vendor-payment'
)
admin_router.register(r'reports', views_admin.AdminReportingViewSet, basename='admin-reports')

# Vendor router
vendor_router = DefaultRouter()
vendor_router.register(r'products', views_vendor.VendorProductViewSet, basename='vendor-product')
vendor_router.register(r'purchase-orders', views_vendor.VendorPurchaseOrderViewSet, basename='vendor-purchase-order')
vendor_router.register(r'vendor-bills', views_vendor.VendorBillViewSet, basename='vendor-bill')
vendor_router.register(r'payments', views_vendor.VendorPaymentViewSet, basename='vendor-payment')
vendor_router.register(r'me', views_vendor.VendorSelfViewSet, basename='vendor-self')

urlpatterns = [
    # Admin URLs
    path('admin/', include(admin_router.urls)),
    path('admin/', include('accounts.admin_urls')),
    
    # Vendor URLs
    path('vendor/', include(vendor_router.urls)),
]
