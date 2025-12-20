# Generated migration for enhanced User model
from django.db import migrations, models
import django.core.validators
from django.utils import timezone


def migrate_user_data(apps, schema_editor):
    """
    Migrate data from AbstractUser fields to new fields.
    Populates name from first_name/last_name and sets role based on is_staff.
    """
    User = apps.get_model('accounts', 'User')
    for user in User.objects.all():
        # Combine first_name and last_name into name
        if hasattr(user, 'first_name') and hasattr(user, 'last_name'):
            full_name = f"{user.first_name} {user.last_name}".strip()
            user.name = full_name if full_name else user.email
        else:
            user.name = user.email
        
        # Set role based on is_staff
        if user.is_staff:
            user.role = 'internal'
        else:
            user.role = 'portal'
        
        user.save()


def reverse_migrate_user_data(apps, schema_editor):
    """
    Reverse migration: populate first_name/last_name from name.
    """
    User = apps.get_model('accounts', 'User')
    for user in User.objects.all():
        if hasattr(user, 'name') and user.name:
            name_parts = user.name.split(maxsplit=1)
            user.first_name = name_parts[0] if len(name_parts) > 0 else ''
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
            user.save()


class Migration(migrations.Migration):
    
    dependencies = [
        ('accounts', '0001_initial'),
    ]
    
    operations = [
        # Step 1: Add new fields with defaults/nulls
        migrations.AddField(
            model_name='user',
            name='name',
            field=models.CharField(max_length=255, default=''),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='user',
            name='role',
            field=models.CharField(
                max_length=10,
                choices=[('internal', 'Internal Staff'), ('portal', 'Portal User')],
                default='portal',
                db_index=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='mobile',
            field=models.CharField(
                max_length=15,
                validators=[
                    django.core.validators.RegexValidator(
                        regex=r'^\+?1?\d{9,15}$',
                        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
                    )
                ],
                blank=True,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='city',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='state',
            field=models.CharField(max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='pincode',
            field=models.CharField(
                max_length=6,
                validators=[
                    django.core.validators.RegexValidator(
                        regex=r'^\d{6}$',
                        message="Pincode must be a 6-digit number."
                    )
                ],
                blank=True,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='user',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        
        # Step 2: Migrate data from old fields to new fields (BEFORE removing old fields)
        migrations.RunPython(migrate_user_data, reverse_code=reverse_migrate_user_data),
        
        # Step 3: Make email unique and indexed
        migrations.AlterField(
            model_name='user',
            name='email',
            field=models.EmailField(
                max_length=255,
                unique=True,
                db_index=True,
                verbose_name='Email Address'
            ),
        ),
        
        # Step 4: Alter primary key to BigAutoField (update serialization)
        migrations.AlterField(
            model_name='user',
            name='id',
            field=models.BigAutoField(primary_key=True, serialize=False),
        ),
        
        # Step 5: Alter other fields to match new model
        migrations.AlterField(
            model_name='user',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AlterField(
            model_name='user',
            name='is_staff',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='user',
            name='password',
            field=models.CharField(max_length=128),
        ),
        
        # Step 6: Add database constraints
        migrations.AddConstraint(
            model_name='user',
            constraint=models.CheckConstraint(
                check=models.Q(role__in=['internal', 'portal']),
                name='valid_role'
            ),
        ),
        
        # Step 7: Add indexes
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['email'], name='user_email_idx'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=models.Index(fields=['role'], name='user_role_idx'),
        ),
        
        # Step 8: Update Meta options and managers
        migrations.AlterModelOptions(
            name='user',
            options={
                'verbose_name': 'User',
                'verbose_name_plural': 'Users',
            },
        ),
        migrations.AlterModelManagers(
            name='user',
            managers=[
            ],
        ),
        
        # Step 9: Remove old AbstractUser fields (AFTER data migration)
        migrations.RemoveField(
            model_name='user',
            name='date_joined',
        ),
        migrations.RemoveField(
            model_name='user',
            name='first_name',
        ),
        migrations.RemoveField(
            model_name='user',
            name='last_name',
        ),
        migrations.RemoveField(
            model_name='user',
            name='username',
        ),
    ]
