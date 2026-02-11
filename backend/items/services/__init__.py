"""
Services package - CQRS-ориентированная структура сервисов.

Commands - изменяют состояние системы
Queries - только читают состояние
Domain - бизнес-правила и инварианты
"""

# Domain layer
from .domain import ItemTransitions, HistoryActions

# Services
from .history_service import HistoryService
from .lock_service import LockService

# Commands
from .commands import (
    ConfirmTMCCommand,
    SendToServiceCommand,
    ReturnFromServiceCommand,
    UpdateItemCommand,
)

# Queries
from .queries import (
    GetItemQuery,
    GetItemHistoryQuery,
    ListItemsForConfirmQuery,
)

__all__ = [
    # Domain
    'ItemTransitions',
    'HistoryActions',
    # Services
    'HistoryService',
    'LockService',
    # Commands
    'ConfirmTMCCommand',
    'SendToServiceCommand',
    'ReturnFromServiceCommand',
    'UpdateItemCommand',
    # Queries
    'GetItemQuery',
    'GetItemHistoryQuery',
    'ListItemsForConfirmQuery',
]

