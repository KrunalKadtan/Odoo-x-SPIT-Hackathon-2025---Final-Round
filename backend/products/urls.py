from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    path('', views.ProductListView.as_view(), name='product_list'),
    path('<int:id>/', views.ProductDetailView.as_view(), name='product_detail'),
    path('categories/', views.ProductCategoriesView.as_view(), name='product_categories'),
]