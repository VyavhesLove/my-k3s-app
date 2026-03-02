// test/modals/TransferModal.test.jsx - тесты компонента TransferModal
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransferModal } from '@/components/modals/TransferModal';

// Мок axios
vi.mock('@/api/axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

// Мок store
vi.mock('@/store/useItemStore', () => ({
  useItemStore: vi.fn(() => ({
    selectedItem: null,
    setSelectedItem: vi.fn(),
    lockItem: vi.fn(),
    unlockItem: vi.fn(),
    refreshItems: vi.fn(),
    lockedItems: new Set(),
  })),
}));

// Мок toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    promise: vi.fn(),
  },
}));

import api from '@/api/axios';
import { useItemStore } from '@/store/useItemStore';
import { toast } from 'sonner';

describe('TransferModal', () => {
  const mockItem = {
    id: 1,
    name: 'Ноутбук Dell',
    location: 'Склад 1',
    responsible: 'Иванов И.И.',
  };

  const mockLocations = [
    { id: 1, name: 'Склад 1' },
    { id: 2, name: 'Склад 2' },
    { id: 3, name: 'Офис' },
  ];

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useItemStore.mockReturnValue({
      selectedItem: mockItem,
      setSelectedItem: vi.fn(),
      lockItem: vi.fn().mockResolvedValue(true),
      unlockItem: vi.fn().mockResolvedValue(true),
      refreshItems: vi.fn().mockResolvedValue(true),
      lockedItems: {},
    });
  });

  describe('Рендеринг', () => {
    it('не должен рендериться когда isOpen=false', () => {
      render(
        <TransferModal 
          isOpen={false} 
          onClose={mockOnClose} 
          item={mockItem} 
          isDarkMode={false} 
        />
      );
      
      expect(screen.queryByText('Передать ТМЦ')).not.toBeInTheDocument();
    });

    it('не должен рендериться когда item=null', () => {
      render(
        <TransferModal 
          isOpen={true} 
          onClose={mockOnClose} 
          item={null} 
          isDarkMode={false} 
        />
      );
      
      expect(screen.queryByText('Передать ТМЦ')).not.toBeInTheDocument();
    });

    it('должен рендериться когда isOpen=true и item передан', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { locations: mockLocations } } 
      });

      render(
        <TransferModal 
          isOpen={true} 
          onClose={mockOnClose} 
          item={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Передать ТМЦ')).toBeInTheDocument();
      });
    });
  });

  describe('Загрузка данных', () => {
    it('должен загружать локации при открытии', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { locations: mockLocations } } 
      });

      render(
        <TransferModal 
          isOpen={true} 
          onClose={mockOnClose} 
          item={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/items/locations/');
      });
    });

    it('должен показывать предупреждение если локаций нет', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { locations: [] } } 
      });

      render(
        <TransferModal 
          isOpen={true} 
          onClose={mockOnClose} 
          item={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Список локаций пуст/i)).toBeInTheDocument();
      });
    });
  });

  describe('Блокировка ТМЦ', () => {
    it('должен пытаться заблокировать ТМЦ при открытии', async () => {
      const lockItem = vi.fn().mockResolvedValue(true);
      useItemStore.mockReturnValue({
        selectedItem: mockItem,
        setSelectedItem: vi.fn(),
        lockItem,
        unlockItem: vi.fn(),
        refreshItems: vi.fn(),
        lockedItems: new Set(),
      });

      api.get.mockResolvedValueOnce({ 
        data: { data: { locations: mockLocations } } 
      });

      render(
        <TransferModal 
          isOpen={true} 
          onClose={mockOnClose} 
          item={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(lockItem).toHaveBeenCalledWith(mockItem.id);
      });
    });

    it('должен показывать сообщение об ошибке при блокировке другим пользователем', async () => {
      const lockItem = vi.fn().mockRejectedValue({
        response: { status: 423, data: { locked_by: 'Петров П.П.' } }
      });
      useItemStore.mockReturnValue({
        selectedItem: mockItem,
        setSelectedItem: vi.fn(),
        lockItem,
        unlockItem: vi.fn(),
        refreshItems: vi.fn(),
        lockedItems: new Set(),
      });

      api.get.mockResolvedValueOnce({ 
        data: { data: { locations: mockLocations } } 
      });

      render(
        <TransferModal 
          isOpen={true} 
          onClose={mockOnClose} 
          item={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe('Валидация формы', () => {
    it('должен показывать ошибку при пустой локации', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { locations: mockLocations } } 
      });

      render(
        <TransferModal 
          isOpen={true} 
          onClose={mockOnClose} 
          item={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Передать ТМЦ')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('Подтвердить передачу');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Выберите локацию/i)).toBeInTheDocument();
      });
    });

    it('должен показывать ошибку при пустом ответственном', async () => {
      api.get.mockResolvedValueOnce({ 
        data: { data: { locations: mockLocations } } 
      });

      // Создаём item без ответственного для этого теста
      const itemWithoutResponsible = { ...mockItem, responsible: '' };

      render(
        <TransferModal 
          isOpen={true} 
          onClose={mockOnClose} 
          item={itemWithoutResponsible} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Передать ТМЦ')).toBeInTheDocument();
      });

      // Выбираем локацию
      const locationSelect = screen.getAllByRole('combobox')[0];
      await userEvent.selectOptions(locationSelect, 'Склад 2');

      const submitButton = screen.getByText('Подтвердить передачу');
      await userEvent.click(submitButton);

      // Проверяем, что форма не отправлена (API не вызван)
      // because required field prevents form submission
      await waitFor(() => {
        expect(api.put).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Успешная отправка', () => {
    it('должен разблокировать ТМЦ при закрытии', async () => {
      const unlockItem = vi.fn().mockResolvedValue(true);
      useItemStore.mockReturnValue({
        selectedItem: mockItem,
        setSelectedItem: vi.fn(),
        lockItem: vi.fn().mockResolvedValue(true),
        unlockItem,
        refreshItems: vi.fn(),
        lockedItems: new Set(),
      });

      api.get.mockResolvedValueOnce({ 
        data: { data: { locations: mockLocations } } 
      });

      render(
        <TransferModal 
          isOpen={true} 
          onClose={mockOnClose} 
          item={mockItem} 
          isDarkMode={false} 
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Передать ТМЦ')).toBeInTheDocument();
      });

      // Закрываем модалку
      const closeButton = screen.getByRole('button', { name: /отмена/i });
      await userEvent.click(closeButton);

      await waitFor(() => {
        expect(unlockItem).toHaveBeenCalledWith(mockItem.id);
      });
    });
  });
});

