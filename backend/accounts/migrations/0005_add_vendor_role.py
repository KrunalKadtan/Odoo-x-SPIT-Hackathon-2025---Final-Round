# Generated migration to add vendor role to User model
# Ported from project-aarav codebase

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_user_address'),
    ]

    operations = [
        # Update role choices to include vendor
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('internal', 'Internal Staff'), ('portal', 'Portal User'), ('vendor', 'Vendor User')],
                db_index=True,
                default='portal',
                max_length=10
            ),
        ),
        
        # Remove old constraint
        migrations.RemoveConstraint(
            model_name='user',
            name='valid_role',
        ),
        
        # Add new constraint with vendor role
        migrations.AddConstraint(
            model_name='user',
            constraint=models.CheckConstraint(
                check=models.Q(role__in=['internal', 'portal', 'vendor']),
                name='valid_role'
            ),
        ),
    ]
