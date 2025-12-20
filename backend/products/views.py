from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Product, ProductColor
from .serializers import ProductSerializer, ProductDetailSerializer

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
