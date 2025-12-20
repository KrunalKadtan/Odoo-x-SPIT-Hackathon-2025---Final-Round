from django.shortcuts import render
from django.db import transaction
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.pagination import PageNumberPagination

from .models import Product, SaleOrder, SaleOrderLine, SystemSettings, Coupon, DiscountOffer, CustomerInvoice, Payment, PaymentTerm
from .serializers import ProductSerializer, SaleOrderSerializer, CouponSerializer, DiscountOfferSerializer, CustomerInvoiceSerializer, PaymentSerializer, PaymentTermSerializer, SystemSettingsSerializer
from .permissions import IsInternalUser
from .services import SaleOrderService, InvoiceService, CouponValidationService, PaymentService


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Product CRUD operations.
    Internal users only.
    
    Provides:
    - list: GET /api/products/
    - create: POST /api/products/
    - retrieve: GET /api/products/{id}/
    - update: PUT /api/products/{id}/
    - partial_update: PATCH /api/products/{id}/
    - destroy: DELETE /api/products/{id}/
    
    Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7, 1.8
    """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated, IsInternalUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product_category', 'product_type', 'published']
    search_fields = ['product_name', 'material']
    ordering_fields = ['product_name', 'sales_price', 'created_at']
    pagination_class = PageNumberPagination




class ProductCatalogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only ViewSet for published products.
    No authentication required.
    
    Provides:
    - list: GET /api/products/catalog/
    - retrieve: GET /api/products/catalog/{id}/
    
    Requirements: 2.1, 2.2, 2.3, 2.4
    """
    queryset = Product.objects.filter(published=True)
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['product_category', 'product_type']
    search_fields = ['product_name']
    pagination_class = PageNumberPagination



class SaleOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for SaleOrder operations.
    Portal users see only their orders, internal users see all.
    
    Provides:
    - list: GET /api/orders/
    - create: POST /api/orders/
    - retrieve: GET /api/orders/{id}/
    - update: PUT /api/orders/{id}/
    - partial_update: PATCH /api/orders/{id}/
    - destroy: DELETE /api/orders/{id}/
    - confirm: POST /api/orders/{id}/confirm/
    - cancel: POST /api/orders/{id}/cancel/
    - apply_coupon: POST /api/orders/{id}/apply-coupon/
    
    Requirements: 3.1, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5
    """
    serializer_class = SaleOrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['order_date', 'total_amount']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        """
        Filter queryset based on user role.
        Portal users see only their orders, internal users see all.
        
        Requirements: 4.1, 4.2
        """
        if self.request.user.role == 'internal':
            return SaleOrder.objects.all().prefetch_related('lines__product')
        return SaleOrder.objects.filter(customer=self.request.user).prefetch_related('lines__product')
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create a new sale order using SaleOrderService.
        
        Expected request body:
        {
            "line_items": [
                {"product_id": 1, "quantity": 2},
                {"product_id": 2, "quantity": 1}
            ],
            "coupon_code": "OPTIONAL_COUPON"  // optional
        }
        
        Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
        """
        line_items = request.data.get('line_items', [])
        coupon_code = request.data.get('coupon_code', None)
        
        if not line_items:
            return Response(
                {'error': 'At least one line item is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use SaleOrderService to create order
            order = SaleOrderService.create_order(
                customer_id=request.user.id,
                line_items=line_items,
                coupon_code=coupon_code
            )
            
            # Serialize and return
            serializer = self.get_serializer(order)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def confirm(self, request, pk=None):
        """
        Confirm a sale order.
        Validates state transition and optionally generates invoice if automatic_invoicing is enabled.
        
        POST /api/orders/{id}/confirm/
        
        Requirements: 5.1, 5.2, 5.4, 5.5, 20.1, 20.2, 20.3
        """
        order = self.get_object()
        
        # Validate state transition
        if not order.can_transition_to('confirmed'):
            return Response(
                {'error': f'Cannot confirm order in {order.status} status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Confirm the order
            order.confirm()
            
            # Check if automatic invoicing is enabled
            settings = SystemSettings.load()
            invoice = None
            
            if settings.automatic_invoicing:
                try:
                    # Generate invoice automatically
                    invoice = InvoiceService.generate_invoice(order.id)
                except Exception as e:
                    # Log error but don't block order confirmation
                    # In production, use proper logging
                    print(f"Failed to auto-generate invoice: {str(e)}")
            
            # Prepare response
            response_data = {
                'message': 'Order confirmed successfully',
                'order': self.get_serializer(order).data
            }
            
            if invoice:
                response_data['invoice_id'] = invoice.id
                response_data['message'] = 'Order confirmed and invoice generated automatically'
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel a sale order.
        Validates state transition.
        
        POST /api/orders/{id}/cancel/
        
        Requirements: 5.2, 5.3
        """
        order = self.get_object()
        
        # Validate state transition
        if not order.can_transition_to('cancelled'):
            return Response(
                {'error': f'Cannot cancel order in {order.status} status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Cancel the order
            order.cancel()
            
            return Response(
                {
                    'message': 'Order cancelled successfully',
                    'order': self.get_serializer(order).data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    
    @action(detail=True, methods=['post'], url_path='apply-coupon')
    @transaction.atomic
    def apply_coupon(self, request, pk=None):
        """
        Apply a coupon code to a sale order.
        Validates coupon, recalculates totals, and marks coupon as used.
        
        POST /api/orders/{id}/apply-coupon/
        
        Expected request body:
        {
            "coupon_code": "DISCOUNT10"
        }
        
        Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
        """
        order = self.get_object()
        coupon_code = request.data.get('coupon_code')
        
        if not coupon_code:
            return Response(
                {'error': 'coupon_code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate order is in draft status
        if order.status != 'draft':
            return Response(
                {'error': 'Can only apply coupons to draft orders'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if order already has a coupon
        if order.applied_coupon:
            return Response(
                {'error': 'Order already has a coupon applied'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Validate coupon using CouponValidationService
            is_valid, message, coupon = CouponValidationService.validate_coupon(
                code=coupon_code,
                contact=request.user,
                check_date=order.order_date.date()
            )
            
            if not is_valid:
                return Response(
                    {'error': message},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate discount
            discount_percentage = coupon.discount_offer.discount_percentage
            discount_amount = (order.subtotal * discount_percentage) / 100
            discount_amount = discount_amount.quantize(order.subtotal.quantize(1))
            
            # Update order
            order.applied_coupon = coupon
            order.discount_amount = discount_amount
            order.total_amount = order.subtotal - discount_amount
            order.save()
            
            # Mark coupon as used
            coupon.status = 'used'
            coupon.save()
            
            return Response(
                {
                    'message': 'Coupon applied successfully',
                    'order': self.get_serializer(order).data,
                    'discount_percentage': float(discount_percentage),
                    'discount_amount': float(discount_amount)
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )



class CouponViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Coupon CRUD operations.
    Internal users only.
    
    Provides:
    - list: GET /api/coupons/
    - create: POST /api/coupons/
    - retrieve: GET /api/coupons/{id}/
    - update: PUT /api/coupons/{id}/
    - partial_update: PATCH /api/coupons/{id}/
    - destroy: DELETE /api/coupons/{id}/
    - validate_coupon: POST /api/coupons/validate/
    - my_coupons: GET /api/coupons/my-coupons/
    
    Requirements: 13.1, 13.2, 13.3, 13.5
    """
    queryset = Coupon.objects.all().select_related('discount_offer', 'contact')
    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated, IsInternalUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'discount_offer']
    search_fields = ['code']
    ordering_fields = ['created_at', 'expiration_date']
    pagination_class = PageNumberPagination
    
    def get_permissions(self):
        """
        Override permissions for specific actions.
        validate_coupon and my_coupons are available to all authenticated users.
        """
        if self.action in ['validate_coupon', 'my_coupons']:
            return [IsAuthenticated()]
        return super().get_permissions()
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete a coupon only if it hasn't been used.
        
        Requirements: 13.5
        """
        coupon = self.get_object()
        
        if coupon.status == 'used':
            return Response(
                {'error': 'Cannot delete a used coupon'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['post'])
    def validate_coupon(self, request):
        """
        Validate a coupon code for usage.
        Available to all authenticated users.
        
        POST /api/coupons/validate/
        
        Expected request body:
        {
            "coupon_code": "DISCOUNT10"
        }
        
        Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
        """
        coupon_code = request.data.get('coupon_code')
        
        if not coupon_code:
            return Response(
                {'error': 'coupon_code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate coupon using CouponValidationService
        is_valid, message, coupon = CouponValidationService.validate_coupon(
            code=coupon_code,
            contact=request.user if request.user.is_authenticated else None
        )
        
        if not is_valid:
            return Response(
                {
                    'valid': False,
                    'message': message,
                    'status': coupon.status if coupon else None
                },
                status=status.HTTP_200_OK
            )
        
        # Return validation success with discount details
        return Response(
            {
                'valid': True,
                'message': 'Coupon is valid',
                'coupon': {
                    'code': coupon.code,
                    'discount_percentage': float(coupon.discount_offer.discount_percentage),
                    'expiration_date': coupon.expiration_date,
                    'discount_offer_name': coupon.discount_offer.name
                }
            },
            status=status.HTTP_200_OK
        )
    
    @action(detail=False, methods=['get'], url_path='my-coupons')
    def my_coupons(self, request):
        """
        Return coupons assigned to the authenticated user.
        Available to all authenticated users (portal and internal).
        
        GET /api/coupons/my-coupons/
        
        Requirements: 13.4
        """
        # Filter coupons assigned to the current user
        coupons = Coupon.objects.filter(contact=request.user).select_related('discount_offer')
        
        # Apply pagination
        page = self.paginate_queryset(coupons)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(coupons, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class DiscountOfferViewSet(viewsets.ModelViewSet):
    """
    ViewSet for DiscountOffer CRUD operations.
    Internal users only.
    
    Provides:
    - list: GET /api/offers/
    - create: POST /api/offers/
    - retrieve: GET /api/offers/{id}/
    - update: PUT /api/offers/{id}/
    - partial_update: PATCH /api/offers/{id}/
    - destroy: DELETE /api/offers/{id}/
    - active_offers: GET /api/offers/active/
    
    Requirements: 12.1, 12.2, 12.4, 12.5
    """
    queryset = DiscountOffer.objects.all()
    serializer_class = DiscountOfferSerializer
    permission_classes = [IsAuthenticated, IsInternalUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['created_at', 'start_date', 'end_date']
    pagination_class = PageNumberPagination
    
    def get_permissions(self):
        """
        Override permissions for specific actions.
        active_offers is available to all users (unauthenticated access).
        """
        if self.action == 'active_offers':
            return [AllowAny()]
        return super().get_permissions()
    
    def destroy(self, request, *args, **kwargs):
        """
        Delete a discount offer only if no coupons reference it.
        
        Requirements: 12.5
        """
        offer = self.get_object()
        
        # Check if any coupons reference this offer
        if offer.coupons.exists():
            return Response(
                {'error': 'Cannot delete discount offer that has associated coupons'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return super().destroy(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def active_offers(self, request):
        """
        Return currently active discount offers.
        Available to all users without authentication.
        
        GET /api/offers/active/
        
        Filters offers by current date range (start_date <= today <= end_date).
        
        Requirements: 12.3
        """
        import datetime
        today = datetime.date.today()
        
        # Filter offers that are active today
        active_offers = DiscountOffer.objects.filter(
            start_date__lte=today,
            end_date__gte=today
        )
        
        # Apply pagination
        page = self.paginate_queryset(active_offers)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(active_offers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class CustomerInvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for CustomerInvoice operations.
    Portal users see only their invoices, internal users see all.
    
    Provides:
    - list: GET /api/invoices/
    - create: POST /api/invoices/
    - retrieve: GET /api/invoices/{id}/
    - update: PUT /api/invoices/{id}/
    - partial_update: PATCH /api/invoices/{id}/
    - destroy: DELETE /api/invoices/{id}/
    - confirm: POST /api/invoices/{id}/confirm/
    
    Requirements: 8.1, 8.4, 8.5
    """
    serializer_class = CustomerInvoiceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status']
    ordering_fields = ['invoice_date', 'due_date', 'total_amount']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        """
        Filter queryset based on user role.
        Portal users see only their invoices, internal users see all.
        
        Requirements: 8.4, 8.5
        """
        if self.request.user.role == 'internal':
            return CustomerInvoice.objects.all().select_related('order__customer')
        return CustomerInvoice.objects.filter(
            order__customer=self.request.user
        ).select_related('order__customer')
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """
        Create a new customer invoice from a confirmed order using InvoiceService.
        
        Expected request body:
        {
            "order_id": 1,
            "payment_terms_days": 30  // optional, defaults to 30
        }
        
        Requirements: 8.1
        """
        order_id = request.data.get('order_id')
        payment_terms_days = request.data.get('payment_terms_days', 30)
        
        if not order_id:
            return Response(
                {'error': 'order_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use InvoiceService to generate invoice
            invoice = InvoiceService.generate_invoice(
                order_id=order_id,
                payment_terms_days=payment_terms_days
            )
            
            # Serialize and return
            serializer = self.get_serializer(invoice)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def confirm(self, request, pk=None):
        """
        Confirm a customer invoice and deduct stock.
        Uses InvoiceService.confirm_invoice() which handles row-level locking.
        
        POST /api/invoices/{id}/confirm/
        
        Requirements: 8.6, 8.7, 8.8
        """
        invoice = self.get_object()
        
        # Validate invoice is in draft status
        if invoice.status != 'draft':
            return Response(
                {'error': f'Cannot confirm invoice in {invoice.status} status. Invoice must be in draft status.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Use InvoiceService to confirm invoice and deduct stock
            confirmed_invoice = InvoiceService.confirm_invoice(invoice.id)
            
            # Serialize and return
            serializer = self.get_serializer(confirmed_invoice)
            return Response(
                {
                    'message': 'Invoice confirmed successfully and stock deducted',
                    'invoice': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            # Return appropriate error for insufficient stock or other issues
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )




class PaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Payment operations.
    Portal users see only their payments, internal users see all.
    
    Provides:
    - list: GET /api/payments/
    - create: POST /api/payments/
    - retrieve: GET /api/payments/{id}/
    - update: PUT /api/payments/{id}/
    - partial_update: PATCH /api/payments/{id}/
    - destroy: DELETE /api/payments/{id}/
    - create_razorpay_order: POST /api/payments/create-order/
    - verify_payment: POST /api/payments/verify/
    
    Requirements: 11.1, 11.2, 11.3, 11.4
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['method']
    ordering_fields = ['payment_date', 'amount']
    pagination_class = PageNumberPagination
    
    def get_queryset(self):
        """
        Filter queryset based on user role.
        Portal users see only their payments, internal users see all.
        
        Requirements: 11.1, 11.2
        """
        if self.request.user.role == 'internal':
            return Payment.objects.all().select_related('customer_invoice__order__customer')
        
        # Portal users see only their payments (through customer_invoice)
        return Payment.objects.filter(
            customer_invoice__order__customer=self.request.user
        ).select_related('customer_invoice__order__customer')
    
    @action(detail=False, methods=['post'], url_path='create-order')
    @transaction.atomic
    def create_razorpay_order(self, request):
        """
        Create a Razorpay order for invoice payment.
        Uses PaymentService.create_razorpay_order().
        
        POST /api/payments/create-order/
        
        Expected request body:
        {
            "invoice_id": 1
        }
        
        Returns:
        {
            "payment_id": 1,
            "razorpay_order_id": "order_xxx",
            "amount": 1000.00,
            "currency": "INR"
        }
        
        Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
        """
        invoice_id = request.data.get('invoice_id')
        
        if not invoice_id:
            return Response(
                {'error': 'invoice_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify invoice exists and user has access
            try:
                if request.user.role == 'internal':
                    invoice = CustomerInvoice.objects.get(id=invoice_id)
                else:
                    # Portal users can only create orders for their own invoices
                    invoice = CustomerInvoice.objects.get(
                        id=invoice_id,
                        order__customer=request.user
                    )
            except CustomerInvoice.DoesNotExist:
                return Response(
                    {'error': 'Invoice not found or access denied'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if invoice is already paid
            if invoice.payments.filter(razorpay_payment_id__isnull=False).exists():
                return Response(
                    {'error': 'Invoice is already paid'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create Razorpay order using PaymentService
            payment, razorpay_order = PaymentService.create_razorpay_order(
                invoice_id=invoice_id
            )
            
            return Response(
                {
                    'payment_id': payment.id,
                    'razorpay_order_id': razorpay_order['id'],
                    'amount': float(payment.amount),
                    'currency': razorpay_order['currency']
                },
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def verify_payment(self, request):
        """
        Verify Razorpay payment signature and update payment record.
        Uses PaymentService.verify_razorpay_payment().
        
        POST /api/payments/verify/
        
        Expected request body:
        {
            "payment_id": 1,
            "razorpay_payment_id": "pay_xxx",
            "razorpay_signature": "signature_xxx"
        }
        
        Returns:
        {
            "message": "Payment verified successfully",
            "payment": {...}
        }
        
        Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
        """
        payment_id = request.data.get('payment_id')
        razorpay_payment_id = request.data.get('razorpay_payment_id')
        razorpay_signature = request.data.get('razorpay_signature')
        
        # Validate required fields
        if not payment_id:
            return Response(
                {'error': 'payment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not razorpay_payment_id:
            return Response(
                {'error': 'razorpay_payment_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not razorpay_signature:
            return Response(
                {'error': 'razorpay_signature is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify payment exists and user has access
            try:
                if request.user.role == 'internal':
                    payment = Payment.objects.get(id=payment_id)
                else:
                    # Portal users can only verify their own payments
                    payment = Payment.objects.get(
                        id=payment_id,
                        customer_invoice__order__customer=request.user
                    )
            except Payment.DoesNotExist:
                return Response(
                    {'error': 'Payment not found or access denied'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if payment is already verified
            if payment.razorpay_payment_id:
                return Response(
                    {'error': 'Payment is already verified'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Verify payment using PaymentService
            verified_payment = PaymentService.verify_razorpay_payment(
                payment_id=payment_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature
            )
            
            # Serialize and return
            serializer = self.get_serializer(verified_payment)
            return Response(
                {
                    'message': 'Payment verified successfully',
                    'payment': serializer.data
                },
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )



class PaymentTermViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PaymentTerm CRUD operations.
    Internal users only.
    
    Provides:
    - list: GET /api/payment-terms/
    - create: POST /api/payment-terms/
    - retrieve: GET /api/payment-terms/{id}/
    - update: PUT /api/payment-terms/{id}/
    - partial_update: PATCH /api/payment-terms/{id}/
    - destroy: DELETE /api/payment-terms/{id}/
    - default_term: GET /api/payment-terms/default/
    
    Requirements: 14.1, 14.2, 14.4, 14.5
    """
    queryset = PaymentTerm.objects.all()
    serializer_class = PaymentTermSerializer
    permission_classes = [IsAuthenticated, IsInternalUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    pagination_class = PageNumberPagination
    
    def get_permissions(self):
        """
        Override permissions for specific actions.
        default_term is available to all users (unauthenticated access).
        """
        if self.action == 'default_term':
            return [AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def default_term(self, request):
        """
        Return the default payment term.
        Available to all users without authentication.
        
        GET /api/payment-terms/default/
        
        Requirements: 14.3
        """
        try:
            default_term = PaymentTerm.objects.get(is_default=True)
            serializer = self.get_serializer(default_term)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except PaymentTerm.DoesNotExist:
            return Response(
                {'error': 'No default payment term found'},
                status=status.HTTP_404_NOT_FOUND
            )



class SystemSettingsViewSet(viewsets.ViewSet):
    """
    ViewSet for SystemSettings singleton operations.
    Internal users only.
    
    Provides:
    - retrieve: GET /api/settings/
    - update: PUT /api/settings/
    - partial_update: PATCH /api/settings/
    
    Note: This is a singleton resource, so list and create operations are not supported.
    The settings instance is automatically created if it doesn't exist.
    
    Requirements: 15.1, 15.2, 15.3
    """
    permission_classes = [IsAuthenticated, IsInternalUser]
    serializer_class = SystemSettingsSerializer
    
    def list(self, request):
        """
        Return the singleton system settings instance.
        This acts as both list and retrieve since there's only one instance.
        
        GET /api/settings/
        
        Requirements: 15.1
        """
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def retrieve(self, request, pk=None):
        """
        Return the singleton system settings instance.
        The pk parameter is ignored since there's only one instance.
        
        GET /api/settings/{id}/
        
        Requirements: 15.1
        """
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @transaction.atomic
    def update(self, request, pk=None):
        """
        Update the singleton system settings instance.
        The pk parameter is ignored since there's only one instance.
        
        PUT /api/settings/{id}/
        
        Requirements: 15.2, 15.3
        """
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings, data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @transaction.atomic
    def partial_update(self, request, pk=None):
        """
        Partially update the singleton system settings instance.
        The pk parameter is ignored since there's only one instance.
        
        PATCH /api/settings/{id}/
        
        Requirements: 15.2, 15.3
        """
        settings = SystemSettings.load()
        serializer = SystemSettingsSerializer(settings, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
