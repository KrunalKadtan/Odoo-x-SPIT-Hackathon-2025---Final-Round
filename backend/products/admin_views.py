from django.db import transaction
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.core.exceptions import ValidationError
from .models import Product, ProductColor
from .admin_serializers import ProductSerializer, ProductCreateSerializer
from accounts.models import User


class ProductPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_products(request):
    """
    Admin products API endpoint.
    
    GET: List all products with filtering and pagination
    POST: Create a new product
    
    Only accessible by internal users (admin/staff).
    """
    # Check if user is internal
    if request.user.role != 'internal':
        return Response(
            {'error': 'Access denied. Internal users only.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        # Get query parameters
        status_filter = request.GET.get('status', 'all')  # all, new, confirmed, archived
        published_filter = request.GET.get('published')  # true, false
        search = request.GET.get('search', '')
        
        # Start with all products
        queryset = Product.objects.all().order_by('-created_at')
        
        # Apply status filter (this would need additional status field in model)
        # For now, we'll use published as a proxy
        if status_filter == 'new':
            queryset = queryset.filter(published=False)
        elif status_filter == 'confirmed':
            queryset = queryset.filter(published=True)
        # archived would need a separate field
        
        # Apply published filter
        if published_filter is not None:
            is_published = published_filter.lower() == 'true'
            queryset = queryset.filter(published=is_published)
        
        # Apply search filter
        if search:
            queryset = queryset.filter(
                product_name__icontains=search
            )
        
        # Paginate results
        paginator = ProductPagination()
        page = paginator.paginate_queryset(queryset, request)
        
        if page is not None:
            serializer = ProductSerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)
        
        serializer = ProductSerializer(queryset, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create new product
        serializer = ProductCreateSerializer(data=request.data)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Create product
                    product = serializer.save()
                    
                    # Handle colors if provided
                    colors = request.data.get('colors', [])
                    if colors:
                        for color in colors:
                            ProductColor.objects.create(
                                product=product,
                                color=color.strip()
                            )
                    
                    # Return created product with colors
                    response_serializer = ProductSerializer(product)
                    return Response(
                        response_serializer.data,
                        status=status.HTTP_201_CREATED
                    )
            
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    {'error': f'Product creation failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_product_detail(request, product_id):
    """
    Admin product detail API endpoint.
    
    GET: Get single product details
    PUT: Update product
    DELETE: Delete product
    
    Only accessible by internal users (admin/staff).
    """
    # Check if user is internal
    if request.user.role != 'internal':
        return Response(
            {'error': 'Access denied. Internal users only.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ProductCreateSerializer(product, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Update product
                    product = serializer.save()
                    
                    # Handle colors update if provided
                    if 'colors' in request.data:
                        colors = request.data.get('colors', [])
                        # Remove existing colors
                        ProductColor.objects.filter(product=product).delete()
                        # Add new colors
                        for color in colors:
                            ProductColor.objects.create(
                                product=product,
                                color=color.strip()
                            )
                    
                    # Return updated product
                    response_serializer = ProductSerializer(product)
                    return Response(response_serializer.data)
            
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            except Exception as e:
                return Response(
                    {'error': f'Product update failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    elif request.method == 'DELETE':
        try:
            product.delete()
            return Response(
                {'message': 'Product deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return Response(
                {'error': f'Product deletion failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_product_toggle_published(request, product_id):
    """
    Toggle product published status.
    
    PATCH: Toggle published status
    
    Only accessible by internal users (admin/staff).
    """
    # Check if user is internal
    if request.user.role != 'internal':
        return Response(
            {'error': 'Access denied. Internal users only.'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Product not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Toggle published status
    published = request.data.get('published')
    if published is not None:
        product.published = published
    else:
        product.published = not product.published
    
    product.save()
    
    serializer = ProductSerializer(product)
    return Response(serializer.data)