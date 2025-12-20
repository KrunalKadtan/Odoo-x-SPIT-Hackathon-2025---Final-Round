from django.shortcuts import render
from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.core.exceptions import ValidationError as DjangoValidationError
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import (
    Product, ProductColor, CustomerInvoice, Payment, SaleOrder, 
    SaleOrderLine, Cart, CartItem, PaymentTerm
)
from .serializers import (
    ProductSerializer, ProductDetailSerializer, CustomerInvoiceSerializer,
    PaymentSerializer, CreatePaymentOrderSerializer, VerifyPaymentSerializer,
    InvoiceListSerializer, SaleOrderSerializer, CartSerializer, CartItemSerializer
)
from .services import PaymentService
import logging

logger = logging.getLogger(__name__)

class ProductListView(generics.ListAPIView):
    """
    List all published products with filtering and search capabilities.
    """
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Product.objects.filter(published=True).prefetch_related('colors')
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category and category.lower() != 'all products':
            queryset = queryset.filter(product_category__icontains=category)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(product_name__icontains=search)
        
        # Filter by material
        material = self.request.query_params.get('material', None)
        if material:
            queryset = queryset.filter(material__icontains=material)
        
        # Price range filtering
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price:
            queryset = queryset.filter(sales_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(sales_price__lte=max_price)
        
        # Sorting
        sort_by = self.request.query_params.get('sort', 'product_name')
        if sort_by == 'price_low':
            queryset = queryset.order_by('sales_price')
        elif sort_by == 'price_high':
            queryset = queryset.order_by('-sales_price')
        else:
            queryset = queryset.order_by('product_name')
        
        return queryset

class ProductDetailView(generics.RetrieveAPIView):
    """
    Retrieve a single product with full details.
    """
    serializer_class = ProductDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Product.objects.filter(published=True).prefetch_related('colors')

class ProductCategoriesView(generics.GenericAPIView):
    """
    Get list of all available product categories.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        categories = Product.objects.filter(published=True).values_list('product_category', flat=True).distinct()
        return Response({'categories': list(categories)})

class InvoiceListView(generics.ListAPIView):
    """
    List all invoices for the authenticated user.
    """
    serializer_class = InvoiceListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Get invoices for the current user
        return CustomerInvoice.objects.filter(
            order__customer=self.request.user
        ).select_related('order', 'order__customer').prefetch_related('payments').order_by('-invoice_date')


class InvoiceDetailView(generics.RetrieveAPIView):
    """
    Retrieve detailed information about a specific invoice.
    """
    serializer_class = CustomerInvoiceSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'invoice_id'
    lookup_url_kwarg = 'invoice_id'
    
    def get_queryset(self):
        # Only allow users to access their own invoices
        return CustomerInvoice.objects.filter(
            order__customer=self.request.user
        ).select_related('order', 'order__customer').prefetch_related('payments')
    
    def get_object(self):
        """Override to use invoice_id from URL."""
        invoice_id = self.kwargs.get('invoice_id')
        try:
            return self.get_queryset().get(id=invoice_id)
        except CustomerInvoice.DoesNotExist:
            from django.http import Http404
            raise Http404("Invoice not found")


class CreatePaymentOrderView(APIView):
    """
    Create a Razorpay payment order for an invoice.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreatePaymentOrderSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            invoice_id = serializer.validated_data['invoice_id']
            amount = serializer.validated_data.get('amount')
            
            # Create Razorpay order using PaymentService
            payment, razorpay_order = PaymentService.create_razorpay_order(
                invoice_id=invoice_id,
                amount=amount
            )
            
            # Return payment and order details
            return Response({
                'success': True,
                'payment_id': payment.id,
                'razorpay_order_id': razorpay_order['id'],
                'amount': float(payment.amount),
                'currency': razorpay_order['currency'],
                'invoice_id': invoice_id,
                'razorpay_key': getattr(settings, 'RAZORPAY_API_KEY', ''),
            }, status=status.HTTP_201_CREATED)
            
        except DjangoValidationError as e:
            logger.error(f"Payment order creation failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in payment order creation: {str(e)}")
            return Response(
                {'error': 'Failed to create payment order. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class VerifyPaymentView(APIView):
    """
    Verify Razorpay payment signature and update payment status.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response(
                {'error': 'Invalid data', 'details': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            payment_id = serializer.validated_data['payment_id']
            razorpay_payment_id = serializer.validated_data['razorpay_payment_id']
            razorpay_signature = serializer.validated_data['razorpay_signature']
            
            # Verify payment using PaymentService
            payment = PaymentService.verify_razorpay_payment(
                payment_id=payment_id,
                razorpay_payment_id=razorpay_payment_id,
                razorpay_signature=razorpay_signature
            )
            
            # Return updated payment details
            payment_serializer = PaymentSerializer(payment)
            return Response({
                'success': True,
                'message': 'Payment verified successfully',
                'payment': payment_serializer.data
            }, status=status.HTTP_200_OK)
            
        except DjangoValidationError as e:
            logger.error(f"Payment verification failed: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Unexpected error in payment verification: {str(e)}")
            return Response(
                {'error': 'Payment verification failed. Please contact support.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentDetailView(generics.RetrieveAPIView):
    """
    Retrieve details of a specific payment.
    """
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'payment_id'
    lookup_url_kwarg = 'payment_id'
    
    def get_queryset(self):
        # Only allow users to access their own payments
        return Payment.objects.filter(
            customer_invoice__order__customer=self.request.user
        ).select_related('customer_invoice', 'customer_invoice__order')
    
    def get_object(self):
        """Override to use payment_id from URL."""
        payment_id = self.kwargs.get('payment_id')
        try:
            return self.get_queryset().get(id=payment_id)
        except Payment.DoesNotExist:
            from django.http import Http404
            raise Http404("Payment not found")

# Cart Views
class CartView(APIView):
    """
    Get or create user's cart with items.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get user's cart with all items."""
        try:
            cart, created = Cart.objects.get_or_create(user=request.user)
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error fetching cart: {str(e)}")
            return Response(
                {'error': 'Failed to fetch cart'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AddToCartView(APIView):
    """
    Add item to cart or update quantity if item already exists.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Add product to cart."""
        try:
            product_id = request.data.get('product_id')
            quantity = int(request.data.get('quantity', 1))
            
            if not product_id:
                return Response(
                    {'error': 'Product ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if quantity <= 0:
                return Response(
                    {'error': 'Quantity must be greater than 0'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get or create cart
            cart, created = Cart.objects.get_or_create(user=request.user)
            
            # Get product
            try:
                product = Product.objects.get(id=product_id, published=True)
            except Product.DoesNotExist:
                return Response(
                    {'error': 'Product not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check stock availability
            if product.current_stock < quantity:
                return Response(
                    {'error': f'Only {product.current_stock} items available in stock'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Add or update cart item
            cart_item, created = CartItem.objects.get_or_create(
                cart=cart,
                product=product,
                defaults={'quantity': quantity}
            )
            
            if not created:
                # Update quantity if item already exists
                new_quantity = cart_item.quantity + quantity
                if product.current_stock < new_quantity:
                    return Response(
                        {'error': f'Only {product.current_stock} items available in stock'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                cart_item.quantity = new_quantity
                cart_item.save()
            
            # Return updated cart
            cart_serializer = CartSerializer(cart)
            return Response({
                'success': True,
                'message': f'{product.product_name} added to cart',
                'cart': cart_serializer.data
            })
            
        except ValueError:
            return Response(
                {'error': 'Invalid quantity value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error adding to cart: {str(e)}")
            return Response(
                {'error': 'Failed to add item to cart'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UpdateCartItemView(APIView):
    """
    Update quantity of a cart item.
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request, item_id):
        """Update cart item quantity."""
        try:
            quantity = int(request.data.get('quantity', 1))
            
            if quantity <= 0:
                return Response(
                    {'error': 'Quantity must be greater than 0'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get cart item
            try:
                cart_item = CartItem.objects.select_related('cart', 'product').get(
                    id=item_id,
                    cart__user=request.user
                )
            except CartItem.DoesNotExist:
                return Response(
                    {'error': 'Cart item not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check stock availability
            if cart_item.product.current_stock < quantity:
                return Response(
                    {'error': f'Only {cart_item.product.current_stock} items available in stock'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Update quantity
            cart_item.quantity = quantity
            cart_item.save()
            
            # Return updated cart
            cart_serializer = CartSerializer(cart_item.cart)
            return Response({
                'success': True,
                'message': 'Cart updated successfully',
                'cart': cart_serializer.data
            })
            
        except ValueError:
            return Response(
                {'error': 'Invalid quantity value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f"Error updating cart item: {str(e)}")
            return Response(
                {'error': 'Failed to update cart item'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class RemoveFromCartView(APIView):
    """
    Remove item from cart.
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, item_id):
        """Remove item from cart."""
        try:
            # Get cart item
            try:
                cart_item = CartItem.objects.select_related('cart', 'product').get(
                    id=item_id,
                    cart__user=request.user
                )
            except CartItem.DoesNotExist:
                return Response(
                    {'error': 'Cart item not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            product_name = cart_item.product.product_name
            cart = cart_item.cart
            cart_item.delete()
            
            # Return updated cart
            cart_serializer = CartSerializer(cart)
            return Response({
                'success': True,
                'message': f'{product_name} removed from cart',
                'cart': cart_serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error removing from cart: {str(e)}")
            return Response(
                {'error': 'Failed to remove item from cart'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ClearCartView(APIView):
    """
    Clear all items from cart.
    """
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        """Clear all items from cart."""
        try:
            cart, created = Cart.objects.get_or_create(user=request.user)
            cart.items.all().delete()
            
            cart_serializer = CartSerializer(cart)
            return Response({
                'success': True,
                'message': 'Cart cleared successfully',
                'cart': cart_serializer.data
            })
            
        except Exception as e:
            logger.error(f"Error clearing cart: {str(e)}")
            return Response(
                {'error': 'Failed to clear cart'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# Order Views
class OrderListView(generics.ListAPIView):
    """
    List all orders for the authenticated user.
    """
    serializer_class = SaleOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SaleOrder.objects.filter(
            customer=self.request.user
        ).select_related('customer', 'payment_term', 'applied_coupon').prefetch_related(
            'lines__product', 'invoices', 'invoices__payments'
        ).order_by('-order_date')


class OrderDetailView(generics.RetrieveAPIView):
    """
    Retrieve detailed information about a specific order.
    """
    serializer_class = SaleOrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return SaleOrder.objects.filter(
            customer=self.request.user
        ).select_related('customer', 'payment_term', 'applied_coupon').prefetch_related(
            'lines__product', 'invoices', 'invoices__payments'
        )


class CheckoutView(APIView):
    """
    Create order from cart items.
    """
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        """Create order from cart."""
        try:
            # Get user's cart
            try:
                cart = Cart.objects.prefetch_related('items__product').get(user=request.user)
            except Cart.DoesNotExist:
                return Response(
                    {'error': 'Cart is empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not cart.items.exists():
                return Response(
                    {'error': 'Cart is empty'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get default payment term
            try:
                payment_term = PaymentTerm.objects.get(is_default=True)
            except PaymentTerm.DoesNotExist:
                # Create default payment term if none exists
                payment_term = PaymentTerm.objects.create(
                    name='Immediate Payment',
                    early_payment_discount=False,
                    is_default=True,
                    example_preview='Payment due immediately upon invoice generation.'
                )
            
            # Calculate totals
            subtotal = cart.get_total()
            discount_amount = 0  # TODO: Apply coupon logic if needed
            total_amount = subtotal - discount_amount
            
            # Create sale order
            order = SaleOrder.objects.create(
                customer=request.user,
                subtotal=subtotal,
                discount_amount=discount_amount,
                total_amount=total_amount,
                payment_term=payment_term,
                status='confirmed'
            )
            
            # Create order lines
            for cart_item in cart.items.all():
                # Check stock availability
                if cart_item.product.current_stock < cart_item.quantity:
                    raise Exception(f'Insufficient stock for {cart_item.product.product_name}')
                
                # Create order line
                SaleOrderLine.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product.sales_price,
                    line_total=cart_item.get_total()
                )
                
                # Update stock
                cart_item.product.current_stock -= cart_item.quantity
                cart_item.product.save()
            
            # Create invoice
            invoice = CustomerInvoice.objects.create(
                order=order,
                due_date=timezone.now().date() + timedelta(days=30),
                total_amount=total_amount,
                status='confirmed'
            )
            
            # Clear cart
            cart.items.all().delete()
            
            # Return order details
            order_serializer = SaleOrderSerializer(order)
            return Response({
                'success': True,
                'message': 'Order created successfully',
                'order': order_serializer.data,
                'invoice_id': invoice.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            return Response(
                {'error': f'Failed to create order: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )