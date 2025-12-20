from django.db import transaction
from django.db.models import F
from .models import Product
from rest_framework.exceptions import ValidationError

class StockUpdateService:
    @staticmethod
    def update_stock(product_id: int, quantity_change: int, transaction_type: str):
        """
        Updates the stock of a product safely using SELECT ... FOR UPDATE.
        
        Args:
            product_id: ID of the product to update.
            quantity_change: Amount to change stock by (must be positive).
            transaction_type: 'increase' (e.g. VendorBill) or 'decrease' (e.g. CustomerInvoice).
        """
        if quantity_change <= 0:
            raise ValidationError("Quantity change must be positive.")

        with transaction.atomic():
            # Lock the row for update to prevent race conditions
            try:
                product = Product.objects.select_for_update().get(id=product_id)
            except Product.DoesNotExist:
                raise ValidationError(f"Product with id {product_id} does not exist.")

            if transaction_type == 'increase':
                # VendorBill confirmation
                product.current_stock += quantity_change
            elif transaction_type == 'decrease':
                # CustomerInvoice confirmation
                # Check for sufficient stock is implied by the DB constraint, 
                # but good to check in app logic too for better error message.
                if product.current_stock < quantity_change:
                     raise ValidationError(f"Insufficient stock for product {product.product_name}. Current: {product.current_stock}, Requested: {quantity_change}")
                product.current_stock -= quantity_change
            else:
                raise ValidationError("Invalid transaction type. Must be 'increase' or 'decrease'.")

            product.save()
            return product.current_stock
