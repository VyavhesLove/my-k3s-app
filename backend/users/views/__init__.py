# Импорты для обратной совместимости
from .auth import CustomTokenObtainPairView
from .profile import get_current_user, update_profile, change_password
from .users import create_user, user_list, toggle_user_block
from .history import get_user_history, get_active_sessions, terminate_session, create_session

__all__ = [
    'CustomTokenObtainPairView',
    'get_current_user', 'update_profile', 'change_password',
    'create_user', 'user_list', 'toggle_user_block',
    'get_user_history', 'get_active_sessions', 'terminate_session', 'create_session'
]

