from django.urls import path
from . import views

urlpatterns = [
    path('items', views.item_list, name='item_list'),
    path('items/<int:item_id>/', views.item_detail, name='item_detail'),
    path('locations', views.location_list, name='location_list'),
    path('hello', views.hello, name='hello'),
    path('analytics-data', views.get_analytics, name='get_analytics'),
    path('status-counters', views.get_status_counters, name='get_status_counters'),
]
