from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, admin_views

app_name = 'products'

# Create router and register viewsets
router = DefaultRouter()

# Product Management APIs
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'catalog', views.ProductCatalogViewSet, basename='catalog')

# Sale Order APIs
router.register(r'orders', views.SaleOrderViewSet, basename='order')

# Coupon APIs
router.register(r'coupons', views.CouponViewSet, basename='coupon')

# Discount Offer APIs
router.register(r'offers', views.DiscountOfferViewSet, basename='offer')

# Customer Invoice APIs
router.register(r'invoices', views.CustomerInvoiceViewSet, basename='invoice')

# Payment APIs
router.register(r'payments', views.PaymentViewSet, basename='payment')

# Payment Term APIs
router.register(r'payment-terms', views.PaymentTermViewSet, basename='payment-term')

# System Settings APIs
router.register(r'settings', views.SystemSettingsViewSet, basename='settings')

urlpatterns = [
    # Admin endpoints
    path('admin/products/', admin_views.admin_products, name='admin_products'),
    path('admin/products/<int:product_id>/', admin_views.admin_product_detail, name='admin_product_detail'),
    path('admin/products/<int:product_id>/toggle-published/', admin_views.admin_product_toggle_published, name='admin_product_toggle_published'),
    
    # Include router URLs
    path('', include(router.urls)),
]
