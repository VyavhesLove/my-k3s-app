from django.urls import path
from . import views

urlpatterns = [
    path('items/', views.item_list, name='item_list'),
    path('items/<int:item_id>/', views.item_detail, name='item_detail'),
    path('items/<int:item_id>/send-to-service/', views.send_to_service, name='send_to_service'),
    path('items/<int:item_id>/return-from-service/', views.return_from_service, name='return_from_service'),
    path('items/<int:item_id>/confirm-repair/', views.confirm_repair, name='confirm_repair'),
    path('items/<int:item_id>/confirm/', views.confirm_item, name='confirm_item'),
    path('items/<int:item_id>/confirm-tmc/', views.ConfirmTMCAPIView.as_view(), name='confirm_tmc'),
    path('items/<int:item_id>/write-off/', views.write_off_item, name='write_off_item'),
    path('items/<int:item_id>/cancel-write-off/', views.cancel_write_off_item, name='cancel_write_off_item'),
    path('items/<int:item_id>/lock/', views.lock_item, name='lock_item'),
    path('items/<int:item_id>/unlock/', views.unlock_item, name='unlock_item'),
    path('locations/', views.location_list, name='location_list'),
    path('hello/', views.hello, name='hello'),
    path('analytics-data/', views.get_analytics, name='get_analytics'),
    path('status-counters/', views.get_status_counters, name='get_status_counters'),
    path('brigades/', views.brigade_list, name='brigade_list'),
    # Write-offs CRUD endpoints
    path('writeoffs/', views.write_off_list, name='write_off_list'),
    path('writeoffs/<int:write_off_id>/cancel/', views.write_off_cancel, name='write_off_cancel'),
]
