from django.contrib import admin
from django.core.exceptions import ValidationError
from .models import PaymentTerm, SystemSettings

@admin.register(PaymentTerm)
class PaymentTermAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'early_payment_discount',
        'discount_percentage',
        'discount_days',
        'is_default',
        'created_at'
    )
    list_filter = ('early_payment_discount', 'is_default', 'created_at')
    search_fields = ('name', 'example_preview')
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('name',)
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'is_default', 'example_preview')
        }),
        ('Early Payment Discount', {
            'fields': (
                'early_payment_discount',
                'discount_percentage',
                'discount_days',
                'early_pay_discount_computation'
            ),
            'description': 'Configure early payment discount terms'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def delete_model(self, request, obj):
        """
        Override delete to show friendly error for default term.
        """
        try:
            obj.delete()
        except ValidationError as e:
            self.message_user(request, str(e), level='error')
    
    def delete_queryset(self, request, queryset):
        """
        Override bulk delete to prevent deletion of default term.
        """
        default_terms = queryset.filter(is_default=True)
        if default_terms.exists():
            self.message_user(
                request,
                "Cannot delete default payment term(s).",
                level='error'
            )
            queryset = queryset.exclude(is_default=True)
        
        queryset.delete()


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """
    Admin interface for SystemSettings singleton.
    Only allows editing the single instance, not creating or deleting.
    """
    
    def has_add_permission(self, request):
        """Prevent adding new instances (singleton pattern)."""
        return False
    
    def has_delete_permission(self, request, obj=None):
        """Prevent deleting the singleton instance."""
        return False
    
    def changelist_view(self, request, extra_context=None):
        """Redirect to the edit page for the singleton instance."""
        from django.shortcuts import redirect
        obj = SystemSettings.load()
        return redirect('admin:products_systemsettings_change', obj.pk)
    
    fieldsets = (
        ('System Configuration', {
            'fields': ('automatic_invoicing',),
            'description': 'Configure system-wide settings'
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    
    def get_object(self, request, object_id, from_field=None):
        """Always return the singleton instance."""
        return SystemSettings.load()
