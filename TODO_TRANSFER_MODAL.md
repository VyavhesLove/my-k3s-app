# TransferModal - Улучшения

## Гибридный вариант

### 1. TransferModal.jsx ✅
- [x] Обновить сигнатуру: `({ isOpen, onClose, item, isDarkMode })`
- [x] Упростить store: только `selectedItem`, `setSelectedItem`
- [x] Добавить `useCallback` для `fetchLocations`
- [x] Обновить `useEffect`: использовать `isOpen` + сброс формы
- [x] Убрать `window.location.reload()` → `onClose()`
- [x] Обновить early return

### 2. ItemDetailPanel.jsx ✅
- [x] Проверить пропсы (уже передаются корректно)

