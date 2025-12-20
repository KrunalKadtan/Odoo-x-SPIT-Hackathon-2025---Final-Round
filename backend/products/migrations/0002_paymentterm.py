# Generated migration for PaymentTerm model
from django.db import migrations, models
import django.core.validators


def create_default_payment_term(apps, schema_editor):
    """
    Create the default "Immediate Payment" term.
    """
    PaymentTerm = apps.get_model('products', 'PaymentTerm')
    PaymentTerm.objects.get_or_create(
        name='Immediate Payment',
        defaults={
            'early_payment_discount': False,
            'discount_percentage': 0.00,
            'discount_days': 0,
            'is_default': True,
            'example_preview': 'Payment is due immediately upon invoice receipt.',
        }
    )


def remove_default_payment_term(apps, schema_editor):
    """
    Remove the default payment term (for migration rollback).
    """
    PaymentTerm = apps.get_model('products', 'PaymentTerm')
    PaymentTerm.objects.filter(name='Immediate Payment').delete()


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='PaymentTerm',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(
                    db_index=True,
                    help_text='Unique name for the payment term',
                    max_length=255,
                    unique=True
                )),
                ('early_payment_discount', models.BooleanField(
                    default=False,
                    help_text='Whether this term offers early payment discounts'
                )),
                ('discount_percentage', models.DecimalField(
                    decimal_places=2,
                    default=0.0,
                    help_text='Discount percentage (0-100)',
                    max_digits=5,
                    validators=[
                        django.core.validators.MinValueValidator(0.0),
                        django.core.validators.MaxValueValidator(100.0)
                    ]
                )),
                ('discount_days', models.IntegerField(
                    default=0,
                    help_text='Number of days to qualify for early payment discount',
                    validators=[django.core.validators.MinValueValidator(0)]
                )),
                ('early_pay_discount_computation', models.CharField(
                    blank=True,
                    choices=[
                        ('percentage_of_total', 'Percentage of Total Amount'),
                        ('fixed_amount', 'Fixed Amount Discount')
                    ],
                    help_text='Method to calculate early payment discount',
                    max_length=50,
                    null=True
                )),
                ('example_preview', models.TextField(
                    blank=True,
                    help_text='Example showing how this payment term works',
                    null=True
                )),
                ('is_default', models.BooleanField(
                    default=False,
                    help_text='Whether this is the default payment term'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Payment Term',
                'verbose_name_plural': 'Payment Terms',
                'db_table': 'payment_terms',
                'ordering': ['name'],
            },
        ),
        migrations.AddConstraint(
            model_name='paymentterm',
            constraint=models.CheckConstraint(
                check=models.Q(
                    ('discount_percentage__gte', 0),
                    ('discount_percentage__lte', 100)
                ),
                name='valid_discount_percentage'
            ),
        ),
        migrations.AddConstraint(
            model_name='paymentterm',
            constraint=models.CheckConstraint(
                check=models.Q(('discount_days__gte', 0)),
                name='valid_discount_days'
            ),
        ),
        migrations.AddIndex(
            model_name='paymentterm',
            index=models.Index(fields=['name'], name='payment_term_name_idx'),
        ),
        migrations.AddIndex(
            model_name='paymentterm',
            index=models.Index(fields=['is_default'], name='payment_term_default_idx'),
        ),
        migrations.RunPython(
            create_default_payment_term,
            reverse_code=remove_default_payment_term
        ),
    ]
