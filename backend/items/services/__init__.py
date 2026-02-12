"""
Services package - CQRS-ориентированная структура сервисов.

Commands - изменяют состояние системы
Queries - только читают состояние
Domain - бизнес-правила и инварианты
"""

# Domain layer
from .domain import ItemTransitions
from .domain.exceptions import (
    DomainError,
    DomainValidationError,
    DomainConflictError,
    DomainNotFoundError,
)

# Services
from .history_service import HistoryService
from .lock_service import LockService

# Commands
from .commands import (
    ConfirmTMCCommand,
    SendToServiceCommand,
    ReturnFromServiceCommand,
    UpdateItemCommand,
    ConfirmItemCommand,
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
    'DomainError',
    'DomainValidationError',
    'DomainConflictError',
    'DomainNotFoundError',
    # Services
    'HistoryService',
    'LockService',
    # Commands
    'ConfirmTMCCommand',
    'SendToServiceCommand',
    'ReturnFromServiceCommand',
    'UpdateItemCommand',
    'ConfirmItemCommand',
    # Queries
    'GetItemQuery',
    'GetItemHistoryQuery',
    'ListItemsForConfirmQuery',
]

