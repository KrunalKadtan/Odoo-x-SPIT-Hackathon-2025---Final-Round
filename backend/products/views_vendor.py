"""
Vendor views for ApparelDesk Vendor User APIs.

Provides read-only access for vendor users to their own data.
"""

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend

from .models import Product, PurchaseOrder, VendorBill, Payment
from .serializers_vendor import (
    VendorProductSerializer,
    VendorPurchaseOrderSerializer,
    VendorBillSerializer,
    VendorPaymentSerializer,
    VendorSelfSerializer
)
from .admin_vendor_permissions import IsVendorUserRole, IsVendorObjectOwner


class VendorProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vendor ViewSet for Product viewing (read-only).
    Used for reference during purchase flows.

    Endpoints:
    - GET /api/vendor/products/ - List products
    - GET /api/vendor/products/{id}/ - Product detail
    """
    queryset = Product.objects.all()
    serializer_class = VendorProductSerializer
    permission_classes = [IsAuthenticated, IsVendorUserRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product_category', 'product_type']
    search_fields = ['product_name', 'material']
    ordering_fields = ['product_name', 'purchase_price']
    pagination_class = PageNumberPagination


class VendorPurchaseOrderViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vendor ViewSet for Purchase Order viewing (read-only).
    Vendor can only see purchase orders where purchase_order.vendor == vendor.contact

    Endpoints:
    - GET /api/vendor/purchase-orders/ - List vendor's purchase orders
    - GET /api/vendor/purchase-orders/{id}/ - Purchase order detail
    """
    serializer_class = VendorPurchaseOrderSerializer
    permission_classes = [IsAuthenticated, IsVendorUserRole, IsVendorObjectOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['order_date', 'total_amount']
    pagination_class = PageNumberPagination

    def get_queryset(self):
        """Filter purchase orders to only show vendor's own orders."""
        user = self.request.user

        # Check if user has a linked contact
        if not hasattr(user, 'contact') or not user.contact:
            return PurchaseOrder.objects.none()

        vendor_contact = user.contact

        # Return only purchase orders for this vendor
        return PurchaseOrder.objects.filter(
            vendor=vendor_contact
        ).prefetch_related('lines__product')


class VendorBillViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vendor ViewSet for Vendor Bill viewing (read-only).
    Vendor can only see their own bills.
    
    Endpoints:
    - GET /api/vendor/vendor-bills/ - List vendor's bills
    - GET /api/vendor/vendor-bills/{id}/ - Vendor bill detail
    """
    serializer_class = VendorBillSerializer
    permission_classes = [IsAuthenticated, IsVendorUserRole, IsVendorObjectOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['bill_date', 'due_date', 'total_amount']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        """Filter vendor bills to only show vendor's own bills."""
        user = self.request.user
        
        # Check if user has a linked contact
        if not hasattr(user, 'contact') or not user.contact:
            return VendorBill.objects.none()
        
        vendor_contact = user.contact
        
        # Return only vendor bills for this vendor
        return VendorBill.objects.filter(
            vendor=vendor_contact
        ).select_related('purchase_order')


class VendorPaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vendor ViewSet for Payment viewing (read-only).
    Vendor can only see payments for their bills.
    
    Endpoints:
    - GET /api/vendor/payments/ - List vendor's payments
    - GET /api/vendor/payments/{id}/ - Payment detail
    """
    serializer_class = VendorPaymentSerializer
    permission_classes = [IsAuthenticated, IsVendorUserRole, IsVendorObjectOwner]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['method']
    ordering_fields = ['payment_date', 'amount']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        """Filter payments to only show vendor's own payments."""
        user = self.request.user
        
        # Check if user has a linked contact
        if not hasattr(user, 'contact') or not user.contact:
            return Payment.objects.none()
        
        vendor_contact = user.contact
        
        # Return only payments for vendor bills belonging to this vendor
        return Payment.objects.filter(
            vendor_bill__vendor=vendor_contact
        ).select_related('vendor_bill')


class VendorSelfViewSet(viewsets.ViewSet):
    """
    Vendor ViewSet for viewing own contact information.
    
    Endpoints:
    - GET /api/vendor/me/ - Get vendor's own contact info
    """
    permission_classes = [IsAuthenticated, IsVendorUserRole]
    
    def list(self, request):
        """
        Return vendor's own contact information.
        
        Returns:
        - Vendor contact info
        - Linked user info
        """
        user = request.user
        
        # Check if user has a linked contact
        if not hasattr(user, 'contact') or not user.contact:
            return Response(
                {'error': 'No contact linked to this vendor user'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        vendor_contact = user.contact
        serializer = VendorSelfSerializer(vendor_contact)
        
        return Response(serializer.data, status=status.HTTP_200_OK)
