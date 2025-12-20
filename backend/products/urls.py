from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    path('', views.ProductListView.as_view(), name='product_list'),
    path('<int:id>/', views.ProductDetailView.as_view(), name='product_detail'),
    path('categories/', views.ProductCategoriesView.as_view(), name='product_categories'),
    
    # Cart endpoints
    path('cart/', views.CartView.as_view(), name='cart'),
    path('cart/add/', views.AddToCartView.as_view(), name='add_to_cart'),
    path('cart/items/<int:item_id>/', views.UpdateCartItemView.as_view(), name='update_cart_item'),
    path('cart/items/<int:item_id>/remove/', views.RemoveFromCartView.as_view(), name='remove_from_cart'),
    path('cart/clear/', views.ClearCartView.as_view(), name='clear_cart'),
    
    # Order endpoints
    path('orders/', views.OrderListView.as_view(), name='order_list'),
    path('orders/<int:pk>/', views.OrderDetailView.as_view(), name='order_detail'),
    path('checkout/', views.CheckoutView.as_view(), name='checkout'),
    
    # Invoice endpoints
    path('invoices/', views.InvoiceListView.as_view(), name='invoice_list'),
    path('invoices/<int:invoice_id>/', views.InvoiceDetailView.as_view(), name='invoice_detail'),
    
    # Payment endpoints
    path('payments/create-order/', views.CreatePaymentOrderView.as_view(), name='create_payment_order'),
    path('payments/verify/', views.VerifyPaymentView.as_view(), name='verify_payment'),
    path('payments/<int:payment_id>/', views.PaymentDetailView.as_view(), name='payment_detail'),
]