from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django import forms
from .models import User, Contact


class UserCreationForm(forms.ModelForm):
    """Form for creating new users in admin."""
    password1 = forms.CharField(label='Password', widget=forms.PasswordInput)
    password2 = forms.CharField(label='Password confirmation', widget=forms.PasswordInput)
    
    class Meta:
        model = User
        fields = ('email', 'name', 'role')
    
    def clean_password2(self):
        password1 = self.cleaned_data.get("password1")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise forms.ValidationError("Passwords don't match")
        return password2
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeForm(forms.ModelForm):
    """Form for updating users in admin."""
    password = ReadOnlyPasswordHashField(
        label="Password",
        help_text=(
            "Raw passwords are not stored, so there is no way to see this "
            "user's password, but you can change the password using "
            "<a href=\"../password/\">this form</a>."
        ),
    )
    
    class Meta:
        model = User
        fields = ('email', 'password', 'name', 'role', 'mobile', 'city', 
                  'state', 'pincode', 'is_active', 'is_staff', 'is_superuser')


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin configuration for enhanced User model."""
    form = UserChangeForm
    add_form = UserCreationForm
    
    list_display = ('email', 'name', 'role', 'is_staff', 'is_active', 'created_at')
    list_filter = ('role', 'is_staff', 'is_active', 'created_at')
    
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'mobile')}),
        ('Location', {'fields': ('city', 'state', 'pincode')}),
        ('Role & Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser')}),
        ('Important dates', {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'role', 'password1', 'password2'),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'last_login')
    search_fields = ('email', 'name', 'mobile')
    ordering = ('-created_at',)
    filter_horizontal = ()


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    """Admin configuration for Contact model."""
    
    list_display = ('name', 'type', 'email', 'mobile', 'user', 'created_at')
    list_filter = ('type', 'created_at')
    search_fields = ('name', 'email', 'mobile')
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('name', 'type', 'email', 'mobile')
        }),
        ('Location', {
            'fields': ('city', 'state', 'pincode')
        }),
        ('Portal Access', {
            'fields': ('user',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')
    ordering = ('-created_at',)
