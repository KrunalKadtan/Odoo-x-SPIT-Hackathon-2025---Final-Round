from django.contrib import admin
from django.core.exceptions import ValidationError
from .models import PaymentTerm

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
