"""
Custom permission classes for ApparelDesk REST APIs.
"""
from rest_framework import permissions


class IsInternalUser(permissions.BasePermission):
    """
    Permission class that allows only internal users.
    Internal users have role='internal' and can perform administrative operations.
    """
    
    def has_permission(self, request, view):
        """
        Check if user is authenticated and has internal role.
        """
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'internal'
        )


class IsOwnerOrInternal(permissions.BasePermission):
    """
    Permission class that allows owners to access their own resources 
    or internal users to access all resources.
    
    This is used for resources that have a customer/owner relationship,
    such as orders, invoices, and payments.
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Check if user is internal or owns the resource.
        """
        # Internal users can access all resources
        if request.user.role == 'internal':
            return True
        
        # Check if object has customer attribute (SaleOrder, etc.)
        if hasattr(obj, 'customer'):
            return obj.customer == request.user
        
        # Check if object has order.customer attribute (CustomerInvoice)
        if hasattr(obj, 'order') and hasattr(obj.order, 'customer'):
            return obj.order.customer == request.user
        
        # Check if object has customer_invoice.order.customer (Payment)
        if hasattr(obj, 'customer_invoice') and obj.customer_invoice:
            if hasattr(obj.customer_invoice, 'order'):
                return obj.customer_invoice.order.customer == request.user
        
        # Default deny
        return False
