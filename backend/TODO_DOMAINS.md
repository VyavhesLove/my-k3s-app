# DomainError Implementation Plan

## Шаг 1: Создать DomainError ✅
- [x] `items/services/domain/exceptions.py` - создать базовое доменное исключение

## Шаг 2: Обновить domain/__init__.py ✅
- [x] Экспортировать DomainError из доменного слоя

## Шаг 3: Заменить ValueError на DomainError ✅
- [x] `items/services/domain/item_transitions.py` - 3 валидатора
- [x] `items/services/lock_service.py` - lock(), unlock()
- [x] `items/services/commands/return_from_service.py` - _confirm()
- [x] `items/services/commands/confirm_tmc.py` - execute(), _reject()
- [x] `items/services.py` - ConfirmTMCService, ItemLockService

## Шаг 4: Создать DRF Exception Handler ✅
- [x] `items/exceptions.py` - кастомный exception handler

## Шаг 5: Подключить в settings.py ✅
- [x] `inventory/settings.py` - добавить DEFAULT_EXCEPTION_HANDLERS

## Шаг 6: Обновить views.py ✅
- [x] Убрать ручной try/except для ValueError


