from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.core.validators import RegexValidator


class UserManager(BaseUserManager):
    """
    Custom manager for User model with email-based authentication.
    """
    
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and return a regular user with email and password.
        """
        if not email:
            raise ValueError('Users must have an email address')
        
        email = self.normalize_email(email)
        extra_fields.setdefault('role', 'portal')
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and return a superuser with admin privileges.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'internal')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Enhanced User model for ApparelDesk with identity and contact fields.
    Uses email-based authentication and role-based classification.
    """
    
    # Role choices
    ROLE_CHOICES = [
        ('internal', 'Internal Staff'),
        ('portal', 'Portal User'),
    ]
    
    # Validators
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    
    pincode_regex = RegexValidator(
        regex=r'^\d{6}$',
        message="Pincode must be a 6-digit number."
    )
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Identity fields
    name = models.CharField(max_length=255)
    email = models.EmailField(
        max_length=255,
        unique=True,
        db_index=True,
        verbose_name='Email Address'
    )
    password = models.CharField(max_length=128)
    
    # Role field with CHECK constraint
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='portal',
        db_index=True
    )
    
    # Contact fields
    mobile = models.CharField(
        max_length=15,
        validators=[phone_regex],
        blank=True,
        null=True
    )
    
    # Location fields
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(
        max_length=6,
        validators=[pincode_regex],
        blank=True,
        null=True
    )
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Django admin fields
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    
    # Custom manager
    objects = UserManager()
    
    # Authentication configuration
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        constraints = [
            models.CheckConstraint(
                check=models.Q(role__in=['internal', 'portal']),
                name='valid_role'
            )
        ]
        indexes = [
            models.Index(fields=['email'], name='user_email_idx'),
            models.Index(fields=['role'], name='user_role_idx'),
        ]
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return self.name
    
    def get_short_name(self):
        return self.name.split()[0] if self.name else self.email


class Contact(models.Model):
    """
    Contact model for customers and vendors in ApparelDesk.
    Maintains a one-to-one relationship with User for portal access.
    """
    
    # Contact type choices
    TYPE_CHOICES = [
        ('customer', 'Customer'),
        ('vendor', 'Vendor'),
        ('both', 'Both'),
    ]
    
    # Validators (reuse from User model)
    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )
    
    pincode_regex = RegexValidator(
        regex=r'^\d{6}$',
        message="Pincode must be a 6-digit number."
    )
    
    # Primary key
    id = models.BigAutoField(primary_key=True)
    
    # Identity fields
    name = models.CharField(max_length=255)
    type = models.CharField(
        max_length=10,
        choices=TYPE_CHOICES,
        db_index=True
    )
    email = models.EmailField(
        max_length=255,
        db_index=True,
        verbose_name='Email Address'
    )
    mobile = models.CharField(
        max_length=15,
        validators=[phone_regex],
        blank=True,
        null=True
    )
    
    # Location fields
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(
        max_length=6,
        validators=[pincode_regex],
        blank=True,
        null=True
    )
    
    # One-to-one relationship with User (nullable for contacts without portal access)
    user = models.OneToOneField(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contact'
    )
    
    # Timestamp fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'contacts'
        verbose_name = 'Contact'
        verbose_name_plural = 'Contacts'
        constraints = [
            models.CheckConstraint(
                check=models.Q(type__in=['customer', 'vendor', 'both']),
                name='valid_contact_type'
            )
        ]
        indexes = [
            models.Index(fields=['type'], name='contact_type_idx'),
            models.Index(fields=['email'], name='contact_email_idx'),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
