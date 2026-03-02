# Импорты для обратной совместимости
from .auth import CustomTokenObtainPairView, SwaggerTokenView
from .profile import get_current_user, update_profile, change_password
from .users import create_user, user_list, toggle_user_block, reset_user_password
from .history import (
    get_user_history, get_active_sessions, terminate_session, create_session,
    get_user_sessions, terminate_all_user_sessions, terminate_user_session
)
from .stats import get_system_stats, get_migrations_status

__all__ = [
    'CustomTokenObtainPairView',
    'SwaggerTokenView',
    'get_current_user', 'update_profile', 'change_password',
    'create_user', 'user_list', 'toggle_user_block', 'reset_user_password',
    'get_user_history', 'get_active_sessions', 'terminate_session', 'create_session',
    'get_user_sessions', 'terminate_all_user_sessions', 'terminate_user_session',
    'get_system_stats', 'get_migrations_status'
]

