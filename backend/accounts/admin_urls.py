from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .admin_views import (
    AdminUserViewSet, 
    AdminDashboardViewSet, 
    AdminAnalyticsViewSet,
    AdminSystemViewSet
)

# Admin router for accounts
admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserViewSet, basename='admin-users')
admin_router.register(r'dashboard', AdminDashboardViewSet, basename='admin-dashboard')
admin_router.register(r'analytics', AdminAnalyticsViewSet, basename='admin-analytics')
admin_router.register(r'system', AdminSystemViewSet, basename='admin-system')

urlpatterns = [
    path('', include(admin_router.urls)),
]