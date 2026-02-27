from django.urls import path
from . import views
from .views import history

urlpatterns = [
    # items endpoints - без префикса 'items/' т.к. он уже добавлен в inventory/urls.py
    path('', views.item_list, name='item_list'),
    path('<int:item_id>/', views.item_detail, name='item_detail'),
    path('<int:item_id>/history/', history.item_history, name='item_history'),
    path('<int:item_id>/send-to-service/', views.send_to_service, name='send_to_service'),
    path('<int:item_id>/return-from-service/', views.return_from_service, name='return_from_service'),
    path('<int:item_id>/confirm-repair/', views.confirm_repair, name='confirm_repair'),
    path('<int:item_id>/write-off-from-confirm-repair/', views.write_off_from_confirm_repair, name='write_off_from_confirm_repair'),
    path('<int:item_id>/confirm/', views.confirm_item, name='confirm_item'),
    path('<int:item_id>/confirm-tmc/', views.ConfirmTMCAPIView.as_view(), name='confirm_tmc'),
    path('<int:item_id>/write-off/', views.write_off_item, name='write_off_item'),
    path('<int:item_id>/cancel-write-off/', views.cancel_write_off_item, name='cancel_write_off_item'),
    path('<int:item_id>/lock/', views.lock_item, name='lock_item'),
    path('<int:item_id>/unlock/', views.unlock_item, name='unlock_item'),
    path('<int:item_id>/qty/', views.get_item_qty, name='get_item_qty'),
    path('locations/', views.location_list, name='location_list'),
    path('hello/', views.hello, name='hello'),
    # Write-offs CRUD endpoints
    path('writeoffs/', views.write_off_list, name='write_off_list'),
    path('writeoffs/filters/', views.write_off_filter_options, name='write_off_filter_options'),
    path('writeoffs/<int:write_off_id>/cancel/', views.write_off_cancel, name='write_off_cancel'),
    path('writeoffs/bulk-restore/', views.write_off_bulk_restore, name='write_off_bulk_restore'),
]
