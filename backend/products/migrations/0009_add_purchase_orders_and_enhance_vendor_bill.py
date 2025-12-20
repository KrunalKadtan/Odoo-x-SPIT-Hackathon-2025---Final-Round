# Generated migration for Purchase Orders and enhanced Vendor Bill

from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
from decimal import Decimal
import datetime


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0008_system_settings'),
        ('accounts', '0003_contact_contact_valid_contact_type'),
    ]

    operations = [
        # Create PurchaseOrder model
        migrations.CreateModel(
            name='PurchaseOrder',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('order_date', models.DateTimeField(auto_now_add=True, db_index=True, help_text='Date and time when purchase order was created')),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')], db_index=True, default='draft', help_text='Current status of the purchase order', max_length=20)),
                ('subtotal', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Sum of all line item totals', max_digits=12)),
                ('tax_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Total tax amount', max_digits=12)),
                ('total_amount', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Final total including tax', max_digits=12)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('vendor', models.ForeignKey(db_index=True, help_text='Vendor contact for this purchase order', on_delete=django.db.models.deletion.PROTECT, related_name='purchase_orders', to='accounts.contact')),
            ],
            options={
                'verbose_name': 'Purchase Order',
                'verbose_name_plural': 'Purchase Orders',
                'db_table': 'purchase_orders',
                'ordering': ['-order_date'],
            },
        ),
        
        # Create PurchaseOrderLine model
        migrations.CreateModel(
            name='PurchaseOrderLine',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('quantity', models.IntegerField(help_text='Quantity ordered (must be positive)', validators=[django.core.validators.MinValueValidator(1)])),
                ('unit_price', models.DecimalField(decimal_places=2, help_text='Unit price at time of order (from Product.purchase_price)', max_digits=10)),
                ('tax_percentage', models.DecimalField(decimal_places=2, default=0.0, help_text='Tax percentage for this line', max_digits=5)),
                ('line_subtotal', models.DecimalField(decimal_places=2, help_text='Line subtotal (quantity * unit_price)', max_digits=12)),
                ('line_tax', models.DecimalField(decimal_places=2, default=Decimal('0.00'), help_text='Tax amount for this line', max_digits=12)),
                ('line_total', models.DecimalField(decimal_places=2, help_text='Line total (subtotal + tax)', max_digits=12)),
                ('product', models.ForeignKey(db_index=True, help_text='Product being ordered', on_delete=django.db.models.deletion.PROTECT, related_name='purchase_order_lines', to='products.product')),
                ('purchase_order', models.ForeignKey(db_index=True, help_text='Parent purchase order', on_delete=django.db.models.deletion.CASCADE, related_name='lines', to='products.purchaseorder')),
            ],
            options={
                'verbose_name': 'Purchase Order Line',
                'verbose_name_plural': 'Purchase Order Lines',
                'db_table': 'purchase_order_lines',
                'ordering': ['id'],
            },
        ),
        
        # Add indexes for PurchaseOrder
        migrations.AddIndex(
            model_name='purchaseorder',
            index=models.Index(fields=['vendor'], name='purchase_order_vendor_idx'),
        ),
        migrations.AddIndex(
            model_name='purchaseorder',
            index=models.Index(fields=['order_date'], name='purchase_order_date_idx'),
        ),
        migrations.AddIndex(
            model_name='purchaseorder',
            index=models.Index(fields=['status'], name='purchase_order_status_idx'),
        ),
        
        # Add constraint for PurchaseOrderLine
        migrations.AddConstraint(
            model_name='purchaseorderline',
            constraint=models.CheckConstraint(check=models.Q(('quantity__gt', 0)), name='valid_purchase_line_quantity'),
        ),
        
        # Add indexes for PurchaseOrderLine
        migrations.AddIndex(
            model_name='purchaseorderline',
            index=models.Index(fields=['purchase_order'], name='purchase_line_order_idx'),
        ),
        migrations.AddIndex(
            model_name='purchaseorderline',
            index=models.Index(fields=['product'], name='purchase_line_product_idx'),
        ),
        
        # Enhance VendorBill - Add new fields
        migrations.AddField(
            model_name='vendorbill',
            name='purchase_order',
            field=models.ForeignKey(db_index=True, help_text='Source purchase order for this bill', on_delete=django.db.models.deletion.PROTECT, related_name='vendor_bills', to='products.purchaseorder', null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='vendorbill',
            name='vendor',
            field=models.ForeignKey(db_index=True, help_text='Vendor for this bill', on_delete=django.db.models.deletion.PROTECT, related_name='vendor_bills', to='accounts.contact', null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='vendorbill',
            name='bill_date',
            field=models.DateField(db_index=True, default=datetime.date.today, help_text='Date when bill was created'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='vendorbill',
            name='due_date',
            field=models.DateField(help_text='Payment due date', null=True),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='vendorbill',
            name='status',
            field=models.CharField(choices=[('draft', 'Draft'), ('confirmed', 'Confirmed'), ('cancelled', 'Cancelled')], db_index=True, default='draft', help_text='Current status of the bill', max_length=20),
        ),
        migrations.AddField(
            model_name='vendorbill',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        
        # Add indexes for VendorBill
        migrations.AddIndex(
            model_name='vendorbill',
            index=models.Index(fields=['vendor'], name='vendor_bill_vendor_idx'),
        ),
        migrations.AddIndex(
            model_name='vendorbill',
            index=models.Index(fields=['bill_date'], name='vendor_bill_date_idx'),
        ),
        migrations.AddIndex(
            model_name='vendorbill',
            index=models.Index(fields=['status'], name='vendor_bill_status_idx'),
        ),
    ]
