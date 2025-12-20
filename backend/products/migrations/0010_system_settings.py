# Generated migration for SystemSettings model
# Ported from project-aarav codebase

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('products', '0009_alter_saleorder_payment_term'),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemSettings',
            fields=[
                ('id', models.IntegerField(default=1, help_text='Always 1 for singleton pattern', primary_key=True, serialize=False)),
                ('automatic_invoicing', models.BooleanField(default=False, help_text='Enable automatic invoice generation from confirmed orders')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'System Settings',
                'verbose_name_plural': 'System Settings',
                'db_table': 'system_settings',
            },
        ),
        migrations.AddConstraint(
            model_name='systemsettings',
            constraint=models.CheckConstraint(check=models.Q(('id', 1)), name='system_settings_singleton'),
        ),
    ]
