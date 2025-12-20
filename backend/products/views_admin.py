"""
Admin views for ApparelDesk Admin APIs.

Provides full CRUD operations for admin users.
"""

from django.db import transaction
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination

from .models import Product, PurchaseOrder, PurchaseOrderLine, VendorBill, Payment
from accounts.models import Contact
from .serializers_admin import (
    AdminProductSerializer,
    AdminVendorSerializer,
    AdminPurchaseOrderSerializer,
    AdminPurchaseOrderLineSerializer,
    AdminVendorBillSerializer,
    AdminVendorPaymentSerializer
)
from .admin_vendor_permissions import IsAdminUserRole
from decimal import Decimal


class AdminProductViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Product management.
    
    Endpoints:
    - POST /api/admin/products/ - Create product
    - GET /api/admin/products/ - List all products
    - GET /api/admin/products/{id}/ - Product detail
    - PUT /api/admin/products/{id}/ - Update product
    - PATCH /api/admin/products/{id}/publish/ - Publish/unpublish
    - GET /api/admin/products/{id}/stock/ - View stock (read-only)
    """
    queryset = Product.objects.all()
    serializer_class = AdminProductSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product_category', 'product_type', 'published']
    search_fields = ['product_name', 'material']
    ordering_fields = ['product_name', 'sales_price', 'purchase_price', 'created_at']
    pagination_class = PageNumberPagination
    
    @action(detail=True, methods=['patch'])
    def publish(self, request, pk=None):
        """
        Publish or unpublish a product.
        
        Request body:
        {
            "published": true/false
        }
        """
        product = self.get_object()
        published = request.data.get('published')
        
        if published is None:
            return Response(
                {'error': 'published field is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        product.published = published
        product.save()
        
        serializer = self.get_serializer(product)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def stock(self, request, pk=None):
        """
        View current stock for a product (read-only).
        """
        product = self.get_object()
        return Response({
            'product_id': product.id,
            'product_name': product.product_name,
            'current_stock': product.current_stock
        }, status=status.HTTP_200_OK)


class AdminVendorViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Vendor (Contact) management.
    
    Endpoints:
    - POST /api/admin/vendors/ - Create vendor
    - GET /api/admin/vendors/ - List all vendors
    - GET /api/admin/vendors/{id}/ - Vendor detail
    - PUT /api/admin/vendors/{id}/ - Update vendor
    - DELETE /api/admin/vendors/{id}/ - Delete vendor
    """
    queryset = Contact.objects.filter(type__in=['vendor', 'both'])
    serializer_class = AdminVendorSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'city', 'state']
    search_fields = ['name', 'email', 'mobile']
    ordering_fields = ['name', 'created_at']
    pagination_class = PageNumberPagination


class AdminPurchaseOrderViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Purchase Order management.
    
    Endpoints:
    - POST /api/admin/purchase-orders/ - Create purchase order
    - GET /api/admin/purchase-orders/ - List all purchase orders
    - GET /api/admin/purchase-orders/{id}/ - Purchase order detail
    - PUT /api/admin/purchase-orders/{id}/ - Update purchase order
    - DELETE /api/admin/purchase-orders/{id}/ - Delete purchase order
    """
    queryset = PurchaseOrder.objects.all().prefetch_related('lines__product')
    serializer_class = AdminPurchaseOrderSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'vendor']
    ordering_fields = ['order_date', 'total_amount']
    pagination_class = PageNumberPagination
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create purchase order with line items.
        
        Request body:
        {
            "vendor": 1,
            "lines": [
                {"product": 1, "quantity": 10, "unit_price": "100.00", "tax_percentage": "18.00"},
                {"product": 2, "quantity": 5, "unit_price": "200.00", "tax_percentage": "18.00"}
            ]
        }
        """
        vendor_id = request.data.get('vendor')
        lines_data = request.data.get('lines', [])
        
        if not vendor_id:
            return Response(
                {'error': 'vendor is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not lines_data:
            return Response(
                {'error': 'At least one line item is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Validate vendor
            vendor = Contact.objects.get(id=vendor_id, type__in=['vendor', 'both'])
        except Contact.DoesNotExist:
            return Response(
                {'error': 'Invalid vendor ID or contact is not a vendor'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create purchase order
        purchase_order = PurchaseOrder.objects.create(vendor=vendor)
        
        # Create line items and calculate totals
        subtotal = Decimal('0.00')
        tax_amount = Decimal('0.00')
        
        for line_data in lines_data:
            try:
                product = Product.objects.get(id=line_data['product'])
                quantity = int(line_data['quantity'])
                unit_price = Decimal(str(line_data['unit_price']))
                tax_percentage = Decimal(str(line_data.get('tax_percentage', '0.00')))
                
                line = PurchaseOrderLine(
                    purchase_order=purchase_order,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                    tax_percentage=tax_percentage
                )
                line.calculate_line_totals()
                line.save()
                
                subtotal += line.line_subtotal
                tax_amount += line.line_tax
                
            except (Product.DoesNotExist, KeyError, ValueError) as e:
                return Response(
                    {'error': f'Invalid line item data: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update purchase order totals
        purchase_order.subtotal = subtotal
        purchase_order.tax_amount = tax_amount
        purchase_order.total_amount = subtotal + tax_amount
        purchase_order.save()
        
        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminPurchaseOrderLineViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Purchase Order Line management.
    
    Endpoints:
    - POST /api/admin/purchase-orders/{po_id}/lines/ - Add line to PO
    - PUT /api/admin/purchase-order-lines/{line_id}/ - Update line
    - DELETE /api/admin/purchase-order-lines/{line_id}/ - Delete line
    """
    queryset = PurchaseOrderLine.objects.all()
    serializer_class = AdminPurchaseOrderLineSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Add a line item to a purchase order."""
        purchase_order_id = request.data.get('purchase_order')
        
        if not purchase_order_id:
            return Response(
                {'error': 'purchase_order is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            purchase_order = PurchaseOrder.objects.get(id=purchase_order_id)
            product = Product.objects.get(id=request.data['product'])
            quantity = int(request.data['quantity'])
            unit_price = Decimal(str(request.data['unit_price']))
            tax_percentage = Decimal(str(request.data.get('tax_percentage', '0.00')))
            
            line = PurchaseOrderLine(
                purchase_order=purchase_order,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                tax_percentage=tax_percentage
            )
            line.calculate_line_totals()
            line.save()
            
            # Recalculate purchase order totals
            self._recalculate_po_totals(purchase_order)
            
            serializer = self.get_serializer(line)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except (PurchaseOrder.DoesNotExist, Product.DoesNotExist, KeyError, ValueError) as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        """Update a purchase order line."""
        line = self.get_object()
        
        try:
            if 'quantity' in request.data:
                line.quantity = int(request.data['quantity'])
            if 'unit_price' in request.data:
                line.unit_price = Decimal(str(request.data['unit_price']))
            if 'tax_percentage' in request.data:
                line.tax_percentage = Decimal(str(request.data['tax_percentage']))
            
            line.calculate_line_totals()
            line.save()
            
            # Recalculate purchase order totals
            self._recalculate_po_totals(line.purchase_order)
            
            serializer = self.get_serializer(line)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        """Delete a purchase order line."""
        line = self.get_object()
        purchase_order = line.purchase_order
        
        line.delete()
        
        # Recalculate purchase order totals
        self._recalculate_po_totals(purchase_order)
        
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    def _recalculate_po_totals(self, purchase_order):
        """Recalculate purchase order totals from lines."""
        lines = purchase_order.lines.all()
        subtotal = sum(line.line_subtotal for line in lines)
        tax_amount = sum(line.line_tax for line in lines)
        
        purchase_order.subtotal = subtotal
        purchase_order.tax_amount = tax_amount
        purchase_order.total_amount = subtotal + tax_amount
        purchase_order.save()


class AdminVendorBillViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Vendor Bill management.
    
    Endpoints:
    - POST /api/admin/vendor-bills/ - Create vendor bill
    - GET /api/admin/vendor-bills/ - List all vendor bills
    - GET /api/admin/vendor-bills/{id}/ - Vendor bill detail
    - PUT /api/admin/vendor-bills/{id}/ - Update vendor bill
    - POST /api/admin/vendor-bills/{id}/confirm/ - Confirm bill and update stock
    """
    queryset = VendorBill.objects.all().select_related('purchase_order', 'vendor')
    serializer_class = AdminVendorBillSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'vendor']
    ordering_fields = ['bill_date', 'due_date', 'total_amount']
    pagination_class = PageNumberPagination
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create vendor bill from purchase order.
        
        Request body:
        {
            "purchase_order": 1,
            "due_date": "2025-01-31"
        }
        """
        purchase_order_id = request.data.get('purchase_order')
        due_date = request.data.get('due_date')
        
        if not purchase_order_id:
            return Response(
                {'error': 'purchase_order is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not due_date:
            return Response(
                {'error': 'due_date is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            purchase_order = PurchaseOrder.objects.get(id=purchase_order_id)
            
            # Create vendor bill
            vendor_bill = VendorBill.objects.create(
                purchase_order=purchase_order,
                vendor=purchase_order.vendor,
                due_date=due_date,
                total_amount=purchase_order.total_amount
            )
            
            serializer = self.get_serializer(vendor_bill)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except PurchaseOrder.DoesNotExist:
            return Response(
                {'error': 'Purchase order not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def confirm(self, request, pk=None):
        """
        Confirm vendor bill and update stock.
        
        This action:
        1. Validates bill is in draft status
        2. Updates product stock based on purchase order lines
        3. Marks bill as confirmed
        4. Prevents double confirmation
        """
        vendor_bill = self.get_object()
        
        # Validate bill is in draft status
        if vendor_bill.status != 'draft':
            return Response(
                {'error': f'Cannot confirm bill in {vendor_bill.status} status. Bill must be in draft status.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get purchase order lines with row-level locking
            purchase_order = vendor_bill.purchase_order
            order_lines = purchase_order.lines.select_for_update()
            
            # Update stock for each line
            for line in order_lines:
                product = Product.objects.select_for_update().get(pk=line.product.pk)
                product.current_stock += line.quantity
                product.save()
            
            # Confirm bill
            vendor_bill.status = 'confirmed'
            vendor_bill.save()
            
            serializer = self.get_serializer(vendor_bill)
            return Response(
                {
                    'message': 'Vendor bill confirmed successfully and stock updated',
                    'vendor_bill': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class AdminVendorPaymentViewSet(viewsets.ModelViewSet):
    """
    Admin ViewSet for Vendor Payment management.
    
    Endpoints:
    - POST /api/admin/vendor-payments/ - Create vendor payment
    - GET /api/admin/vendor-payments/ - List all vendor payments
    - GET /api/admin/vendor-payments/{id}/ - Vendor payment detail
    """
    queryset = Payment.objects.filter(vendor_bill__isnull=False).select_related('vendor_bill')
    serializer_class = AdminVendorPaymentSerializer
    permission_classes = [IsAuthenticated, IsAdminUserRole]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['method', 'vendor_bill']
    ordering_fields = ['payment_date', 'amount']
    pagination_class = PageNumberPagination
