from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.get_current_user, name='current_user'),
    path('me/history/', views.get_user_history, name='user_history'),
    path('me/sessions/', views.get_active_sessions, name='active_sessions'),
    path('me/sessions/terminate/', views.terminate_session, name='terminate_session'),
    path('me/change-password/', views.change_password, name='change_password'),
    path('me/update/', views.update_profile, name='update_profile'),
    path('sessions/create/', views.create_session, name='create_session'),
]

