"""
URL configuration for products app.

This module configures all REST API endpoints for the ApparelDesk platform.
All ViewSets are registered with a DRF router for automatic URL generation.

Requirements: All API requirements (1.1-20.5)
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'products'

# Create router and register viewsets
router = DefaultRouter()

# Product Management APIs (Requirements: 1.1-1.8, 2.1-2.4)
router.register(r'products', views.ProductViewSet, basename='product')
router.register(r'catalog', views.ProductCatalogViewSet, basename='catalog')

# Sale Order APIs (Requirements: 3.1-3.7, 4.1-4.5, 5.1-5.5, 6.1-6.7)
router.register(r'orders', views.SaleOrderViewSet, basename='order')

# Coupon APIs (Requirements: 7.1-7.5, 13.1-13.5)
router.register(r'coupons', views.CouponViewSet, basename='coupon')

# Discount Offer APIs (Requirements: 12.1-12.5)
router.register(r'offers', views.DiscountOfferViewSet, basename='offer')

# Customer Invoice APIs (Requirements: 8.1-8.8)
router.register(r'invoices', views.CustomerInvoiceViewSet, basename='invoice')

# Payment APIs (Requirements: 9.1-9.5, 10.1-10.5, 11.1-11.4)
router.register(r'payments', views.PaymentViewSet, basename='payment')

# Payment Term APIs (Requirements: 14.1-14.5)
router.register(r'payment-terms', views.PaymentTermViewSet, basename='payment-term')

# System Settings APIs (Requirements: 15.1-15.4)
router.register(r'settings', views.SystemSettingsViewSet, basename='settings')

urlpatterns = [
    path('', include(router.urls)),
]
