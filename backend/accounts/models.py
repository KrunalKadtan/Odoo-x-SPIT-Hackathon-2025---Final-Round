from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom User model for ApparelDesk.
    Extends AbstractUser to allow future customization.
    """
    # AbstractUser provides: username, email, password, first_name, last_name, etc.
    # Additional fields can be added here in future phases
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.username
