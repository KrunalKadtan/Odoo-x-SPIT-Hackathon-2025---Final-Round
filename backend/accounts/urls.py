from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('signup/', views.portal_signup, name='portal_signup'),
]
