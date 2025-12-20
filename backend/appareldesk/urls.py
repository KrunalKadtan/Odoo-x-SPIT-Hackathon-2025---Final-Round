"""
URL configuration for appareldesk project.

This is the main URL configuration that routes to all app-specific URLs.

API Structure:
- /api/token/ - JWT token obtain (POST)
- /api/token/refresh/ - JWT token refresh (POST)
- /api/accounts/ - Account management (signup, etc.)
- /api/schema/ - OpenAPI schema (JSON/YAML)
- /api/docs/ - Interactive API documentation (Swagger UI)
- /api/ - All product/order/invoice/payment APIs (from products app)

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),
    
    # JWT Authentication endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Account management (signup, etc.)
    path('api/accounts/', include('accounts.urls')),
    
    # OpenAPI Schema and Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    
    # All REST API endpoints (products, orders, invoices, payments, etc.)
    # This includes all ViewSets registered in products/urls.py
    path('api/', include('products.urls')),
    
    # Admin and Vendor APIs
    path('api/', include('products.urls_admin_vendor')),
]
