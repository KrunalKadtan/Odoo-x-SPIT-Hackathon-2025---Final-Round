from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.contrib.auth import get_user_model
from django.db.models import Count, Q, Sum
from django.utils import timezone
from datetime import timedelta
from .models import User
from .serializers import UserProfileSerializer
from products.models import SaleOrder, CustomerInvoice, Product, Payment

User = get_user_model()


class AdminPermission(BasePermission):
    """Custom permission class for admin-only access"""
    
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'internal'
        )


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin viewset for managing users"""
    
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated, AdminPermission]
    
    def get_queryset(self):
        """Filter users based on query parameters"""
        queryset = User.objects.all()
        
        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by name or email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | Q(email__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get user statistics"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        
        # Users by role
        role_stats = User.objects.values('role').annotate(count=Count('id'))
        
        # Recent registrations (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_registrations = User.objects.filter(
            created_at__gte=thirty_days_ago
        ).count()
        
        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': total_users - active_users,
            'role_distribution': {item['role']: item['count'] for item in role_stats},
            'recent_registrations': recent_registrations
        })
    
    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Toggle user active status"""
        user = self.get_object()
        user.is_active = not user.is_active
        user.save()
        
        return Response({
            'message': f'User {"activated" if user.is_active else "deactivated"} successfully',
            'is_active': user.is_active
        })
    
    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get('role')
        
        if new_role not in ['customer', 'vendor', 'internal']:
            return Response(
                {'error': 'Invalid role'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.role = new_role
        user.save()
        
        return Response({
            'message': f'User role changed to {new_role}',
            'role': user.role
        })


class AdminDashboardViewSet(viewsets.ViewSet):
    """Admin dashboard data and metrics"""
    
    permission_classes = [IsAuthenticated, AdminPermission]
    
    @action(detail=False, methods=['get'])
    def metrics(self, request):
        """Get dashboard metrics"""
        # User metrics
        total_users = User.objects.count()
        total_customers = User.objects.filter(role='customer').count()
        total_vendors = User.objects.filter(role='vendor').count()
        
        # Order metrics
        total_orders = SaleOrder.objects.count()
        pending_orders = SaleOrder.objects.filter(status='pending').count()
        confirmed_orders = SaleOrder.objects.filter(status='confirmed').count()
        
        # Revenue metrics
        total_revenue = SaleOrder.objects.filter(
            status='confirmed'
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # Product metrics
        total_products = Product.objects.count()
        published_products = Product.objects.filter(published=True).count()
        
        # Recent activity (last 7 days)
        seven_days_ago = timezone.now() - timedelta(days=7)
        recent_users = User.objects.filter(created_at__gte=seven_days_ago).count()
        recent_orders = SaleOrder.objects.filter(created_at__gte=seven_days_ago).count()
        
        return Response({
            'users': {
                'total': total_users,
                'customers': total_customers,
                'vendors': total_vendors,
                'recent': recent_users
            },
            'orders': {
                'total': total_orders,
                'pending': pending_orders,
                'confirmed': confirmed_orders,
                'recent': recent_orders
            },
            'revenue': {
                'total': total_revenue
            },
            'products': {
                'total': total_products,
                'published': published_products
            }
        })
    
    @action(detail=False, methods=['get'])
    def recent_activity(self, request):
        """Get recent system activity"""
        # Recent user registrations
        recent_users = User.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).order_by('-created_at')[:10]
        
        # Recent orders
        recent_orders = SaleOrder.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=7)
        ).select_related('customer').order_by('-created_at')[:10]
        
        activities = []
        
        # Add user activities
        for user in recent_users:
            activities.append({
                'type': 'user_registration',
                'description': f'New user registered: {user.name}',
                'timestamp': user.created_at,
                'user': user.name,
                'user_email': user.email
            })
        
        # Add order activities
        for order in recent_orders:
            activities.append({
                'type': 'order_created',
                'description': f'New order #{order.id} by {order.customer.name}',
                'timestamp': order.created_at,
                'user': order.customer.name,
                'amount': float(order.total_amount)
            })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response(activities[:20])  # Return top 20 activities


class AdminAnalyticsViewSet(viewsets.ViewSet):
    """Admin analytics and reporting"""
    
    permission_classes = [IsAuthenticated, AdminPermission]
    
    @action(detail=False, methods=['get'])
    def user_growth(self, request):
        """Get user growth analytics"""
        # Get user registrations by month for the last 12 months
        from django.db.models import Count
        from django.db.models.functions import TruncMonth
        
        twelve_months_ago = timezone.now() - timedelta(days=365)
        
        user_growth = User.objects.filter(
            created_at__gte=twelve_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        return Response(list(user_growth))
    
    @action(detail=False, methods=['get'])
    def revenue_analytics(self, request):
        """Get revenue analytics"""
        from django.db.models import Sum
        from django.db.models.functions import TruncMonth
        
        twelve_months_ago = timezone.now() - timedelta(days=365)
        
        revenue_data = SaleOrder.objects.filter(
            created_at__gte=twelve_months_ago,
            status='confirmed'
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            revenue=Sum('total_amount')
        ).order_by('month')
        
        return Response(list(revenue_data))
    
    @action(detail=False, methods=['get'])
    def order_analytics(self, request):
        """Get order analytics"""
        # Order status distribution
        order_status = SaleOrder.objects.values('status').annotate(
            count=Count('id')
        )
        
        # Orders by month
        from django.db.models.functions import TruncMonth
        twelve_months_ago = timezone.now() - timedelta(days=365)
        
        orders_by_month = SaleOrder.objects.filter(
            created_at__gte=twelve_months_ago
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            count=Count('id')
        ).order_by('month')
        
        return Response({
            'status_distribution': list(order_status),
            'monthly_orders': list(orders_by_month)
        })


class AdminSystemViewSet(viewsets.ViewSet):
    """Admin system management"""
    
    permission_classes = [IsAuthenticated, AdminPermission]
    
    @action(detail=False, methods=['get'])
    def system_health(self, request):
        """Get system health status"""
        from django.db import connection
        
        # Database health
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                db_status = "healthy"
        except Exception:
            db_status = "error"
        
        # Basic system metrics
        total_users = User.objects.count()
        total_orders = SaleOrder.objects.count()
        total_products = Product.objects.count()
        
        return Response({
            'database': db_status,
            'total_users': total_users,
            'total_orders': total_orders,
            'total_products': total_products,
            'timestamp': timezone.now()
        })
    
    @action(detail=False, methods=['get'])
    def audit_logs(self, request):
        """Get system audit logs (placeholder)"""
        # This would typically connect to a logging system
        # For now, return recent activities as audit logs
        
        recent_activities = []
        
        # Recent user activities
        recent_users = User.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).order_by('-created_at')[:50]
        
        for user in recent_users:
            recent_activities.append({
                'timestamp': user.created_at,
                'action': 'USER_CREATED',
                'user': user.email,
                'details': f'User {user.name} registered'
            })
        
        # Recent order activities
        recent_orders = SaleOrder.objects.filter(
            created_at__gte=timezone.now() - timedelta(days=30)
        ).select_related('customer').order_by('-created_at')[:50]
        
        for order in recent_orders:
            recent_activities.append({
                'timestamp': order.created_at,
                'action': 'ORDER_CREATED',
                'user': order.customer.email,
                'details': f'Order #{order.id} created for ₹{order.total_amount}'
            })
        
        # Sort by timestamp
        recent_activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response(recent_activities[:100])