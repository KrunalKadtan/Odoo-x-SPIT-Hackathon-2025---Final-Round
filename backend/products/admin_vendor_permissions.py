"""
Permission classes for Admin and Vendor User APIs.

Implements role-based access control for:
- Admin users (role='internal')
- Vendor users (role='vendor')
"""

from rest_framework import permissions


class IsAdminUserRole(permissions.BasePermission):
    """
    Permission class that allows only admin users (role='internal').
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and has admin role."""
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'internal'
        )


class IsVendorUserRole(permissions.BasePermission):
    """
    Permission class that allows only vendor users (role='vendor').
    """
    
    def has_permission(self, request, view):
        """Check if user is authenticated and has vendor role."""
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'vendor'
        )


class IsVendorObjectOwner(permissions.BasePermission):
    """
    Permission class that allows vendor users to access only their own objects.
    
    Checks if the object is linked to the vendor user's contact.
    Works with objects that have:
    - vendor attribute (ForeignKey to Contact)
    - purchase_order.vendor attribute (nested relationship)
    """
    
    def has_object_permission(self, request, view, obj):
        """Check if vendor user owns the object."""
        # Admin users have full access
        if request.user.role == 'internal':
            return True
        
        # Vendor users can only access their own objects
        if request.user.role == 'vendor':
            # Check if user has a linked contact
            if not hasattr(request.user, 'contact') or not request.user.contact:
                return False
            
            vendor_contact = request.user.contact
            
            # Check direct vendor attribute
            if hasattr(obj, 'vendor'):
                return obj.vendor == vendor_contact
            
            # Check nested vendor through purchase_order
            if hasattr(obj, 'purchase_order') and hasattr(obj.purchase_order, 'vendor'):
                return obj.purchase_order.vendor == vendor_contact
            
            # Check nested vendor through vendor_bill
            if hasattr(obj, 'vendor_bill') and hasattr(obj.vendor_bill, 'vendor'):
                return obj.vendor_bill.vendor == vendor_contact
        
        return False
