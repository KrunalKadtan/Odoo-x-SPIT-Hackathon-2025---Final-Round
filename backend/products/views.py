# Clean views file - will replace the conflicted one
from django.shortcuts import render
from django.conf import settings
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.decorators import action
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
import logging

from .models import (
    Product, ProductColor, SaleOrder, SaleOrderLine, 
    CustomerInvoice, Payment, PaymentTerm, DiscountOffer, 
    Coupon, SystemSettings
)
from .serializers import (
    ProductSerializer, ProductColorSerializer, SaleOrderSerializer,
    SaleOrderLineSerializer, CustomerInvoiceSerializer, PaymentSerializer,
    PaymentTermSerializer, DiscountOfferSerializer, CouponSerializer,
    SystemSettingsSerializer
)

logger = logging.getLogger(__name__)

# Product ViewSets
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Product.objects.all()
        # Add filtering by user if needed
        if hasattr(self.request.user, 'role') and self.request.user.role == 'external':
            queryset = queryset.filter(published=True)
        return queryset

class ProductCatalogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(published=True)
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

class SaleOrderViewSet(viewsets.ModelViewSet):
    serializer_class = SaleOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter orders by current user
        if hasattr(self.request.user, 'role'):
            if self.request.user.role == 'external':
                return SaleOrder.objects.filter(customer=self.request.user)
            elif self.request.user.role == 'internal':
                return SaleOrder.objects.all()
        return SaleOrder.objects.none()

class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated]

class DiscountOfferViewSet(viewsets.ModelViewSet):
    queryset = DiscountOffer.objects.all()
    serializer_class = DiscountOfferSerializer
    permission_classes = [IsAuthenticated]

class CustomerInvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerInvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Filter invoices by current user
        if hasattr(self.request.user, 'role'):
            if self.request.user.role == 'external':
                return CustomerInvoice.objects.filter(customer=self.request.user)
            elif self.request.user.role == 'internal':
                return CustomerInvoice.objects.all()
        return CustomerInvoice.objects.none()

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

class PaymentTermViewSet(viewsets.ModelViewSet):
    queryset = PaymentTerm.objects.all()
    serializer_class = PaymentTermSerializer
    permission_classes = [IsAuthenticated]

class SystemSettingsViewSet(viewsets.ModelViewSet):
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated]

class PaymentTermViewSet(viewsets.ModelViewSet):
    queryset = PaymentTerm.objects.all()
    permission_classes = [IsAuthenticated]

class SystemSettingsViewSet(viewsets.ModelViewSet):
    queryset = SystemSettings.objects.all()
    permission_classes = [IsAuthenticated]